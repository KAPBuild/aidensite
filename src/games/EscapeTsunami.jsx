import React, { useRef, useState, useEffect, useCallback } from 'react'
import * as THREE from 'three'

// ─── CONFIG ────────────────────────────────────────────────
const CONFIG = {
  PLAYER_BASE_SPEED: 0.12,
  TSUNAMI_SLOW: 0.04,
  TSUNAMI_MEDIUM: 0.07,
  TSUNAMI_FAST: 0.11,
  TSUNAMI_LIGHTNING: 0.16,
  AREA_LENGTH: 60,
  HIDING_GAP: 20,
  WALL_HEIGHT: 6,
  COIN_SPAWN_RATE: 2000,
}

const AREAS = [
  { name: 'Common',    color: 0x8BC34A, emoji: '🌿', tier: 0 },
  { name: 'Uncommon',  color: 0x29B6F6, emoji: '💧', tier: 1 },
  { name: 'Rare',      color: 0x7E57C2, emoji: '💎', tier: 2 },
  { name: 'Epic',      color: 0xE040FB, emoji: '🔮', tier: 3 },
  { name: 'Legendary', color: 0xFFB300, emoji: '⭐', tier: 4 },
  { name: 'Mythic',    color: 0xFF1744, emoji: '🌌', tier: 5 },
]

const TSUNAMI_TYPES = [
  { name: 'Slow Tsunami',      speed: CONFIG.TSUNAMI_SLOW,      color: 0x4FC3F7, warning: '🌊 Slow Tsunami approaching...' },
  { name: 'Medium Tsunami',    speed: CONFIG.TSUNAMI_MEDIUM,    color: 0x0288D1, warning: '🌊🌊 Medium Tsunami incoming!' },
  { name: 'Fast Tsunami',      speed: CONFIG.TSUNAMI_FAST,      color: 0x01579B, warning: '🌊🌊🌊 Fast Tsunami! RUN!' },
  { name: 'Lightning Tsunami', speed: CONFIG.TSUNAMI_LIGHTNING,  color: 0x311B92, warning: '⚡🌊⚡ LIGHTNING TSUNAMI!! GO GO GO!' },
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
  { name: '📦 Galaxy Lucky Block', weight: 2, type: 'galaxy_block', action: 'galaxyBlock' },
  { name: '🪐 Galaxy Slap Hand',   weight: 1, type: 'galaxy_slap', action: 'galaxySlap' },
]

const GALAXY_BLOCK_REWARDS = [
  '🌟 Galaxy Star — 500 Coins!',
  '🪐 Saturn Ring — 2x Speed for 30s!',
  '☄️ Comet Dash — Invincible for 15s!',
  '🌌 Nebula Shield — Permanent Shield!',
  '🔭 Telescope — Reveal all coins!',
  '🛸 UFO Ride — Fly over tsunami!',
  '💫 Shooting Star — 1000 Coins!',
  '🌠 Aurora — Triple Score for 30s!',
]

