import React, { useState, useEffect } from 'react'

const POKEAPI_URL = 'https://pokeapi.co/api/v2'

export default function PokemonTracker() {
  const [collection, setCollection] = useState(() => {
    const saved = localStorage.getItem('aidenPokemonCollection')
    return saved ? JSON.parse(saved) : []
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPokemon, setSelectedPokemon] = useState(null)

  // Save to localStorage whenever collection changes
  useEffect(() => {
    localStorage.setItem('aidenPokemonCollection', JSON.stringify(collection))
  }, [collection])

  // Search for Pokemon
  const searchPokemon = async (term) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${POKEAPI_URL}/pokemon?limit=1000`)
      const data = await response.json()

      const filtered = data.results
        .filter(p => p.name.toLowerCase().includes(term.toLowerCase()))
        .slice(0, 10)

      const pokemonData = await Promise.all(
        filtered.map(async (p) => {
          const res = await fetch(p.url)
          return res.json()
        })
      )

      setSearchResults(pokemonData)
    } catch (error) {
      console.error('Error searching Pokemon:', error)
    }
    setLoading(false)
  }

  // Add Pokemon to collection
  const addPokemon = (pokemon) => {
    if (!collection.some(p => p.id === pokemon.id)) {
      setCollection([...collection, {
        id: pokemon.id,
        name: pokemon.name,
        image: pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default,
        type: pokemon.types[0].type.name,
        favorite: false,
      }])
      setSearchResults([])
      setSearchTerm('')
    }
  }

  // Toggle favorite
  const toggleFavorite = (id) => {
    setCollection(collection.map(p =>
      p.id === id ? { ...p, favorite: !p.favorite } : p
    ))
  }

  // Remove Pokemon
  const removePokemon = (id) => {
    setCollection(collection.filter(p => p.id !== id))
  }

  const favorites = collection.filter(p => p.favorite)
  const sorted = [...collection].sort((a, b) => b.favorite - a.favorite)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-300 via-yellow-300 to-red-400 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-2">
            🔴 Pokemon Tracker
          </h1>
          <p className="text-lg md:text-xl font-bold text-white drop-shadow">
            You have {collection.length} Pokemon! {favorites.length > 0 && `⭐ ${favorites.length} favorites`}
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">🔍 Find & Add Pokemon</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                searchPokemon(e.target.value)
              }}
              placeholder="Search Pokemon name..."
              className="flex-1 px-4 py-3 border-2 border-red-300 rounded-lg focus:outline-none focus:border-red-500 text-lg"
            />
            <button
              onClick={() => searchPokemon(searchTerm)}
              className="btn btn-primary px-6 py-3 rounded-lg"
            >
              🔎 Search
            </button>
          </div>

          {loading && <p className="text-center text-lg font-bold text-red-600">Loading... 🔄</p>}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {searchResults.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className="bg-gradient-to-br from-yellow-100 to-red-100 rounded-lg p-3 text-center border-2 border-yellow-400 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setSelectedPokemon(pokemon)}
                >
                  <img
                    src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}
                    alt={pokemon.name}
                    className="w-20 h-20 mx-auto mb-2"
                  />
                  <p className="font-bold text-red-700 capitalize">{pokemon.name}</p>
                  <p className="text-sm text-red-600">#{pokemon.id}</p>
                </div>
              ))}
            </div>
          )}

          {/* Pokemon Detail Modal */}
          {selectedPokemon && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
              <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full">
                <button
                  onClick={() => setSelectedPokemon(null)}
                  className="float-right text-2xl font-bold text-gray-600 hover:text-red-600"
                >
                  ✕
                </button>
                <div className="text-center mb-4">
                  <img
                    src={selectedPokemon.sprites.other['official-artwork'].front_default || selectedPokemon.sprites.front_default}
                    alt={selectedPokemon.name}
                    className="w-40 h-40 mx-auto mb-4"
                  />
                  <h3 className="text-3xl font-bold text-red-600 capitalize mb-2">
                    {selectedPokemon.name}
                  </h3>
                  <p className="text-lg font-bold text-gray-600 mb-4">
                    #{selectedPokemon.id}
                  </p>
                  <p className="text-lg font-semibold mb-4">
                    Type: <span className="text-red-600 capitalize">{selectedPokemon.types[0].type.name}</span>
                  </p>
                </div>

                {collection.some(p => p.id === selectedPokemon.id) ? (
                  <p className="text-center text-green-600 font-bold mb-4 text-lg">✓ Already in collection!</p>
                ) : (
                  <button
                    onClick={() => {
                      addPokemon(selectedPokemon)
                      setSelectedPokemon(null)
                    }}
                    className="btn btn-success w-full py-3 text-lg rounded-lg mb-4"
                  >
                    ➕ Add to Collection
                  </button>
                )}

                <button
                  onClick={() => setSelectedPokemon(null)}
                  className="btn bg-gray-500 w-full py-3 text-lg rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collection Display */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-6">
            📦 Your Collection ({collection.length})
          </h2>

          {collection.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl font-bold text-gray-500 mb-4">No Pokemon yet!</p>
              <p className="text-lg text-gray-600">Search above to add your first Pokemon! 🔍</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sorted.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className="bg-gradient-to-br from-yellow-100 to-red-100 rounded-lg p-4 border-3 border-yellow-400 hover:shadow-lg transition-all"
                >
                  <div className="relative">
                    <img
                      src={pokemon.image}
                      alt={pokemon.name}
                      className="w-full aspect-square object-contain mb-2"
                    />
                    <button
                      onClick={() => toggleFavorite(pokemon.id)}
                      className={`absolute top-2 right-2 text-2xl transition-transform hover:scale-125 ${
                        pokemon.favorite ? '⭐' : '☆'
                      }`}
                    >
                      {pokemon.favorite ? '⭐' : '☆'}
                    </button>
                  </div>
                  <p className="font-bold text-red-700 capitalize text-center mb-1">{pokemon.name}</p>
                  <p className="text-sm text-red-600 text-center mb-2">#{pokemon.id}</p>
                  <p className="text-xs text-gray-600 text-center mb-3 capitalize">{pokemon.type}</p>
                  <button
                    onClick={() => removePokemon(pokemon.id)}
                    className="btn bg-red-500 w-full py-2 text-sm rounded-lg"
                  >
                    🗑️ Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
