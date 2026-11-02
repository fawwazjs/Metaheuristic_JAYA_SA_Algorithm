import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import { formatNumber } from '../../lib/algorithms/rng'
import {
  SceneCamera,
  SceneCanvas,
  SceneLights,
  GlSceneFallback,
  useWebGLSupport,
} from './scene'

const LATTICE = 6
const ATOM_COUNT = LATTICE * LATTICE * 3

function lerpColor(a: THREE.Color, b: THREE.Color, t: number) {
  return a.clone().lerp(b, Math.min(1, Math.max(0, t)))
}

/** Warna logam berdasarkan temperatur relatif 0..1. */
export function forgeColor(ratio: number): THREE.Color {
  const stops: Array<[number, string]> = [
    [0, '#5e6a73'],
    [0.14, '#7a3a22'],
    [0.34, '#c8561e'],
    [0.6, '#e3b64f'],
    [0.82, '#ffe6a8'],
    [1, '#fffbe8'],
  ]
  const t = Math.min(1, Math.max(0, ratio))
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1]
      const [t1, c1] = stops[i]
      const local = (t - t0) / Math.max(1e-6, t1 - t0)
      return lerpColor(new THREE.Color(c0), new THREE.Color(c1), local * local * (3 - 2 * local))
    }
  }
  return new THREE.Color(stops[stops.length - 1][1])
}

type CoolingMode = 'slow' | 'fast' | 'manual'

