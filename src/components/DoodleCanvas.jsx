import React, { useRef, useState, useEffect } from 'react'

export default function DoodleCanvas() {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  const [tool, setTool] = useState('pen')
  const [history, setHistory] = useState([])
  const [textInput, setTextInput] = useState('')
  const [fontSize, setFontSize] = useState(16)
  const [showTools, setShowTools] = useState(true)
  const contextRef = useRef(null)
  const [startPos, setStartPos] = useState(null)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1

  // Initialize canvas to fullscreen
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      // Get window dimensions
      const width = window.innerWidth
      const height = window.innerHeight

      // Set canvas display size
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'

      // Set internal canvas resolution for sharp drawing
      canvas.width = width * dpr
      canvas.height = height * dpr

      // Scale context for high DPI displays
      const context = canvas.getContext('2d', { willReadFrequently: true })
      context.scale(dpr, dpr)
      context.fillStyle = 'white'
      context.fillRect(0, 0, width, height)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      contextRef.current = context

      setHistory([canvas.toDataURL()])
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [dpr])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    let clientX, clientY
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if (e.clientX !== undefined) {
      clientX = e.clientX
      clientY = e.clientY
    } else {
      return { x: 0, y: 0 }
    }

    // Calculate position relative to canvas
    const x = clientX - rect.left
    const y = clientY - rect.top

    return { x, y }
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
    const canvas = canvasRef.current
    const context = contextRef.current

    const imageData = context.getImageData(0, 0, canvas.width / dpr, canvas.height / dpr)
    const data = imageData.data

    const targetColor = getPixelColor(imageData, Math.floor(x), Math.floor(y), canvas.width / dpr)
    const fillColor = hexToRgba(color)

    const stack = [[Math.floor(x), Math.floor(y)]]
    const visited = new Set()

    while (stack.length > 0) {
      const [px, py] = stack.pop()
      const key = `${px},${py}`

      if (visited.has(key)) continue
      if (px < 0 || px >= canvas.width / dpr || py < 0 || py >= canvas.height / dpr) continue

      const idx = (py * (canvas.width / dpr) + px) * 4
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

  const getPixelColor = (imageData, x, y, width) => {
    const idx = (y * width + x) * 4
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
        const canvas = canvasRef.current
        const context = contextRef.current
        context.fillStyle = 'white'
        context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
        context.drawImage(img, 0, 0)
      }
      img.src = newHistory[newHistory.length - 1]
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const context = contextRef.current
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    setHistory([canvas.toDataURL()])
  }

  const saveDrawing = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `aiden-drawing-${new Date().getTime()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col">
      {/* Canvas - Takes up most of screen */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
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
          className="block w-full h-full"
          style={{
            touchAction: 'none',
            cursor: tool === 'text' ? 'text' : tool === 'fill' ? 'pointer' : 'crosshair',
            display: 'block',
          }}
        />
      </div>

      {/* Top Controls Bar */}
      <div className="bg-gray-900 border-t-4 border-gray-700 p-3 md:p-4 flex gap-2 items-center justify-between flex-wrap">
        <div className="flex gap-2 items-center flex-wrap">
          {/* Tool Selection */}
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
              title={t.label}
            >
              {t.emoji}
            </button>
          ))}
        </div>

        {/* Color Picker */}
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 cursor-pointer rounded border-2 border-gray-600"
          />
          {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFD700', '#FF69B4', '#00CED1', '#FF8C00'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 md:w-8 md:h-8 rounded border-2 transition-all ${
                color === c ? 'border-white scale-110 shadow-lg' : 'border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        {/* Brush Size */}
        <div className="flex gap-2 items-center">
          <label className="text-white font-bold text-xs md:text-sm">Size:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 md:w-32 h-2 bg-gray-600 rounded-lg"
          />
          <span className="text-white font-bold text-xs md:text-sm w-6">{brushSize}</span>
        </div>

        {/* Font Size - Only show when text tool selected */}
        {tool === 'text' && (
          <div className="flex gap-2 items-center">
            <label className="text-white font-bold text-xs md:text-sm">Font:</label>
            <input
              type="range"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-20 md:w-32 h-2 bg-gray-600 rounded-lg"
            />
            <span className="text-white font-bold text-xs md:text-sm w-8">{fontSize}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={undo}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 md:px-3 py-1 md:py-2 rounded font-bold text-xs md:text-sm"
            title="Undo"
          >
            ↶
          </button>
          <button
            onClick={clearCanvas}
            className="bg-red-500 hover:bg-red-600 text-white px-2 md:px-3 py-1 md:py-2 rounded font-bold text-xs md:text-sm"
            title="Clear"
          >
            🗑️
          </button>
          <button
            onClick={saveDrawing}
            className="bg-green-500 hover:bg-green-600 text-white px-2 md:px-3 py-1 md:py-2 rounded font-bold text-xs md:text-sm"
            title="Save"
          >
            💾
          </button>
          <button
            onClick={() => setShowTools(!showTools)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 md:px-3 py-1 md:py-2 rounded font-bold text-xs md:text-sm"
            title="Toggle Info"
          >
            ℹ️
          </button>
        </div>
      </div>

      {/* Text Input Panel - Show when text tool active */}
      {tool === 'text' && startPos && (
        <div className="bg-gray-800 border-t-2 border-purple-500 p-3 flex gap-2">
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
          <button
            onClick={handleTextTool}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-bold text-sm"
          >
            Add Text
          </button>
        </div>
      )}

      {/* Info Panel */}
      {showTools && (
        <div className="bg-gray-800 border-t-2 border-gray-700 p-3 text-white text-xs md:text-sm">
          <p>
            <strong>Current Tool:</strong> {['Pen', 'Line', 'Rect', 'Circle', 'Text', 'Fill'][['pen', 'line', 'rectangle', 'circle', 'text', 'fill'].indexOf(tool)]} |{' '}
            <strong>Brush:</strong> {brushSize}px | <strong>Color:</strong> {color}
          </p>
          <p className="mt-1">Click/Touch to draw • Use tools above • Hold to draw with pen</p>
        </div>
      )}
    </div>
  )
}
