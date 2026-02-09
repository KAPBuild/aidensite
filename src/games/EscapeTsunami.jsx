import React, { useRef, useState, useEffect, useCallback } from 'react'
import * as THREE from 'three'

// ─── CONFIG ────────────────────────────────────────────────
const CONFIG = {
  PLAYER_BASE_SPEED: 0.15,
  TSUNAMI_SLOW: 0.05,
  TSUNAMI_MEDIUM: 0.08,
  TSUNAMI_FAST: 0.12,
  TSUNAMI_LIGHTNING: 0.17,
  AREA_LENGTH: 28,
  HIDING_GAP: 10,
  COIN_SPAWN_RATE: 1200,
}

const AREAS = [
  { name: 'Common',    color: 0x8BC34A, emoji: '🌿', tier: 0 },
  { name: 'Uncommon',  color: 0x29B6F6, emoji: '💧', tier: 1 },
  { name: 'Rare',      color: 0x7E57C2, emoji: '💎', tier: 2 },
  { name: 'Epic',      color: 0xE040FB, emoji: '🔮', tier: 3 },
  { name: 'Legendary', color: 0xFFB300, emoji: '⭐', tier: 4 },
  { name: 'Mythic',    color: 0xFF1744, emoji: '🌌', tier: 5 },
  { name: 'OG',        color: 0x00E676, emoji: '🏆', tier: 6, style: 'og' },
  { name: 'Secret',    color: 0x000000, emoji: '👁️', tier: 7, style: 'secret' },
  { name: 'Godly',     color: 0xFFD700, emoji: '👑', tier: 8, style: 'godly' },
]

const TSUNAMI_TYPES = [
  { name: 'Slow Tsunami',      speed: CONFIG.TSUNAMI_SLOW,      color: 0x4FC3F7, warning: '🌊 Slow Tsunami approaching...' },
  { name: 'Medium Tsunami',    speed: CONFIG.TSUNAMI_MEDIUM,    color: 0x0288D1, warning: '🌊🌊 Medium Tsunami incoming!' },
  { name: 'Fast Tsunami',      speed: CONFIG.TSUNAMI_FAST,      color: 0x01579B, warning: '🌊🌊🌊 Fast Tsunami! RUN!' },
  { name: 'Lightning Tsunami', speed: CONFIG.TSUNAMI_LIGHTNING, color: 0x311B92, warning: '⚡🌊⚡ LIGHTNING TSUNAMI!!' },
]

const SPIN_WHEEL_ITEMS = [
  { name: '🏃 Speed Boost',   weight: 20, type: 'buff',    action: 'speedBoost' },
  { name: '🛡️ Shield',        weight: 15, type: 'buff',    action: 'shield' },
  { name: '💰 50 Coins',      weight: 20, type: 'coins',   amount: 50 },
  { name: '💰 100 Coins',     weight: 12, type: 'coins',   amount: 100 },
  { name: '🧲 Coin Magnet',   weight: 10, type: 'buff',    action: 'magnet' },
  { name: '⏱️ Time Freeze',   weight: 8,  type: 'buff',    action: 'freeze' },
  { name: '💰 250 Coins',     weight: 5,  type: 'coins',   amount: 250 },
  { name: '🍀 Double Score',  weight: 4,  type: 'buff',    action: 'doubleScore' },
  { name: '📦 Galaxy Block',  weight: 2,  type: 'galaxy_block', action: 'galaxyBlock' },
  { name: '🪐 Galaxy Slap',   weight: 1,  type: 'galaxy_slap', action: 'galaxySlap' },
]

const GALAXY_BLOCK_REWARDS = [
  '🌟 Galaxy Star — 500 Coins!',
  '🪐 Saturn Ring — 2x Speed!',
  '☄️ Comet Dash — Invincible!',
  '🌌 Nebula Shield!',
  '💫 Shooting Star — 1000 Coins!',
]

