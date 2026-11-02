import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  heatColor,
  normalizeCost,
  normalizedHeight,
  type Landscape,
} from '../../lib/algorithms/landscapes'

/* ------------------------------------------------------------------ */
/* WebGL capability                                                    */
/* ------------------------------------------------------------------ */

let webglCache: boolean | null = null

export function supportsWebGL(): boolean {
  if (webglCache !== null) return webglCache
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    webglCache = Boolean(gl)
    if (gl && 'getExtension' in gl) {
      const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')
      lose?.loseContext()
    }
  } catch {
    webglCache = false
  }
  return webglCache
}

export function useWebGLSupport(): boolean {
  const [supported, setSupported] = useState(true)
  useEffect(() => {
    setSupported(supportsWebGL())
  }, [])
  return supported
}

/* ------------------------------------------------------------------ */
/* Terrain geometry                                                    */
/* ------------------------------------------------------------------ */

export interface TerrainGeometryOptions {
  segments: number
  size?: number
  height?: number
}

export function buildTerrainGeometry(
  landscape: Landscape,
  { segments, size = 10, height = 2.4 }: TerrainGeometryOptions,
): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
  geometry.rotateX(-Math.PI / 2)
  const position = geometry.attributes.position as THREE.BufferAttribute
  const count = position.count
  const colors = new Float32Array(count * 3)
  const heights = new Float32Array(count)
  const [[x0, x1], [y0, y1]] = landscape.domain

  for (let i = 0; i < count; i++) {
    const x = position.getX(i)
    const z = position.getZ(i)
    const u = (x + size / 2) / size
    const v = (z + size / 2) / size
    const wx = x0 + u * (x1 - x0)
    const wy = y0 + v * (y1 - y0)
    const cost = landscape.fn(wx, wy)
    const normalized = normalizedHeight(landscape, cost)
    position.setY(i, normalized * height)
    heights[i] = normalized
    const [r, g, b] = heatColor(normalizeCost(cost, landscape.maxForColor))
    colors[i * 3] = r / 255
    colors[i * 3 + 1] = g / 255
    colors[i * 3 + 2] = b / 255
  }

  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

const TERRAIN_VERTEX = /* glsl */ `
  attribute vec3 aColor;
  attribute float aHeight;
  varying vec3 vColor;
  varying float vHeight;
  varying vec3 vNormalW;
  varying float vDepth;
  void main() {
    vColor = aColor;
    vHeight = aHeight;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    vNormalW = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`

const TERRAIN_FRAGMENT = /* glsl */ `
  uniform vec3 uFogColor;
  uniform vec3 uLineColor;
  uniform float uContour;
  uniform float uReveal;
  uniform float uGlow;
  varying vec3 vColor;
  varying float vHeight;
  varying vec3 vNormalW;
  varying float vDepth;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 L = normalize(vec3(0.38, 0.92, 0.28));
    float diff = clamp(dot(N, L), 0.0, 1.0);
    float rim = pow(1.0 - clamp(N.y, 0.0, 1.0), 2.4);

    // Kontur tipis seperti garis tinta.
    float band = fract(vHeight * uContour);
    float line = smoothstep(0.94, 0.995, band) * smoothstep(0.02, 0.10, vHeight);

    // Palet sepia gelap: krem hanya di puncak, cokelat tua di lembah.
    vec3 shadowTint = vec3(0.30, 0.21, 0.13);
    vec3 lightTint = vec3(0.86, 0.71, 0.47);
    vec3 base = mix(shadowTint, lightTint, clamp(vColor.r * 1.15, 0.0, 1.0) * 0.75);
    base *= 0.44 + 0.92 * diff;
    base += rim * vec3(0.07, 0.05, 0.02);
    base = mix(base, uLineColor, line * 0.38);
    base += uGlow * vec3(0.10, 0.065, 0.02) * smoothstep(0.62, 1.0, vHeight);

    base = mix(base, uFogColor, clamp(smoothstep(12.0, 30.0, vDepth), 0.0, 0.95));
    base = mix(uFogColor, base, clamp(uReveal, 0.0, 1.0));
    gl_FragColor = vec4(base, 1.0);
    #include <colorspace_fragment>
  }
`

export function useTerrainMaterial(reveal = 1) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: TERRAIN_VERTEX,
        fragmentShader: TERRAIN_FRAGMENT,
        uniforms: {
          uFogColor: { value: new THREE.Color('#1b1008') },
          uLineColor: { value: new THREE.Color('#241509') },
          uContour: { value: 16 },
          uReveal: { value: reveal },
          uGlow: { value: 0.6 },
        },
        side: THREE.DoubleSide,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  return material
}

