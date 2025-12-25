import React, { useRef, useState, useEffect } from 'react'

export default function DoodleCanvas() {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  const [tool, setTool] = useState('pen')
  const [history, setHistory] = useState([])
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [canvasSize, setCanvasSize] = useState('medium')
  const [textInput, setTextInput] = useState('')
  const [fontSize, setFontSize] = useState(16)
  const [zoom, setZoom] = useState(1)
  const [showToolPanel, setShowToolPanel] = useState(true)
  const contextRef = useRef(null)
  const [startPos, setStartPos] = useState(null)

  const sizes = {
    small: { w: 400, h: 300 },
    medium: { w: 600, h: 450 },
    large: { w: 800, h: 600 },
  }

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const size = sizes[canvasSize]
    canvas.width = size.w
    canvas.height = size.h

    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    contextRef.current = context

    setHistory([canvas.toDataURL()])
  }, [canvasSize])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    let x, y
    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else if (e.nativeEvent) {
      x = e.nativeEvent.offsetX || e.clientX - rect.left
      y = e.nativeEvent.offsetY || e.clientY - rect.top
    }

    return {
      x: x / zoom,
      y: y / zoom,
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    const { x, y } = getCoordinates(e)

    if (tool === 'text') {
      setStartPos({ x, y })
      return
    }

    contextRef.current.beginPath()
    contextRef.current.moveTo(x, y)
    setStartPos({ x, y })
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()

    const { x, y } = getCoordinates(e)
    const context = contextRef.current

    if (tool === 'pen') {
      context.strokeStyle = color
      context.lineWidth = brushSize
      context.lineTo(x, y)
      context.stroke()
    }
  }

  const stopDrawing = (e) => {
    if (!isDrawing && tool !== 'text') return
    e.preventDefault()

    const { x, y } = getCoordinates(e)
    const context = contextRef.current

    if (tool === 'line' && startPos) {
      context.strokeStyle = color
      context.lineWidth = brushSize
      context.beginPath()
      context.moveTo(startPos.x, startPos.y)
      context.lineTo(x, y)
      context.stroke()
    } else if (tool === 'rectangle' && startPos) {
      context.strokeStyle = color
      context.lineWidth = brushSize
      const w = x - startPos.x
      const h = y - startPos.y
      context.strokeRect(startPos.x, startPos.y, w, h)
    } else if (tool === 'circle' && startPos) {
      context.strokeStyle = color
      context.lineWidth = brushSize
      const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
      context.beginPath()
      context.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
      context.stroke()
    }

    contextRef.current.closePath()
    setIsDrawing(false)
    setStartPos(null)
    saveToHistory()
  }

  const handleTextTool = (e) => {
    if (tool === 'text' && startPos && textInput) {
      const context = contextRef.current
      context.fillStyle = color
      context.font = `${fontSize}px Arial`
      context.fillText(textInput, startPos.x, startPos.y)
      setTextInput('')
      saveToHistory()
      setStartPos(null)
    }
  }

  const fillCanvas = (e) => {
    const { x, y } = getCoordinates(e)
    const context = contextRef.current

    const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    const data = imageData.data

    const targetColor = getPixelColor(imageData, Math.floor(x), Math.floor(y))
    const fillColor = hexToRgba(color)

    const stack = [[Math.floor(x), Math.floor(y)]]
    const visited = new Set()

    while (stack.length > 0) {
      const [px, py] = stack.pop()
      const key = `${px},${py}`

      if (visited.has(key)) continue
      if (px < 0 || px >= canvasRef.current.width || py < 0 || py >= canvasRef.current.height) continue

      const idx = (py * canvasRef.current.width + px) * 4
      const currentColor = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]]

      if (colorsMatch(currentColor, targetColor)) {
        data[idx] = fillColor.r
        data[idx + 1] = fillColor.g
        data[idx + 2] = fillColor.b
        data[idx + 3] = fillColor.a

        visited.add(key)
        stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1])
      }
    }

    context.putImageData(imageData, 0, 0)
    saveToHistory()
  }

  const getPixelColor = (imageData, x, y) => {
    const idx = (y * imageData.width + x) * 4
    return [imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2], imageData.data[idx + 3]]
  }

  const colorsMatch = (color1, color2) => {
    return color1.every((c, i) => Math.abs(c - color2[i]) < 10)
  }

  const hexToRgba = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b, a: 255 }
  }

  const saveToHistory = () => {
    setHistory([...history, canvasRef.current.toDataURL()])
  }

  const undo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      setHistory(newHistory)
      const img = new Image()
      img.onload = () => {
        const context = contextRef.current
        context.fillStyle = 'white'
        context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        context.drawImage(img, 0, 0)
      }
      img.src = newHistory[newHistory.length - 1]
    }
  }

  const clearCanvas = () => {
    const context = contextRef.current
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setHistory([canvasRef.current.toDataURL()])
  }

  const saveDrawing = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `aiden-drawing-${new Date().getTime()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const ToolPanel = () => (
    <div className="bg-gray-900 rounded-xl p-4 space-y-4">
      {/* Tool Selection */}
      <div>
        <p className="text-white font-bold mb-2 text-sm md:text-base">Tools:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'pen', emoji: '✏️', label: 'Pen' },
            { id: 'line', emoji: '📏', label: 'Line' },
            { id: 'rectangle', emoji: '▭', label: 'Rect' },
            { id: 'circle', emoji: '●', label: 'Circle' },
            { id: 'text', emoji: '📝', label: 'Text' },
            { id: 'fill', emoji: '🪣', label: 'Fill' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`px-2 py-1 md:px-3 md:py-2 rounded text-xs md:text-sm font-bold transition-all ${
                tool === t.id ? 'bg-purple-600 text-white scale-110 shadow-lg' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {t.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Brush Size */}
      <div>
        <p className="text-white font-bold text-xs md:text-sm mb-2">Brush: {brushSize}px</p>
        <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg" />
      </div>

      {/* Font Size */}
      {tool === 'text' && (
        <div>
          <p className="text-white font-bold text-xs md:text-sm mb-2">Font: {fontSize}px</p>
          <input type="range" min="8" max="72" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg" />
        </div>
      )}

      {/* Color */}
      <div>
        <p className="text-white font-bold text-xs md:text-sm mb-2">Color:</p>
        <div className="flex gap-2 flex-wrap items-center">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 cursor-pointer rounded" />
          {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFD700', '#FF69B4', '#00CED1', '#FF8C00'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-gray-600'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Canvas Size */}
      <div>
        <p className="text-white font-bold text-xs md:text-sm mb-2">Canvas:</p>
        <div className="flex gap-2">
          {Object.keys(sizes).map((size) => (
            <button
              key={size}
              onClick={() => setCanvasSize(size)}
              className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                canvasSize === size ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
            </button>
          ))}
        </div>
      </div>

      {/* Zoom */}
      <div>
        <p className="text-white font-bold text-xs md:text-sm mb-2">Zoom: {(zoom * 100).toFixed(0)}%</p>
        <div className="flex gap-2">
          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold flex-1">
            -
          </button>
          <button onClick={() => setZoom(1)} className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold flex-1">
            Reset
          </button>
          <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold flex-1">
            +
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={undo} className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold flex-1">
          ↶ Undo
        </button>
        <button onClick={clearCanvas} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex-1">
          Clear
        </button>
        <button onClick={saveDrawing} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-bold flex-1">
          Save
        </button>
      </div>
    </div>
  )

  // Full Screen Mode
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col md:flex-row">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-2 md:p-4">
          <canvas
            ref={canvasRef}
            onMouseDown={tool === 'fill' ? fillCanvas : startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={tool === 'fill' ? fillCanvas : startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
            className="border-4 border-gray-600 bg-white rounded-lg shadow-lg"
            style={{
              touchAction: 'none',
              cursor: tool === 'text' ? 'text' : 'crosshair',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          />
        </div>

        {/* Tools Sidebar - Toggle on mobile */}
        <div className={`${showToolPanel ? 'block' : 'hidden'} md:block w-full md:w-80 bg-gray-950 border-l border-gray-700 p-4 overflow-y-auto`}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-bold text-lg">🎨 Tools</h2>
            <button onClick={() => setIsFullScreen(false)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold">
              Exit ✕
            </button>
          </div>

          {/* Text Input */}
          {tool === 'text' && startPos && (
            <div className="bg-gray-800 rounded-lg p-3 mb-4 flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Text..."
                className="flex-1 px-2 py-1 rounded text-sm border-2 border-purple-400"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleTextTool(e)
                }}
              />
              <button onClick={handleTextTool} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-bold text-sm">
                Add
              </button>
            </div>
          )}

          <ToolPanel />
        </div>

        {/* Mobile Toggle Button */}
        {!showToolPanel && (
          <button onClick={() => setShowToolPanel(true)} className="fixed bottom-4 right-4 md:hidden bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
            🎨
          </button>
        )}
      </div>
    )
  }

  // Normal Mode
  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-2xl font-bold text-white">🎨 Drawing Canvas</h2>
        <button onClick={() => setIsFullScreen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded-lg font-bold text-sm md:text-base transition-all">
          ⛶ Full Screen
        </button>
      </div>

      {/* Canvas */}
      <div className="flex justify-center bg-gray-800 rounded-lg p-2 md:p-4">
        <canvas
          ref={canvasRef}
          onMouseDown={tool === 'fill' ? fillCanvas : startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={tool === 'fill' ? fillCanvas : startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          className="border-4 border-gray-600 bg-white rounded-lg shadow-lg w-full max-w-full"
          style={{
            touchAction: 'none',
            cursor: tool === 'text' ? 'text' : 'crosshair',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        />
      </div>

      {/* Text Input */}
      {tool === 'text' && startPos && (
        <div className="bg-gray-800 rounded-lg p-3 flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter text..."
            className="flex-1 px-3 py-2 rounded text-sm border-2 border-purple-400"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleTextTool(e)
            }}
          />
          <button onClick={handleTextTool} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-bold text-sm">
            Add Text
          </button>
        </div>
      )}

      {/* Tools */}
      <ToolPanel />
    </div>
  )
}
