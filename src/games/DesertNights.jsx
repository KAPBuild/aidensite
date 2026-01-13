import React, { useRef, useState, useEffect, useCallback } from 'react'

export default function DesertNights({ onBack }) {
  const canvasRef = useRef(null)
  const [gameState, setGameState] = useState('menu') // menu, playing, paused, gameover, victory
  const [night, setNight] = useState(1)
  const [score, setScore] = useState(0)
  const [woodCount, setWoodCount] = useState(20)
  const [hungerLevel, setHungerLevel] = useState(100)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('desertNightsHighScore') || '0')
  })
  const [highestNight, setHighestNight] = useState(() => {
    return parseInt(localStorage.getItem('desertNightsHighestNight') || '0')
  })

  const gameRef = useRef({
    player: { x: 400, y: 300, size: 30, speed: 3.5, facing: 'right' },
    fire: { x: 400, y: 300, radius: 120, visible: true, intensity: 1.0 },
    woodPieces: [],
    foodItems: [],
    warthogs: [],
    attacks: [],
    particles: [],
    keys: {},
    lastAttack: 0,
    spawnTimer: 0,
    nightTimer: 0,
    woodConsumptionTimer: 0,
    hungerDepletionTimer: 0,
    resourceSpawnTimer: 0,
    nightStartTime: 0,
    nightDuration: 60000
  })

  const startGame = useCallback(() => {
    const game = gameRef.current
    game.player = { x: 400, y: 300, size: 30, speed: 3.5, facing: 'right' }
    game.fire = { x: 400, y: 300, radius: 120, visible: true, intensity: 1.0 }
    game.woodPieces = []
    game.foodItems = []
    game.warthogs = []
    game.attacks = []
    game.particles = []
    game.keys = {}
    game.lastAttack = 0
    game.spawnTimer = 0
    game.nightTimer = 0
    game.woodConsumptionTimer = 0
    game.hungerDepletionTimer = 0
    game.resourceSpawnTimer = 0
    game.nightStartTime = Date.now()

    setScore(0)
    setNight(1)
    setWoodCount(20)
    setHungerLevel(100)
    setPlayerHealth(100)
    setGameState('playing')
  }, [])

  const attack = useCallback(() => {
    const game = gameRef.current
    const now = Date.now()
    const attackCooldown = 500

    if (now - game.lastAttack < attackCooldown) return
    game.lastAttack = now

    const angle = game.player.facing === 'right' ? 0 :
                  game.player.facing === 'left' ? Math.PI :
                  game.player.facing === 'up' ? -Math.PI/2 : Math.PI/2

    game.attacks.push({
      x: game.player.x,
      y: game.player.y,
      angle,
      range: 60,
      traveled: 0,
      damage: 30,
      speed: 12
    })
  }, [])

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const game = gameRef.current
    let lastTime = Date.now()
    let animationId

    const gameLoop = (currentTime) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      // Clear canvas - desert background
      ctx.fillStyle = '#d4a574'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw sand pattern
      ctx.strokeStyle = 'rgba(200, 150, 80, 0.3)'
      ctx.lineWidth = 1
      for (let i = 0; i < canvas.height; i += 30) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        for (let j = 0; j < canvas.width; j += 40) {
          ctx.lineTo(j, i + Math.sin(j / 40 + currentTime / 5000) * 8)
        }
        ctx.stroke()
      }

      // === Update Timers ===
      game.nightTimer = currentTime - game.nightStartTime
      game.woodConsumptionTimer += deltaTime
      game.hungerDepletionTimer += deltaTime
      game.resourceSpawnTimer += deltaTime

      // === Fire Wood Consumption ===
      if (game.fire.visible && game.woodConsumptionTimer > 6000) {
        game.woodConsumptionTimer = 0
        setWoodCount(w => {
          const newWood = Math.max(0, w - 1)
          if (newWood === 0) {
            game.fire.visible = false
            game.fire.intensity = 0
          }
          return newWood
        })
      }

      // === Hunger Depletion ===
      if (game.hungerDepletionTimer > 2000) {
        game.hungerDepletionTimer = 0
        setHungerLevel(h => {
          const newHunger = Math.max(0, h - 1)
          if (newHunger === 0) {
            setPlayerHealth(hp => {
              const newHealth = Math.max(0, hp - 5)
              if (newHealth === 0) {
                setGameState('gameover')
              }
              return newHealth
            })
          }
          return newHunger
        })
      }

      // === Player Movement ===
      const moveSpeed = 3.5
      if (game.keys['w'] || game.keys['ArrowUp']) {
        game.player.y -= moveSpeed
        game.player.facing = 'up'
      }
      if (game.keys['s'] || game.keys['ArrowDown']) {
        game.player.y += moveSpeed
        game.player.facing = 'down'
      }
      if (game.keys['a'] || game.keys['ArrowLeft']) {
        game.player.x -= moveSpeed
        game.player.facing = 'left'
      }
      if (game.keys['d'] || game.keys['ArrowRight']) {
        game.player.x += moveSpeed
        game.player.facing = 'right'
      }

      // Boundary checking
      game.player.x = Math.max(20, Math.min(canvas.width - 20, game.player.x))
      game.player.y = Math.max(20, Math.min(canvas.height - 20, game.player.y))

      // Check if player in fire zone
      const dx = game.player.x - game.fire.x
      const dy = game.player.y - game.fire.y
      const distToFire = Math.sqrt(dx * dx + dy * dy)
      game.player.isInFireZone = distToFire < game.fire.radius

      // === Spawn Resources ===
      if (game.resourceSpawnTimer > 3000) {
        game.resourceSpawnTimer = 0
        const angle = Math.random() * Math.PI * 2
        const distance = 150 + Math.random() * 200
        const x = game.fire.x + Math.cos(angle) * distance
        const y = game.fire.y + Math.sin(angle) * distance

        if (Math.random() < 0.75) {
          // Spawn wood
          game.woodPieces.push({
            x: Math.max(30, Math.min(canvas.width - 30, x)),
            y: Math.max(30, Math.min(canvas.height - 30, y)),
            size: 25,
            amount: 5,
            emoji: '🪵'
          })
        } else {
          // Spawn food
          const foodTypes = [
            { emoji: '🍎', value: 15 },
            { emoji: '🍖', value: 30 },
            { emoji: '💧', value: 10 }
          ]
          const food = foodTypes[Math.floor(Math.random() * foodTypes.length)]
          game.foodItems.push({
            x: Math.max(30, Math.min(canvas.width - 30, x)),
            y: Math.max(30, Math.min(canvas.height - 30, y)),
            size: 25,
            foodValue: food.value,
            emoji: food.emoji
          })
        }
      }

      // === Update Wood Pieces ===
      game.woodPieces = game.woodPieces.filter(wood => {
        const wx = game.player.x - wood.x
        const wy = game.player.y - wood.y
        const dist = Math.sqrt(wx * wx + wy * wy)

        if (dist < game.player.size + wood.size / 2) {
          setWoodCount(w => Math.min(99, w + wood.amount))
          if (!game.fire.visible && woodCount + wood.amount > 0) {
            game.fire.visible = true
            game.fire.intensity = 1.0
          }
          // Particles
          for (let i = 0; i < 8; i++) {
            game.particles.push({
              x: game.player.x,
              y: game.player.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 20,
              color: '#8B4513'
            })
          }
          return false
        }

        ctx.font = `${wood.size}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(wood.emoji, wood.x, wood.y)

        return true
      })

      // === Update Food Items ===
      game.foodItems = game.foodItems.filter(food => {
        const fx = game.player.x - food.x
        const fy = game.player.y - food.y
        const dist = Math.sqrt(fx * fx + fy * fy)

        if (dist < game.player.size + food.size / 2) {
          setHungerLevel(h => Math.min(100, h + food.foodValue))
          // Particles
          for (let i = 0; i < 8; i++) {
            game.particles.push({
              x: game.player.x,
              y: game.player.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 20,
              color: '#ff6b00'
            })
          }
          return false
        }

        ctx.font = `${food.size}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(food.emoji, food.x, food.y)

        return true
      })

      // === Spawn Warthogs ===
      const spawnRate = Math.max(3000, 6000 - night * 100)
      game.spawnTimer += deltaTime
      const maxWarthogs = Math.min(3 + Math.floor(night / 5), 12)

      if (game.spawnTimer > spawnRate && game.warthogs.length < maxWarthogs) {
        game.spawnTimer = 0
        const side = Math.floor(Math.random() * 4)
        let x, y
        switch(side) {
          case 0: x = Math.random() * canvas.width; y = -30; break
          case 1: x = canvas.width + 30; y = Math.random() * canvas.height; break
          case 2: x = Math.random() * canvas.width; y = canvas.height + 30; break
          default: x = -30; y = Math.random() * canvas.height; break
        }

        game.warthogs.push({
          x,
          y,
          health: 20 + night * 2,
          maxHealth: 20 + night * 2,
          speed: 0.8 + night * 0.05,
          damage: 10 + night * 2,
          size: 35,
          emoji: '🐗',
          hit: false,
          stoppedAtBoundary: false
        })
      }

      // === Update Warthogs ===
      game.warthogs = game.warthogs.filter(warthog => {
        const wx = game.player.x - warthog.x
        const wy = game.player.y - warthog.y
        const distToPlayer = Math.sqrt(wx * wx + wy * wy)

        const fdx = game.fire.x - warthog.x
        const fdy = game.fire.y - warthog.y
        const distToFire = Math.sqrt(fdx * fdx + fdy * fdy)

        // Check if next position would enter fire
        const nextX = warthog.x + (wx / distToPlayer) * warthog.speed
        const nextY = warthog.y + (wy / distToPlayer) * warthog.speed
        const nextDistToFire = Math.sqrt(
          Math.pow(game.fire.x - nextX, 2) + Math.pow(game.fire.y - nextY, 2)
        )

        if (game.fire.visible && nextDistToFire < game.fire.radius) {
          warthog.stoppedAtBoundary = true
          const perpAngle = Math.atan2(fdy, fdx) + Math.PI / 2
          warthog.x += Math.cos(perpAngle) * warthog.speed * 0.5
          warthog.y += Math.sin(perpAngle) * warthog.speed * 0.5
        } else {
          warthog.stoppedAtBoundary = false
          warthog.x += (wx / distToPlayer) * warthog.speed
          warthog.y += (wy / distToPlayer) * warthog.speed
        }

        // Attack if fire is out and player is close
        if (!game.fire.visible && distToPlayer < game.player.size + warthog.size / 2) {
          setPlayerHealth(h => {
            const newHealth = Math.max(0, h - warthog.damage)
            if (newHealth === 0) setGameState('gameover')
            return newHealth
          })
          warthog.x += (Math.random() - 0.5) * 50
          warthog.y += (Math.random() - 0.5) * 50
        }

        // Draw warthog
        ctx.font = `${warthog.size}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        if (warthog.hit) {
          ctx.filter = 'brightness(2)'
        }
        ctx.fillText(warthog.emoji, warthog.x, warthog.y)
        ctx.filter = 'none'

        // Draw health bar
        const barWidth = 50
        const barHeight = 8
        ctx.fillStyle = '#333'
        ctx.fillRect(warthog.x - barWidth/2, warthog.y - warthog.size/2 - 15, barWidth, barHeight)
        ctx.fillStyle = '#ff4444'
        ctx.fillRect(warthog.x - barWidth/2, warthog.y - warthog.size/2 - 15, barWidth * (warthog.health / warthog.maxHealth), barHeight)

        // Show boundary indicator
        if (warthog.stoppedAtBoundary) {
          ctx.fillStyle = '#ffff00'
          ctx.font = '20px Arial'
          ctx.fillText('❗', warthog.x, warthog.y - warthog.size - 10)
        }

        return warthog.health > 0
      })

      // === Update Attacks ===
      game.attacks = game.attacks.filter(atk => {
        atk.x += Math.cos(atk.angle) * atk.speed
        atk.y += Math.sin(atk.angle) * atk.speed
        atk.traveled += atk.speed

        // Check collision with warthogs
        game.warthogs.forEach(warthog => {
          const ax = atk.x - warthog.x
          const ay = atk.y - warthog.y
          const dist = Math.sqrt(ax * ax + ay * ay)

          if (dist < 30) {
            warthog.health -= atk.damage
            warthog.hit = true
            setTimeout(() => warthog.hit = false, 100)

            if (warthog.health <= 0) {
              setScore(s => s + 10)
              // Particles
              for (let i = 0; i < 15; i++) {
                game.particles.push({
                  x: warthog.x,
                  y: warthog.y,
                  vx: (Math.random() - 0.5) * 12,
                  vy: (Math.random() - 0.5) * 12,
                  life: 30,
                  color: '#ff6b6b'
                })
              }
            }
          }
        })

        // Draw attack (axe)
        ctx.save()
        ctx.translate(atk.x, atk.y)
        ctx.rotate(atk.angle)

        // Axe blade (silver)
        ctx.fillStyle = '#cccccc'
        ctx.beginPath()
        ctx.arc(15, 0, 10, 0, Math.PI * 2)
        ctx.fill()

        // Axe handle (brown)
        ctx.fillStyle = '#8B4513'
        ctx.fillRect(-15, -4, 20, 8)

        ctx.restore()

        return atk.traveled < atk.range
      })

      // === Update Particles ===
      game.particles = game.particles.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.life--

        ctx.fillStyle = p.color
        ctx.globalAlpha = p.life / 30
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1

        return p.life > 0
      })

      // === Draw Fire ===
      if (game.fire.visible) {
        // Safe zone glow
        ctx.fillStyle = `rgba(255, 150, 0, ${0.15 * game.fire.intensity})`
        ctx.beginPath()
        ctx.arc(game.fire.x, game.fire.y, game.fire.radius, 0, Math.PI * 2)
        ctx.fill()

        // Fire boundary line
        ctx.strokeStyle = `rgba(255, 100, 0, ${0.6 * game.fire.intensity})`
        ctx.lineWidth = 3
        ctx.setLineDash([10, 5])
        ctx.beginPath()
        ctx.arc(game.fire.x, game.fire.y, game.fire.radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        // Fire animation
        ctx.font = `${40 + Math.sin(currentTime / 200) * 5}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🔥', game.fire.x, game.fire.y)
      }

      // === Draw Player ===
      ctx.font = '30px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🧑', game.player.x, game.player.y)

      // === Draw UI ===
      ctx.fillStyle = 'white'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`Night: ${night}/99`, 20, 30)
      ctx.fillText(`Score: ${score}`, 20, 55)

      ctx.textAlign = 'right'
      ctx.fillText(`🪵 ${woodCount}`, canvas.width - 20, 30)

      // Hunger bar
      const hungerBarWidth = 150
      const hungerBarHeight = 15
      const hungerBarX = canvas.width - hungerBarWidth - 20
      const hungerBarY = 40
      ctx.fillStyle = '#333'
      ctx.fillRect(hungerBarX, hungerBarY, hungerBarWidth, hungerBarHeight)
      ctx.fillStyle = hungerLevel > 30 ? '#4caf50' : '#ff6b6b'
      ctx.fillRect(hungerBarX, hungerBarY, hungerBarWidth * (hungerLevel / 100), hungerBarHeight)
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.strokeRect(hungerBarX, hungerBarY, hungerBarWidth, hungerBarHeight)
      ctx.fillStyle = 'white'
      ctx.font = '12px Arial'
      ctx.fillText(`🍖 ${hungerLevel}`, canvas.width - hungerBarWidth / 2 - 20, hungerBarY + 11)

      // Health bar
      const healthBarWidth = 150
      const healthBarHeight = 15
      const healthBarX = canvas.width - healthBarWidth - 20
      const healthBarY = 65
      ctx.fillStyle = '#333'
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight)
      ctx.fillStyle = playerHealth > 30 ? '#ff4444' : '#ff0000'
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth * (playerHealth / 100), healthBarHeight)
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight)
      ctx.fillStyle = 'white'
      ctx.font = '12px Arial'
      ctx.fillText(`❤️ ${playerHealth}`, canvas.width - healthBarWidth / 2 - 20, healthBarY + 11)

      // Warnings
      if (woodCount < 5) {
        if (Math.floor(currentTime / 500) % 2 === 0) {
          ctx.fillStyle = '#ff0000'
          ctx.font = 'bold 20px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('⚠️ LOW WOOD! ⚠️', canvas.width / 2, 100)
        }
      }

      if (hungerLevel < 20) {
        if (Math.floor(currentTime / 500) % 2 === 0) {
          ctx.fillStyle = '#ff6b6b'
          ctx.font = 'bold 18px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('🍖 HUNGRY! 🍖', canvas.width / 2, 130)
        }
      }

      if (!game.fire.visible) {
        ctx.fillStyle = '#ff0000'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('🔥 FIRE OUT - DANGER! 🔥', canvas.width / 2, 160)
      }

      // Night progress bar
      const nightProgress = Math.min(game.nightTimer / game.nightDuration, 1)
      const barWidth = 300
      const barHeight = 25
      const barX = canvas.width / 2 - barWidth / 2
      const barY = canvas.height - 40

      ctx.fillStyle = '#333'
      ctx.fillRect(barX, barY, barWidth, barHeight)
      ctx.fillStyle = '#ffaa00'
      ctx.fillRect(barX, barY, barWidth * nightProgress, barHeight)

      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.strokeRect(barX, barY, barWidth, barHeight)

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`Night ${night} - ${Math.round(nightProgress * 100)}%`, canvas.width / 2, barY + 17)

      // === Check Night Completion ===
      if (game.nightTimer >= game.nightDuration) {
        const nextNight = night + 1
        if (nextNight > 99) {
          setGameState('victory')
          if (score > highScore) {
            setHighScore(score)
            localStorage.setItem('desertNightsHighScore', score.toString())
          }
          if (nextNight - 1 > highestNight) {
            setHighestNight(nextNight - 1)
            localStorage.setItem('desertNightsHighestNight', (nextNight - 1).toString())
          }
        } else {
          setNight(nextNight)
          setScore(s => s + 100)
          setWoodCount(w => Math.min(99, w + 10))
          setHungerLevel(h => Math.min(100, h + 20))
          game.nightStartTime = Date.now()
          game.warthogs = []
        }
      }

      animationId = requestAnimationFrame(gameLoop)
    }

    // Keyboard input
    const handleKeyDown = (e) => {
      game.keys[e.key.toLowerCase()] = true
      if (e.key === ' ') {
        e.preventDefault()
        attack()
      }
      if (e.key === 'Escape') {
        setGameState('paused')
      }
    }

    const handleKeyUp = (e) => {
      game.keys[e.key.toLowerCase()] = false
    }

    const handleCanvasClick = () => {
      attack()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvas.addEventListener('click', handleCanvasClick)

    animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('click', handleCanvasClick)
    }
  }, [gameState, night, score, woodCount, hungerLevel, playerHealth, highScore, attack])

  return (
    <div className={`${gameState === 'playing' ? 'fixed inset-0 p-0 overflow-hidden' : 'min-h-screen p-4'} bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 user-select-none`}
      style={gameState === 'playing' ? { touchAction: 'none', overscrollBehavior: 'none' } : {}}>
      <div className={`${gameState === 'playing' ? 'h-full w-full flex flex-col md:flex-row items-stretch justify-between gap-2 md:gap-4 px-2 py-2' : 'max-w-4xl'} mx-auto`}>
        {/* Header - Hide on mobile fullscreen */}
        {gameState !== 'playing' && (
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={onBack}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold"
            >
              Back
            </button>
            <h1 className="text-3xl md:text-4xl font-black text-orange-400 drop-shadow-lg">
              99 Nights in the Desert
            </h1>
            <div className="text-yellow-300 font-bold">
              Best: Night {highestNight}
            </div>
          </div>
        )}

        {/* Game Canvas */}
        <div className={`relative ${gameState === 'playing' ? 'flex-1 flex items-center justify-center md:order-2 w-full md:w-auto' : ''}`}>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className={`rounded-xl border-4 border-orange-600 shadow-2xl bg-yellow-900 ${gameState === 'playing' ? 'w-full h-full object-contain' : 'w-full'}`}
            style={gameState === 'playing' ? { touchAction: 'none', maxWidth: '100%', maxHeight: '100%' } : {}}
          />

          {/* Menu Overlay */}
          {gameState === 'menu' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl p-4">
              <h2 className="text-5xl font-black text-orange-400 mb-4">99 NIGHTS</h2>
              <p className="text-xl text-gray-300 mb-6">Survive the desert warthogs!</p>

              <div className="text-gray-400 mb-8 text-center text-sm md:text-base">
                <p>🪵 Collect wood to keep fire burning (fire consumes 1 wood every 10 sec)</p>
                <p>🍖 Gather food to stay alive (hunger depletes every 2 sec)</p>
                <p>🐗 Fight warthogs with your axe</p>
                <p>🔥 Fire keeps you safe - warthogs can't enter!</p>
                <p>🌙 Survive all 99 nights to win!</p>
              </div>

              <div className="text-gray-400 mb-8 text-center text-sm">
                <p>WASD or Arrow Keys to move</p>
                <p>SPACE or Click to attack</p>
                <p>ESC to pause</p>
              </div>

              <button
                onClick={startGame}
                className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-xl font-black text-2xl transition-all hover:scale-110"
              >
                START GAME
              </button>
            </div>
          )}

          {/* Paused Overlay */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl">
              <h2 className="text-4xl font-black text-yellow-400 mb-8">PAUSED</h2>

              <div className="flex gap-4 flex-col md:flex-row mb-8">
                <button
                  onClick={() => setGameState('playing')}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold text-xl"
                >
                  Resume
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xl"
                >
                  Quit
                </button>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl">
              <h2 className="text-5xl font-black text-red-500 mb-4">GAME OVER</h2>
              <p className="text-2xl text-white mb-2">You survived Night {night - 1}</p>
              <p className="text-xl text-gray-400 mb-2">Score: {score}</p>
              {night - 1 > highestNight && (
                <p className="text-2xl text-yellow-400 mb-4">NEW RECORD!</p>
              )}

              <button
                onClick={startGame}
                className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-xl font-black text-2xl transition-all hover:scale-110"
              >
                TRY AGAIN
              </button>
            </div>
          )}

          {/* Victory Overlay */}
          {gameState === 'victory' && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 flex flex-col items-center justify-center rounded-xl">
              <h2 className="text-6xl font-black text-white mb-4">🏆 VICTORY! 🏆</h2>
              <p className="text-3xl text-white mb-2">You survived all 99 nights!</p>
              <p className="text-4xl font-bold text-white mb-8">Final Score: {score}</p>

              <button
                onClick={startGame}
                className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-xl font-black text-2xl transition-all hover:scale-110"
              >
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Unified Controls */}
        {gameState === 'playing' && (
          <>
            {/* Attack Button - Left side */}
            <div className="flex flex-col items-center justify-center flex-shrink-0 md:order-1 gap-3" style={{ minWidth: '100px', height: 'fit-content' }}>
              <button
                onTouchStart={(e) => {
                  e.preventDefault()
                  attack()
                }}
                onClick={attack}
                className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-b from-red-500 to-red-700 rounded-full font-bold text-xl md:text-2xl text-white shadow-2xl active:scale-90 transition-transform border-4 border-red-400 flex items-center justify-center hover:from-red-400 hover:to-red-600 flex-shrink-0"
              >
                ⚔️
              </button>
            </div>

            {/* Joystick - Right side */}
            <div className="flex items-center justify-center flex-shrink-0 md:order-3" style={{ minWidth: '140px', height: 'fit-content' }}>
              <div
                className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-gray-900 border-4 border-gray-700 shadow-2xl p-2"
                style={{ touchAction: 'none' }}
                onTouchStart={(e) => {
                  e.preventDefault()
                  const touch = e.touches[0]
                  const rect = e.currentTarget.getBoundingClientRect()
                  const centerX = rect.left + rect.width / 2
                  const centerY = rect.top + rect.height / 2
                  const dx = touch.clientX - centerX
                  const dy = touch.clientY - centerY
                  const distance = Math.sqrt(dx * dx + dy * dy)

                  gameRef.current.keys['w'] = distance > 15 && dy < -10
                  gameRef.current.keys['s'] = distance > 15 && dy > 10
                  gameRef.current.keys['a'] = distance > 15 && dx < -10
                  gameRef.current.keys['d'] = distance > 15 && dx > 10
                }}
                onTouchMove={(e) => {
                  e.preventDefault()
                  const touch = e.touches[0]
                  const rect = e.currentTarget.getBoundingClientRect()
                  const centerX = rect.left + rect.width / 2
                  const centerY = rect.top + rect.height / 2
                  const dx = touch.clientX - centerX
                  const dy = touch.clientY - centerY
                  const distance = Math.sqrt(dx * dx + dy * dy)

                  gameRef.current.keys['w'] = distance > 15 && dy < -10
                  gameRef.current.keys['s'] = distance > 15 && dy > 10
                  gameRef.current.keys['a'] = distance > 15 && dx < -10
                  gameRef.current.keys['d'] = distance > 15 && dx > 10
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  gameRef.current.keys['w'] = false
                  gameRef.current.keys['s'] = false
                  gameRef.current.keys['a'] = false
                  gameRef.current.keys['d'] = false
                }}
              >
                {/* Joystick center button */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 md:w-12 md:h-12 bg-gradient-to-b from-gray-600 to-gray-800 rounded-full border-2 border-gray-500 shadow-lg">
                  <div className="absolute inset-1 bg-gradient-to-b from-gray-500 to-gray-700 rounded-full"></div>
                </div>
                {/* Direction indicators */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-gray-600 text-xs md:text-lg">▲</div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-gray-600 text-xs md:text-lg">▼</div>
                <div className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-600 text-xs md:text-lg">◀</div>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-600 text-xs md:text-lg">▶</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
