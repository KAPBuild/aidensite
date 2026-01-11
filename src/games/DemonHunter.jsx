import React, { useRef, useState, useEffect, useCallback } from 'react'

export default function DemonHunter({ onBack }) {
  const canvasRef = useRef(null)
  const [gameState, setGameState] = useState('menu') // menu, playing, paused, gameover, shop
  const [score, setScore] = useState(0)
  const [coins, setCoins] = useState(0)
  const [wave, setWave] = useState(1)
  const [playerHealth, setPlayerHealth] = useState(150)
  const [weapon, setWeapon] = useState({
    name: 'Wooden Sword',
    damage: 25,
    speed: 1,
    range: 50,
    level: 1,
    type: 'sword'
  })
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('demonHunterHighScore') || '0')
  })

  const gameRef = useRef({
    player: { x: 400, y: 300, size: 30, speed: 2, facing: 'right' },
    demons: [],
    attacks: [],
    particles: [],
    keys: {},
    lastAttack: 0,
    spawnTimer: 0,
    isPaused: false,
    demonsKilledThisWave: 0,
    demonsToKill: 5,
    bossActive: false,
    boss: null,
    medkits: []
  })

  const weapons = [
    { name: 'Wooden Sword', damage: 25, speed: 1, range: 50, level: 1, cost: 0, type: 'sword' },
    { name: 'Iron Sword', damage: 40, speed: 1.2, range: 60, level: 2, cost: 50, type: 'sword' },
    { name: 'Fire Blade', damage: 60, speed: 1.3, range: 70, level: 3, cost: 150, type: 'sword' },
    { name: 'Pistol', damage: 45, speed: 2, range: 200, level: 4, cost: 200, type: 'gun' },
    { name: 'Thunder Axe', damage: 85, speed: 1.4, range: 80, level: 5, cost: 300, type: 'sword' },
    { name: 'Shotgun', damage: 80, speed: 1.5, range: 120, level: 6, cost: 400, type: 'gun' },
    { name: 'Dragon Slayer', damage: 120, speed: 1.5, range: 100, level: 7, cost: 500, type: 'sword' },
    { name: 'Machine Gun', damage: 35, speed: 5, range: 250, level: 8, cost: 700, type: 'gun' },
    { name: 'Demon Destroyer', damage: 175, speed: 2, range: 120, level: 9, cost: 1000, type: 'sword' },
    { name: 'Laser Cannon', damage: 200, speed: 3, range: 400, level: 10, cost: 1500, type: 'gun' },
  ]

  const spawnDemon = useCallback(() => {
    const game = gameRef.current
    const canvas = canvasRef.current
    if (!canvas) return

    const side = Math.floor(Math.random() * 4)
    let x, y

    switch(side) {
      case 0: x = Math.random() * canvas.width; y = -30; break
      case 1: x = canvas.width + 30; y = Math.random() * canvas.height; break
      case 2: x = Math.random() * canvas.width; y = canvas.height + 30; break
      default: x = -30; y = Math.random() * canvas.height; break
    }

    const demonTypes = [
      { emoji: '👹', health: 15 + wave * 3, speed: 0.8, damage: 5, coins: 8 },
      { emoji: '👿', health: 20 + wave * 4, speed: 1, damage: 8, coins: 12 },
      { emoji: '👻', health: 10 + wave * 2, speed: 1.5, damage: 5, coins: 6 },
      { emoji: '💀', health: 30 + wave * 5, speed: 0.6, damage: 10, coins: 15 },
      { emoji: '🧟', health: 40 + wave * 6, speed: 0.5, damage: 12, coins: 20 },
    ]

    const type = demonTypes[Math.min(Math.floor(Math.random() * (1 + wave / 2)), demonTypes.length - 1)]

    game.demons.push({
      x, y,
      ...type,
      maxHealth: type.health,
      size: 35,
      hit: false
    })
  }, [wave])

  const attack = useCallback(() => {
    const game = gameRef.current
    const now = Date.now()
    const attackCooldown = 500 / weapon.speed

    if (now - game.lastAttack < attackCooldown) return
    game.lastAttack = now

    const angle = game.player.facing === 'right' ? 0 :
                  game.player.facing === 'left' ? Math.PI :
                  game.player.facing === 'up' ? -Math.PI/2 : Math.PI/2

    game.attacks.push({
      x: game.player.x,
      y: game.player.y,
      angle,
      range: weapon.range,
      damage: weapon.damage,
      traveled: 0,
      speed: 15
    })

    // Add particles
    for (let i = 0; i < 5; i++) {
      game.particles.push({
        x: game.player.x + Math.cos(angle) * 20,
        y: game.player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle + (Math.random() - 0.5)) * 5,
        vy: Math.sin(angle + (Math.random() - 0.5)) * 5,
        life: 20,
        color: weapon.level >= 5 ? '#ff0000' : weapon.level >= 3 ? '#ff8800' : '#ffff00'
      })
    }
  }, [weapon])

  useEffect(() => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const game = gameRef.current

    const handleKeyDown = (e) => {
      game.keys[e.key.toLowerCase()] = true
      if (e.key === ' ' || e.key === 'Enter') {
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

    const handleClick = () => attack()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvas.addEventListener('click', handleClick)

    let animationId
    let lastTime = 0

    const gameLoop = (timestamp) => {
      const deltaTime = timestamp - lastTime
      lastTime = timestamp

      // Clear canvas
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid pattern
      ctx.strokeStyle = '#2a2a4e'
      ctx.lineWidth = 1
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Player movement
      const speed = game.player.speed
      if (game.keys['w'] || game.keys['arrowup']) {
        game.player.y -= speed
        game.player.facing = 'up'
      }
      if (game.keys['s'] || game.keys['arrowdown']) {
        game.player.y += speed
        game.player.facing = 'down'
      }
      if (game.keys['a'] || game.keys['arrowleft']) {
        game.player.x -= speed
        game.player.facing = 'left'
      }
      if (game.keys['d'] || game.keys['arrowright']) {
        game.player.x += speed
        game.player.facing = 'right'
      }

      // Keep player in bounds (with padding)
      game.player.x = Math.max(35, Math.min(canvas.width - 35, game.player.x))
      game.player.y = Math.max(35, Math.min(canvas.height - 35, game.player.y))

      // Spawn demons - only spawn if wave isn't complete
      game.spawnTimer += deltaTime
      const spawnRate = Math.max(1500, 3000 - wave * 100)
      const demonsNeeded = 3 + wave * 2 // Wave 1 = 5 demons, Wave 2 = 7, etc.
      game.demonsToKill = demonsNeeded

      if (game.spawnTimer > spawnRate && game.demonsKilledThisWave < demonsNeeded) {
        game.spawnTimer = 0
        const maxOnScreen = Math.min(2 + Math.floor(wave / 2), 6)
        if (game.demons.length < maxOnScreen) {
          spawnDemon()
        }
      }

      // Update attacks
      game.attacks = game.attacks.filter(atk => {
        atk.x += Math.cos(atk.angle) * atk.speed
        atk.y += Math.sin(atk.angle) * atk.speed
        atk.traveled += atk.speed

        // Draw attack based on weapon type
        ctx.save()
        ctx.translate(atk.x, atk.y)
        ctx.rotate(atk.angle)

        if (weapon.type === 'gun') {
          // Draw bullet
          const bulletColor = weapon.name === 'Laser Cannon' ? '#00ffff' :
                             weapon.name === 'Machine Gun' ? '#ffff00' : '#ffaa00'
          ctx.fillStyle = bulletColor
          ctx.beginPath()
          ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2)
          ctx.fill()

          // Bullet trail
          ctx.fillStyle = weapon.name === 'Laser Cannon' ? '#0088ff' : '#ff8800'
          ctx.globalAlpha = 0.5
          ctx.beginPath()
          ctx.ellipse(-15, 0, 10, 3, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        } else {
          // Sword blade
          ctx.fillStyle = weapon.level >= 7 ? '#ff4444' : weapon.level >= 3 ? '#ff8800' : '#cccccc'
          ctx.beginPath()
          ctx.moveTo(-5, -3)
          ctx.lineTo(20, 0)
          ctx.lineTo(-5, 3)
          ctx.closePath()
          ctx.fill()

          // Sword edge glow
          ctx.strokeStyle = weapon.level >= 7 ? '#ff0000' : weapon.level >= 3 ? '#ffcc00' : '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()

          // Sword handle
          ctx.fillStyle = '#8B4513'
          ctx.fillRect(-12, -4, 8, 8)

          // Sword guard
          ctx.fillStyle = '#FFD700'
          ctx.fillRect(-6, -6, 3, 12)
        }

        ctx.restore()

        // Check collision with demons
        game.demons.forEach(demon => {
          const dx = atk.x - demon.x
          const dy = atk.y - demon.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < demon.size) {
            demon.health -= atk.damage
            demon.hit = true
            setTimeout(() => demon.hit = false, 100)

            // Hit particles
            for (let i = 0; i < 3; i++) {
              game.particles.push({
                x: demon.x,
                y: demon.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 15,
                color: '#ff0000'
              })
            }

            atk.traveled = atk.range + 1
          }
        })

        return atk.traveled < atk.range
      })

      // Update demons
      let newScore = score
      let newCoins = coins
      game.demons = game.demons.filter(demon => {
        // Move toward player
        const dx = game.player.x - demon.x
        const dy = game.player.y - demon.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > 0) {
          demon.x += (dx / dist) * demon.speed
          demon.y += (dy / dist) * demon.speed
        }

        // Check collision with player
        if (dist < game.player.size + demon.size / 2) {
          setPlayerHealth(h => {
            const newHealth = h - demon.damage
            if (newHealth <= 0) {
              setGameState('gameover')
              if (score > highScore) {
                setHighScore(score)
                localStorage.setItem('demonHunterHighScore', score.toString())
              }
            }
            return Math.max(0, newHealth)
          })
          return false
        }

        // Draw demon
        ctx.font = `${demon.size}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        if (demon.hit) {
          ctx.filter = 'brightness(2)'
        }
        ctx.fillText(demon.emoji, demon.x, demon.y)
        ctx.filter = 'none'

        // Health bar
        const barWidth = 40
        const barHeight = 5
        ctx.fillStyle = '#333'
        ctx.fillRect(demon.x - barWidth/2, demon.y - demon.size/2 - 10, barWidth, barHeight)
        ctx.fillStyle = '#ff0000'
        ctx.fillRect(demon.x - barWidth/2, demon.y - demon.size/2 - 10, barWidth * (demon.health / demon.maxHealth), barHeight)

        // Check if dead
        if (demon.health <= 0) {
          newScore += 10
          newCoins += demon.coins
          game.demonsKilledThisWave++

          // 25% chance to drop medkit
          if (Math.random() < 0.25) {
            game.medkits.push({
              x: demon.x,
              y: demon.y,
              heal: 25,
              size: 25
            })
          }

          // Death particles
          for (let i = 0; i < 10; i++) {
            game.particles.push({
              x: demon.x,
              y: demon.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 30,
              color: '#9900ff'
            })
          }
          return false
        }

        return true
      })

      if (newScore !== score) setScore(newScore)
      if (newCoins !== coins) setCoins(newCoins)

      // Update and draw medkits
      game.medkits = game.medkits.filter(medkit => {
        // Check if player picks up medkit
        const dx = game.player.x - medkit.x
        const dy = game.player.y - medkit.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < game.player.size + medkit.size / 2) {
          setPlayerHealth(h => Math.min(150, h + medkit.heal))
          // Heal particles
          for (let i = 0; i < 8; i++) {
            game.particles.push({
              x: game.player.x,
              y: game.player.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5 - 2,
              life: 25,
              color: '#00ff00'
            })
          }
          return false
        }

        // Draw medkit
        ctx.font = `${medkit.size}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('💊', medkit.x, medkit.y)

        return true
      })

      // Check wave completion - killed enough demons, spawn boss
      const demonsNeededForWave = 3 + wave * 2
      if (game.demonsKilledThisWave >= demonsNeededForWave && game.demons.length === 0 && !game.bossActive && !game.boss) {
        // Spawn boss!
        const bossTypes = [
          { emoji: '👹', name: 'Demon Lord', color: '#ff4444' },
          { emoji: '🐉', name: 'Fire Dragon', color: '#ff8800' },
          { emoji: '👾', name: 'Alien Overlord', color: '#00ff88' },
          { emoji: '🦖', name: 'T-Rex King', color: '#88ff00' },
          { emoji: '👿', name: 'Satan Jr', color: '#ff0088' },
          { emoji: '🤖', name: 'Murder Bot', color: '#888888' },
          { emoji: '🦑', name: 'Kraken', color: '#0088ff' },
          { emoji: '🧛', name: 'Vampire Lord', color: '#880000' },
          { emoji: '🐙', name: 'Tentacle Terror', color: '#ff00ff' },
          { emoji: '💀', name: 'Skeleton King', color: '#ffffff' },
          { emoji: '🧟', name: 'Zombie Giant', color: '#00ff00' },
          { emoji: '🦂', name: 'Scorpion Boss', color: '#ffaa00' },
          { emoji: '🕷️', name: 'Spider Queen', color: '#333333' },
          { emoji: '🐲', name: 'Ancient Wyrm', color: '#00ffff' },
          { emoji: '👁️', name: 'All-Seeing Eye', color: '#ff0000' },
        ]
        const bossType = bossTypes[(wave - 1) % bossTypes.length]
        game.boss = {
          x: canvas.width / 2,
          y: -50,
          emoji: bossType.emoji,
          name: bossType.name,
          health: 100 + wave * 50,
          maxHealth: 100 + wave * 50,
          speed: 0.8 + wave * 0.1,
          damage: 15 + wave * 5,
          coins: 50 + wave * 25,
          size: 60,
          hit: false
        }
        game.bossActive = true
      }

      // Update boss
      if (game.boss && game.bossActive) {
        const boss = game.boss

        // Move toward player
        const dx = game.player.x - boss.x
        const dy = game.player.y - boss.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > 0) {
          boss.x += (dx / dist) * boss.speed
          boss.y += (dy / dist) * boss.speed
        }

        // Check collision with player
        if (dist < game.player.size + boss.size / 2) {
          setPlayerHealth(h => {
            const newHealth = h - boss.damage
            if (newHealth <= 0) {
              setGameState('gameover')
              if (score > highScore) {
                setHighScore(score)
                localStorage.setItem('demonHunterHighScore', score.toString())
              }
            }
            return Math.max(0, newHealth)
          })
          // Push boss back a bit
          boss.x -= (dx / dist) * 50
          boss.y -= (dy / dist) * 50
        }

        // Check collision with attacks
        game.attacks.forEach(atk => {
          const atkDx = atk.x - boss.x
          const atkDy = atk.y - boss.y
          const atkDist = Math.sqrt(atkDx * atkDx + atkDy * atkDy)

          if (atkDist < boss.size) {
            boss.health -= weapon.damage
            boss.hit = true
            setTimeout(() => boss.hit = false, 100)
            atk.traveled = 9999 // Remove attack

            // Hit particles
            for (let i = 0; i < 5; i++) {
              game.particles.push({
                x: boss.x,
                y: boss.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 20,
                color: '#ff0000'
              })
            }
          }
        })

        // Draw boss
        ctx.font = `${boss.size}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        if (boss.hit) {
          ctx.filter = 'brightness(2)'
        }
        ctx.fillText(boss.emoji, boss.x, boss.y)
        ctx.filter = 'none'

        // Boss name
        ctx.fillStyle = '#ff4444'
        ctx.font = 'bold 16px Arial'
        ctx.fillText(`BOSS: ${boss.name}`, boss.x, boss.y - boss.size / 2 - 25)

        // Boss health bar
        const barWidth = 80
        const barHeight = 10
        ctx.fillStyle = '#333'
        ctx.fillRect(boss.x - barWidth/2, boss.y - boss.size/2 - 15, barWidth, barHeight)
        ctx.fillStyle = '#ff0000'
        ctx.fillRect(boss.x - barWidth/2, boss.y - boss.size/2 - 15, barWidth * (boss.health / boss.maxHealth), barHeight)

        // Check if boss dead
        if (boss.health <= 0) {
          setScore(s => s + 100)
          setCoins(c => c + boss.coins)

          // Big death explosion
          for (let i = 0; i < 30; i++) {
            game.particles.push({
              x: boss.x,
              y: boss.y,
              vx: (Math.random() - 0.5) * 15,
              vy: (Math.random() - 0.5) * 15,
              life: 40,
              color: ['#ff0000', '#ff8800', '#ffff00', '#9900ff'][Math.floor(Math.random() * 4)]
            })
          }

          game.boss = null
          game.bossActive = false
          game.demonsKilledThisWave = 0
          setWave(w => w + 1)
        }
      }

      // Update particles
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

      // Draw player as knight
      ctx.font = `${game.player.size}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🧑', game.player.x, game.player.y)

      // Draw weapon the player is holding
      const weaponAngle = game.player.facing === 'right' ? 0 :
                          game.player.facing === 'left' ? Math.PI :
                          game.player.facing === 'up' ? -Math.PI/2 : Math.PI/2

      ctx.save()
      ctx.translate(game.player.x + Math.cos(weaponAngle) * 20, game.player.y + Math.sin(weaponAngle) * 20)
      ctx.rotate(weaponAngle)

      if (weapon.type === 'gun') {
        // Gun body
        ctx.fillStyle = weapon.name === 'Laser Cannon' ? '#00aaff' : '#444444'
        ctx.fillRect(-5, -4, 20, 8)

        // Gun barrel
        ctx.fillStyle = weapon.name === 'Laser Cannon' ? '#0088cc' : '#222222'
        ctx.fillRect(10, -2, 12, 4)

        // Gun handle
        ctx.fillStyle = '#8B4513'
        ctx.fillRect(-2, 4, 6, 8)

        // Muzzle flash hint
        ctx.fillStyle = '#ffaa00'
        ctx.beginPath()
        ctx.arc(22, 0, 3, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Sword blade
        ctx.fillStyle = weapon.level >= 7 ? '#ff4444' : weapon.level >= 3 ? '#ff8800' : '#cccccc'
        ctx.beginPath()
        ctx.moveTo(-3, -2)
        ctx.lineTo(18, 0)
        ctx.lineTo(-3, 2)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1
        ctx.stroke()

        // Handle
        ctx.fillStyle = '#8B4513'
        ctx.fillRect(-8, -3, 6, 6)

        // Guard
        ctx.fillStyle = '#FFD700'
        ctx.fillRect(-4, -5, 2, 10)
      }

      ctx.restore()

      // Draw UI
      ctx.fillStyle = 'white'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`Score: ${score}`, 20, 30)
      ctx.fillText(`Wave: ${wave}`, 20, 55)
      const demonsLeft = Math.max(0, (3 + wave * 2) - game.demonsKilledThisWave)
      ctx.fillText(`Demons left: ${demonsLeft}`, 20, 80)
      ctx.fillText(`Coins: ${coins}`, 20, 105)
      ctx.fillText(`Weapon: ${weapon.name}`, 20, 130)

      // Shield health bar
      const shieldX = canvas.width - 130
      const shieldY = 45

      // Shield shape background
      ctx.fillStyle = '#1a1a3a'
      ctx.beginPath()
      ctx.moveTo(shieldX, shieldY - 30)
      ctx.lineTo(shieldX + 50, shieldY - 20)
      ctx.lineTo(shieldX + 50, shieldY + 10)
      ctx.lineTo(shieldX, shieldY + 35)
      ctx.lineTo(shieldX - 50, shieldY + 10)
      ctx.lineTo(shieldX - 50, shieldY - 20)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#4488ff'
      ctx.lineWidth = 3
      ctx.stroke()

      // Shield fill based on health
      ctx.fillStyle = playerHealth > 75 ? '#2266ff' : playerHealth > 40 ? '#4444ff' : '#6622ff'
      ctx.beginPath()
      ctx.moveTo(shieldX, shieldY - 30 + (65 * (1 - playerHealth / 150)))
      ctx.lineTo(shieldX + 45, shieldY - 18 + (28 * (1 - playerHealth / 150)))
      ctx.lineTo(shieldX + 45, shieldY + 8)
      ctx.lineTo(shieldX, shieldY + 30)
      ctx.lineTo(shieldX - 45, shieldY + 8)
      ctx.lineTo(shieldX - 45, shieldY - 18 + (28 * (1 - playerHealth / 150)))
      ctx.closePath()
      ctx.fill()

      // Shield emblem
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('🛡️', shieldX, shieldY)
      ctx.font = 'bold 14px Arial'
      ctx.fillText(`${playerHealth}`, shieldX, shieldY + 18)

      animationId = requestAnimationFrame(gameLoop)
    }

    animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('click', handleClick)
    }
  }, [gameState, attack, spawnDemon, wave, weapon, score, coins, playerHealth, highScore])

  const startGame = () => {
    const game = gameRef.current
    game.player = { x: 400, y: 300, size: 30, speed: 5, facing: 'right' }
    game.demons = []
    game.attacks = []
    game.particles = []
    game.keys = {}
    game.spawnTimer = 0
    game.demonsKilledThisWave = 0
    game.bossActive = false
    game.boss = null
    game.medkits = []
    setScore(0)
    setWave(1)
    setPlayerHealth(150)
    setGameState('playing')
  }

  const buyWeapon = (newWeapon) => {
    if (coins >= newWeapon.cost && newWeapon.level > weapon.level) {
      setCoins(c => c - newWeapon.cost)
      setWeapon(newWeapon)
    }
  }

  return (
    <div className={`${gameState === 'playing' ? 'fixed inset-0 p-0 overflow-hidden' : 'min-h-screen p-4'} bg-gradient-to-br from-purple-900 via-gray-900 to-red-900 user-select-none`}
      style={gameState === 'playing' ? { touchAction: 'none', overscrollBehavior: 'none' } : {}}>
      <div className={`${gameState === 'playing' ? 'h-full w-full flex items-center justify-center gap-2 md:gap-4 px-2' : 'max-w-4xl'} mx-auto`}>
        {/* Header - Hide on mobile fullscreen */}
        {gameState !== 'playing' && (
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={onBack}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold"
            >
              Back
            </button>
            <h1 className="text-3xl md:text-4xl font-black text-red-500 drop-shadow-lg">
              Demon Hunter
            </h1>
            <div className="text-yellow-400 font-bold">
              High Score: {highScore}
            </div>
          </div>
        )}

        {/* Game Canvas - Center with border */}
        <div className={`relative ${gameState === 'playing' ? 'flex-1 flex items-center justify-center' : ''}`}>
          <div className={`${gameState === 'playing' ? 'rounded-xl border-4 border-red-700 shadow-2xl bg-gray-900 md:block hidden' : ''}`}>
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className={`${gameState === 'playing' ? 'w-auto h-auto' : 'w-full'} bg-gray-900 ${gameState !== 'playing' ? 'rounded-xl border-4 border-red-700 shadow-2xl' : ''} block`}
              style={gameState === 'playing' ? { touchAction: 'none' } : {}}
            />
          </div>
          {/* Mobile canvas - respects flex layout */}
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className={`${gameState === 'playing' ? 'md:hidden rounded-xl border-4 border-red-700 shadow-2xl w-full h-auto' : 'w-full'} bg-gray-900 ${gameState !== 'playing' ? 'rounded-xl border-4 border-red-700 shadow-2xl' : ''}`}
            style={gameState === 'playing' ? { touchAction: 'none', maxWidth: '100%', maxHeight: '100vh' } : {}}
          />

          {/* Shop Button during gameplay - Desktop only */}
          {gameState === 'playing' && (
            <button
              onClick={() => setGameState('shop')}
              className="hidden md:flex absolute bottom-4 left-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-all hover:scale-105 items-center gap-2"
            >
              🛒 SHOP ({coins})
            </button>
          )}

          {/* Exit fullscreen button - Mobile only */}
          {gameState === 'playing' && (
            <button
              onClick={() => setGameState('paused')}
              className="md:hidden absolute top-4 left-4 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg"
            >
              ✕ ESC
            </button>
          )}

          {/* Menu Overlay */}
          {gameState === 'menu' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl">
              <h2 className="text-5xl font-black text-red-500 mb-4">DEMON HUNTER</h2>
              <p className="text-xl text-gray-300 mb-8">Survive the demon waves!</p>

              <div className="text-gray-400 mb-8 text-center">
                <p>WASD or Arrow Keys to move</p>
                <p>SPACE or Click to attack</p>
                <p>ESC to pause</p>
              </div>

              <button
                onClick={startGame}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-black text-2xl transition-all hover:scale-110"
              >
                START GAME
              </button>
            </div>
          )}

          {/* Paused Overlay */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl">
              <h2 className="text-4xl font-black text-yellow-400 mb-8">PAUSED</h2>

              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => setGameState('playing')}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold text-xl"
                >
                  Resume
                </button>
                <button
                  onClick={() => setGameState('shop')}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-3 rounded-xl font-bold text-xl"
                >
                  Shop ({coins} coins)
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

          {/* Shop Overlay */}
          {gameState === 'shop' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-xl p-4 overflow-auto">
              <h2 className="text-3xl font-black text-yellow-400 mb-2">SHOP</h2>
              <p className="text-xl text-yellow-300 mb-4">Your Coins: {coins} | Health: {playerHealth}/150</p>

              {/* Medkits Section */}
              <h3 className="text-xl font-bold text-green-400 mb-2">💊 MEDKITS</h3>
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => {
                    if (coins >= 20 && playerHealth < 150) {
                      setCoins(c => c - 20)
                      setPlayerHealth(h => Math.min(150, h + 25))
                    }
                  }}
                  disabled={coins < 20 || playerHealth >= 150}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    coins >= 20 && playerHealth < 150
                      ? 'bg-green-700 border-green-400 hover:scale-105'
                      : 'bg-gray-700 border-gray-500 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">💊</div>
                  <div className="text-white font-bold">Small Medkit</div>
                  <div className="text-green-300 text-sm">+25 HP</div>
                  <div className="text-yellow-400 font-bold mt-2">20 coins</div>
                </button>

                <button
                  onClick={() => {
                    if (coins >= 40 && playerHealth < 150) {
                      setCoins(c => c - 40)
                      setPlayerHealth(h => Math.min(150, h + 50))
                    }
                  }}
                  disabled={coins < 40 || playerHealth >= 150}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    coins >= 40 && playerHealth < 150
                      ? 'bg-green-700 border-green-400 hover:scale-105'
                      : 'bg-gray-700 border-gray-500 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">🏥</div>
                  <div className="text-white font-bold">Large Medkit</div>
                  <div className="text-green-300 text-sm">+50 HP</div>
                  <div className="text-yellow-400 font-bold mt-2">40 coins</div>
                </button>

                <button
                  onClick={() => {
                    if (coins >= 75) {
                      setCoins(c => c - 75)
                      setPlayerHealth(150)
                    }
                  }}
                  disabled={coins < 75 || playerHealth >= 150}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    coins >= 75 && playerHealth < 150
                      ? 'bg-green-700 border-green-400 hover:scale-105'
                      : 'bg-gray-700 border-gray-500 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">❤️‍🩹</div>
                  <div className="text-white font-bold">Full Heal</div>
                  <div className="text-green-300 text-sm">Full HP</div>
                  <div className="text-yellow-400 font-bold mt-2">75 coins</div>
                </button>
              </div>

              {/* Weapons Section */}
              <h3 className="text-xl font-bold text-purple-400 mb-2">⚔️ WEAPONS</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 max-h-48 overflow-auto">
                {weapons.map((w, idx) => (
                  <button
                    key={idx}
                    onClick={() => buyWeapon(w)}
                    disabled={coins < w.cost || w.level <= weapon.level}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      w.level === weapon.level
                        ? 'bg-green-700 border-green-400'
                        : w.level < weapon.level
                        ? 'bg-gray-700 border-gray-500 opacity-50'
                        : coins >= w.cost
                        ? 'bg-purple-700 border-purple-400 hover:scale-105'
                        : 'bg-gray-700 border-gray-500 opacity-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{w.type === 'gun' ? '🔫' : '⚔️'}</div>
                    <div className="text-white font-bold">{w.name}</div>
                    <div className="text-gray-300 text-sm">DMG: {w.damage} | SPD: {w.speed}x</div>
                    <div className="text-gray-300 text-sm">Range: {w.range}</div>
                    <div className="text-yellow-400 font-bold mt-2">
                      {w.level <= weapon.level ? (w.level === weapon.level ? 'EQUIPPED' : 'OWNED') : `${w.cost} coins`}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setGameState('playing')}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold"
              >
                Back to Game
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl">
              <h2 className="text-5xl font-black text-red-500 mb-4">GAME OVER</h2>
              <p className="text-2xl text-white mb-2">Score: {score}</p>
              <p className="text-xl text-gray-400 mb-2">Wave Reached: {wave}</p>
              {score > highScore && (
                <p className="text-2xl text-yellow-400 mb-4">NEW HIGH SCORE!</p>
              )}

              <button
                onClick={startGame}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-black text-2xl transition-all hover:scale-110"
              >
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Mobile Controls - Handheld Console Style */}
        {gameState === 'playing' && (
          <>
            {/* Left Joystick - On left side outside game */}
            <div
              className="flex flex-col items-center justify-center h-full flex-shrink-0"
              style={{ width: '140px' }}
            >
              <div
                className="relative w-36 h-36 rounded-full bg-gray-900 border-4 border-gray-700 shadow-2xl p-2"
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
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-b from-gray-600 to-gray-800 rounded-full border-2 border-gray-500 shadow-lg">
                <div className="absolute inset-1 bg-gradient-to-b from-gray-500 to-gray-700 rounded-full"></div>
              </div>
              {/* Direction indicators */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 text-gray-600 text-lg">▲</div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-gray-600 text-lg">▼</div>
              <div className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-600 text-lg">◀</div>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-600 text-lg">▶</div>
              </div>
            </div>

            {/* Right Action Buttons - On right side outside game */}
            <div className="flex flex-col items-center justify-center gap-4 h-full flex-shrink-0" style={{ width: '140px' }}>
              {/* Shop Button */}
              <button
                onClick={() => setGameState('shop')}
                className="w-20 h-20 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full font-bold text-3xl shadow-2xl active:scale-90 transition-transform border-4 border-yellow-300 flex items-center justify-center hover:from-yellow-300 hover:to-yellow-500"
              >
                🛒
              </button>

              {/* Attack Button */}
              <button
                onTouchStart={(e) => {
                  e.preventDefault()
                  attack()
                }}
                onClick={attack}
                className="w-24 h-24 bg-gradient-to-b from-red-500 to-red-700 rounded-full font-bold text-2xl text-white shadow-2xl active:scale-90 transition-transform border-4 border-red-400 flex items-center justify-center hover:from-red-400 hover:to-red-600"
              >
                ⚔️
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