export function revealUniform(material: THREE.ShaderMaterial, target: number) {
  const uniform = material.uniforms.uReveal
  if (uniform) uniform.value += (target - (uniform.value as number)) * 0.06
}

export function Terrain({
  landscape,
  segments = 128,
  size = 10,
  height = 2.4,
  reveal = 1,
  animateReveal = true,
  onPick,
}: {
  landscape: Landscape
  segments?: number
  size?: number
  height?: number
  reveal?: number
  animateReveal?: boolean
  onPick?: (x: number, y: number) => void
}) {
  const geometry = useMemo(
    () => buildTerrainGeometry(landscape, { segments, size, height }),
    [landscape, segments, size, height],
  )
  const material = useTerrainMaterial(reveal)
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  // Kabut menyibak setiap kali lanskap berganti.
  useEffect(() => {
    if (animateReveal) material.uniforms.uReveal.value = 0
  }, [landscape, material, animateReveal])

  useFrame(() => {
    if (!animateReveal) return
    const uniform = material.uniforms.uReveal
    if (uniform && (uniform.value as number) < 1) {
      uniform.value = Math.min(1, (uniform.value as number) + 0.018)
    }
  })

  const handlePick = (event: { point: THREE.Vector3; stopPropagation: () => void }) => {
    if (!onPick) return
    event.stopPropagation()
    const [[x0, x1], [y0, y1]] = landscape.domain
    const u = (event.point.x + size / 2) / size
    const v = (event.point.z + size / 2) / size
    onPick(x0 + u * (x1 - x0), y0 + v * (y1 - y0))
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        receiveShadow
        onPointerDown={onPick ? handlePick : undefined}
      />
      {/* Alas di bawah lanskap */}
      <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.78, 64]} />
        <meshStandardMaterial color="#26160b" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 0.72, size * 0.76, 80]} />
        <meshBasicMaterial color="#b8862b" transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Scene chrome                                                       */
/* ------------------------------------------------------------------ */

export function SceneLights({ intensity = 1 }: { intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.55 * intensity} color="#f0dcb4" />
      <directionalLight
        position={[5.5, 9, 4.5]}
        intensity={1.5 * intensity}
        color="#ffe6b0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0012}
      />
      <pointLight position={[-6, 3.2, 5]} intensity={14 * intensity} color="#c8561e" distance={18} decay={2} />
      <pointLight position={[6.5, 2.4, -5]} intensity={9 * intensity} color="#e3b64f" distance={16} decay={2} />
      <fog attach="fog" args={['#1b1008', 14, 34]} />
    </>
  )
}

export function SceneCamera({
  target = [0, 0.4, 0],
  autoRotate = false,
  autoRotateSpeed = 0.35,
  minDistance = 6,
  maxDistance = 20,
  maxPolarAngle = Math.PI * 0.47,
  controlsRef,
}: {
  position?: [number, number, number]
  target?: [number, number, number]
  autoRotate?: boolean
  autoRotateSpeed?: number
  minDistance?: number
  maxDistance?: number
  maxPolarAngle?: number
  controlsRef?: React.MutableRefObject<{ reset: () => void } | null>
}) {
  return (
    <OrbitControls
      // drei mengekspos ref dengan .reset()
      ref={controlsRef as never}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.66}
      zoomSpeed={0.72}
      panSpeed={0.6}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={maxPolarAngle}
      target={target}
    />
  )
}

/** Pause render loop saat tab tersembunyi. */
export function VisibilityPause() {
  const setFrameloop = useThree((state) => state.setFrameloop)
  useEffect(() => {
    const onVisibility = () => setFrameloop(document.hidden ? 'never' : 'always')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [setFrameloop])
  return null
}

export function SceneCanvas({
  children,
  className = '',
  camera = { position: [6.4, 6.2, 7.4] as [number, number, number], fov: 42 },
  dpr = [1, 1.75] as [number, number],
  shadows = true,
  onCreated,
}: {
  children: ReactNode
  className?: string
  camera?: { position: [number, number, number]; fov: number }
  dpr?: [number, number]
  shadows?: boolean
  onCreated?: () => void
}) {
  return (
    <Canvas
      className={className}
      dpr={dpr}
      shadows={shadows ? 'soft' : false}
      camera={camera}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.06
        onCreated?.()
      }}
    >
      {children}
    </Canvas>
  )
}