export default function EscapeTsunami({ onBack }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const gameRef = useRef(null)
  const animFrameRef = useRef(null)

  const [gameState, setGameState] = useState('menu')  // menu | playing | gameover | shop | wheel
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
    if (!containerRef.current) return

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
    scene.fog = new THREE.Fog(0x87CEEB, 80, 250)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500)
    camera.position.set(0, 12, 15)
    camera.lookAt(0, 0, -10)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.shadowMap.enabled = true
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight(0xffffff, 1)
    sun.position.set(20, 40, 20)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -80
    sun.shadow.camera.right = 80
    sun.shadow.camera.top = 80
    sun.shadow.camera.bottom = -80
    scene.add(sun)

    // ─── Build the track ─────────────────────
    const totalLength = AREAS.length * (CONFIG.AREA_LENGTH + CONFIG.HIDING_GAP)

    // Ground for each area
    AREAS.forEach((area, i) => {
      const startZ = -(i * (CONFIG.AREA_LENGTH + CONFIG.HIDING_GAP))

      // Area ground
      const groundGeo = new THREE.BoxGeometry(20, 0.5, CONFIG.AREA_LENGTH)
      const groundMat = new THREE.MeshLambertMaterial({ color: area.color })
      const ground = new THREE.Mesh(groundGeo, groundMat)
      ground.position.set(0, -0.25, startZ - CONFIG.AREA_LENGTH / 2)
      ground.receiveShadow = true
      scene.add(ground)

      // Area label (floating text plane with colored marker)
      const labelGeo = new THREE.BoxGeometry(8, 2, 0.2)
      const labelMat = new THREE.MeshLambertMaterial({ color: area.color, emissive: area.color, emissiveIntensity: 0.3 })
      const label = new THREE.Mesh(labelGeo, labelMat)
      label.position.set(0, 4, startZ - 2)
      scene.add(label)

      // Side walls for area
      const wallGeo = new THREE.BoxGeometry(0.5, CONFIG.WALL_HEIGHT, CONFIG.AREA_LENGTH)
      const wallMat = new THREE.MeshLambertMaterial({ color: area.color, transparent: true, opacity: 0.3 })
      const leftWall = new THREE.Mesh(wallGeo, wallMat)
      leftWall.position.set(-10.25, CONFIG.WALL_HEIGHT / 2, startZ - CONFIG.AREA_LENGTH / 2)
      scene.add(leftWall)
      const rightWall = new THREE.Mesh(wallGeo, wallMat.clone())
      rightWall.position.set(10.25, CONFIG.WALL_HEIGHT / 2, startZ - CONFIG.AREA_LENGTH / 2)
      scene.add(rightWall)

      // Decorative emoji pillars at start
      const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8)
      const pillarMat = new THREE.MeshLambertMaterial({ color: area.color })
      const leftPillar = new THREE.Mesh(pillarGeo, pillarMat)
      leftPillar.position.set(-9, 2.5, startZ)
      leftPillar.castShadow = true
      scene.add(leftPillar)
      const rightPillar = new THREE.Mesh(pillarGeo, pillarMat.clone())
      rightPillar.position.set(9, 2.5, startZ)
      rightPillar.castShadow = true
      scene.add(rightPillar)

      // Obstacles/decorations in areas (things to dodge)
      for (let j = 0; j < 3 + area.tier; j++) {
        const obsGeo = new THREE.BoxGeometry(
          1 + Math.random() * 2,
          1 + Math.random() * 3,
          1 + Math.random() * 2
        )
        const obsMat = new THREE.MeshLambertMaterial({
          color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5)
        })
        const obs = new THREE.Mesh(obsGeo, obsMat)
        obs.position.set(
          (Math.random() - 0.5) * 16,
          obsGeo.parameters.height / 2,
          startZ - 10 - Math.random() * (CONFIG.AREA_LENGTH - 20)
        )
        obs.castShadow = true
        obs.receiveShadow = true
        scene.add(obs)
      }

      // Hiding gap between areas (except after last)
      if (i < AREAS.length - 1) {
        const gapZ = startZ - CONFIG.AREA_LENGTH
        const gapGeo = new THREE.BoxGeometry(20, 0.5, CONFIG.HIDING_GAP)
        const gapMat = new THREE.MeshLambertMaterial({ color: 0x5D4037 })
        const gap = new THREE.Mesh(gapGeo, gapMat)
        gap.position.set(0, -0.25, gapZ - CONFIG.HIDING_GAP / 2)
        gap.receiveShadow = true
        scene.add(gap)

        // Hiding shelters in the gap
        for (let s = 0; s < 3; s++) {
          const shelterGroup = new THREE.Group()
          // Roof
          const roofGeo = new THREE.BoxGeometry(3, 0.3, 3)
          const roofMat = new THREE.MeshLambertMaterial({ color: 0x795548 })
          const roof = new THREE.Mesh(roofGeo, roofMat)
          roof.position.y = 3
          roof.castShadow = true
          shelterGroup.add(roof)
          // Pillars
          for (let px = -1; px <= 1; px += 2) {
            for (let pz = -1; pz <= 1; pz += 2) {
              const pGeo = new THREE.BoxGeometry(0.3, 3, 0.3)
              const pMat = new THREE.MeshLambertMaterial({ color: 0x6D4C41 })
              const p = new THREE.Mesh(pGeo, pMat)
              p.position.set(px * 1.2, 1.5, pz * 1.2)
              p.castShadow = true
              shelterGroup.add(p)
            }
          }
          shelterGroup.position.set(
            -6 + s * 6,
            0,
            gapZ - CONFIG.HIDING_GAP / 2
          )
          shelterGroup.userData = { isShelter: true }
          scene.add(shelterGroup)
        }
      }
    })

    // ─── Player (emoji cube runner) ──────────
    const playerGroup = new THREE.Group()
    // Body
    const bodyGeo = new THREE.BoxGeometry(1, 1.5, 1)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xFFEB3B })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.75
    body.castShadow = true
    playerGroup.add(body)
    // Head
    const headGeo = new THREE.SphereGeometry(0.5, 8, 8)
    const headMat = new THREE.MeshLambertMaterial({ color: 0xFFD54F })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 2
    head.castShadow = true
    playerGroup.add(head)
    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 6, 6)
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x212121 })
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(-0.2, 2.1, 0.4)
    playerGroup.add(leftEye)
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat.clone())
    rightEye.position.set(0.2, 2.1, 0.4)
    playerGroup.add(rightEye)
    // Smile
    const smileGeo = new THREE.TorusGeometry(0.15, 0.03, 8, 16, Math.PI)
    const smileMat = new THREE.MeshLambertMaterial({ color: 0x212121 })
    const smile = new THREE.Mesh(smileGeo, smileMat)
    smile.position.set(0, 1.9, 0.45)
    smile.rotation.x = Math.PI
    playerGroup.add(smile)

    playerGroup.position.set(0, 0, 2)
    scene.add(playerGroup)

    // ─── TSUNAMI WALL ───────────────────────
    const tsunamiGeo = new THREE.BoxGeometry(30, 15, 5)
    const tsunamiMat = new THREE.MeshPhongMaterial({
      color: 0x0288D1,
      transparent: true,
      opacity: 0.7,
      emissive: 0x01579B,
      emissiveIntensity: 0.3,
    })
    const tsunami = new THREE.Mesh(tsunamiGeo, tsunamiMat)
    tsunami.position.set(0, 7.5, 30)
    scene.add(tsunami)

    // Foam on top of tsunami
    const foamGeo = new THREE.BoxGeometry(30, 2, 5)
    const foamMat = new THREE.MeshLambertMaterial({ color: 0xE1F5FE, transparent: true, opacity: 0.8 })
    const foam = new THREE.Mesh(foamGeo, foamMat)
    foam.position.y = 8
    tsunami.add(foam)

    // ─── COINS ─────────────────────
    const coinMeshes = []

    // ─── GAME STATE ────────────────
    gameRef.current = {
      player: playerGroup,
      tsunami,
      keys: {},
      coins: coinMeshes,
      coinTimer: 0,
      speedBoostTimer: 0,
      magnetTimer: 0,
      freezeTimer: 0,
      doubleScoreTimer: 0,
      tsunamiType: TSUNAMI_TYPES[0],
      totalTrackLength: totalLength,
      shelters: [],
      galaxySlapActive: false,
      galaxySlapTimer: 0,
    }

    // Find shelters
    scene.traverse((child) => {
      if (child.userData && child.userData.isShelter) {
        gameRef.current.shelters.push(child)
      }
    })

    return { scene, camera, renderer }
  }, [])

  // ─── SPAWN COINS ─────────────────────────
  const spawnCoin = useCallback(() => {
    if (!sceneRef.current || !gameRef.current) return
    const g = gameRef.current
    const playerZ = g.player.position.z

    const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12)
    const coinMat = new THREE.MeshLambertMaterial({ color: 0xFFD700, emissive: 0xFFAB00, emissiveIntensity: 0.4 })
    const coin = new THREE.Mesh(coinGeo, coinMat)
    coin.rotation.x = Math.PI / 2
    coin.position.set(
      (Math.random() - 0.5) * 16,
      1 + Math.random() * 2,
      playerZ - 15 - Math.random() * 40
    )
    coin.castShadow = true
    coin.userData = { isCoin: true }
    sceneRef.current.add(coin)
    g.coins.push(coin)
  }, [])

  // ─── GAME LOOP ────────────────────────────
  const startGame = useCallback(() => {
    const { scene, camera, renderer } = initScene()
    if (!scene) return

    setGameState('playing')
    setScore(0)
    setIsHiding(false)
    setHasShield(false)
    setTsunamiWarning('')
    setMessage('')
    setDamageFlash(false)

    const g = gameRef.current
    // Pick tsunami type based on round
    const round = roundNum
    let tsunamiIdx = 0
    if (round <= 2) tsunamiIdx = 0
    else if (round <= 4) tsunamiIdx = 1
    else if (round <= 6) tsunamiIdx = 2
    else tsunamiIdx = 3
    // Random chance for harder tsunami
    if (Math.random() < 0.2 && tsunamiIdx < 3) tsunamiIdx++

    g.tsunamiType = TSUNAMI_TYPES[tsunamiIdx]
    g.tsunami.material.color.set(g.tsunamiType.color)
    g.tsunami.position.z = 40
    g.player.position.set(0, 0, 2)

    setTsunamiWarning(g.tsunamiType.warning)
    setTimeout(() => setTsunamiWarning(''), 3000)

    // Spawn initial coins
    for (let i = 0; i < 15; i++) spawnCoin()

    let lastTime = performance.now()

    const gameLoop = (time) => {
      if (!gameRef.current) return
      const dt = Math.min((time - lastTime) / 16.67, 3) // Normalize to ~60fps
      lastTime = time

      const game = gameRef.current
      if (gameStateRef.current !== 'playing') {
        animFrameRef.current = requestAnimationFrame(gameLoop)
        renderer.render(scene, camera)
        return
      }

      // ─── Player movement ───────
      const speedMult = 1 + speedLevelRef.current * 0.15
      const boostMult = game.speedBoostTimer > 0 ? 1.5 : 1
      const speed = CONFIG.PLAYER_BASE_SPEED * speedMult * boostMult * dt

      if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) {
        game.player.position.x = Math.max(game.player.position.x - speed, -9)
      }
      if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) {
        game.player.position.x = Math.min(game.player.position.x + speed, 9)
      }
      if (game.keys['ArrowUp'] || game.keys['w'] || game.keys['W']) {
        game.player.position.z -= speed
      }
      if (game.keys['ArrowDown'] || game.keys['s'] || game.keys['S']) {
        game.player.position.z += speed * 0.5 // Slower backwards
      }

      // ─── Tsunami movement ─────
      let tsunamiSpeed = game.tsunamiType.speed * dt
      if (game.freezeTimer > 0) {
        tsunamiSpeed *= 0.2
        game.freezeTimer -= dt
      }

      game.tsunami.position.z -= tsunamiSpeed
      // Tsunami wave animation
      game.tsunami.position.y = 7.5 + Math.sin(time * 0.003) * 1.5

      // ─── Check if player is hiding ────
      let playerHiding = false
      const px = game.player.position.x
      const pz = game.player.position.z
      game.shelters.forEach((shelter) => {
        const sx = shelter.position.x
        const sz = shelter.position.z
        if (Math.abs(px - sx) < 2 && Math.abs(pz - sz) < 2) {
          playerHiding = true
        }
      })
      setIsHiding(playerHiding)

      // ─── Tsunami hits player ──────
      if (game.tsunami.position.z <= game.player.position.z + 2) {
        if (playerHiding) {
          // Safe in shelter — tsunami passes over
          game.tsunami.position.z = game.player.position.z - 10
          setMessage('🛖 Safe in shelter!')
          setTimeout(() => setMessage(''), 2000)
        } else if (hasShieldRef.current) {
          setHasShield(false)
          game.tsunami.position.z = game.player.position.z + 30
          setMessage('🛡️ Shield blocked the tsunami!')
          setTimeout(() => setMessage(''), 2000)
        } else if (game.galaxySlapActive) {
          game.tsunami.position.z = game.player.position.z + 60
          setMessage('🪐 Galaxy Slap pushed tsunami back!')
          setTimeout(() => setMessage(''), 2000)
        } else {
          // Game over
          const finalScore = scoreRef.current
          const savedHigh = parseInt(localStorage.getItem('escapeTsunamiHighScore') || '0')
          if (finalScore > savedHigh) {
            localStorage.setItem('escapeTsunamiHighScore', finalScore.toString())
            setHighScore(finalScore)
          }
          // Save to leaderboard
          const saved = localStorage.getItem('aidenScores-escapetsunami')
          const scores = saved ? JSON.parse(saved) : []
          scores.push({ score: finalScore, date: new Date().toLocaleDateString() })
          localStorage.setItem('aidenScores-escapetsunami', JSON.stringify(scores))

          setDamageFlash(true)
          setTimeout(() => setDamageFlash(false), 300)
          setGameState('gameover')
          return
        }
      }

      // ─── Determine current area ─────
      const absZ = Math.abs(game.player.position.z)
      const areaSize = CONFIG.AREA_LENGTH + CONFIG.HIDING_GAP
      const areaIdx = Math.min(Math.floor(absZ / areaSize), AREAS.length - 1)
      setCurrentArea(AREAS[areaIdx].name)

      // ─── Score (distance traveled) ─────
      const distScore = Math.floor(Math.abs(game.player.position.z) * (game.doubleScoreTimer > 0 ? 2 : 1))
      setScore(distScore)

      // ─── Coin collection ───────
      const magnetRange = game.magnetTimer > 0 ? 8 : 2
      for (let i = game.coins.length - 1; i >= 0; i--) {
        const c = game.coins[i]
        c.rotation.z += 0.05 * dt

        // Magnet pull
        if (game.magnetTimer > 0) {
          const dx = game.player.position.x - c.position.x
          const dz = game.player.position.z - c.position.z
          const dist = Math.sqrt(dx * dx + dz * dz)
          if (dist < magnetRange && dist > 0.5) {
            c.position.x += (dx / dist) * 0.2 * dt
            c.position.z += (dz / dist) * 0.2 * dt
          }
        }

        // Collect
        const dx = game.player.position.x - c.position.x
        const dz = game.player.position.z - c.position.z
        if (Math.abs(dx) < 1.5 && Math.abs(dz) < 1.5) {
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

      // ─── Win condition (reach end of mythic) ─────
      const endZ = -(AREAS.length * (CONFIG.AREA_LENGTH + CONFIG.HIDING_GAP))
      if (game.player.position.z <= endZ) {
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
        const saved = localStorage.getItem('aidenScores-escapetsunami')
        const sc = saved ? JSON.parse(saved) : []
        sc.push({ score: finalScore, date: new Date().toLocaleDateString() })
        localStorage.setItem('aidenScores-escapetsunami', JSON.stringify(sc))
        setGameState('shop')
        return
      }

      // ─── Camera follow ─────
      camera.position.x = game.player.position.x * 0.3
      camera.position.z = game.player.position.z + 15
      camera.position.y = 12
      camera.lookAt(game.player.position.x * 0.5, 0, game.player.position.z - 10)

      renderer.render(scene, camera)
      animFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [initScene, spawnCoin, roundNum])

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

  // ─── TOUCH CONTROLS ───────────────────
  const touchDir = useRef({ x: 0, y: 0 })
  const handleTouchMove = useCallback((dir) => {
    if (!gameRef.current) return
    gameRef.current.keys['ArrowLeft'] = dir === 'left'
    gameRef.current.keys['ArrowRight'] = dir === 'right'
    gameRef.current.keys['ArrowUp'] = dir === 'up'
    gameRef.current.keys['ArrowDown'] = dir === 'down'
  }, [])
  const handleTouchEnd = useCallback(() => {
    if (!gameRef.current) return
    gameRef.current.keys['ArrowLeft'] = false
    gameRef.current.keys['ArrowRight'] = false
    gameRef.current.keys['ArrowUp'] = false
    gameRef.current.keys['ArrowDown'] = false
  }, [])

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
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [])

  // ─── SPIN WHEEL ────────────────────────
  const doSpin = () => {
    if (isSpinning) return
    if (freeSpins <= 0 && coins < 50) return

    if (freeSpins > 0) {
      setFreeSpins(prev => prev - 1)
    } else {
      setCoins(prev => prev - 50)
    }

    setIsSpinning(true)
    setSpinResult(null)
    setGalaxyBlockReward(null)

    // Weighted random
    const totalWeight = SPIN_WHEEL_ITEMS.reduce((a, b) => a + b.weight, 0)
    let r = Math.random() * totalWeight
    let chosen = SPIN_WHEEL_ITEMS[0]
    for (const item of SPIN_WHEEL_ITEMS) {
      r -= item.weight
      if (r <= 0) { chosen = item; break }
    }

    // Animate spin
    const targetAngle = spinAngle + 720 + Math.random() * 360
    const startAngle = spinAngle
    const startTime = performance.now()
    const duration = 3000

    const animateSpin = (time) => {
      const elapsed = time - startTime
      const t = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3) // ease out cubic
      const current = startAngle + (targetAngle - startAngle) * ease
      setSpinAngle(current)

      if (t < 1) {
        requestAnimationFrame(animateSpin)
      } else {
        setSpinAngle(targetAngle)
        setIsSpinning(false)
        setSpinResult(chosen)
        applySpinReward(chosen)
      }
    }
    requestAnimationFrame(animateSpin)
  }

  const applySpinReward = (item) => {
    if (!gameRef.current) return
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
        if (gameRef.current) {
          gameRef.current.speedBoostTimer = 30000
          gameRef.current.doubleScoreTimer = 30000
        }
        setHasShield(true)
        break
      }
      case 'galaxy_slap':
        if (gameRef.current) {
          gameRef.current.galaxySlapActive = true
          gameRef.current.galaxySlapTimer = 30000
        }
        setMessage('🪐 GALAXY SLAP HAND! Tsunami gets pushed back on contact!')
        setTimeout(() => setMessage(''), 4000)
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
        {/* Animated waves background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-blue-400/30 to-transparent animate-pulse" />
        </div>

        <button onClick={onBack} className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-bold backdrop-blur-sm z-10">
          &larr; Back
        </button>

        <div className="text-center z-10">
          <div className="text-8xl mb-4">🌊</div>
          <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-lg mb-2">
            ESCAPE TSUNAMI
          </h1>
          <p className="text-xl md:text-2xl text-cyan-200 font-bold mb-2">Emoji Edition</p>
          <p className="text-lg text-blue-200 mb-8 max-w-md mx-auto">
            Run through 6 rarity zones! Dodge the tsunami! Collect coins and spin for rewards!
          </p>

          <div className="grid grid-cols-3 gap-2 mb-8 max-w-sm mx-auto">
            {AREAS.map(a => (
              <div key={a.name} className="bg-white/10 rounded-lg p-2 text-center backdrop-blur-sm">
                <div className="text-2xl">{a.emoji}</div>
                <div className="text-white text-xs font-bold">{a.name}</div>
              </div>
            ))}
          </div>

          <button
            onClick={startGame}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white px-12 py-4 rounded-xl font-black text-2xl shadow-2xl hover:scale-110 transition-all duration-300 border-4 border-white/30"
          >
            🏃 START RUNNING
          </button>

          {highScore > 0 && (
            <div className="mt-4 text-yellow-300 font-bold text-lg">
              Best Score: {highScore}
            </div>
          )}

          <div className="mt-6 text-blue-200 text-sm">
            <p>WASD or Arrow Keys to move | Mobile: use on-screen controls</p>
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
        <p className="text-yellow-300 text-2xl font-bold mb-6">💰 {coins} Coins</p>
        {message && <p className="text-green-300 text-xl font-bold mb-4">{message}</p>}

        <div className="grid gap-4 max-w-md w-full mb-6">
          <button
            onClick={buySpeed}
            disabled={coins < speedCost}
            className={`p-6 rounded-xl text-left transition-all ${
              coins >= speedCost
                ? 'bg-white/20 hover:bg-white/30 cursor-pointer'
                : 'bg-white/5 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="text-3xl mb-2">🏃 Speed Upgrade</div>
            <div className="text-white font-bold">Level {speedLevel} &rarr; {speedLevel + 1}</div>
            <div className="text-yellow-300 font-bold">Cost: {speedCost} coins</div>
            <div className="text-blue-200 text-sm">+15% movement speed per level</div>
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setGameState('wheel')}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-all"
          >
            🎡 Spin Wheel {freeSpins > 0 ? `(${freeSpins} free)` : '(50 coins)'}
          </button>
          <button
            onClick={() => {
              setMessage('')
              startGame()
            }}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-all"
          >
            ▶ Next Round
          </button>
        </div>
      </div>
    )
  }

  // SPIN WHEEL
  if (gameState === 'wheel') {
    const sliceAngle = 360 / SPIN_WHEEL_ITEMS.length
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-black text-white mb-2">🎡 Spin Wheel</h1>
        <p className="text-yellow-300 text-xl font-bold mb-1">💰 {coins} Coins</p>
        <p className="text-blue-300 font-bold mb-4">
          {freeSpins > 0 ? `${freeSpins} Free Spin(s)!` : 'Cost: 50 coins per spin'}
        </p>

        {/* Wheel */}
        <div className="relative mb-6">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-3xl z-10">▼</div>
          <div
            className="w-72 h-72 rounded-full border-8 border-white shadow-2xl relative overflow-hidden"
            style={{ transform: `rotate(${spinAngle}deg)`, transition: isSpinning ? 'none' : 'none' }}
          >
            {SPIN_WHEEL_ITEMS.map((item, i) => {
              const rotation = i * sliceAngle
              const colors = [
                'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
                'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500',
                'bg-indigo-500', 'bg-violet-500'
              ]
              return (
                <div
                  key={i}
                  className={`absolute w-full h-full ${colors[i % colors.length]}`}
                  style={{
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((rotation - sliceAngle / 2) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotation - sliceAngle / 2) * Math.PI / 180)}%, ${50 + 50 * Math.cos((rotation + sliceAngle / 2) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotation + sliceAngle / 2) * Math.PI / 180)}%)`,
                  }}
                >
                  <div
                    className="absolute text-xs font-bold text-white drop-shadow-lg"
                    style={{
                      left: `${50 + 30 * Math.cos(rotation * Math.PI / 180)}%`,
                      top: `${50 + 30 * Math.sin(rotation * Math.PI / 180)}%`,
                      transform: 'translate(-50%, -50%)',
                      width: '60px',
                      textAlign: 'center',
                    }}
                  >
                    {item.name.split(' ')[0]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Spin Result */}
        {spinResult && (
          <div className={`text-center mb-4 p-4 rounded-xl ${
            spinResult.type === 'galaxy_slap' ? 'bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse' :
            spinResult.type === 'galaxy_block' ? 'bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse' :
            'bg-white/20'
          }`}>
            <div className="text-2xl font-black text-white">{spinResult.name}</div>
            {spinResult.type === 'galaxy_slap' && (
              <div className="text-yellow-300 text-sm font-bold mt-1">LEGENDARY! Pushes tsunami back on contact for 30s!</div>
            )}
            {spinResult.type === 'galaxy_block' && galaxyBlockReward && (
              <div className="text-cyan-300 text-sm font-bold mt-1">{galaxyBlockReward}</div>
            )}
          </div>
        )}

        {/* Spin Items Legend */}
        <div className="grid grid-cols-2 gap-1 max-w-sm mb-4">
          {SPIN_WHEEL_ITEMS.map((item, i) => (
            <div key={i} className="text-white text-xs bg-white/10 rounded px-2 py-1">
              {item.name} <span className="text-yellow-300">({(item.weight / SPIN_WHEEL_ITEMS.reduce((a, b) => a + b.weight, 0) * 100).toFixed(0)}%)</span>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={doSpin}
            disabled={isSpinning || (freeSpins <= 0 && coins < 50)}
            className={`px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all ${
              isSpinning || (freeSpins <= 0 && coins < 50)
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 hover:scale-105'
            } text-white`}
          >
            {isSpinning ? '🎡 Spinning...' : '🎡 SPIN!'}
          </button>
          <button
            onClick={() => setGameState('shop')}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold"
          >
            &larr; Back to Shop
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
          <p className="text-yellow-300 text-xl font-bold mb-2">Coins Earned: {coins}</p>
          <p className="text-cyan-300 font-bold">Reached: {currentArea} Area</p>
          <p className="text-blue-300 font-bold">Round: {roundNum}</p>
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
          <button
            onClick={onBack}
            className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl font-bold text-xl"
          >
            &larr; Back
          </button>
        </div>
      </div>
    )
  }

  // PLAYING
  return (
    <div className="w-full h-screen relative overflow-hidden bg-black">
      {/* Damage flash */}
      {damageFlash && <div className="absolute inset-0 bg-red-500/50 z-30 pointer-events-none" />}

      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* HUD */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-20 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="text-lg font-black">Score: {score}</div>
          <div className="text-yellow-300 font-bold text-sm">💰 {coins}</div>
          <div className="text-sm font-bold" style={{ color: AREAS.find(a => a.name === currentArea)?.color ? `#${AREAS.find(a => a.name === currentArea).color.toString(16).padStart(6, '0')}` : 'white' }}>
            {AREAS.find(a => a.name === currentArea)?.emoji} {currentArea} Area
          </div>
          <div className="text-xs text-blue-300">Round {roundNum}</div>
        </div>

        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-right">
          <div className="text-sm font-bold">🏃 Speed Lv.{speedLevel}</div>
          {hasShield && <div className="text-sm text-green-300 font-bold">🛡️ Shield Active</div>}
          {isHiding && <div className="text-sm text-yellow-300 font-bold animate-pulse">🛖 HIDING!</div>}
          {gameRef.current?.galaxySlapActive && <div className="text-sm text-purple-300 font-bold animate-pulse">🪐 Galaxy Slap!</div>}
          {gameRef.current?.speedBoostTimer > 0 && <div className="text-sm text-cyan-300 font-bold">⚡ Speed Boost!</div>}
          {gameRef.current?.magnetTimer > 0 && <div className="text-sm text-yellow-300 font-bold">🧲 Magnet!</div>}
          {gameRef.current?.freezeTimer > 0 && <div className="text-sm text-blue-300 font-bold">⏱️ Time Freeze!</div>}
          {gameRef.current?.doubleScoreTimer > 0 && <div className="text-sm text-green-300 font-bold">🍀 2x Score!</div>}
        </div>
      </div>

      {/* Tsunami warning */}
      {tsunamiWarning && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-600/80 text-white px-6 py-2 rounded-lg font-black text-lg animate-pulse z-20">
          {tsunamiWarning}
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 bg-black/70 text-white px-8 py-3 rounded-xl font-black text-xl z-20 animate-bounce">
          {message}
        </div>
      )}

      {/* Mobile controls */}
      <div className="absolute bottom-4 left-4 z-20 md:hidden">
        <div className="grid grid-cols-3 gap-1">
          <div />
          <button
            onTouchStart={() => handleTouchMove('up')}
            onTouchEnd={handleTouchEnd}
            className="bg-white/30 backdrop-blur-sm w-14 h-14 rounded-lg flex items-center justify-center text-2xl active:bg-white/50"
          >
            ▲
          </button>
          <div />
          <button
            onTouchStart={() => handleTouchMove('left')}
            onTouchEnd={handleTouchEnd}
            className="bg-white/30 backdrop-blur-sm w-14 h-14 rounded-lg flex items-center justify-center text-2xl active:bg-white/50"
          >
            ◀
          </button>
          <button
            onTouchStart={() => handleTouchMove('down')}
            onTouchEnd={handleTouchEnd}
            className="bg-white/30 backdrop-blur-sm w-14 h-14 rounded-lg flex items-center justify-center text-2xl active:bg-white/50"
          >
            ▼
          </button>
          <button
            onTouchStart={() => handleTouchMove('right')}
            onTouchEnd={handleTouchEnd}
            className="bg-white/30 backdrop-blur-sm w-14 h-14 rounded-lg flex items-center justify-center text-2xl active:bg-white/50"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/40 hover:bg-black/60 text-white px-3 py-1 rounded font-bold text-xs z-20"
      >
        ✕ Quit
      </button>
    </div>
  )
}
