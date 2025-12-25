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
  const [isFullScreen, setIsFullScreen] = useState(false)
  const contextRef = useRef(null)
  const [startPos, setStartPos] = useState(null)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      let width, height

      if (isFullScreen) {
        // Full screen mode
        width = window.innerWidth
        height = window.innerHeight
      } else {
        // Embedded mode
        const rect = canvas.parentElement.getBoundingClientRect()
        width = rect.width - 20
        height = 400
      }

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
  }, [isFullScreen, dpr])

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

  const ToolsSection = () => (
    <>
      {/* Tool Selection */}
      <div className="flex flex-wrap gap-2 mb-3">
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
              tool === t.id ? 'bg-purple-600 text-white scale-110 shadow-lg' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
            }`}
            title={t.label}
          >
            {t.emoji}
          </button>
        ))}
      </div>

      {/* Color & Size Controls */}
      <div className="flex flex-wrap gap-3 mb-3 items-center">
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 cursor-pointer rounded border-2 border-gray-400"
          />
          {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFD700', '#FF69B4', '#00CED1', '#FF8C00'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 md:w-6 md:h-6 rounded border-2 transition-all ${
                color === c ? 'border-black scale-110 shadow' : 'border-gray-400 hover:border-gray-600'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-gray-700 font-bold text-xs md:text-sm">Size:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-16 md:w-24 h-2 bg-gray-400 rounded-lg"
          />
          <span className="text-gray-700 font-bold text-xs md:text-sm w-6">{brushSize}</span>
        </div>

        {tool === 'text' && (
          <div className="flex gap-2 items-center">
            <label className="text-gray-700 font-bold text-xs md:text-sm">Font:</label>
            <input
              type="range"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-16 md:w-24 h-2 bg-gray-400 rounded-lg"
            />
            <span className="text-gray-700 font-bold text-xs md:text-sm w-6">{fontSize}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={undo}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 px-2 md:px-3 py-1 rounded font-bold text-xs md:text-sm"
          title="Undo"
        >
          ↶ Undo
        </button>
        <button
          onClick={clearCanvas}
          className="bg-red-400 hover:bg-red-500 text-white px-2 md:px-3 py-1 rounded font-bold text-xs md:text-sm"
          title="Clear"
        >
          🗑️ Clear
        </button>
        <button
          onClick={saveDrawing}
          className="bg-green-400 hover:bg-green-500 text-white px-2 md:px-3 py-1 rounded font-bold text-xs md:text-sm"
          title="Save"
        >
          💾 Save
        </button>
      </div>
    </>
  )

  // Fullscreen Mode
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
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
            className="block bg-white rounded-lg shadow-lg border-4 border-gray-600"
            style={{
              touchAction: 'none',
              cursor: tool === 'text' ? 'text' : tool === 'fill' ? 'pointer' : 'crosshair',
              display: 'block',
            }}
          />
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-900 border-t-4 border-gray-700 p-4 overflow-y-auto max-h-32 md:max-h-none">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <ToolsSection />
            <button
              onClick={() => setIsFullScreen(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm md:text-base whitespace-nowrap"
            >
              Exit Fullscreen ✕
            </button>
          </div>
        </div>

        {/* Text Input Panel */}
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
              Add
            </button>
          </div>
        )}
      </div>
    )
  }

  // Normal Embedded Mode
  return (
    <div className="space-y-3">
      {/* Canvas */}
      <div className="flex justify-center bg-gray-100 rounded-lg p-2">
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
          className="bg-white rounded-lg shadow-md border-4 border-gray-400 block"
          style={{
            touchAction: 'none',
            cursor: tool === 'text' ? 'text' : tool === 'fill' ? 'pointer' : 'crosshair',
            display: 'block',
          }}
        />
      </div>

      {/* Tools */}
      <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
        <ToolsSection />

        {/* Fullscreen Button */}
        <button
          onClick={() => setIsFullScreen(true)}
          className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-all hover:scale-105"
        >
          ⛶ Go Fullscreen
        </button>
      </div>

      {/* Text Input Panel */}
      {tool === 'text' && startPos && (
        <div className="bg-gray-100 rounded-lg p-3 flex gap-2 border-2 border-purple-400">
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
    </div>
  )
}