export const THREE_LIMITS = { maxPolarAngle: Math.PI * 0.47 }

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

export function terrainHeightAt(landscape: Landscape, x: number, y: number, height = 2.4): number {
  return normalizedHeight(landscape, landscape.fn(x, y)) * height
}

export function worldFromDomain(
  landscape: Landscape,
  x: number,
  y: number,
  size = 10,
): [number, number] {
  const [[x0, x1], [y0, y1]] = landscape.domain
  const u = (x - x0) / (x1 - x0)
  const v = (y - y0) / (y1 - y0)
  return [(u - 0.5) * size, (v - 0.5) * size]
}

export function domainFromWorld(
  landscape: Landscape,
  wx: number,
  wz: number,
  size = 10,
): [number, number] {
  const [[x0, x1], [y0, y1]] = landscape.domain
  const u = wx / size + 0.5
  const v = wz / size + 0.5
  return [x0 + u * (x1 - x0), y0 + v * (y1 - y0)]
}

/** Debu/ember melayang untuk latar 3D. */
export function EmberField({ count = 70, radius = 7 }: { count?: number; radius?: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const seeds = useMemo(() => {
    const arr = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      arr[i * 4] = (Math.random() - 0.5) * radius * 2
      arr[i * 4 + 1] = Math.random() * 4.5 + 0.2
      arr[i * 4 + 2] = (Math.random() - 0.5) * radius * 2
      arr[i * 4 + 3] = 0.15 + Math.random() * 0.5
    }
    return arr
  }, [count, radius])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = seeds[i * 4]
      positions[i * 3 + 1] = seeds[i * 4 + 1]
      positions[i * 3 + 2] = seeds[i * 4 + 2]
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [count, seeds])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state) => {
    const points = pointsRef.current
    if (!points) return
    const positions = points.geometry.attributes.position as THREE.BufferAttribute
    const time = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const speed = seeds[i * 4 + 3]
      let y = positions.getY(i) + 0.004 + speed * 0.012
      if (y > 5) y = 0.15
      positions.setY(i, y)
      positions.setX(i, seeds[i * 4] + Math.sin(time * speed + i) * 0.22)
    }
    positions.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        color="#f0c56a"
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/** Ikon jatuh bila WebGL tidak tersedia. */
export function GlSceneFallback({ label }: { label: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_30%,#3b2513,#171008_75%)]">
      <div className="absolute inset-0 opacity-30">
        <div className="page-noise absolute inset-0" />
      </div>
      <svg viewBox="0 0 320 200" className="relative w-[86%] max-w-[420px]" fill="none" aria-hidden="true">
        <path d="M14 150 C60 120 74 156 108 130 C138 108 150 70 178 84 C206 98 216 150 248 132 C272 118 284 96 306 104" stroke="#b8862b" strokeWidth="1.2" opacity=".7" />
        <path d="M14 164 C60 134 74 170 108 144 C138 122 150 84 178 98 C206 112 216 164 248 146 C272 132 284 110 306 118" stroke="#8a5a2b" strokeWidth=".8" opacity=".45" />
        {[24, 58, 92, 126, 160, 194, 228, 262, 296].map((x) => (
          <line key={x} x1={x} y1={30} x2={x} y2={172} stroke="#b8862b" strokeWidth=".4" opacity=".16" />
        ))}
        {[40, 68, 96, 124, 152].map((y) => (
          <line key={y} x1={12} y1={y} x2={308} y2={y} stroke="#b8862b" strokeWidth=".4" opacity=".16" />
        ))}
        <circle cx="178" cy="98" r="5" fill="#e3b64f" />
        <circle cx="178" cy="98" r="12" stroke="#e3b64f" strokeWidth=".8" opacity=".5" />
        <path d="M150 40 h60 M150 48 h40" stroke="#b8862b" strokeWidth="1" opacity=".5" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-center">
        <p className="font-heading text-[10px] uppercase tracking-[0.22em] text-gold-light/80">Tampilan 2D</p>
        <p className="mt-1 font-body text-[13px] italic text-parchment-200/75">{label}</p>
        <p className="mt-1 font-body text-[11px] text-parchment-300/50">
          WebGL tidak tersedia — visualisasi 2D tetap berfungsi penuh.
        </p>
      </div>
    </div>
  )
}