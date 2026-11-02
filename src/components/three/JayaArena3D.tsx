import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import { getLandscape } from '../../lib/algorithms/landscapes'
import { formatNumber } from '../../lib/algorithms/rng'
import { useJayaStore } from '../../store/jayaStore'
import {
  EmberField,
  GlSceneFallback,
  SceneCamera,
  SceneCanvas,
  SceneLights,
  Terrain,
  terrainHeightAt,
  useWebGLSupport,
  domainFromWorld,
  worldFromDomain,
} from './scene'

const SIZE = 10
const HEIGHT = 1.7

export function JayaArena3D() {
  const supported = useWebGLSupport()
  const reduce = useReducedMotion()
  const landscapeId = useJayaStore((s) => s.landscapeId)
  const snapshot = useJayaStore((s) => s.snapshot)
  const running = useJayaStore((s) => s.running)
  const [autoRotate, setAutoRotate] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)
  const controlsRef = useRef<{ reset: () => void } | null>(null)
  const landscape = getLandscape(landscapeId)

  useEffect(() => {
    if (!useJayaStore.getState().snapshot) useJayaStore.getState().init()
  }, [])

  useEffect(() => {
    if (reduce) setAutoRotate(false)
  }, [reduce])

  const toggle = useJayaStore((s) => s.toggleRunning)
  const stepIteration = useJayaStore((s) => s.stepIteration)
  const reset = useJayaStore((s) => s.reset)

  const selectedUpdate = snapshot?.updates.find((u) => u.candidate === selected) ?? null

  return (
    <div className="sim-shell overflow-hidden border border-gold/25">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/20 px-3 py-2.5 sm:px-4">
        <div>
          <p className="font-heading text-[9px] uppercase tracking-[0.22em] text-[#a9c79b]/85">Visualisasi 3D Populasi JAYA</p>
          <h3 className="font-heading text-base font-semibold text-parchment-50">Lanskap Fungsi dan Kandidat Solusi</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-sm border border-[#6f8f63]/40 bg-black/25 px-2 py-1 font-mono text-[10px] text-[#a9c79b]">
            Iter {snapshot?.iteration ?? 1}
          </span>
          <span className="rounded-sm border border-gold/25 bg-black/25 px-2 py-1 font-mono text-[10px] text-gold-light/85">
            best {formatNumber(snapshot?.bestFitness ?? 0, 3)}
          </span>
          <span className="rounded-sm border border-parchment-300/20 bg-black/25 px-2 py-1 font-mono text-[10px] text-parchment-200/70">
            {snapshot?.positions.length ?? 0} kandidat
          </span>
        </div>
      </div>

      <div className="relative h-[320px] sm:h-[400px] lg:h-[440px]">
        {supported ? (
          <SceneCanvas camera={{ position: [8.6, 7.4, 9.6], fov: 42 }} dpr={[1, 1.65]}>
            <color attach="background" args={['#1b1008']} />
            <SceneLights intensity={1} />
            <Terrain landscape={landscape} segments={96} size={SIZE} height={HEIGHT} />
            <ArenaPieces
              landscapeId={landscapeId}
              onSelect={setSelected}
              selected={selected}
              reduce={Boolean(reduce)}
            />
            <EmberField count={40} radius={6.5} />
            <SceneCamera
              controlsRef={controlsRef}
              autoRotate={autoRotate && !running}
              autoRotateSpeed={0.4}
              target={[0, 0.7, 0]}
              minDistance={6}
              maxDistance={20}
            />
          </SceneCanvas>
        ) : (
          <GlSceneFallback label="Visualisasi 3D populasi JAYA — kandidat bergerak menuju P_best dan menjauhi P_worst" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-2">
          <span className="rounded-sm border border-gold/25 bg-leather-900/70 px-2 py-1 font-body text-[10px] italic text-parchment-200/75">
            Seret untuk memutar · Scroll untuk zoom · Klik kandidat untuk memilih
          </span>
        </div>
      </div>

      <div className="grid gap-2 border-t border-gold/20 p-3 sm:grid-cols-[1fr_auto] sm:items-start sm:p-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className="btn-ritual !min-h-[38px] !px-3 !text-[9px]" onClick={toggle} aria-label={running ? 'Jeda simulasi 3D' : 'Mainkan simulasi 3D'}>
              {running ? 'Jeda' : 'Mainkan'}
            </button>
            <button type="button" className="btn-ritual !min-h-[38px] !px-3 !text-[9px]" onClick={stepIteration} aria-label="Satu iterasi simulasi 3D">
              Satu iterasi
            </button>
            <button type="button" className="btn-ritual btn-ritual-light !min-h-[38px] !px-3 !text-[9px]" onClick={reset} aria-label="Reset simulasi 3D">
              Reset
            </button>
            <button type="button" className="btn-ritual btn-ritual-light !min-h-[38px] !px-3 !text-[9px]" onClick={() => setAutoRotate((v) => !v)} aria-pressed={autoRotate}>
              {autoRotate ? 'Hentikan putar' : 'Putar otomatis'}
            </button>
            <button type="button" className="btn-ritual btn-ritual-light !min-h-[38px] !px-3 !text-[9px]" onClick={() => controlsRef.current?.reset()}>
              Reset kamera
            </button>
          </div>
          {selected !== null && snapshot ? (
            <div className="border border-gold/20 bg-black/25 p-2 font-mono text-[10px] leading-relaxed text-parchment-200/80">
              <span className="text-gold-light">Kandidat #{selected + 1}</span>{' '}
              X = ({formatNumber(snapshot.positions[selected]?.[0] ?? 0, 2)},{' '}
              {formatNumber(snapshot.positions[selected]?.[1] ?? 0, 2)}) · F ={' '}
              {formatNumber(snapshot.fitness[selected] ?? 0, 3)}
              {selectedUpdate && (
                <>
                  <br />
                  r1 = {formatNumber(selectedUpdate.r1[0], 2)} · r2 = {formatNumber(selectedUpdate.r2[0], 2)} → X′ = (
                  {formatNumber(selectedUpdate.proposed[0], 2)}, {formatNumber(selectedUpdate.proposed[1], 2)})
                </>
              )}
            </div>
          ) : (
            <p className="font-body text-[11px] italic text-parchment-300/60">
              Kontrol terhubung dengan simulator 2D: mengubah populasi atau lanskap pada bagian Algoritma JAYA juga
              mengubah visualisasi ini.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ArenaPieces({
  landscapeId,
  selected,
  onSelect,
  reduce,
}: {
  landscapeId: string
  selected: number | null
  onSelect: (index: number | null) => void
  reduce: boolean
}) {
  const landscape = getLandscape(landscapeId)
  const snapshot = useJayaStore((s) => s.snapshot)
  const groupRef = useRef<THREE.Group>(null)
  const bestRef = useRef<THREE.Group>(null)
  const worstRef = useRef<THREE.Group>(null)
  const dispRef = useRef<Array<[number, number]>>([])
  const arrowGroup = useRef<THREE.Group>(null)
  const updateAge = useRef(0)

  const pieceGeometry = useMemo(() => {
    const body = new THREE.ConeGeometry(0.075, 0.22, 8)
    body.translate(0, 0.11, 0)
    return body
  }, [])

  useEffect(() => () => pieceGeometry.dispose(), [pieceGeometry])

  useEffect(() => {
    dispRef.current = []
    updateAge.current = 0
  }, [landscapeId])

  useFrame((state, delta) => {
    const snap = useJayaStore.getState().snapshot
    if (!snap || !groupRef.current) return
    const time = state.clock.elapsedTime

    if (dispRef.current.length !== snap.positions.length) {
      dispRef.current = snap.positions.map((p) => [p[0], p[1]] as [number, number])
    }

    const easing = reduce ? 1 : Math.min(1, delta * 5.5)
    snap.positions.forEach((position, index) => {
      const display = dispRef.current[index]
      display[0] += (position[0] - display[0]) * easing
      display[1] += (position[1] - display[1]) * easing
      const [wx, wz] = worldFromDomain(landscape, display[0], display[1], SIZE)
      const wy = terrainHeightAt(landscape, display[0], display[1], HEIGHT)
      const piece = groupRef.current?.children[index] as THREE.Group | undefined
      if (piece) {
        piece.position.set(wx, wy + (index === snap.bestIndex ? 0.06 : 0), wz)
        piece.rotation.y = Math.sin(time * 0.8 + index) * 0.2
      }
    })

    if (bestRef.current) {
      const [wx, wz] = worldFromDomain(landscape, snap.best[0], snap.best[1], SIZE)
      const wy = terrainHeightAt(landscape, snap.best[0], snap.best[1], HEIGHT)
      bestRef.current.position.set(wx, wy, wz)
      bestRef.current.rotation.y = time * 0.5
    }
    if (worstRef.current) {
      const [wx, wz] = worldFromDomain(landscape, snap.worst[0], snap.worst[1], SIZE)
      const wy = terrainHeightAt(landscape, snap.worst[0], snap.worst[1], HEIGHT)
      worstRef.current.position.set(wx, wy, wz)
      const pulse = 1 + Math.sin(time * 3) * 0.08
      worstRef.current.scale.setScalar(pulse)
    }

    // Panah pembaruan singkat
    if (arrowGroup.current) {
      updateAge.current += delta
      const show = snap.updates.length > 0 && updateAge.current < 1.6 && (snap.phase === 'update' || snap.phase === 'select')
      arrowGroup.current.visible = show
      if (show) {
        arrowGroup.current.children.forEach((child, index) => {
          const update = snap.updates[index]
          if (!update) return
          const [fx, fz] = worldFromDomain(landscape, update.from[0], update.from[1], SIZE)
          const [bx, bz] = worldFromDomain(landscape, update.proposed[0], update.proposed[1], SIZE)
          const fy = terrainHeightAt(landscape, update.from[0], update.from[1], HEIGHT) + 0.1
          const by = terrainHeightAt(landscape, update.proposed[0], update.proposed[1], HEIGHT) + 0.1
          const dir = new THREE.Vector3(bx - fx, by - fy, bz - fz)
          const length = dir.length()
          if (length < 0.02) return
          child.position.set((fx + bx) / 2, (fy + by) / 2, (fz + bz) / 2)
          child.scale.set(1, length, 1)
          child.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            dir.clone().normalize(),
          )
        })
      }
    }
  })

  if (!snapshot) return null

  return (
    <group>
      <group ref={groupRef}>
        {snapshot.positions.map((_, index) => (
          <group
            key={index}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(index)
            }}
          >
            <mesh geometry={pieceGeometry} castShadow>
              <meshStandardMaterial
                color={index === snapshot.bestIndex ? '#e3b64f' : index === snapshot.worstIndex ? '#5a1a1a' : '#5c7a52'}
                roughness={0.55}
                metalness={index === snapshot.bestIndex ? 0.75 : 0.2}
                emissive={index === snapshot.bestIndex ? '#8a5a2b' : '#000000'}
                emissiveIntensity={index === snapshot.bestIndex ? 0.6 : 0}
              />
            </mesh>
            <mesh position={[0, 0.245, 0]} castShadow>
              <sphereGeometry args={[0.058, 10, 10]} />
              <meshStandardMaterial
                color={index === snapshot.bestIndex ? '#f7e2a8' : index === snapshot.worstIndex ? '#7a1e1e' : '#43603b'}
                roughness={0.5}
              />
            </mesh>
            {selected === index && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
                <ringGeometry args={[0.11, 0.14, 24]} />
                <meshBasicMaterial color="#e3b64f" transparent opacity={0.85} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        ))}
      </group>

      {/* P_best: penanda solusi terbaik + pilar cahaya */}
      <group ref={bestRef}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <coneGeometry args={[0.1, 0.3, 8]} />
          <meshStandardMaterial color="#e3b64f" metalness={0.85} roughness={0.3} emissive="#8a5a2b" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0, 0.47, 0]} castShadow>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#fbf4e4" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.56, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.075, 0.09, 4]} />
          <meshStandardMaterial color="#f0d79a" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.06, 0.14, 1.5, 16, 1, true]} />
          <meshBasicMaterial color="#e3b64f" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <pointLight position={[0, 0.5, 0]} color="#f0c56a" intensity={1.6} distance={2.6} decay={2} />
      </group>

      {/* P_worst: kandidat terburuk dengan cincin merah */}
      <group ref={worstRef}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <coneGeometry args={[0.085, 0.24, 8]} />
          <meshStandardMaterial color="#43130f" roughness={0.75} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.13, 0.17, 24]} />
          <meshBasicMaterial color="#a8322a" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <group ref={arrowGroup} visible={false}>
        {snapshot.updates.map((update) => (
          <mesh key={update.candidate}>
            <cylinderGeometry args={[0.012, 0.012, 1, 6]} />
            <meshBasicMaterial color="#b8862b" transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Pilih titik lanskap 3D → domain. Dipakai bila pengguna ingin menaruh kandidat baru. */
export function pickDomain(landscapeId: string, wx: number, wz: number) {
  return domainFromWorld(getLandscape(landscapeId), wx, wz, SIZE)
}