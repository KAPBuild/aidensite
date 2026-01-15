import React, { useRef, useState, useEffect, useCallback } from 'react'
import * as THREE from 'three'

// Game configuration
const CONFIG = {
  NIGHT_DURATION: 10000,      // 10 seconds per night
  DAY_TRANSITION: 2000,       // 2 second safe period
  FIRE_RADIUS: 12,            // units
  WOOD_CONSUMPTION: 3000,     // 1 wood per 3 seconds
  MOVE_SPEED: 0.15,
  SPRINT_SPEED: 0.25,
  MAX_HEALTH: 100,
  MAX_HUNGER: 100,
  MAX_STAMINA: 100,
  HUNGER_DRAIN: 2,            // per second
  STAMINA_REGEN: 15,          // per second
  QUICK_ATTACK_DAMAGE: 20,
  WOOD_PER_LOG: 5,
  MAX_WOOD: 50,
  RESOURCE_SPAWN_RATE: 2500,
  WARTHOG_SPAWN_RATE: 4000,
}

export default function DesertNights({ onBack }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const gameRef = useRef(null)

  const [gameState, setGameState] = useState('menu')
  const [night, setNight] = useState(1)
  const [score, setScore] = useState(0)
  const [woodCount, setWoodCount] = useState(15)
  const [hungerLevel, setHungerLevel] = useState(100)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [stamina, setStamina] = useState(100)
  const [kills, setKills] = useState(0)
  const [fireStatus, setFireStatus] = useState('burning')
  const [nightProgress, setNightProgress] = useState(0)
  const [highestNight, setHighestNight] = useState(() => {
    return parseInt(localStorage.getItem('desertNights3DHighestNight') || '0')
  })

  // Create blocky player mesh
  const createPlayer = useCallback(() => {
    const group = new THREE.Group()

    // Body
    const bodyGeo = new THREE.BoxGeometry(1, 1.5, 0.6)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xd4a574 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 1.25
    body.castShadow = true
    group.add(body)

    // Head
    const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8)
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffdbac })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 2.4
    head.castShadow = true
    group.add(head)

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.1)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(-0.2, 2.5, 0.4)
    group.add(leftEye)
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
    rightEye.position.set(0.2, 2.5, 0.4)
    group.add(rightEye)

    // Arms
    const armGeo = new THREE.BoxGeometry(0.3, 1, 0.3)
    const armMat = new THREE.MeshLambertMaterial({ color: 0xffdbac })
    const leftArm = new THREE.Mesh(armGeo, armMat)
    leftArm.position.set(-0.65, 1.25, 0)
    leftArm.castShadow = true
    group.add(leftArm)
    const rightArm = new THREE.Mesh(armGeo, armMat)
    rightArm.position.set(0.65, 1.25, 0)
    rightArm.castShadow = true
    group.add(rightArm)

    // Legs
    const legGeo = new THREE.BoxGeometry(0.35, 1, 0.35)
    const legMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
    const leftLeg = new THREE.Mesh(legGeo, legMat)
    leftLeg.position.set(-0.25, 0.5, 0)
    leftLeg.castShadow = true
    group.add(leftLeg)
    const rightLeg = new THREE.Mesh(legGeo, legMat)
    rightLeg.position.set(0.25, 0.5, 0)
    rightLeg.castShadow = true
    group.add(rightLeg)

    // Axe
    const axeGroup = new THREE.Group()
    const handleGeo = new THREE.BoxGeometry(0.1, 1.2, 0.1)
    const handleMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    const handle = new THREE.Mesh(handleGeo, handleMat)
    axeGroup.add(handle)

    const bladeGeo = new THREE.BoxGeometry(0.5, 0.4, 0.1)
    const bladeMat = new THREE.MeshLambertMaterial({ color: 0xcccccc })
    const blade = new THREE.Mesh(bladeGeo, bladeMat)
    blade.position.set(0.2, 0.5, 0)
    axeGroup.add(blade)

    axeGroup.position.set(0.9, 1.2, 0.3)
    axeGroup.rotation.z = -0.3
    group.add(axeGroup)
    group.userData.axe = axeGroup

    return group
  }, [])

  // Create warthog mesh
  const createWarthog = useCallback((type = 'normal') => {
    const group = new THREE.Group()
    const colors = {
      piglet: 0xffb6c1,
      normal: 0x8B4513,
      boar: 0x4a3728,
      alpha: 0x2d1f15
    }
    const sizes = {
      piglet: 0.6,
      normal: 1,
      boar: 1.4,
      alpha: 1.8
    }
    const scale = sizes[type] || 1
    const color = colors[type] || colors.normal

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.8 * scale, 1 * scale, 1 * scale)
    const bodyMat = new THREE.MeshLambertMaterial({ color })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.6 * scale
    body.castShadow = true
    group.add(body)

    // Head
    const headGeo = new THREE.BoxGeometry(0.8 * scale, 0.7 * scale, 0.9 * scale)
    const head = new THREE.Mesh(headGeo, bodyMat)
    head.position.set(1 * scale, 0.6 * scale, 0)
    head.castShadow = true
    group.add(head)

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.4 * scale, 0.3 * scale, 0.4 * scale)
    const snoutMat = new THREE.MeshLambertMaterial({ color: 0xffa0a0 })
    const snout = new THREE.Mesh(snoutGeo, snoutMat)
    snout.position.set(1.5 * scale, 0.5 * scale, 0)
    group.add(snout)

    // Tusks
    const tuskGeo = new THREE.BoxGeometry(0.1 * scale, 0.3 * scale, 0.1 * scale)
    const tuskMat = new THREE.MeshLambertMaterial({ color: 0xfffff0 })
    const leftTusk = new THREE.Mesh(tuskGeo, tuskMat)
    leftTusk.position.set(1.4 * scale, 0.3 * scale, 0.25 * scale)
    leftTusk.rotation.z = 0.3
    group.add(leftTusk)
    const rightTusk = new THREE.Mesh(tuskGeo, tuskMat)
    rightTusk.position.set(1.4 * scale, 0.3 * scale, -0.25 * scale)
    rightTusk.rotation.z = 0.3
    group.add(rightTusk)

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.12 * scale, 0.12 * scale, 0.05 * scale)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(1.2 * scale, 0.75 * scale, 0.35 * scale)
    group.add(leftEye)
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
    rightEye.position.set(1.2 * scale, 0.75 * scale, -0.35 * scale)
    group.add(rightEye)

    // Legs
    const legGeo = new THREE.BoxGeometry(0.25 * scale, 0.5 * scale, 0.25 * scale)
    const positions = [
      [-0.5, 0.25, 0.3],
      [-0.5, 0.25, -0.3],
      [0.5, 0.25, 0.3],
      [0.5, 0.25, -0.3]
    ]
    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, bodyMat)
      leg.position.set(pos[0] * scale, pos[1] * scale, pos[2] * scale)
      leg.castShadow = true
      group.add(leg)
    })

    return group
  }, [])

  // Create fire
  const createFire = useCallback(() => {
    const group = new THREE.Group()

    // Fire pit base
    const pitGeo = new THREE.CylinderGeometry(1.5, 2, 0.5, 8)
    const pitMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
    const pit = new THREE.Mesh(pitGeo, pitMat)
    pit.position.y = 0.25
    pit.receiveShadow = true
    group.add(pit)

    // Fire cubes (animated)
    const fireColors = [0xff4500, 0xff6600, 0xff8c00, 0xffa500]
    for (let i = 0; i < 8; i++) {
      const size = 0.3 + Math.random() * 0.4
      const fireGeo = new THREE.BoxGeometry(size, size * 1.5, size)
      const fireMat = new THREE.MeshBasicMaterial({
        color: fireColors[Math.floor(Math.random() * fireColors.length)],
        transparent: true,
        opacity: 0.9
      })
      const fireCube = new THREE.Mesh(fireGeo, fireMat)
      fireCube.position.set(
        (Math.random() - 0.5) * 1.5,
        0.5 + Math.random() * 1,
        (Math.random() - 0.5) * 1.5
      )
      fireCube.userData.baseY = fireCube.position.y
      fireCube.userData.speed = 0.5 + Math.random() * 0.5
      fireCube.userData.phase = Math.random() * Math.PI * 2
      group.add(fireCube)
    }

    // Point light
    const fireLight = new THREE.PointLight(0xff6600, 2, 25)
    fireLight.position.y = 1.5
    fireLight.castShadow = true
    group.add(fireLight)
    group.userData.light = fireLight

    // Safe zone indicator (circle on ground)
    const zoneGeo = new THREE.RingGeometry(CONFIG.FIRE_RADIUS - 0.5, CONFIG.FIRE_RADIUS, 32)
    const zoneMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    const zone = new THREE.Mesh(zoneGeo, zoneMat)
    zone.rotation.x = -Math.PI / 2
    zone.position.y = 0.05
    group.add(zone)
    group.userData.zone = zone

    return group
  }, [])

  // Create wood log
  const createWoodLog = useCallback(() => {
    const group = new THREE.Group()
    const logGeo = new THREE.BoxGeometry(0.8, 0.4, 0.4)
    const logMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 })

    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(logGeo, logMat)
      log.position.set(
        (Math.random() - 0.5) * 0.3,
        0.2 + i * 0.3,
        (Math.random() - 0.5) * 0.3
      )
      log.rotation.y = Math.random() * Math.PI
      log.castShadow = true
      group.add(log)
    }

    // Floating animation
    group.userData.baseY = 0
    group.userData.phase = Math.random() * Math.PI * 2

    return group
  }, [])

  // Create cactus
  const createCactus = useCallback(() => {
    const group = new THREE.Group()
    const cactusMat = new THREE.MeshLambertMaterial({ color: 0x2d5a27 })

    // Main body
    const bodyGeo = new THREE.BoxGeometry(0.8, 2.5, 0.8)
    const body = new THREE.Mesh(bodyGeo, cactusMat)
    body.position.y = 1.25
    body.castShadow = true
    group.add(body)

    // Arms
    const armGeo = new THREE.BoxGeometry(1.2, 0.6, 0.6)
    const leftArm = new THREE.Mesh(armGeo, cactusMat)
    leftArm.position.set(-0.8, 1.8, 0)
    leftArm.castShadow = true
    group.add(leftArm)

    const leftArmUp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.6), cactusMat)
    leftArmUp.position.set(-1.2, 2.3, 0)
    leftArmUp.castShadow = true
    group.add(leftArmUp)

    // Fruit on top
    const fruitGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3)
    const fruitMat = new THREE.MeshLambertMaterial({ color: 0xff69b4 })
    const fruit = new THREE.Mesh(fruitGeo, fruitMat)
    fruit.position.y = 2.7
    group.add(fruit)

    return group
  }, [])

  // Create rock
  const createRock = useCallback(() => {
    const geo = new THREE.BoxGeometry(
      1 + Math.random() * 1.5,
      0.5 + Math.random() * 1,
      1 + Math.random() * 1.5
    )
    const mat = new THREE.MeshLambertMaterial({ color: 0x808080 })
    const rock = new THREE.Mesh(geo, mat)
    rock.position.y = geo.parameters.height / 2
    rock.rotation.y = Math.random() * Math.PI
    rock.castShadow = true
    rock.receiveShadow = true
    return rock
  }, [])

  // Initialize game
  const initGame = useCallback(() => {
    if (!containerRef.current) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB)
    scene.fog = new THREE.Fog(0xd4a574, 30, 80)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8)
    sunLight.position.set(50, 100, 50)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 500
    sunLight.shadow.camera.left = -50
    sunLight.shadow.camera.right = 50
    sunLight.shadow.camera.top = 50
    sunLight.shadow.camera.bottom = -50
    scene.add(sunLight)

    // Ground
    const groundGeo = new THREE.PlaneGeometry(100, 100)
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xd4a574 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Player
    const player = createPlayer()
    player.position.set(0, 0, 5)
    scene.add(player)

    // Fire
    const fire = createFire()
    fire.position.set(0, 0, 0)
    scene.add(fire)

    // Add some environment
    for (let i = 0; i < 15; i++) {
      const cactus = createCactus()
      const angle = Math.random() * Math.PI * 2
      const dist = 20 + Math.random() * 25
      cactus.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist)
      cactus.rotation.y = Math.random() * Math.PI
      scene.add(cactus)
    }

    for (let i = 0; i < 20; i++) {
      const rock = createRock()
      const angle = Math.random() * Math.PI * 2
      const dist = 15 + Math.random() * 30
      rock.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist)
      scene.add(rock)
    }

    // Game state
    gameRef.current = {
      player,
      fire,
      sunLight,
      ambientLight,
      warthogs: [],
      woodLogs: [],
      foodItems: [],
      attacks: [],
      keys: {},
      lastAttack: 0,
      nightStartTime: Date.now(),
      woodConsumptionTimer: 0,
      hungerDepletionTimer: 0,
      resourceSpawnTimer: 0,
      warthogSpawnTimer: 0,
      staminaRegenTimer: 0,
      isNight: false,
      playerFacing: 0,
      isSprinting: false,
    }

    return () => {
      renderer.dispose()
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [createPlayer, createFire, createCactus, createRock])

  // Start game
  const startGame = useCallback(() => {
    setScore(0)
    setNight(1)
    setWoodCount(15)
    setHungerLevel(100)
    setPlayerHealth(100)
    setStamina(100)
    setKills(0)
    setFireStatus('burning')
    setNightProgress(0)

    if (gameRef.current) {
      gameRef.current.nightStartTime = Date.now()
      gameRef.current.woodConsumptionTimer = 0
      gameRef.current.hungerDepletionTimer = 0
      gameRef.current.resourceSpawnTimer = 0
      gameRef.current.warthogSpawnTimer = 0

      // Clear existing enemies and resources
      gameRef.current.warthogs.forEach(w => sceneRef.current?.remove(w.mesh))
      gameRef.current.warthogs = []
      gameRef.current.woodLogs.forEach(w => sceneRef.current?.remove(w))
      gameRef.current.woodLogs = []
      gameRef.current.foodItems.forEach(f => sceneRef.current?.remove(f))
      gameRef.current.foodItems = []

      // Reset player position
      gameRef.current.player.position.set(0, 0, 5)
    }

    setGameState('playing')
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    const cleanup = initGame()
    if (!cleanup) return

    const game = gameRef.current
    const scene = sceneRef.current
    const renderer = rendererRef.current
    const camera = cameraRef.current

    let lastTime = Date.now()
    let animationId

    const gameLoop = () => {
      const now = Date.now()
      const deltaTime = now - lastTime
      lastTime = now

      if (!game || !scene || !renderer || !camera) {
        animationId = requestAnimationFrame(gameLoop)
        return
      }

      // Night progress
      const nightTime = now - game.nightStartTime
      const progress = Math.min(nightTime / CONFIG.NIGHT_DURATION, 1)
      setNightProgress(progress)

      // Day/night cycle visuals
      const nightIntensity = Math.sin(progress * Math.PI)
      const skyColor = new THREE.Color().lerpColors(
        new THREE.Color(0x87CEEB),
        new THREE.Color(0x1a1a3a),
        nightIntensity * 0.8
      )
      scene.background = skyColor
      game.sunLight.intensity = 0.8 - nightIntensity * 0.6
      game.ambientLight.intensity = 0.4 - nightIntensity * 0.25

      // Check night completion
      if (nightTime >= CONFIG.NIGHT_DURATION) {
        const nextNight = night + 1
        if (nextNight > 99) {
          setGameState('victory')
          if (nextNight - 1 > highestNight) {
            setHighestNight(nextNight - 1)
            localStorage.setItem('desertNights3DHighestNight', (nextNight - 1).toString())
          }
        } else {
          setNight(nextNight)
          setScore(s => s + 50 * night)
          setWoodCount(w => Math.min(CONFIG.MAX_WOOD, w + 5))
          setHungerLevel(h => Math.min(CONFIG.MAX_HUNGER, h + 15))
          game.nightStartTime = Date.now()

          // Clear warthogs at end of night
          game.warthogs.forEach(w => scene.remove(w.mesh))
          game.warthogs = []
        }
      }

      // Timers
      game.woodConsumptionTimer += deltaTime
      game.hungerDepletionTimer += deltaTime
      game.resourceSpawnTimer += deltaTime
      game.warthogSpawnTimer += deltaTime
      game.staminaRegenTimer += deltaTime

      // Wood consumption
      if (game.woodConsumptionTimer > CONFIG.WOOD_CONSUMPTION) {
        game.woodConsumptionTimer = 0
        setWoodCount(w => {
          const newWood = Math.max(0, w - 1)
          if (newWood > 15) setFireStatus('blazing')
          else if (newWood > 5) setFireStatus('burning')
          else if (newWood > 0) setFireStatus('flickering')
          else setFireStatus('out')

          // Update fire visuals
          const light = game.fire.userData.light
          if (light) {
            light.intensity = newWood > 0 ? 1 + (newWood / 20) : 0
          }

          return newWood
        })
      }

      // Hunger depletion
      if (game.hungerDepletionTimer > 1000) {
        game.hungerDepletionTimer = 0
        const drain = game.isSprinting ? CONFIG.HUNGER_DRAIN * 1.5 : CONFIG.HUNGER_DRAIN
        setHungerLevel(h => {
          const newHunger = Math.max(0, h - drain)
          if (newHunger === 0) {
            setPlayerHealth(hp => {
              const newHealth = Math.max(0, hp - 5)
              if (newHealth === 0) setGameState('gameover')
              return newHealth
            })
          }
          return newHunger
        })
      }

      // Stamina regen
      if (game.staminaRegenTimer > 100 && !game.isSprinting) {
        game.staminaRegenTimer = 0
        setStamina(s => Math.min(CONFIG.MAX_STAMINA, s + CONFIG.STAMINA_REGEN / 10))
      }

      // Player movement
      const speed = game.isSprinting && stamina > 0 ? CONFIG.SPRINT_SPEED : CONFIG.MOVE_SPEED
      let moved = false

      if (game.keys['w'] || game.keys['arrowup']) {
        game.player.position.z -= speed
        game.playerFacing = Math.PI
        moved = true
      }
      if (game.keys['s'] || game.keys['arrowdown']) {
        game.player.position.z += speed
        game.playerFacing = 0
        moved = true
      }
      if (game.keys['a'] || game.keys['arrowleft']) {
        game.player.position.x -= speed
        game.playerFacing = Math.PI / 2
        moved = true
      }
      if (game.keys['d'] || game.keys['arrowright']) {
        game.player.position.x += speed
        game.playerFacing = -Math.PI / 2
        moved = true
      }

      if (moved) {
        game.player.rotation.y = game.playerFacing
      }

      // Sprint stamina drain
      if (game.isSprinting && moved) {
        setStamina(s => {
          const newStamina = Math.max(0, s - 0.5)
          if (newStamina === 0) game.isSprinting = false
          return newStamina
        })
      }

      // Boundary
      game.player.position.x = Math.max(-45, Math.min(45, game.player.position.x))
      game.player.position.z = Math.max(-45, Math.min(45, game.player.position.z))

      // Camera follow
      camera.position.set(
        game.player.position.x,
        game.player.position.y + 20,
        game.player.position.z + 15
      )
      camera.lookAt(game.player.position.x, 0, game.player.position.z)

      // Fire animation
      game.fire.children.forEach(child => {
        if (child.userData.baseY !== undefined) {
          child.position.y = child.userData.baseY +
            Math.sin(now * 0.005 * child.userData.speed + child.userData.phase) * 0.3
          child.rotation.y += 0.02
        }
      })

      // Spawn resources
      if (game.resourceSpawnTimer > CONFIG.RESOURCE_SPAWN_RATE) {
        game.resourceSpawnTimer = 0

        const angle = Math.random() * Math.PI * 2
        const dist = CONFIG.FIRE_RADIUS + 5 + Math.random() * 20
        const x = Math.cos(angle) * dist
        const z = Math.sin(angle) * dist

        if (Math.random() < 0.7) {
          const log = createWoodLog()
          log.position.set(x, 0, z)
          scene.add(log)
          game.woodLogs.push(log)
        } else {
          // Food item (simple sphere)
          const foodGeo = new THREE.SphereGeometry(0.4, 8, 8)
          const foodMat = new THREE.MeshLambertMaterial({ color: 0xff6b6b })
          const food = new THREE.Mesh(foodGeo, foodMat)
          food.position.set(x, 0.5, z)
          food.userData.value = 25
          food.castShadow = true
          scene.add(food)
          game.foodItems.push(food)
        }
      }

      // Spawn warthogs (only during night)
      const maxWarthogs = Math.min(3 + Math.floor(night / 10), 10)
      if (nightIntensity > 0.3 && game.warthogSpawnTimer > CONFIG.WARTHOG_SPAWN_RATE &&
          game.warthogs.length < maxWarthogs) {
        game.warthogSpawnTimer = 0

        let type = 'normal'
        if (night >= 25 && Math.random() < 0.3) type = 'boar'
        else if (night >= 10 && Math.random() < 0.4) type = 'normal'
        else if (night < 10) type = 'piglet'

        const stats = {
          piglet: { health: 20, speed: 0.08, damage: 5 },
          normal: { health: 40, speed: 0.06, damage: 15 },
          boar: { health: 80, speed: 0.04, damage: 25 },
          alpha: { health: 150, speed: 0.05, damage: 40 }
        }

        const warthog = createWarthog(type)
        const angle = Math.random() * Math.PI * 2
        const dist = 35 + Math.random() * 10
        warthog.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist)
        scene.add(warthog)

        game.warthogs.push({
          mesh: warthog,
          type,
          health: stats[type].health,
          maxHealth: stats[type].health,
          speed: stats[type].speed,
          damage: stats[type].damage,
          lastAttack: 0
        })
      }

      // Update warthogs
      const firePos = game.fire.position
      const playerPos = game.player.position
      const fireActive = fireStatus !== 'out'

      game.warthogs = game.warthogs.filter(warthog => {
        const pos = warthog.mesh.position
        const distToPlayer = pos.distanceTo(playerPos)
        const distToFire = pos.distanceTo(firePos)

        // Move toward player
        const dir = new THREE.Vector3()
        dir.subVectors(playerPos, pos).normalize()

        // Check if next position would be in fire zone
        const nextPos = pos.clone().add(dir.multiplyScalar(warthog.speed))
        const nextDistToFire = nextPos.distanceTo(firePos)

        if (fireActive && nextDistToFire < CONFIG.FIRE_RADIUS) {
          // Circle around fire
          const tangent = new THREE.Vector3(-dir.z, 0, dir.x)
          pos.add(tangent.multiplyScalar(warthog.speed * 0.5))
        } else {
          pos.add(dir.multiplyScalar(warthog.speed))
        }

        // Face player
        warthog.mesh.lookAt(playerPos.x, pos.y, playerPos.z)

        // Attack player if close and fire is out (or player outside fire)
        const playerDistToFire = playerPos.distanceTo(firePos)
        const playerSafe = fireActive && playerDistToFire < CONFIG.FIRE_RADIUS

        if (distToPlayer < 2 && !playerSafe && now - warthog.lastAttack > 1000) {
          warthog.lastAttack = now
          setPlayerHealth(hp => {
            const newHealth = Math.max(0, hp - warthog.damage)
            if (newHealth === 0) setGameState('gameover')
            return newHealth
          })
        }

        return warthog.health > 0
      })

      // Update attacks
      game.attacks = game.attacks.filter(attack => {
        attack.position.add(attack.direction.clone().multiplyScalar(0.5))
        attack.traveled += 0.5

        // Check hit on warthogs
        game.warthogs.forEach(warthog => {
          if (attack.position.distanceTo(warthog.mesh.position) < 2) {
            warthog.health -= attack.damage
            if (warthog.health <= 0) {
              scene.remove(warthog.mesh)
              setKills(k => k + 1)
              setScore(s => s + (warthog.type === 'boar' ? 30 : warthog.type === 'piglet' ? 5 : 15))

              // Drop meat
              const meatGeo = new THREE.BoxGeometry(0.5, 0.3, 0.3)
              const meatMat = new THREE.MeshLambertMaterial({ color: 0xcd5c5c })
              const meat = new THREE.Mesh(meatGeo, meatMat)
              meat.position.copy(warthog.mesh.position)
              meat.position.y = 0.3
              meat.userData.value = 35
              meat.userData.isMeat = true
              scene.add(meat)
              game.foodItems.push(meat)
            }
          }
        })

        // Remove if traveled too far
        if (attack.traveled > 10) {
          scene.remove(attack.mesh)
          return false
        }
        return true
      })

      // Collect resources
      game.woodLogs = game.woodLogs.filter(log => {
        log.position.y = 0.2 + Math.sin(now * 0.003 + log.userData.phase) * 0.2
        log.rotation.y += 0.01

        if (game.player.position.distanceTo(log.position) < 2) {
          scene.remove(log)
          setWoodCount(w => Math.min(CONFIG.MAX_WOOD, w + CONFIG.WOOD_PER_LOG))
          setScore(s => s + 1)
          return false
        }
        return true
      })

      game.foodItems = game.foodItems.filter(food => {
        food.rotation.y += 0.02

        if (game.player.position.distanceTo(food.position) < 2) {
          scene.remove(food)
          const value = food.userData.value || 20
          setHungerLevel(h => Math.min(CONFIG.MAX_HUNGER, h + value))
          if (food.userData.isMeat) {
            setPlayerHealth(hp => Math.min(CONFIG.MAX_HEALTH, hp + 10))
          }
          setScore(s => s + 1)
          return false
        }
        return true
      })

      // Heal near fire
      const playerDistToFire = playerPos.distanceTo(firePos)
      if (playerDistToFire < CONFIG.FIRE_RADIUS && fireActive && hungerLevel > 50) {
        setPlayerHealth(hp => Math.min(CONFIG.MAX_HEALTH, hp + 0.02))
      }

      renderer.render(scene, camera)
      animationId = requestAnimationFrame(gameLoop)
    }

    // Input handlers
    const handleKeyDown = (e) => {
      game.keys[e.key.toLowerCase()] = true
      if (e.key === ' ') {
        e.preventDefault()
        attack()
      }
      if (e.key === 'Shift') {
        game.isSprinting = true
      }
      if (e.key === 'Escape') {
        setGameState('paused')
      }
    }

    const handleKeyUp = (e) => {
      game.keys[e.key.toLowerCase()] = false
      if (e.key === 'Shift') {
        game.isSprinting = false
      }
    }

    const attack = () => {
      const now = Date.now()
      if (now - game.lastAttack < 400) return
      game.lastAttack = now

      // Create attack projectile
      const attackGeo = new THREE.BoxGeometry(0.4, 0.4, 0.2)
      const attackMat = new THREE.MeshBasicMaterial({ color: 0xcccccc })
      const attackMesh = new THREE.Mesh(attackGeo, attackMat)
      attackMesh.position.copy(game.player.position)
      attackMesh.position.y += 1.5

      const direction = new THREE.Vector3(
        Math.sin(game.playerFacing),
        0,
        -Math.cos(game.playerFacing)
      )

      scene.add(attackMesh)
      game.attacks.push({
        mesh: attackMesh,
        position: attackMesh.position,
        direction,
        damage: CONFIG.QUICK_ATTACK_DAMAGE,
        traveled: 0
      })

      // Animate axe swing
      const axe = game.player.userData.axe
      if (axe) {
        axe.rotation.x = -1
        setTimeout(() => { axe.rotation.x = 0 }, 200)
      }
    }

    const handleClick = () => {
      if (gameState === 'playing') attack()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    containerRef.current?.addEventListener('click', handleClick)

    animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      containerRef.current?.removeEventListener('click', handleClick)
      cleanup?.()
    }
  }, [gameState, night, stamina, fireStatus, hungerLevel, highestNight, createWarthog, createWoodLog, initGame])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && rendererRef.current && cameraRef.current) {
        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight
        rendererRef.current.setSize(width, height)
        cameraRef.current.aspect = width / height
        cameraRef.current.updateProjectionMatrix()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="fixed inset-0 bg-black">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full h-full ${gameState !== 'playing' ? 'pointer-events-none' : ''}`}
        style={{ touchAction: 'none' }}
      />

      {/* HUD Overlay */}
      {gameState === 'playing' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            {/* Left Side - Night & Score */}
            <div className="bg-black/60 rounded-xl p-3 text-white">
              <div className="text-2xl font-black text-orange-400">NIGHT {night}/99</div>
              <div className="text-lg font-bold">Score: {score.toLocaleString()}</div>
              <div className="text-sm text-gray-300">Kills: {kills}</div>
            </div>

            {/* Right Side - Resources */}
            <div className="bg-black/60 rounded-xl p-3 text-white text-right">
              {/* Health Bar */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">❤️</span>
                <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${playerHealth}%` }}
                  />
                </div>
                <span className="text-sm w-8">{Math.round(playerHealth)}</span>
              </div>

              {/* Hunger Bar */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🍖</span>
                <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${hungerLevel > 30 ? 'bg-green-500' : 'bg-orange-500'}`}
                    style={{ width: `${hungerLevel}%` }}
                  />
                </div>
                <span className="text-sm w-8">{Math.round(hungerLevel)}</span>
              </div>

              {/* Stamina Bar */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">⚡</span>
                <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${stamina}%` }}
                  />
                </div>
                <span className="text-sm w-8">{Math.round(stamina)}</span>
              </div>

              {/* Wood */}
              <div className="flex items-center gap-2">
                <span className="text-sm">🪵</span>
                <span className="font-bold text-lg">{woodCount}/{CONFIG.MAX_WOOD}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  fireStatus === 'blazing' ? 'bg-orange-500' :
                  fireStatus === 'burning' ? 'bg-yellow-500' :
                  fireStatus === 'flickering' ? 'bg-red-500 animate-pulse' :
                  'bg-gray-600'
                }`}>
                  {fireStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Night Progress Bar */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80">
            <div className="bg-black/60 rounded-full p-2">
              <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all"
                  style={{ width: `${nightProgress * 100}%` }}
                />
              </div>
              <div className="text-center text-white text-sm mt-1">
                Night {night} - {Math.round(nightProgress * 100)}%
              </div>
            </div>
          </div>

          {/* Warnings */}
          {fireStatus === 'flickering' && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-red-500 text-2xl font-black animate-pulse">
              ⚠️ LOW WOOD! ⚠️
            </div>
          )}
          {fireStatus === 'out' && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-red-600 text-3xl font-black animate-pulse">
              🔥 FIRE OUT - DANGER! 🔥
            </div>
          )}
          {hungerLevel < 20 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 text-orange-500 text-xl font-black animate-pulse">
              🍖 HUNGRY! 🍖
            </div>
          )}
        </div>
      )}

      {/* Mobile Controls */}
      {gameState === 'playing' && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-auto md:hidden">
          {/* Attack Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault()
              if (gameRef.current) {
                const now = Date.now()
                if (now - gameRef.current.lastAttack < 400) return
                gameRef.current.lastAttack = now
                // Trigger attack
              }
            }}
            className="w-20 h-20 bg-red-600/80 rounded-full flex items-center justify-center text-4xl border-4 border-red-400 active:scale-90"
          >
            ⚔️
          </button>

          {/* Joystick */}
          <div
            className="relative w-32 h-32 bg-gray-900/80 rounded-full border-4 border-gray-600"
            style={{ touchAction: 'none' }}
            onTouchStart={(e) => {
              e.preventDefault()
              handleJoystick(e.touches[0])
            }}
            onTouchMove={(e) => {
              e.preventDefault()
              handleJoystick(e.touches[0])
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              if (gameRef.current) {
                gameRef.current.keys = {}
              }
            }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-600 rounded-full" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-gray-500">▲</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-gray-500">▼</div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">◀</div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">▶</div>
          </div>
        </div>
      )}

      {/* Menu Overlay */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 bg-gradient-to-b from-orange-900/90 to-black/90 flex flex-col items-center justify-center p-4">
          <h1 className="text-5xl md:text-7xl font-black text-orange-400 mb-4 text-center drop-shadow-lg">
            99 NIGHTS
          </h1>
          <p className="text-xl md:text-2xl text-orange-200 mb-8">in the Desert</p>

          <div className="text-gray-300 mb-8 text-center text-sm md:text-base max-w-md">
            <p className="mb-2">🔥 Stay near the fire - warthogs can't enter!</p>
            <p className="mb-2">🪵 Collect wood to keep the fire burning</p>
            <p className="mb-2">🍖 Gather food to survive hunger</p>
            <p className="mb-2">⚔️ Fight warthogs with your axe</p>
            <p className="mb-4">🌙 Survive all 99 nights to win!</p>
            <p className="text-xs text-gray-400">WASD to move | SPACE/CLICK to attack | SHIFT to sprint</p>
          </div>

          <button
            onClick={startGame}
            className="bg-orange-600 hover:bg-orange-500 text-white px-10 py-4 rounded-xl font-black text-2xl transition-all hover:scale-110 mb-4"
          >
            START GAME
          </button>

          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Games
          </button>

          {highestNight > 0 && (
            <p className="text-orange-300 mt-4">Best: Night {highestNight}</p>
          )}
        </div>
      )}

      {/* Paused Overlay */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-black text-yellow-400 mb-8">PAUSED</h2>
          <button
            onClick={() => setGameState('playing')}
            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold text-xl mb-4"
          >
            Resume
          </button>
          <button
            onClick={() => setGameState('menu')}
            className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold text-xl"
          >
            Quit
          </button>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
          <h2 className="text-5xl font-black text-red-500 mb-4">GAME OVER</h2>
          <p className="text-2xl text-white mb-2">You survived to Night {night}</p>
          <p className="text-xl text-gray-400 mb-2">Score: {score.toLocaleString()}</p>
          <p className="text-lg text-gray-400 mb-6">Kills: {kills}</p>
          {night > highestNight && (
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
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/90 to-orange-600/90 flex flex-col items-center justify-center">
          <h2 className="text-6xl font-black text-white mb-4">🏆 VICTORY! 🏆</h2>
          <p className="text-3xl text-white mb-2">You survived all 99 nights!</p>
          <p className="text-4xl font-bold text-white mb-4">Score: {score.toLocaleString()}</p>
          <p className="text-xl text-white/80 mb-8">Total Kills: {kills}</p>
          <button
            onClick={startGame}
            className="bg-white text-orange-600 px-8 py-4 rounded-xl font-black text-2xl transition-all hover:scale-110"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  )
}

// Helper function for joystick
function handleJoystick(touch) {
  // This would need proper implementation with refs
  // For now it's a placeholder
}
