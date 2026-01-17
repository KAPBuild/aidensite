/**
 * Aidensite Drawings API
 * Cloudflare Worker for storing and retrieving drawings
 *
 * Endpoints:
 * - GET /drawings - List all drawings
 * - GET /drawings/featured - Get top liked drawings
 * - GET /drawings/:id - Get a specific drawing
 * - POST /drawings - Upload a new drawing
 * - POST /drawings/:id/like - Like a drawing
 * - DELETE /drawings/:id - Delete a drawing (with secret)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route handling
      if (path === '/drawings' && request.method === 'GET') {
        return await listDrawings(env);
      }

      if (path === '/drawings/featured' && request.method === 'GET') {
        return await getFeaturedDrawings(env);
      }

      if (path === '/drawings' && request.method === 'POST') {
        return await uploadDrawing(request, env);
      }

      if (path.match(/^\/drawings\/[\w-]+$/) && request.method === 'GET') {
        const id = path.split('/')[2];
        return await getDrawing(id, env);
      }

      if (path.match(/^\/drawings\/[\w-]+\/like$/) && request.method === 'POST') {
        const id = path.split('/')[2];
        return await likeDrawing(id, env);
      }

      if (path.match(/^\/drawings\/[\w-]+$/) && request.method === 'DELETE') {
        const id = path.split('/')[2];
        return await deleteDrawing(id, request, env);
      }

      // Health check
      if (path === '/health') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({ error: 'Internal server error', message: error.message }, 500);
    }
  }
};

// Helper to create JSON responses
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Generate a unique ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// List all drawings (paginated)
async function listDrawings(env) {
  const listKey = 'drawings:list';
  const listData = await env.DRAWINGS_KV.get(listKey, 'json') || [];

  // Get metadata for each drawing
  const drawings = await Promise.all(
    listData.slice(0, 50).map(async (id) => {
      const meta = await env.DRAWINGS_KV.get(`drawing:${id}:meta`, 'json');
      return meta ? { id, ...meta } : null;
    })
  );

  return jsonResponse({
    drawings: drawings.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt),
    total: listData.length,
  });
}

// Get featured/top liked drawings
async function getFeaturedDrawings(env) {
  const listKey = 'drawings:list';
  const listData = await env.DRAWINGS_KV.get(listKey, 'json') || [];

  // Get metadata for all drawings
  const drawings = await Promise.all(
    listData.map(async (id) => {
      const meta = await env.DRAWINGS_KV.get(`drawing:${id}:meta`, 'json');
      return meta ? { id, ...meta } : null;
    })
  );

  // Sort by likes and return top 10
  const featured = drawings
    .filter(Boolean)
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 10);

  return jsonResponse({ drawings: featured });
}

// Get a specific drawing
async function getDrawing(id, env) {
  const meta = await env.DRAWINGS_KV.get(`drawing:${id}:meta`, 'json');

  if (!meta) {
    return jsonResponse({ error: 'Drawing not found' }, 404);
  }

  // Get the image from R2
  const image = await env.DRAWINGS_BUCKET.get(`drawings/${id}.png`);

  if (!image) {
    return jsonResponse({ error: 'Image not found' }, 404);
  }

  // Return image as base64 or redirect to R2 URL
  const imageData = await image.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageData)));

  return jsonResponse({
    id,
    ...meta,
    imageData: `data:image/png;base64,${base64}`,
  });
}

// Upload a new drawing
async function uploadDrawing(request, env) {
  const body = await request.json();

  if (!body.imageData) {
    return jsonResponse({ error: 'imageData is required' }, 400);
  }

  const id = generateId();
  const title = body.title || 'Untitled';
  const artist = body.artist || 'Anonymous';

  // Extract base64 data
  const base64Data = body.imageData.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  // Store image in R2
  await env.DRAWINGS_BUCKET.put(`drawings/${id}.png`, imageBuffer, {
    httpMetadata: {
      contentType: 'image/png',
    },
  });

  // Store metadata in KV
  const meta = {
    title,
    artist,
    likes: 0,
    createdAt: Date.now(),
  };

  await env.DRAWINGS_KV.put(`drawing:${id}:meta`, JSON.stringify(meta));

  // Add to list
  const listKey = 'drawings:list';
  const listData = await env.DRAWINGS_KV.get(listKey, 'json') || [];
  listData.unshift(id);
  await env.DRAWINGS_KV.put(listKey, JSON.stringify(listData));

  return jsonResponse({
    success: true,
    id,
    message: 'Drawing uploaded successfully!',
  });
}

// Like a drawing
async function likeDrawing(id, env) {
  const metaKey = `drawing:${id}:meta`;
  const meta = await env.DRAWINGS_KV.get(metaKey, 'json');

  if (!meta) {
    return jsonResponse({ error: 'Drawing not found' }, 404);
  }

  // Increment likes
  meta.likes = (meta.likes || 0) + 1;
  await env.DRAWINGS_KV.put(metaKey, JSON.stringify(meta));

  return jsonResponse({
    success: true,
    likes: meta.likes,
  });
}

// Delete a drawing (requires delete secret in body)
async function deleteDrawing(id, request, env) {
  const body = await request.json().catch(() => ({}));

  // Simple protection - require a secret to delete
  // In production, you'd want proper authentication
  if (body.secret !== 'aidensite-admin-2024') {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Delete from R2
  await env.DRAWINGS_BUCKET.delete(`drawings/${id}.png`);

  // Delete metadata
  await env.DRAWINGS_KV.delete(`drawing:${id}:meta`);

  // Remove from list
  const listKey = 'drawings:list';
  const listData = await env.DRAWINGS_KV.get(listKey, 'json') || [];
  const newList = listData.filter(drawingId => drawingId !== id);
  await env.DRAWINGS_KV.put(listKey, JSON.stringify(newList));

  return jsonResponse({ success: true, message: 'Drawing deleted' });
}
