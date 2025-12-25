import React, { useState, useEffect } from 'react'

export default function HotWheelsGallery() {
  const [gallery, setGallery] = useState(() => {
    const saved = localStorage.getItem('aidenHotWheels')
    return saved ? JSON.parse(saved) : []
  })
  const [carName, setCarName] = useState('')
  const [carColor, setCarColor] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('aidenHotWheels', JSON.stringify(gallery))
  }, [gallery])

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = e.target.files
    if (files.length === 0 || !carName.trim()) {
      alert('Please enter a car name!')
      return
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newCar = {
          id: Date.now() + Math.random(),
          name: carName,
          color: carColor || 'Unknown',
          image: event.target.result,
          favorite: false,
        }
        setGallery([newCar, ...gallery])
        setCarName('')
        setCarColor('')
        setShowForm(false)
      }
      reader.readAsDataURL(file)
    })
  }

  // Toggle favorite
  const toggleFavorite = (id) => {
    setGallery(gallery.map(car =>
      car.id === id ? { ...car, favorite: !car.favorite } : car
    ))
  }

  // Remove car
  const removeCar = (id) => {
    setGallery(gallery.filter(car => car.id !== id))
  }

  const favorites = gallery.filter(c => c.favorite)
  const sorted = [...gallery].sort((a, b) => b.favorite - a.favorite)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-300 via-yellow-300 to-red-400 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-2">
            🏎️ Hot Wheels Gallery
          </h1>
          <p className="text-lg md:text-xl font-bold text-white drop-shadow">
            You have {gallery.length} cars! {favorites.length > 0 && `⭐ ${favorites.length} favorites`}
          </p>
        </div>

        {/* Add Car Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary w-full py-4 text-xl rounded-lg font-bold"
            >
              ➕ Add Your Hot Wheels Car
            </button>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-orange-600 mb-4">📸 Add a New Car</h2>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">Car Name / Model:</label>
                <input
                  type="text"
                  value={carName}
                  onChange={(e) => setCarName(e.target.value)}
                  placeholder="e.g., Red Porsche"
                  className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 text-lg"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">Color (optional):</label>
                <input
                  type="text"
                  value={carColor}
                  onChange={(e) => setCarColor(e.target.value)}
                  placeholder="e.g., Red, Blue, Silver"
                  className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 text-lg"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">📷 Upload Photo:</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg bg-yellow-50"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="btn bg-gray-500 flex-1 py-3 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Gallery Display */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-orange-600 mb-6">
            🏆 Your Collection ({gallery.length})
          </h2>

          {gallery.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl font-bold text-gray-500 mb-4">No cars yet! 🏎️</p>
              <p className="text-lg text-gray-600">Add your first Hot Wheels car above! 📸</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sorted.map((car) => (
                <div
                  key={car.id}
                  className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all border-4 border-orange-300"
                >
                  {/* Image Container */}
                  <div className="relative bg-gray-200 h-48 flex items-center justify-center overflow-hidden">
                    <img
                      src={car.image}
                      alt={car.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                    <button
                      onClick={() => toggleFavorite(car.id)}
                      className={`absolute top-3 right-3 text-3xl transition-transform hover:scale-125 drop-shadow-lg ${
                        car.favorite ? '⭐' : '☆'
                      }`}
                    >
                      {car.favorite ? '⭐' : '☆'}
                    </button>
                  </div>

                  {/* Info Section */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-orange-700 mb-1">{car.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">Color: {car.color}</p>
                    <button
                      onClick={() => removeCar(car.id)}
                      className="btn bg-red-500 w-full py-2 rounded-lg font-bold text-sm"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
