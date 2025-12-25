import React, { useRef, useState, useEffect } from 'react'

export default function DoodleCanvas() {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [isErasing, setIsErasing] = useState(false)
  const [brushSize, setBrushSize] = useState(5)
  const contextRef = useRef(null)
  const [history, setHistory] = useState([])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width = Math.min(600, window.innerWidth - 40)
    canvas.height = 400

    const context = canvas.getContext('2d')
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)
    contextRef.current = context

    // Save initial state
    setHistory([canvas.toDataURL()])

    // Handle window resize
    const handleResize = () => {
      const newWidth = Math.min(600, window.innerWidth - 40)
      const oldCanvas = canvas
      const newCanvas = document.createElement('canvas')
      newCanvas.width = newWidth
      newCanvas.height = 400

      const newContext = newCanvas.getContext('2d')
      newContext.fillStyle = 'white'
      newContext.fillRect(0, 0, newWidth, 400)
      newContext.drawImage(oldCanvas, 0, 0)

      canvas.width = newWidth
      canvas.height = 400
      contextRef.current = newContext
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Start drawing
  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent
    contextRef.current.beginPath()
    contextRef.current.moveTo(offsetX, offsetY)
    setIsDrawing(true)
  }

  // Draw on canvas
  const draw = (e) => {
    if (!isDrawing) return

    const { offsetX, offsetY } = e.nativeEvent
    const context = contextRef.current

    if (isErasing) {
      context.clearRect(offsetX - brushSize / 2, offsetY - brushSize / 2, brushSize, brushSize)
    } else {
      context.strokeStyle = color
      context.lineWidth = brushSize
      context.lineJoin = 'round'
      context.lineCap = 'round'
      context.lineTo(offsetX, offsetY)
      context.stroke()
    }
  }

  // Stop drawing
  const stopDrawing = () => {
    contextRef.current.closePath()
    setIsDrawing(false)
    // Save to history
    setHistory([...history, canvasRef.current.toDataURL()])
  }

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current
    contextRef.current.fillStyle = 'white'
    contextRef.current.fillRect(0, 0, canvas.width, canvas.height)
    setHistory([canvas.toDataURL()])
  }

  // Undo
  const undo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      setHistory(newHistory)
      const img = new Image()
      img.onload = () => {
        contextRef.current.fillStyle = 'white'
        contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        contextRef.current.drawImage(img, 0, 0)
      }
      img.src = newHistory[newHistory.length - 1]
    }
  }

  // Save drawing
  const saveDrawing = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `aiden-doodle-${new Date().getTime()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFD700', '#FF69B4', '#00CED1', '#FF8C00']

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="border-4 border-gray-800 bg-white rounded-lg shadow-lg max-w-full"
        />
      </div>

      {/* Color Picker */}
      <div className="flex flex-wrap gap-2 justify-center items-center">
        <span className="font-bold text-gray-700">Colors:</span>
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c)
              setIsErasing(false)
            }}
            className={`w-10 h-10 rounded-full border-4 transition-transform hover:scale-110 ${
              color === c && !isErasing ? 'border-gray-800 scale-110' : 'border-gray-300'
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      {/* Brush Size */}
      <div className="flex justify-center items-center gap-4">
        <span className="font-bold text-gray-700">Brush Size:</span>
        <input
          type="range"
          min="1"
          max="30"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-40 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-gray-700 font-bold">{brushSize}px</span>
      </div>

      {/* Tools */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => setIsErasing(!isErasing)}
          className={`btn px-4 py-2 rounded-lg font-bold transition-all text-white ${
            isErasing
              ? 'bg-red-500 scale-110 shadow-lg'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          🧹 {isErasing ? 'Erasing' : 'Eraser'}
        </button>

        <button
          onClick={undo}
          className="btn px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold"
        >
          ↶ Undo
        </button>

        <button
          onClick={clearCanvas}
          className="btn px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold"
        >
          🗑️ Clear
        </button>

        <button
          onClick={saveDrawing}
          className="btn px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold"
        >
          💾 Save
        </button>
      </div>

      <div className="text-center text-sm text-gray-600 mt-4">
        💡 Tip: Draw with your mouse or touch! You can change colors, brush size, and use the eraser.
      </div>
    </div>
  )
}
