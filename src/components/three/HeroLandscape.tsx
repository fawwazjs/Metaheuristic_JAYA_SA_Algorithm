import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import { LANDSCAPES, type Landscape } from '../../lib/algorithms/landscapes'
import {
  EmberField as Embers,
  SceneCamera,
  SceneCanvas,
  SceneLights,
  Terrain,
  terrainHeightAt,
  GlSceneFallback,
  useWebGLSupport,
} from './scene'

export function HeroLandscape({ className = '' }: { className?: string }) {
  const supported = useWebGLSupport()
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(1)
  const [autoRotate, setAutoRotate] = useState(!reduce)
  const [entered, setEntered] = useState(false)
  const [pick, setPick] = useState<[number, number] | null>(null)
  const landscape = LANDSCAPES[index]
  const controlsRef = useRef<{ reset: () => void; target: THREE.Vector3; object: THREE.Camera } | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 350)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (reduce) setAutoRotate(false)
  }, [reduce])

  useEffect(() => {
    if (reduce) return
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % LANDSCAPES.length)
    }, 14000)
    return () => window.clearInterval(timer)
  }, [reduce])

  const resetCamera = () => {
    controlsRef.current?.reset()
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${entered ? 'opacity-100' : 'opacity-0'}`}
      >
        {supported ? (
          <SceneCanvas camera={{ position: [6.8, 6.4, 8], fov: 42 }} dpr={[1, 1.7]}>
            <color attach="background" args={['#1b1008']} />
            <SceneLights />
            <Terrain
              landscape={landscape}
              segments={typeof window !== 'undefined' && window.innerWidth < 768 ? 64 : 128}
              size={15}
              height={3.1}
              onPick={(x, y) => setPick([x, y])}
            />
            <RollingOrb landscape={landscape} picked={pick} />
            <Embers count={48} radius={9} />
            <SceneCamera
              controlsRef={controlsRef}
              autoRotate={autoRotate}
              autoRotateSpeed={0.28}
              position={[6.8, 6.4, 8.2]}
              target={[0, 0.6, 0]}
              minDistance={8}
              maxDistance={24}
            />
          </SceneCanvas>
        ) : (
          <GlSceneFallback label="Lanskap fungsi uji — Rastrigin, Himmelblau, dan Ackley" />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_30%,rgba(31,18,8,.55)_100%)]" />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-sm border border-gold/25 bg-leather-900/70 px-3 py-2 backdrop-blur-sm">
          <span className="mr-1 hidden font-heading text-[9px] uppercase tracking-[0.2em] text-parchment-300/70 sm:inline">
            Fungsi: <span className="text-gold-light">{landscape.name}</span>
          </span>
          {LANDSCAPES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Tampilkan fungsi ${item.name}`}
              aria-pressed={i === index}
              className="group flex h-8 w-6 items-center justify-center"
            >
              <span
                className={`block h-2.5 w-2.5 rounded-full border transition-all ${
                  i === index
                    ? 'border-gold-light bg-gold-light'
                    : 'border-parchment-300/40 bg-transparent group-hover:bg-parchment-300/40'
                }`}
              />
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-parchment-300/20" aria-hidden="true" />
          <button
            type="button"
            onClick={resetCamera}
            className="min-h-[32px] px-2 font-heading text-[8px] uppercase tracking-[0.18em] text-parchment-200/80 transition-colors hover:text-gold-light"
          >
            Reset Kamera
          </button>
          <button
            type="button"
            onClick={() => setAutoRotate((value) => !value)}
            aria-pressed={autoRotate}
            className="min-h-[32px] px-2 font-heading text-[8px] uppercase tracking-[0.18em] text-parchment-200/80 transition-colors hover:text-gold-light"
          >
            {autoRotate ? 'Hentikan Putar' : 'Putar Otomatis'}
          </button>
        </div>
        <p className="rounded-sm bg-leather-900/45 px-3 py-1 text-center font-body text-[11px] italic text-parchment-200/65 backdrop-blur-[2px]">
          Seret untuk memutar · Scroll / cubit untuk zoom · Klik lanskap untuk memindahkan bola
        </p>
      </div>
    </div>
  )
}

function RollingOrb({ landscape, picked }: { landscape: Landscape; picked: [number, number] | null }) {
  const orbRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const target = useRef<[number, number]>([landscape.globalPoint[0] * 0.6, landscape.globalPoint[1] * 0.6 - 0.8])
  const current = useRef<[number, number]>([...target.current])
  const velocity = useRef<[number, number]>([0.01, 0.008])

  useEffect(() => {
    if (picked) target.current = [picked[0], picked[1]]
  }, [picked])

  useFrame((state) => {
    const orb = orbRef.current
    if (!orb) return
    const time = state.clock.elapsedTime
    const [tx, ty] = target.current
    const [cx, cy] = current.current

    // Gradient descent lembut dengan sedikit noise — ilustrasi dekoratif untuk SA.
    const h = 0.06
    const dx = (landscape.fn(cx + h, cy) - landscape.fn(cx - h, cy)) / (2 * h)
    const dy = (landscape.fn(cx, cy + h) - landscape.fn(cx, cy - h)) / (2 * h)
    velocity.current[0] += (-dx * 0.00035 + (tx - cx) * 0.0009) + Math.sin(time * 1.7) * 0.00012
    velocity.current[1] += (-dy * 0.00035 + (ty - cy) * 0.0009) + Math.cos(time * 1.3) * 0.00012
    velocity.current[0] *= 0.975
    velocity.current[1] *= 0.975
    current.current[0] = Math.max(
      landscape.domain[0][0],
      Math.min(landscape.domain[0][1], cx + velocity.current[0]),
    )
    current.current[1] = Math.max(
      landscape.domain[1][0],
      Math.min(landscape.domain[1][1], cy + velocity.current[1]),
    )

    const [[x0, x1], [y0, y1]] = landscape.domain
    const u = (current.current[0] - x0) / (x1 - x0)
    const v = (current.current[1] - y0) / (y1 - y0)
    const wx = (u - 0.5) * 15
    const wz = (v - 0.5) * 15
    const wy = terrainHeightAt(landscape, current.current[0], current.current[1], 3.1) + 0.12
    orb.position.set(wx, wy, wz)
    orb.rotation.x += 0.02
    orb.rotation.z += 0.013
    if (haloRef.current) {
      haloRef.current.position.set(wx, wy, wz)
      const pulse = 1 + Math.sin(time * 2.2) * 0.08
      haloRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group>
      <mesh ref={orbRef} castShadow>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial
          color="#f7dfa0"
          emissive="#e3b64f"
          emissiveIntensity={2.4}
          roughness={0.28}
          metalness={0.65}
        />
        <pointLight color="#f0c56a" intensity={2.2} distance={2.4} decay={2} />
      </mesh>
      <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.26, 32]} />
        <meshBasicMaterial color="#e3b64f" transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}