// Create emoji texture
function createEmojiTexture(emoji, size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.font = `${size * 0.8}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, size / 2, size / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// Create emoji sprite
function createEmojiSprite(emoji, scale = 2) {
  const texture = createEmojiTexture(emoji)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(scale, scale, 1)
  return sprite
}

export default function EscapeTsunami({ onBack }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const gameRef = useRef(null)
  const animFrameRef = useRef(null)

  const [gameState, setGameState] = useState('menu')
  const [score, setScore] = useState(0)
  const [coins, setCoins] = useState(0)
  const [speedLevel, setSpeedLevel] = useState(0)
  const [currentArea, setCurrentArea] = useState('Common')
  const [tsunamiWarning, setTsunamiWarning] = useState('')
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('escapeTsunamiHighScore') || '0')
  })
  const [message, setMessage] = useState('')
  const [isHiding, setIsHiding] = useState(false)
  const [hasShield, setHasShield] = useState(false)
  const [spinResult, setSpinResult] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinAngle, setSpinAngle] = useState(0)
  const [freeSpins, setFreeSpins] = useState(1)
  const [damageFlash, setDamageFlash] = useState(false)
  const [roundNum, setRoundNum] = useState(1)
  const [galaxyBlockReward, setGalaxyBlockReward] = useState(null)
  const [shouldStartGame, setShouldStartGame] = useState(false)
  const [areaTransition, setAreaTransition] = useState(null) // { name, emoji, color }

  // Mobile joystick state — use refs so touch handlers always have fresh values
  const joystickActiveRef = useRef(false)
  const [joystickActive, setJoystickActive] = useState(false)
  const joystickRef = useRef({ x: 0, y: 0 })
  const joystickStartRef = useRef({ x: 0, y: 0 })

  // Refs for game loop access
  const coinsRef = useRef(coins)
  const scoreRef = useRef(score)
  const speedLevelRef = useRef(speedLevel)
  const hasShieldRef = useRef(hasShield)
  const gameStateRef = useRef(gameState)

  useEffect(() => { coinsRef.current = coins }, [coins])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { speedLevelRef.current = speedLevel }, [speedLevel])
  useEffect(() => { hasShieldRef.current = hasShield }, [hasShield])
  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  // ─── CREATE 3D SCENE ──────────────────────────────
  const initScene = useCallback(() => {
    if (!containerRef.current) return null

    // Clean up previous
    if (rendererRef.current) {
      rendererRef.current.dispose()
      if (containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
    }

    const w = containerRef.current.clientWidth
    const h = containerRef.current.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB)
    scene.fog = new THREE.Fog(0x87CEEB, 50, 150)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500)
    camera.position.set(0, 15, 20)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.shadowMap.enabled = true
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight(0xffffff, 0.8)
    sun.position.set(20, 40, 20)
    sun.castShadow = true
    scene.add(sun)

    // ─── Build the track ─────────────────────
    const obstacles = []
    const shelters = []

    // Track area boundaries for transition detection
    const areaBoundaries = []

    AREAS.forEach((area, i) => {
      const startZ = -(i * (CONFIG.AREA_LENGTH + CONFIG.HIDING_GAP))

      // Store boundary for transition detection
      areaBoundaries.push({ z: startZ, name: area.name, emoji: area.emoji, color: area.color })

      // Area ground — special areas get unique materials
      const groundGeo = new THREE.BoxGeometry(24, 1, CONFIG.AREA_LENGTH)
      let groundMat
      if (area.style === 'secret') {
        groundMat = new THREE.MeshLambertMaterial({ color: 0x1a0033, emissive: 0x220044, emissiveIntensity: 0.5 })
      } else if (area.style === 'godly') {
        groundMat = new THREE.MeshLambertMaterial({ color: 0xFFD700, emissive: 0xFFAB00, emissiveIntensity: 0.6 })
      } else if (area.style === 'og') {
        groundMat = new THREE.MeshLambertMaterial({ color: 0x1B5E20, emissive: 0x00E676, emissiveIntensity: 0.3 })
      } else {
        groundMat = new THREE.MeshLambertMaterial({ color: area.color })
      }
      const ground = new THREE.Mesh(groundGeo, groundMat)
      ground.position.set(0, -0.5, startZ - CONFIG.AREA_LENGTH / 2)
      ground.receiveShadow = true
      scene.add(ground)

      // ─── TRANSITION GATE at area entrance ─────
      const gateColor = area.style === 'secret' ? 0x6600cc : area.style === 'godly' ? 0xFFD700 : area.style === 'og' ? 0x00E676 : area.color
      // Left pillar
      const pillarGeo = new THREE.BoxGeometry(1.2, 8, 1.2)
      const pillarMat = new THREE.MeshLambertMaterial({ color: gateColor })
      const leftPillar = new THREE.Mesh(pillarGeo, pillarMat)
      leftPillar.position.set(-10, 4, startZ)
      leftPillar.castShadow = true
      scene.add(leftPillar)
      const rightPillar = new THREE.Mesh(pillarGeo, pillarMat.clone())
      rightPillar.position.set(10, 4, startZ)
      rightPillar.castShadow = true
      scene.add(rightPillar)
      // Top beam
      const beamGeo = new THREE.BoxGeometry(22, 1.5, 1.2)
      const beamMat = new THREE.MeshLambertMaterial({ color: gateColor })
      const beam = new THREE.Mesh(beamGeo, beamMat)
      beam.position.set(0, 8.5, startZ)
      beam.castShadow = true
      scene.add(beam)
      // Area emoji on gate
      const gateEmoji = createEmojiSprite(area.emoji, 3.5)
      gateEmoji.position.set(0, 10.5, startZ)
      scene.add(gateEmoji)
      // Colored light strip under beam
      const stripGeo = new THREE.BoxGeometry(20, 0.3, 0.3)
      const stripMat = new THREE.MeshLambertMaterial({ color: gateColor, emissive: gateColor, emissiveIntensity: 0.8 })
      const strip = new THREE.Mesh(stripGeo, stripMat)
      strip.position.set(0, 7.6, startZ)
      scene.add(strip)

      // Emoji obstacles — each special area gets themed emojis
      let obstacleEmojis
      if (area.style === 'secret') obstacleEmojis = ['👻', '💀', '🕳️', '🔮', '👁️', '🕸️', '⚰️', '🖤']
      else if (area.style === 'godly') obstacleEmojis = ['⚡', '🔱', '👑', '💎', '🏛️', '☁️', '🌩️', '✨']
      else if (area.style === 'og') obstacleEmojis = ['🎮', '📺', '🕹️', '💾', '📼', '🏆', '🎖️', '🥇']
      else obstacleEmojis = ['🌳', '🪨', '🏠', '🚗', '📦', '🗿', '🎪', '⛺']
      for (let j = 0; j < 3 + area.tier; j++) {
        const emoji = obstacleEmojis[Math.floor(Math.random() * obstacleEmojis.length)]
        const obs = createEmojiSprite(emoji, 2.5 + Math.random() * 1.5)
        const ox = (Math.random() - 0.5) * 18
        const oz = startZ - 5 - Math.random() * (CONFIG.AREA_LENGTH - 10)
        obs.position.set(ox, 2, oz)
        scene.add(obs)
        obstacles.push({ x: ox, z: oz, radius: 1.5 })
      }

      // Side decorations
      let decorEmojis
      if (area.style === 'secret') decorEmojis = ['🕯️', '👁️', '🌑', '💜', '🔮']
      else if (area.style === 'godly') decorEmojis = ['✨', '💫', '⭐', '🌟', '👑']
      else if (area.style === 'og') decorEmojis = ['🎮', '🕹️', '💚', '🏆', '📀']
      else decorEmojis = ['🌴', '🌵', '🌲', '🌻', '🍄']
      for (let side = -1; side <= 1; side += 2) {
        for (let d = 0; d < 3; d++) {
          const decor = createEmojiSprite(decorEmojis[d % decorEmojis.length], 2)
          decor.position.set(side * 13, 1.5, startZ - 4 - d * 8)
          scene.add(decor)
        }
      }

      // Special areas get floating particles
      if (area.style) {
        const particleEmoji = area.style === 'secret' ? '👁️' : area.style === 'godly' ? '✨' : '💚'
        for (let e = 0; e < 6; e++) {
          const particle = createEmojiSprite(particleEmoji, 1.5)
          particle.position.set(
            (Math.random() - 0.5) * 20,
            3 + Math.random() * 5,
            startZ - Math.random() * CONFIG.AREA_LENGTH
          )
          scene.add(particle)
        }
      }

      // Hiding gap between areas (except after last)
      if (i < AREAS.length - 1) {
        const gapZ = startZ - CONFIG.AREA_LENGTH
        const gapGeo = new THREE.BoxGeometry(24, 1, CONFIG.HIDING_GAP)
        const gapMat = new THREE.MeshLambertMaterial({ color: 0x5D4037 })
        const gap = new THREE.Mesh(gapGeo, gapMat)
        gap.position.set(0, -0.5, gapZ - CONFIG.HIDING_GAP / 2)
        gap.receiveShadow = true
        scene.add(gap)

        // Shelter emoji huts in the gap
        for (let s = 0; s < 3; s++) {
          const shelterX = -7 + s * 7
          const shelterZ = gapZ - CONFIG.HIDING_GAP / 2

          const hut = createEmojiSprite('🛖', 4)
          hut.position.set(shelterX, 2.5, shelterZ)
          scene.add(hut)

          shelters.push({ x: shelterX, z: shelterZ, radius: 2.5 })
        }
      }
    })

    // ─── FINISH LINE ─────────────────────
    const finishZ = -(AREAS.length * (CONFIG.AREA_LENGTH + CONFIG.HIDING_GAP)) + CONFIG.HIDING_GAP
    const finishLine = createEmojiSprite('🏁', 6)
    finishLine.position.set(0, 4, finishZ)
    scene.add(finishLine)

    // Goal arrow pointing forward
    const goalArrow = createEmojiSprite('⬇️', 3)
    goalArrow.position.set(0, 8, finishZ)
    scene.add(goalArrow)

    // ─── Player (emoji runner) ──────────
    const playerEmoji = createEmojiSprite('🏃', 3)
    playerEmoji.position.set(0, 1.5, 2)
    scene.add(playerEmoji)

    // ─── TSUNAMI WAVE (reusable — hidden until triggered) ─────
    const tsunamiGroup = new THREE.Group()

    // Main water wall — tall and wide so you can't miss it
    const tsunamiGeo = new THREE.BoxGeometry(40, 18, 6)
    const tsunamiMat = new THREE.MeshPhongMaterial({
      color: 0x0288D1,
      transparent: true,
      opacity: 0.8,
      emissive: 0x01579B,
      emissiveIntensity: 0.4,
    })
    const tsunamiMesh = new THREE.Mesh(tsunamiGeo, tsunamiMat)
    tsunamiMesh.position.y = 9
    tsunamiGroup.add(tsunamiMesh)

    // Big wave emojis across the front
    for (let i = 0; i < 7; i++) {
      const waveEmoji = createEmojiSprite('🌊', 5)
      waveEmoji.position.set(-12 + i * 4, 14, 3.5)
      tsunamiGroup.add(waveEmoji)
    }
    // Foam layer on top
    const foamGeo = new THREE.BoxGeometry(40, 3, 6)
    const foamMat = new THREE.MeshLambertMaterial({ color: 0xB3E5FC, transparent: true, opacity: 0.7 })
    const foam = new THREE.Mesh(foamGeo, foamMat)
    foam.position.y = 19
    tsunamiGroup.add(foam)

    tsunamiGroup.visible = false
    scene.add(tsunamiGroup)

    // ─── GAME STATE ────────────────
    gameRef.current = {
      player: playerEmoji,
      tsunami: tsunamiGroup,
      tsunamiMesh,
      keys: {},
      coins: [],
      coinTimer: 0,
      speedBoostTimer: 0,
      magnetTimer: 0,
      freezeTimer: 0,
      doubleScoreTimer: 0,
      tsunamiType: TSUNAMI_TYPES[0],
      obstacles,
      shelters,
      galaxySlapActive: false,
      galaxySlapTimer: 0,
      finishZ,
      areaBoundaries,
      lastAreaIdx: -1,
      // Wave system: tsunami spawns periodically
      waveActive: false,
      waveTimer: 4000, // first wave comes after 4 seconds
      waveInterval: 5000, // time between waves (shrinks with difficulty)
      wavesPerArea: 2,
      waveSpeed: 0,
      wavesSpawned: 0,
    }

    return { scene, camera, renderer }
  }, [])

  // ─── SPAWN COINS ─────────────────────────
  const spawnCoin = useCallback(() => {
    if (!sceneRef.current || !gameRef.current) return
    const g = gameRef.current
    const playerZ = g.player.position.z

    const coinEmoji = createEmojiSprite('💰', 1.5)
    coinEmoji.position.set(
      (Math.random() - 0.5) * 18,
      1.5,
      playerZ - 15 - Math.random() * 30
    )
    coinEmoji.userData = { isCoin: true }
    sceneRef.current.add(coinEmoji)
    g.coins.push(coinEmoji)
  }, [])

  // ─── START GAME ────────────────────────────
  const startGame = useCallback(() => {
    setScore(0)
    setIsHiding(false)
    setHasShield(false)
    setTsunamiWarning('')
    setMessage('')
    setDamageFlash(false)
    setGameState('playing')
    setShouldStartGame(true)
  }, [])

  // Initialize scene after container is rendered
  useEffect(() => {
    if (!shouldStartGame || gameState !== 'playing') return
    if (!containerRef.current) return

    setShouldStartGame(false)

    const result = initScene()
    if (!result || !result.scene) return

    const { scene, camera, renderer } = result

    const g = gameRef.current
    // Pick tsunami type based on round
    let tsunamiIdx = Math.min(Math.floor((roundNum - 1) / 2), 3)
    if (Math.random() < 0.2 && tsunamiIdx < 3) tsunamiIdx++

    g.tsunamiType = TSUNAMI_TYPES[tsunamiIdx]
    g.tsunamiMesh.material.color.set(g.tsunamiType.color)
    g.tsunami.visible = false
    g.waveActive = false
    g.waveTimer = 4000
    g.waveSpeed = g.tsunamiType.speed * 3.5
    g.wavesSpawned = 0
    // Faster waves in later rounds
    g.waveInterval = Math.max(3000, 6000 - roundNum * 400)
    g.player.position.set(0, 1.5, 2)

    // Spawn initial coins
    for (let i = 0; i < 10; i++) spawnCoin()

    let lastTime = performance.now()

    const gameLoop = (time) => {
      if (!gameRef.current) return
      const dt = Math.min((time - lastTime) / 16.67, 3)
      lastTime = time

      const game = gameRef.current
      if (gameStateRef.current !== 'playing') {
        animFrameRef.current = requestAnimationFrame(gameLoop)
        renderer.render(scene, camera)
        return
      }

      // ─── Player movement ───────
      const speedMult = 1 + speedLevelRef.current * 0.2
      const boostMult = game.speedBoostTimer > 0 ? 1.5 : 1
      const speed = CONFIG.PLAYER_BASE_SPEED * speedMult * boostMult * dt

      let moveX = 0
      let moveZ = 0

      // Keyboard
      if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) moveX -= 1
      if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) moveX += 1
      if (game.keys['ArrowUp'] || game.keys['w'] || game.keys['W']) moveZ -= 1
      if (game.keys['ArrowDown'] || game.keys['s'] || game.keys['S']) moveZ += 1

      // Mobile joystick
      if (joystickRef.current.x !== 0 || joystickRef.current.y !== 0) {
        moveX = joystickRef.current.x
        moveZ = joystickRef.current.y
      }

      // Normalize diagonal movement
      if (moveX !== 0 && moveZ !== 0) {
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
        moveX /= len
        moveZ /= len
      }

      let newX = game.player.position.x + moveX * speed
      let newZ = game.player.position.z + moveZ * speed

      // Boundary clamp
      newX = Math.max(-10, Math.min(10, newX))

      // Collision with obstacles
      let blocked = false
      for (const obs of game.obstacles) {
        const dx = newX - obs.x
        const dz = newZ - obs.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < obs.radius + 0.8) {
          blocked = true
          // Push player back
          if (dist > 0) {
            newX = obs.x + (dx / dist) * (obs.radius + 0.8)
            newZ = obs.z + (dz / dist) * (obs.radius + 0.8)
          }
        }
      }

      game.player.position.x = newX
      game.player.position.z = newZ

      // ─── Check if player is hiding behind a shelter ────
      let playerHiding = false
      for (const shelter of game.shelters) {
        const dx = game.player.position.x - shelter.x
        const dz = game.player.position.z - shelter.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < shelter.radius) {
          playerHiding = true
          break
        }
      }
      // Also count being near an obstacle as hiding
      if (!playerHiding) {
        for (const obs of game.obstacles) {
          const dx = game.player.position.x - obs.x
          const dz = game.player.position.z - obs.z
          const dist = Math.sqrt(dx * dx + dz * dz)
          if (dist < obs.radius + 1.2) {
            playerHiding = true
            break
          }
        }
      }
      setIsHiding(playerHiding)

      // ─── Tsunami wave system ──────
      if (game.freezeTimer > 0) {
        game.freezeTimer -= dt * 16.67
      }

      if (!game.waveActive) {
        // Count down to next wave
        const timerDrain = game.freezeTimer > 0 ? dt * 16.67 * 0.3 : dt * 16.67
        game.waveTimer -= timerDrain
        if (game.waveTimer <= 0) {
          // Spawn a wave!
          game.waveActive = true
          game.wavesSpawned++
          // Wave spawns far ahead of the player and rushes TOWARD them
          game.tsunami.position.z = game.player.position.z - 80
          game.tsunami.position.x = 0
          game.tsunami.visible = true
          // Pick wave type — gets harder as more waves spawn
          const waveTypeIdx = Math.min(Math.floor(game.wavesSpawned / 3), 3)
          game.tsunamiType = TSUNAMI_TYPES[waveTypeIdx]
          game.tsunamiMesh.material.color.set(game.tsunamiType.color)
          game.waveSpeed = (0.3 + game.tsunamiType.speed * 2) * 1.2

          setTsunamiWarning(game.tsunamiType.warning)
          setTimeout(() => setTsunamiWarning(''), 2500)
        }
      } else {
        // Wave is active — move it toward the player (increasing z)
        const spd = game.freezeTimer > 0 ? game.waveSpeed * 0.3 : game.waveSpeed
        game.tsunami.position.z += spd * dt
        // Wave bobbing animation
        game.tsunami.position.y = Math.sin(time * 0.005) * 1.5

        // Check if wave has reached the player
        const waveFrontZ = game.tsunami.position.z + 3
        const playerZ = game.player.position.z
        if (waveFrontZ >= playerZ - 1 && waveFrontZ <= playerZ + 4) {
          // Wave is sweeping through player position
          if (playerHiding) {
            setMessage('🛖 Safe! The wave passed over!')
            setTimeout(() => setMessage(''), 2000)
          } else if (hasShieldRef.current) {
            setHasShield(false)
            setMessage('🛡️ Shield blocked the wave!')
            setTimeout(() => setMessage(''), 2000)
          } else if (game.galaxySlapActive) {
            setMessage('🪐 Galaxy Slap deflected the wave!')
            setTimeout(() => setMessage(''), 2000)
          } else {
            // Game over — hit by tsunami
            const finalScore = scoreRef.current
            const savedHigh = parseInt(localStorage.getItem('escapeTsunamiHighScore') || '0')
            if (finalScore > savedHigh) {
              localStorage.setItem('escapeTsunamiHighScore', finalScore.toString())
              setHighScore(finalScore)
            }
            const saved = localStorage.getItem('aidenScores-escapetsunami')
            const scores = saved ? JSON.parse(saved) : []
            scores.push({ score: finalScore, date: new Date().toLocaleDateString() })
            localStorage.setItem('aidenScores-escapetsunami', JSON.stringify(scores))

            setDamageFlash(true)
            setTimeout(() => setDamageFlash(false), 300)
            setGameState('gameover')
            return
          }
          // Wave passed — hide it and reset timer
          game.waveActive = false
          game.tsunami.visible = false
          game.waveTimer = game.waveInterval
        }

        // If wave passed way beyond player, reset
        if (game.tsunami.position.z > game.player.position.z + 30) {
          game.waveActive = false
          game.tsunami.visible = false
          game.waveTimer = game.waveInterval
        }
      }

      // ─── Determine current area + transition banner ─────
      const absZ = Math.abs(game.player.position.z)
      const areaSize = CONFIG.AREA_LENGTH + CONFIG.HIDING_GAP
      const areaIdx = Math.min(Math.floor(absZ / areaSize), AREAS.length - 1)
      setCurrentArea(AREAS[areaIdx].name)

      // Show transition banner when entering a new area
      if (areaIdx !== game.lastAreaIdx) {
        game.lastAreaIdx = areaIdx
        const area = AREAS[areaIdx]
        setAreaTransition({ name: area.name, emoji: area.emoji, color: area.color })
        setTimeout(() => setAreaTransition(null), 2500)
      }

      // ─── Score ─────
      const distScore = Math.floor(absZ * (game.doubleScoreTimer > 0 ? 2 : 1))
      setScore(distScore)

      // ─── Coin collection ───────
      const magnetRange = game.magnetTimer > 0 ? 10 : 2.5
      for (let i = game.coins.length - 1; i >= 0; i--) {
        const c = game.coins[i]
        c.material.rotation += 0.02 * dt

        // Magnet pull
        if (game.magnetTimer > 0) {
          const dx = game.player.position.x - c.position.x
          const dz = game.player.position.z - c.position.z
          const dist = Math.sqrt(dx * dx + dz * dz)
          if (dist < magnetRange && dist > 1) {
            c.position.x += (dx / dist) * 0.3 * dt
            c.position.z += (dz / dist) * 0.3 * dt
          }
        }

        // Collect
        const dx = game.player.position.x - c.position.x
        const dz = game.player.position.z - c.position.z
        if (Math.abs(dx) < 2 && Math.abs(dz) < 2) {
          sceneRef.current.remove(c)
          game.coins.splice(i, 1)
          const coinVal = (areaIdx + 1) * 5
          setCoins(prev => prev + coinVal)
        }
      }

      // ─── Spawn coins ──────────
      game.coinTimer += dt * 16.67
      if (game.coinTimer > CONFIG.COIN_SPAWN_RATE) {
        game.coinTimer = 0
        spawnCoin()
      }

      // ─── Buff timers ──────────
      if (game.speedBoostTimer > 0) game.speedBoostTimer -= dt * 16.67
      if (game.magnetTimer > 0) game.magnetTimer -= dt * 16.67
      if (game.doubleScoreTimer > 0) game.doubleScoreTimer -= dt * 16.67
      if (game.galaxySlapTimer > 0) {
        game.galaxySlapTimer -= dt * 16.67
        if (game.galaxySlapTimer <= 0) game.galaxySlapActive = false
      }

      // ─── Win condition ─────
      if (game.player.position.z <= game.finishZ) {
        setRoundNum(prev => prev + 1)
        setFreeSpins(prev => prev + 1)
        setMessage('🎉 You escaped! Round complete!')
        setCoins(prev => prev + roundNum * 100)
        const finalScore = scoreRef.current
        const savedHigh = parseInt(localStorage.getItem('escapeTsunamiHighScore') || '0')
        if (finalScore > savedHigh) {
          localStorage.setItem('escapeTsunamiHighScore', finalScore.toString())
          setHighScore(finalScore)
        }
        setGameState('shop')
        return
      }

      // ─── Camera follow ─────
      camera.position.x = game.player.position.x * 0.3
      camera.position.z = game.player.position.z + 18
      camera.position.y = 12
      camera.lookAt(game.player.position.x * 0.3, 0, game.player.position.z - 5)

      renderer.render(scene, camera)
      animFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [shouldStartGame, gameState, initScene, spawnCoin, roundNum])

  // ─── KEYBOARD ──────────────────────────
  useEffect(() => {
    const onDown = (e) => {
      if (gameRef.current) gameRef.current.keys[e.key] = true
    }
    const onUp = (e) => {
      if (gameRef.current) gameRef.current.keys[e.key] = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  // ─── MOBILE JOYSTICK HANDLERS ───────────────────
  const handleJoystickStart = (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    joystickStartRef.current = { x: touch.clientX, y: touch.clientY }
    joystickActiveRef.current = true
    setJoystickActive(true)
  }

  const handleJoystickMove = (e) => {
    e.preventDefault()
    if (!joystickActiveRef.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - joystickStartRef.current.x
    const dy = touch.clientY - joystickStartRef.current.y
    const maxDist = 40
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 0) {
      const clampedDist = Math.min(dist, maxDist)
      joystickRef.current = {
        x: (dx / dist) * (clampedDist / maxDist),
        y: (dy / dist) * (clampedDist / maxDist)
      }
    }
  }

  const handleJoystickEnd = (e) => {
    e.preventDefault()
    joystickActiveRef.current = false
    setJoystickActive(false)
    joystickRef.current = { x: 0, y: 0 }
  }

  // ─── RESIZE ────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      rendererRef.current.setSize(w, h)
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ─── CLEANUP ───────────────────────────
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (rendererRef.current) rendererRef.current.dispose()
    }
  }, [])

  // ─── SPIN WHEEL ────────────────────────
  const doSpin = () => {
    if (isSpinning) return
    if (freeSpins <= 0 && coins < 50) return

    if (freeSpins > 0) setFreeSpins(prev => prev - 1)
    else setCoins(prev => prev - 50)

    setIsSpinning(true)
    setSpinResult(null)
    setGalaxyBlockReward(null)

    const totalWeight = SPIN_WHEEL_ITEMS.reduce((a, b) => a + b.weight, 0)
    let r = Math.random() * totalWeight
    let chosen = SPIN_WHEEL_ITEMS[0]
    for (const item of SPIN_WHEEL_ITEMS) {
      r -= item.weight
      if (r <= 0) { chosen = item; break }
    }

    const targetAngle = spinAngle + 720 + Math.random() * 360
    const startAngle = spinAngle
    const startTime = performance.now()
    const duration = 3000

    const animateSpin = (time) => {
      const elapsed = time - startTime
      const t = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setSpinAngle(startAngle + (targetAngle - startAngle) * ease)

      if (t < 1) requestAnimationFrame(animateSpin)
      else {
        setIsSpinning(false)
        setSpinResult(chosen)
        applySpinReward(chosen)
      }
    }
    requestAnimationFrame(animateSpin)
  }

  const applySpinReward = (item) => {
    if (!gameRef.current) gameRef.current = { speedBoostTimer: 0, magnetTimer: 0, freezeTimer: 0, doubleScoreTimer: 0, galaxySlapActive: false, galaxySlapTimer: 0 }
    switch (item.type) {
      case 'coins':
        setCoins(prev => prev + item.amount)
        break
      case 'buff':
        if (item.action === 'speedBoost') gameRef.current.speedBoostTimer = 15000
        if (item.action === 'shield') setHasShield(true)
        if (item.action === 'magnet') gameRef.current.magnetTimer = 20000
        if (item.action === 'freeze') gameRef.current.freezeTimer = 10000
        if (item.action === 'doubleScore') gameRef.current.doubleScoreTimer = 20000
        break
      case 'galaxy_block': {
        const reward = GALAXY_BLOCK_REWARDS[Math.floor(Math.random() * GALAXY_BLOCK_REWARDS.length)]
        setGalaxyBlockReward(reward)
        setCoins(prev => prev + 500)
        gameRef.current.speedBoostTimer = 30000
        gameRef.current.doubleScoreTimer = 30000
        setHasShield(true)
        break
      }
      case 'galaxy_slap':
        gameRef.current.galaxySlapActive = true
        gameRef.current.galaxySlapTimer = 30000
        break
    }
  }

  // ─── SHOP ──────────────────────────────
  const buySpeed = () => {
    const cost = (speedLevel + 1) * 100
    if (coins >= cost) {
      setCoins(prev => prev - cost)
      setSpeedLevel(prev => prev + 1)
    }
  }

  // ─── RENDER ────────────────────────────

  // MENU
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-blue-600 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <button onClick={onBack} className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-bold backdrop-blur-sm z-10">
          ← Back
        </button>

        <div className="text-center z-10">
          <div className="text-8xl mb-4">🌊🏃💨</div>
          <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg mb-2">
            ESCAPE TSUNAMI
          </h1>
          <p className="text-xl text-cyan-200 font-bold mb-4">Emoji Edition</p>

          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 mb-6 max-w-md mx-auto text-left text-white">
            <p className="font-bold text-yellow-300 mb-2">🎯 GOAL:</p>
            <p className="mb-2">Run through ALL 9 zones to escape the tsunami! Can you reach Godly?</p>
            <p className="font-bold text-yellow-300 mb-2">🎮 HOW TO PLAY:</p>
            <ul className="text-sm space-y-1">
              <li>• Run forward (↑ or W) toward the finish</li>
              <li>• Tsunami waves come every few seconds!</li>
              <li>• Hide behind 🛖 shelters or 🌳🪨 obstacles to survive</li>
              <li>• Collect 💰 coins for upgrades</li>
              <li>• Reach the 🏁 finish to win the round!</li>
            </ul>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {AREAS.map(a => (
              <div key={a.name} className="bg-white/10 rounded-lg px-3 py-2 text-center backdrop-blur-sm">
                <span className="text-2xl">{a.emoji}</span>
                <span className="text-white text-xs font-bold ml-1">{a.name}</span>
              </div>
            ))}
          </div>

          <button
            onClick={startGame}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white px-10 py-4 rounded-xl font-black text-2xl shadow-2xl hover:scale-110 transition-all duration-300 border-4 border-white/30"
          >
            🏃 START RUNNING
          </button>

          {highScore > 0 && (
            <div className="mt-4 text-yellow-300 font-bold text-lg">
              Best Score: {highScore}
            </div>
          )}

          <div className="mt-4 text-blue-200 text-sm">
            Desktop: WASD or Arrow Keys | Mobile: Touch joystick
          </div>
        </div>
      </div>
    )
  }

  // SHOP
  if (gameState === 'shop') {
    const speedCost = (speedLevel + 1) * 100
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-purple-600 flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl font-black text-white mb-2">🏪 SHOP</h1>
        <p className="text-yellow-300 text-2xl font-bold mb-2">Round {roundNum} Complete!</p>
        <p className="text-white text-xl font-bold mb-6">💰 {coins} Coins</p>

        <div className="grid gap-4 max-w-md w-full mb-6">
          <button
            onClick={buySpeed}
            disabled={coins < speedCost}
            className={`p-6 rounded-xl text-left transition-all ${
              coins >= speedCost ? 'bg-white/20 hover:bg-white/30' : 'bg-white/5 opacity-50'
            }`}
          >
            <div className="text-3xl mb-2">🏃 Speed Upgrade</div>
            <div className="text-white font-bold">Level {speedLevel} → {speedLevel + 1}</div>
            <div className="text-yellow-300 font-bold">Cost: {speedCost} coins</div>
          </button>
        </div>

        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={() => setGameState('wheel')}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all"
          >
            🎡 Spin Wheel {freeSpins > 0 ? `(${freeSpins} free)` : '(50 coins)'}
          </button>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all"
          >
            ▶ Next Round
          </button>
        </div>
      </div>
    )
  }

  // SPIN WHEEL
  if (gameState === 'wheel') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-black text-white mb-2">🎡 Spin Wheel</h1>
        <p className="text-yellow-300 text-xl font-bold mb-1">💰 {coins} Coins</p>
        <p className="text-blue-300 font-bold mb-4">
          {freeSpins > 0 ? `${freeSpins} Free Spin(s)!` : 'Cost: 50 coins'}
        </p>

        {/* Simple wheel display */}
        <div className="relative mb-6">
          <div className="text-4xl mb-2 text-center">▼</div>
          <div
            className="w-64 h-64 rounded-full border-8 border-white shadow-2xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500"
            style={{ transform: `rotate(${spinAngle}deg)` }}
          >
            <div className="text-6xl">🎰</div>
          </div>
        </div>

        {spinResult && (
          <div className={`text-center mb-4 p-4 rounded-xl ${
            spinResult.type === 'galaxy_slap' || spinResult.type === 'galaxy_block'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse'
              : 'bg-white/20'
          }`}>
            <div className="text-2xl font-black text-white">{spinResult.name}</div>
            {galaxyBlockReward && <div className="text-cyan-300 font-bold mt-1">{galaxyBlockReward}</div>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-1 max-w-sm mb-4 text-xs">
          {SPIN_WHEEL_ITEMS.map((item, i) => (
            <div key={i} className="text-white bg-white/10 rounded px-2 py-1">
              {item.name}
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={doSpin}
            disabled={isSpinning || (freeSpins <= 0 && coins < 50)}
            className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${
              isSpinning || (freeSpins <= 0 && coins < 50)
                ? 'bg-gray-600'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:scale-105'
            } text-white`}
          >
            {isSpinning ? '🎡 Spinning...' : '🎡 SPIN!'}
          </button>
          <button onClick={() => setGameState('shop')} className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold">
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // GAME OVER
  if (gameState === 'gameover') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-8xl mb-4">🌊💀</div>
        <h1 className="text-5xl font-black text-red-400 mb-4">WASHED AWAY!</h1>
        <div className="bg-white/10 rounded-xl p-6 mb-6 text-center">
          <p className="text-white text-2xl font-bold mb-2">Score: {score}</p>
          <p className="text-yellow-300 text-xl font-bold mb-2">💰 {coins} Coins</p>
          <p className="text-cyan-300 font-bold">Reached: {currentArea}</p>
          {score >= highScore && score > 0 && (
            <p className="text-yellow-400 text-xl font-black mt-2 animate-pulse">NEW HIGH SCORE!</p>
          )}
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setRoundNum(1)
              setCoins(0)
              setSpeedLevel(0)
              setFreeSpins(1)
              setHasShield(false)
              startGame()
            }}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-8 py-4 rounded-xl font-black text-xl shadow-2xl hover:scale-105 transition-all"
          >
            🔄 Try Again
          </button>
          <button onClick={onBack} className="bg-white/20 text-white px-8 py-4 rounded-xl font-bold text-xl">
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // PLAYING
  return (
    <div className="w-full h-screen relative overflow-hidden bg-black touch-none">
      {damageFlash && <div className="absolute inset-0 bg-red-500/50 z-30 pointer-events-none" />}

      <div ref={containerRef} className="w-full h-full" />

      {/* HUD */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-20 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="text-lg font-black">Score: {score}</div>
          <div className="text-yellow-300 font-bold text-sm">💰 {coins}</div>
          <div className="font-bold" style={{ color: `#${AREAS.find(a => a.name === currentArea)?.color.toString(16).padStart(6, '0') || 'fff'}` }}>
            {AREAS.find(a => a.name === currentArea)?.emoji} {currentArea}
          </div>
        </div>

        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-right text-sm">
          <div className="font-bold">🏃 Speed Lv.{speedLevel}</div>
          {hasShield && <div className="text-green-300 font-bold">🛡️ Shield</div>}
          {isHiding && <div className="text-yellow-300 font-bold animate-pulse">🛖 HIDING!</div>}
          {gameRef.current?.galaxySlapActive && <div className="text-purple-300 font-bold">🪐 Galaxy Slap!</div>}
        </div>
      </div>

      {/* Goal / wave status indicator */}
      <div className={`absolute top-14 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold z-20 pointer-events-none ${
        gameRef.current?.waveActive ? 'bg-red-600/90 animate-pulse text-white' : 'bg-green-600/80 text-white'
      }`}>
        {gameRef.current?.waveActive ? '🌊 TSUNAMI WAVE! HIDE BEHIND SOMETHING!' : '🏁 Run forward! Find cover before the next wave!'}
      </div>

      {/* Area transition banner */}
      {areaTransition && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center animate-bounce">
          <div className="bg-black/80 backdrop-blur-sm rounded-2xl px-10 py-6 border-4" style={{ borderColor: `#${areaTransition.color.toString(16).padStart(6, '0')}` }}>
            <div className="text-6xl mb-2">{areaTransition.emoji}</div>
            <div className="text-3xl font-black text-white">
              {areaTransition.name === 'Secret' ? '👁️ SECRET ZONE' :
               areaTransition.name === 'Godly' ? '👑 GODLY ZONE' :
               areaTransition.name === 'OG' ? '🏆 OG ZONE' :
               `${areaTransition.name} Area`}
            </div>
            <div className="text-sm mt-1" style={{ color: `#${areaTransition.color.toString(16).padStart(6, '0')}` }}>
              {areaTransition.name === 'Secret' ? 'You found the secret...' :
               areaTransition.name === 'Godly' ? 'ONLY THE WORTHY SURVIVE' :
               areaTransition.name === 'OG' ? 'Respect the originals' :
               'Keep running!'}
            </div>
          </div>
        </div>
      )}

      {tsunamiWarning && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-600/80 text-white px-6 py-2 rounded-lg font-black text-lg animate-pulse z-20">
          {tsunamiWarning}
        </div>
      )}

      {message && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 bg-black/70 text-white px-8 py-3 rounded-xl font-black text-xl z-20 animate-bounce">
          {message}
        </div>
      )}

      {/* Mobile Joystick */}
      <div
        className="absolute bottom-8 left-8 w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm z-20 md:hidden flex items-center justify-center"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
      >
        <div
          className="w-16 h-16 rounded-full bg-white/50"
          style={{
            transform: `translate(${joystickRef.current.x * 25}px, ${joystickRef.current.y * 25}px)`
          }}
        />
        <div className="absolute text-xs text-white font-bold bottom-1">MOVE</div>
      </div>

      <button
        onClick={onBack}
        className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-500 text-white px-3 py-1 rounded font-bold text-sm z-20"
      >
        ✕ Quit
      </button>
    </div>
  )
}