export function AnnealingForge() {
  const supported = useWebGLSupport()
  const reduce = useReducedMotion()
  const [mode, setMode] = useState<CoolingMode>('slow')
  const [manualT, setManualT] = useState(1)
  const [stats, setStats] = useState({ T: 1, energy: 0, order: 0, hammer: 0 })
  const temperatureRef = useRef(1)
  const orderRef = useRef(0)
  const [autoRotate, setAutoRotate] = useState(!reduce)
  const controlsRef = useRef<{ reset: () => void } | null>(null)

  const reset = () => {
    temperatureRef.current = 1
    orderRef.current = 0
    setManualT(1)
    setStats({ T: 1, energy: 0, order: 0, hammer: 0 })
  }

  const energy = Math.max(0, (1 - stats.order) ** 2 * 24)

  return (
    <div className="sim-shell overflow-hidden border border-gold/25">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/20 px-3 py-2.5 sm:px-4">
        <div>
          <p className="font-heading text-[9px] uppercase tracking-[0.22em] text-[#f0a06a]/85">Visualisasi 3D Pendinginan Logam</p>
          <h3 className="font-heading text-base font-semibold text-parchment-50">Kisi Atom dan Temperatur</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-sm border border-ember/35 bg-black/25 px-2 py-1 font-mono text-[10px] text-[#f0a06a]">
            T = {formatNumber(stats.T, 3)}
          </span>
          <span className="rounded-sm border border-gold/25 bg-black/25 px-2 py-1 font-mono text-[10px] text-gold-light/85">
            Energi ≈ {formatNumber(energy, 2)}
          </span>
          <span className={`rounded-sm border px-2 py-1 font-mono text-[10px] ${stats.order > 0.9 ? 'border-[#6f8f63]/50 text-[#a9c79b]' : 'border-parchment-300/25 text-parchment-200/70'}`}>
            Keteraturan {Math.round(stats.order * 100)}%
          </span>
        </div>
      </div>

      <div className="relative h-[300px] sm:h-[380px] lg:h-[420px]">
        {supported ? (
          <SceneCanvas camera={{ position: [4.6, 3.4, 5.4], fov: 42 }} dpr={[1, 1.6]}>
            <color attach="background" args={['#171008']} />
            <SceneLights intensity={0.85} />
            <ForgeScene
              temperatureRef={temperatureRef}
              orderRef={orderRef}
              mode={mode}
              manualT={manualT}
              reduce={Boolean(reduce)}
              onStats={setStats}
            />
            <SceneCamera
              controlsRef={controlsRef}
              autoRotate={autoRotate}
              autoRotateSpeed={0.5}
              target={[0, 1.1, 0]}
              minDistance={3.4}
              maxDistance={11}
              maxPolarAngle={Math.PI * 0.48}
            />
          </SceneCanvas>
        ) : (
          <GlSceneFallback label="Batang logam yang dipanaskan dan kisi kristal" />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-2">
          <span className="rounded-sm border border-gold/25 bg-leather-900/70 px-2 py-1 font-body text-[10px] italic text-parchment-200/75">
            Seret untuk memutar · Scroll untuk zoom
          </span>
        </div>
      </div>

      <div className="space-y-2.5 border-t border-gold/20 p-3 sm:p-4">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className="btn-ritual !min-h-[40px] !px-3 !text-[9px]"
            data-active={mode === 'slow'}
            onClick={() => {
              setMode('slow')
              reset()
            }}
          >
            Pendinginan lambat (α = 0,998)
          </button>
          <button
            type="button"
            className="btn-ritual !min-h-[40px] !px-3 !text-[9px]"
            onClick={() => {
              setMode('fast')
              reset()
            }}
          >
            Pendinginan cepat
          </button>
          <button
            type="button"
            className="btn-ritual btn-ritual-light !min-h-[40px] !px-3 !text-[9px]"
            onClick={() => {
              setMode('manual')
              setManualT(temperatureRef.current)
            }}
          >
            Atur manual
          </button>
          <button
            type="button"
            className="btn-ritual btn-ritual-light !min-h-[40px] !px-3 !text-[9px]"
            onClick={() => setAutoRotate((value) => !value)}
            aria-pressed={autoRotate}
          >
            {autoRotate ? 'Hentikan putar' : 'Putar otomatis'}
          </button>
          <button
            type="button"
            className="btn-ritual btn-ritual-light !min-h-[40px] !px-3 !text-[9px]"
            onClick={() => controlsRef.current?.reset()}
          >
            Reset kamera
          </button>
        </div>

        {mode === 'manual' ? (
          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="label-cinzel !text-parchment-300">Temperatur manual</span>
              <output className="value-mono !text-gold-light">{formatNumber(manualT, 3)}</output>
            </span>
            <input
              type="range"
              className="lever"
              min={0.01}
              max={1}
              step={0.005}
              value={manualT}
              onChange={(event) => {
                const value = Number(event.target.value)
                setManualT(value)
                temperatureRef.current = value
              }}
              aria-label="Temperatur manual"
            />
          </label>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full border border-gold/25 bg-black/30">
              <div
                className="h-full transition-[width] duration-200"
                style={{
                  width: `${temperatureRef.current * 100}%`,
                  background: `linear-gradient(90deg, #5e6a73, #c8561e, #e3b64f, #fffbe8)`,
                }}
              />
            </div>
            <span className="font-heading text-[8px] uppercase tracking-wider text-parchment-300/60">
              {mode === 'slow' ? 'T0 = 1 · α = 0,998' : 'pendinginan cepat'}
            </span>
          </div>
        )}

        <p className="font-body text-[12px] leading-snug text-parchment-300/70">
          <span className="font-semibold text-gold-light/85">Catatan:</span> pendinginan lambat memberi atom waktu
          menata diri sehingga kisi lebih rapi dan energi rendah. Pendinginan cepat mengunci cacat — analogi SA yang
          berhenti terlalu cepat dan terjebak pada optimum lokal. Ini hanya ilustrasi visual.
        </p>
      </div>
    </div>
  )
}

function ForgeScene({
  temperatureRef,
  orderRef,
  mode,
  manualT,
  reduce,
  onStats,
}: {
  temperatureRef: React.MutableRefObject<number>
  orderRef: React.MutableRefObject<number>
  mode: CoolingMode
  manualT: number
  reduce: boolean
  onStats: (stats: { T: number; energy: number; order: number; hammer: number }) => void
}) {
  const barRef = useRef<THREE.Mesh>(null)
  const barMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const hammerRef = useRef<THREE.Group>(null)
  const atomsRef = useRef<THREE.InstancedMesh>(null)
  const sparkRef = useRef<THREE.Points>(null)
  const tempColor = useRef(new THREE.Color('#fffbe8'))
  const lastUpdate = useRef(0)
  const hammerSwing = useRef(0)

  const atomData = useMemo(() => {
    const positions: THREE.Vector3[] = []
    const targets: THREE.Vector3[] = []
    const phases: number[] = []
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < LATTICE; i++) {
        for (let j = 0; j < LATTICE; j++) {
          const x = (i - (LATTICE - 1) / 2) * 0.19
          const y = 0.22 + layer * 0.19
          const z = (j - (LATTICE - 1) / 2) * 0.19
          targets.push(new THREE.Vector3(x, y, z))
          positions.push(new THREE.Vector3(x, y, z))
          phases.push(Math.random() * Math.PI * 2)
        }
      }
    }
    return { targets, positions, phases }
  }, [])

  const sparkPositions = useMemo(() => {
    const array = new Float32Array(80 * 3)
    for (let i = 0; i < 80; i++) {
      array[i * 3] = (Math.random() - 0.5) * 1.2
      array[i * 3 + 1] = Math.random() * 1.6
      array[i * 3 + 2] = (Math.random() - 0.5) * 0.9
    }
    return array
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    // Skedul pendinginan
    if (mode === 'slow') {
      temperatureRef.current = Math.max(0.01, temperatureRef.current * Math.pow(0.998, delta * 60 * 0.09))
      orderRef.current = Math.min(1, orderRef.current + delta * 0.09)
    } else if (mode === 'fast') {
      temperatureRef.current = Math.max(0.01, temperatureRef.current * Math.pow(0.88, delta * 60 * 0.25))
      orderRef.current = Math.min(0.42, orderRef.current + delta * 0.03)
    } else {
      temperatureRef.current = manualT
      orderRef.current = Math.min(1, Math.max(0, 1 - manualT * 0.92))
    }

    const ratio = temperatureRef.current
    tempColor.current.copy(forgeColor(ratio))
    if (barMaterial.current) {
      barMaterial.current.emissive.copy(tempColor.current)
      barMaterial.current.emissiveIntensity = 0.35 + ratio * 2.6
      barMaterial.current.color.copy(lerpColor(new THREE.Color('#3a2a1f'), tempColor.current, 0.55))
    }

    // Kisi atom
    const atoms = atomsRef.current
    if (atoms) {
      const amplitude = reduce ? 0.012 : 0.012 + ratio * 0.075
      const order = orderRef.current
      for (let i = 0; i < ATOM_COUNT; i++) {
        const target = atomData.targets[i]
        const phase = atomData.phases[i]
        const jitterX = Math.sin(time * (5 + phase) + phase) * amplitude
        const jitterY = Math.cos(time * (4 + phase * 0.7) + phase) * amplitude
        const jitterZ = Math.sin(time * (6 + phase * 0.4)) * amplitude
        const distortionX = Math.sin(target.y * 8 + phase) * (1 - order) * 0.16
        const distortionZ = Math.cos(target.x * 9 + phase) * (1 - order) * 0.16
        dummy.position.set(target.x + jitterX + distortionX, target.y + jitterY, target.z + jitterZ + distortionZ)
        const scale = 0.05
        dummy.scale.setScalar(scale)
        dummy.updateMatrix()
        atoms.setMatrixAt(i, dummy.matrix)
      }
      atoms.instanceMatrix.needsUpdate = true
      const material = atoms.material as THREE.MeshStandardMaterial
      material.emissive.copy(tempColor.current)
      material.emissiveIntensity = 0.3 + ratio * 1.8
    }

    // Palu: ayun lembut, pukul tiap ~2.2 dtk
    if (hammerRef.current) {
      hammerSwing.current = (hammerSwing.current + delta * 0.42) % 1
      const swing = Math.sin(hammerSwing.current * Math.PI * 2) * 0.5 + 0.5
      hammerRef.current.rotation.z = -0.9 + swing * 0.9
    }

    if (sparkRef.current) {
      const positions = sparkRef.current.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < 80; i++) {
        let y = positions.getY(i) + delta * (0.7 + (i % 5) * 0.18)
        if (y > 2.1) y = 0.6
        positions.setY(i, y)
      }
      positions.needsUpdate = true
      const material = sparkRef.current.material as THREE.PointsMaterial
      material.opacity = 0.25 + ratio * 0.65
    }

    if (time - lastUpdate.current > 0.25) {
      lastUpdate.current = time
      onStats({
        T: ratio,
        energy: Number(((1 - orderRef.current) ** 2 * 24).toFixed(2)),
        order: orderRef.current,
        hammer: hammerSwing.current,
      })
    }
  })

  return (
    <group>
      {/* Landasan */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.3, 0.62]} />
        <meshStandardMaterial color="#4a4f55" roughness={0.72} metalness={0.45} />
      </mesh>
      <mesh position={[0.32, 0.52, 0]} castShadow>
        <coneGeometry args={[0.22, 0.4, 4]} />
        <meshStandardMaterial color="#3d4247" roughness={0.7} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.6, 0.44, 0.44]} />
        <meshStandardMaterial color="#2e3237" roughness={0.85} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.0, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.6, 0.16, 48]} />
        <meshStandardMaterial color="#241a12" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.18, 1.24, 64]} />
        <meshBasicMaterial color="#b8862b" transparent opacity={0.32} side={THREE.DoubleSide} />
      </mesh>

      {/* Batang logam */}
      <mesh ref={barRef} position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[1.1, 0.18, 0.24]} />
        <meshStandardMaterial ref={barMaterial} color="#5a3a24" roughness={0.42} metalness={0.82} emissive="#e3b64f" />
      </mesh>

      {/* Kisi atom di sekitar batang */}
      <instancedMesh ref={atomsRef} args={[undefined, undefined, ATOM_COUNT]} castShadow>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color="#f0d79a" emissive="#e3b64f" emissiveIntensity={1.4} roughness={0.4} />
      </instancedMesh>

      {/* Palu */}
      <group ref={hammerRef} position={[0.62, 0.62, 0.42]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 1.3, 12]} />
          <meshStandardMaterial color="#6b4423" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.3, 0]} castShadow>
          <boxGeometry args={[0.5, 0.22, 0.22]} />
          <meshStandardMaterial color="#5e6a73" roughness={0.55} metalness={0.7} />
        </mesh>
      </group>

      {/* Percikan */}
      <points ref={sparkRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#ffcf7a"
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <pointLight position={[0, 1.1, 0]} color="#ffb35c" intensity={6} distance={6} decay={2} />
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshBasicMaterial color="#c8561e" transparent opacity={0.16} />
      </mesh>
    </group>
  )
}