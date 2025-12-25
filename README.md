# 🧪 Aiden's Lab

A fun, interactive React web application built as a Christmas gift for Aiden! This site combines his interests (soccer, Messi, drawing, Pokemon, Hot Wheels, and games) into one exciting digital playground.

## 🎯 Features

- **🎨 Drawing Canvas** - Create beautiful doodles with various colors, brush sizes, and tools
- **⚽ Soccer & Messi Zone** - Learn about soccer and Messi (Coming Soon!)
- **🔴 Pokemon Tracker** - Track and manage your Pokemon collection using PokeAPI
- **🏎️ Hot Wheels Gallery** - Upload and showcase your Hot Wheels collection
- **♟️ Chess Game** - Play chess against three AI opponents with different personalities:
  - Silly Sam (Easy - Makes random moves)
  - Clever Carl (Medium - Decent AI)
  - Chess Master Max (Hard - Smart AI)
- **🎮 Games Section** - Fun mini-games including:
  - Soccer Clicker (Click the ball as fast as you can!)
  - Memory Game (Match Pokemon pairs!)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd aidensite

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5174`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 📦 Tech Stack

- **Frontend Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Canvas Drawing:** HTML5 Canvas
- **Chess Logic:** chess.js
- **Data Source:** PokeAPI (https://pokeapi.co)
- **Storage:** localStorage (Browser)

## 📝 Project Structure

```
src/
├── components/
│   ├── Navigation.jsx          # Main navigation bar
│   ├── HomePage.jsx            # Landing page with canvas
│   ├── DoodleCanvas.jsx        # Drawing canvas component
│   ├── PokemonTracker.jsx      # Pokemon collection manager
│   ├── HotWheelsGallery.jsx    # Hot Wheels showcase
│   ├── ChessGame.jsx           # Chess game with AI
│   └── GamesSection.jsx        # Games hub
├── games/
│   ├── SoccerClicker.jsx       # Soccer clicking game
│   └── MemoryGame.jsx          # Memory card matching game
└── App.jsx                     # Main app component
```

## 🎮 How to Play

### Drawing Canvas
- Click to draw with different colors
- Adjust brush size with the slider
- Use eraser to erase mistakes
- Click "Undo" to undo last action
- Click "Clear" to start over
- Click "Save" to download your drawing

### Pokemon Tracker
- Search for Pokemon by name
- Click on a Pokemon to see details
- Add to your collection
- Star your favorites
- View your collection with stats

### Hot Wheels Gallery
- Upload photos of your cars
- Name your collection
- Add colors and details
- Star your favorites
- Manage your entire collection

### Chess Game
- Choose an opponent (Silly Sam, Clever Carl, or Chess Master Max)
- Click a piece to select it (highlights valid moves)
- Click a square to move
- Beat the AI and track your wins!

### Games
- **Soccer Clicker:** Click the ball 30 times as fast as you can!
- **Memory Game:** Flip cards to find matching Pokemon pairs

## 💾 Data Persistence

All data is saved in your browser using `localStorage`:
- Drawing history (undo/redo)
- Pokemon collection
- Hot Wheels gallery
- Game scores and leaderboards
- Chess game statistics

## 🌐 Deployment

### Deploy to Cloudflare Pages

1. Push code to GitHub:
```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Connect to Cloudflare Pages:
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project"
   - Select your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Build output directory: `dist`
   - Deploy!

3. Your site will be live at `your-username.pages.dev`

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to change the color scheme:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
    },
  },
}
```

### Add More Games
Create new game files in `src/games/` and add them to `GamesSection.jsx`

### Expand Pokemon Features
Add more PokeAPI endpoints to the `PokemonTracker.jsx` component

## 📱 Mobile Support

The entire app is fully responsive and works great on:
- Mobile phones (portrait & landscape)
- Tablets
- Desktop computers

## 🐛 Troubleshooting

**Canvas not drawing?**
- Make sure your browser supports HTML5 Canvas
- Try a different browser (Chrome, Firefox, Safari)

**Pokemon API slow?**
- PokeAPI is free, sometimes slow. Refresh the page and try again.

**Storage full?**
- Clear your browser cache if you have many drawings/images

## 🎁 Special Notes

This was built as a Christmas gift with love! Every feature was designed to be fun, intuitive, and encourage creativity and exploration.

### For Aiden:
Enjoy your new lab! Have fun exploring all the features, setting high scores, and creating awesome drawings. You're amazing! 🎉

## 📄 License

This project is personal gift software. Feel free to modify and enjoy!

---

**Built with ❤️ by Uncle Nick | Merry Christmas! 🎄**
