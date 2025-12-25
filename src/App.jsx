import { useState } from 'react'
import Navigation from './components/Navigation'
import HomePage from './components/HomePage'
import PokemonTracker from './components/PokemonTracker'
import HotWheelsGallery from './components/HotWheelsGallery'
import ChessGame from './components/ChessGame'
import GamesSection from './components/GamesSection'
import RetroGames from './components/RetroGames'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <HomePage />
      case 'soccer':
        return <div className="p-8"><h1 className="text-4xl font-bold text-white mb-8">⚽ Messi & Soccer Zone</h1><p className="text-white text-xl">Coming soon! 🚀</p></div>
      case 'pokemon':
        return <PokemonTracker />
      case 'hotwheels':
        return <HotWheelsGallery />
      case 'chess':
        return <ChessGame />
      case 'games':
        return <GamesSection />
      case 'retro':
        return <RetroGames />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="pt-20">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
