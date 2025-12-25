import React, { useRef, useState, useEffect } from 'react'

export default function DoodleCanvas() {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [isErasing, setIsErasing] = useState(false)
  const [brushSize, setBrushSize] = useState(5)
  const contextRef = useRef(null)
  const [history, setHistory] = useState([])
  const [isMobile, setIsMobile] = useState(false)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setIsMobile(isMobileDevice)

    canvas.width = isMobileDevice ? Math.min(500, window.innerWidth - 40) : Math.min(700, window.innerWidth - 40)
    canvas.height = 400

    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)
    contextRef.current = context

    // Save initial state
    setHistory([canvas.toDataURL()])

    // Handle window resize
    const handleResize = () => {
      const newWidth = isMobileDevice ? Math.min(500, window.innerWidth - 40) : Math.min(700, window.innerWidth - 40)
      const oldCanvas = canvas
      const newCanvas = document.createElement('canvas')
      newCanvas.width = newWidth
      newCanvas.height = 400

      const newContext = newCanvas.getContext('2d', { willReadFrequently: true })
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

  // Get mouse/touch position
  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    } else if (e.nativeEvent) {
      return {
        x: e.nativeEvent.offsetX || e.clientX - rect.left,
        y: e.nativeEvent.offsetY || e.clientY - rect.top,
      }
    }
    return { x: 0, y: 0 }
  }

  // Start drawing
  const startDrawing = (e) => {
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    contextRef.current.beginPath()
    contextRef.current.moveTo(x, y)
    setIsDrawing(true)
  }

  // Draw on canvas
  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()

    const { x, y } = getCoordinates(e)
    const context = contextRef.current

    if (isErasing) {
      context.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize)
    } else {
      context.strokeStyle = color
      context.lineWidth = brushSize
      context.lineJoin = 'round'
      context.lineCap = 'round'
      context.lineTo(x, y)
      context.stroke()
    }
  }

  // Stop drawing
  const stopDrawing = (e) => {
    e.preventDefault()
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
          onTouchCancel={stopDrawing}
          className="border-4 border-gray-800 bg-white rounded-lg shadow-lg max-w-full touch-none"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Color Picker */}
      <div className="flex flex-wrap gap-3 justify-center items-center">
        <span className="font-bold text-gray-700 w-full text-center">Colors:</span>
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c)
              setIsErasing(false)
            }}
            className={`${isMobile ? 'w-14 h-14' : 'w-12 h-12'} rounded-full border-4 transition-transform hover:scale-110 ${
              color === c && !isErasing ? 'border-gray-800 scale-110 shadow-lg' : 'border-gray-300'
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      {/* Brush Size */}
      <div className="flex flex-col justify-center items-center gap-3">
        <span className="font-bold text-gray-700">Brush Size:</span>
        <div className="flex flex-wrap gap-2 justify-center">
          {[3, 6, 10, 15, 20, 30].map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                brushSize === size
                  ? 'bg-blue-600 text-white scale-110'
                  : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
              }`}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className={`flex flex-wrap gap-3 justify-center ${isMobile ? 'flex-col' : ''}`}>
        <button
          onClick={() => setIsErasing(!isErasing)}
          className={`btn ${isMobile ? 'px-6 py-3 text-lg w-full' : 'px-4 py-2'} rounded-lg font-bold transition-all text-white ${
            isErasing
              ? 'bg-red-500 scale-110 shadow-lg'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          🧹 {isErasing ? 'Erasing' : 'Eraser'}
        </button>

        <button
          onClick={undo}
          className={`btn ${isMobile ? 'px-6 py-3 text-lg w-full' : 'px-4 py-2'} bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold`}
        >
          ↶ Undo
        </button>

        <button
          onClick={clearCanvas}
          className={`btn ${isMobile ? 'px-6 py-3 text-lg w-full' : 'px-4 py-2'} bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold`}
        >
          🗑️ Clear
        </button>

        <button
          onClick={saveDrawing}
          className={`btn ${isMobile ? 'px-6 py-3 text-lg w-full' : 'px-4 py-2'} bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold`}
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
