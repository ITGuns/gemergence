"use client";

/**
 * The Gemfield journey scene. A scroll-scrubbed camera travels through the
 * growth system: open space → disconnect field → the seven modules locking
 * into a ring → the acceleration corridor → the Deskii command deck → the
 * handover. All state comes from the journey store (no React re-renders).
 */

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Edges, Line, Text } from "@react-three/drei";
import { journey, clamp01, smooth, BANDS, bandWeight } from "./journey-store";

const INK_BG = "#0a0f0c";
const EMERALD = "#0e5c45";
const EMERALD_LIGHT = "#7fc8ad";
const EMERALD_MID = "#1e8f68";
const PANEL = "#141d17";
const MUT = "#a8b3aa";

/* ── Camera + light keyframes along the journey ─────────────────── */
type Key = { p: number; pos: [number, number, number]; look: [number, number, number]; fov: number; fog: number; light: number; speed: number };
const KEYS: Key[] = [
  // Hero frames the gem in the right third (copy owns the left).
  { p: 0.0, pos: [-3.2, 0.7, 13], look: [-1.6, 0.1, 0], fov: 50, fog: 0.045, light: 1.0, speed: 0.6 },
  { p: 0.12, pos: [1.7, 0.3, 10], look: [0.7, 0, -2], fov: 53, fog: 0.062, light: 0.5, speed: 0.45 },
  { p: 0.26, pos: [0, 1.5, 8.2], look: [0, 0, 0], fov: 50, fog: 0.04, light: 0.9, speed: 0.7 },
  { p: 0.54, pos: [0, 0.9, 6.6], look: [0, 0, 0], fov: 52, fog: 0.04, light: 1.0, speed: 1.0 },
  { p: 0.6, pos: [0, 0.4, 4.6], look: [0, 0, -3], fov: 63, fog: 0.052, light: 1.3, speed: 3.4 },
  { p: 0.66, pos: [2.7, 1.0, 3.6], look: [1.7, 0.3, -2.4], fov: 48, fog: 0.05, light: 0.85, speed: 0.8 },
  { p: 0.86, pos: [2.2, 0.7, 2.8], look: [1.2, 0.2, -3], fov: 48, fog: 0.05, light: 0.9, speed: 0.6 },
  { p: 1.0, pos: [0, 1.7, 1.2], look: [0, 0.4, -5], fov: 46, fog: 0.034, light: 1.45, speed: 0.9 },
];

const vA = new THREE.Vector3();
const vB = new THREE.Vector3();
const vPos = new THREE.Vector3();
const vLook = new THREE.Vector3();
const curLook = new THREE.Vector3(0, 0, 0);

function sampleKeys(p: number) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = smooth(clamp01((p - a.p) / (b.p - a.p)));
  vPos.set(...a.pos).lerp(vB.set(...b.pos), t);
  vLook.set(...a.look).lerp(vA.set(...b.look), t);
  return {
    fov: a.fov + (b.fov - a.fov) * t,
    fog: a.fog + (b.fog - a.fog) * t,
    light: a.light + (b.light - a.light) * t,
    speed: a.speed + (b.speed - a.speed) * t,
  };
}

/** Deterministic pseudo-random from an index. */
const rnd = (i: number, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ── Rig: camera, fog, key light ────────────────────────────────── */
function Rig({ dirLight, gemLight }: { dirLight: React.RefObject<THREE.DirectionalLight | null>; gemLight: React.RefObject<THREE.PointLight | null> }) {
  const { camera, scene } = useThree();
  const speedRef = useRef(0.6);

  useFrame((state) => {
    const k = sampleKeys(journey.p);
    speedRef.current = k.speed;
    // parallax on top of the path
    vPos.x += journey.mx * 0.55;
    vPos.y += journey.my * 0.3;
    camera.position.lerp(vPos, 0.07);
    curLook.lerp(vLook, 0.07);
    camera.lookAt(curLook);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov += (k.fov - cam.fov) * 0.07;
    cam.updateProjectionMatrix();
    if (scene.fog instanceof THREE.FogExp2) scene.fog.density += (k.fog - scene.fog.density) * 0.07;
    if (dirLight.current) dirLight.current.intensity = 0.8 * k.light;
    if (gemLight.current) gemLight.current.intensity = (5 + Math.sin(state.clock.elapsedTime * 1.4) * 1.2) * k.light;
  });
  return null;
}
// expose current streak speed to siblings via module ref
const speedState = { v: 0.6 };
function SpeedSampler() {
  useFrame(() => { speedState.v = sampleKeys(journey.p).speed; });
  return null;
}

/* ── The gem core (with handover shards) ────────────────────────── */
function GemCore() {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Sprite>(null);
  const shards = useRef<THREE.Group>(null);
  const pulse = useRef(0);
  const lastLock = useRef(-1);

  const glowMap = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(64,190,140,0.85)");
    grad.addColorStop(0.4, "rgba(30,143,104,0.25)");
    grad.addColorStop(1, "rgba(30,143,104,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }, []);

  const shardOffsets: [number, number, number][] = [
    [1.5, 0.7, 0.2], [-1.5, 0.45, 0.1], [0.8, -0.9, 0.5], [-0.8, 1.1, -0.4],
  ];

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (!group.current) return;
    group.current.rotation.y = t * 0.16;
    group.current.rotation.x = Math.sin(t * 0.11) * 0.12;

    // pulse when a system node locks
    const idx = Math.floor(journey.sys * 7.0001);
    if (idx !== lastLock.current && journey.sys > 0 && journey.sys < 1) {
      lastLock.current = idx;
      pulse.current = 1;
    }
    pulse.current = Math.max(0, pulse.current - dt * 2.2);
    const s = 1 + pulse.current * 0.1 + Math.sin(t * 1.6) * 0.015;
    group.current.scale.setScalar(s);
    if (glow.current) glow.current.scale.setScalar(4.2 + pulse.current * 1.4 + Math.sin(t * 1.6) * 0.18);

    // handover: shards separate then re-fuse
    const hand = clamp01((journey.p - BANDS.handover[0]) / (BANDS.handover[1] - BANDS.handover[0]));
    const sep = Math.sin(Math.PI * hand) * 0.9;
    shards.current?.children.forEach((sh, i) => {
      const o = shardOffsets[i];
      sh.position.set(o[0] * sep, o[1] * sep, o[2] * sep);
      sh.rotation.y = t * 0.3 + i;
      sh.rotation.z = sep * (i % 2 ? 1 : -1) * 0.7;
    });
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial color={EMERALD} emissive="#0a4634" emissiveIntensity={0.9} roughness={0.25} metalness={0.35} flatShading />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.45, 1]} />
        <meshBasicMaterial color={EMERALD_LIGHT} wireframe transparent opacity={0.14} />
      </mesh>
      <group ref={shards}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i}>
            <tetrahedronGeometry args={[0.34, 0]} />
            <meshStandardMaterial color={EMERALD_MID} emissive={EMERALD} emissiveIntensity={0.8} roughness={0.3} flatShading />
          </mesh>
        ))}
      </group>
      <sprite ref={glow} scale={4.2}>
        <spriteMaterial map={glowMap} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/* ── The seven system modules: scatter → lock into the ring ─────── */
const PILLAR_LABELS = ["01 WEBSITE", "02 VISIBILITY", "03 LEAD CAPTURE", "04 FOLLOW-UP", "05 REVIEWS", "06 REPORTING", "07 CUSTOM TOOLS"];
const RING_R = 3.15;

function SystemNodes() {
  const nodes = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const lineMats = useRef<(THREE.Material | null)[]>([]);
  const ring = useRef<THREE.Group>(null);

  const data = useMemo(
    () =>
      PILLAR_LABELS.map((label, i) => {
        const ang = (i / 7) * Math.PI * 2 - Math.PI / 2;
        return {
          label,
          home: new THREE.Vector3(Math.cos(ang) * RING_R, Math.sin(ang) * RING_R * 0.5, Math.sin(ang) * -0.6),
          scatter: new THREE.Vector3((rnd(i) - 0.5) * 16, (rnd(i, 1) - 0.5) * 8, -4 - rnd(i, 2) * 10),
        };
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const problemW = bandWeight(journey.p, BANDS.problem);
    const preSystem = journey.p < BANDS.system[0] ? 1 : 0;
    const assembled = journey.sys >= 1 ? 1 : 0;
    if (ring.current) ring.current.rotation.y = assembled ? t * 0.1 : 0;

    data.forEach((d, i) => {
      const g = nodes.current[i];
      const m = mats.current[i];
      if (!g || !m) return;
      const lock = smooth(clamp01(journey.sys * 7 - i));
      vA.copy(d.scatter);
      // drift while scattered
      vA.x += Math.sin(t * 0.4 + i * 2.1) * 0.5;
      vA.y += Math.cos(t * 0.3 + i * 1.7) * 0.4;
      g.position.lerpVectors(vA, d.home, lock);
      g.rotation.y = t * (0.6 - lock * 0.45) + i;
      const flicker = preSystem ? 0.22 + 0.12 * Math.sin(t * 11 + i * 5) * problemW : 0;
      m.opacity = Math.max(flicker + (1 - preSystem) * 0, 0.15) * (1 - lock) + lock * 1;
      m.emissiveIntensity = 0.25 + lock * 0.9;
      const lm = lineMats.current[i] as THREE.Material & { opacity: number };
      if (lm) lm.opacity = lock * 0.5;
      g.scale.setScalar(0.7 + lock * 0.45);
    });
  });

  return (
    <group ref={ring}>
      {data.map((d, i) => (
        <group key={d.label}>
          <group ref={(el) => { nodes.current[i] = el; }}>
            <mesh>
              <octahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial
                ref={(el) => { mats.current[i] = el; }}
                color={EMERALD_MID}
                emissive={EMERALD}
                transparent
                roughness={0.3}
                flatShading
              />
            </mesh>
            <Billboard position={[0, -0.62, 0]}>
              <Text fontSize={0.18} color={EMERALD_LIGHT} anchorX="center" anchorY="middle" letterSpacing={0.12}>
                {d.label}
              </Text>
            </Billboard>
          </group>
          <Line
            points={[d.home.toArray(), [0, 0, 0]]}
            color={EMERALD_LIGHT}
            lineWidth={1}
            transparent
            opacity={0}
            ref={(el) => {
              // drei Line ref exposes the Line2 object; grab its material
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              lineMats.current[i] = (el as any)?.material ?? null;
            }}
          />
        </group>
      ))}
    </group>
  );
}

/* ── Broken links shown in the disconnect field ─────────────────── */
function BrokenLinks() {
  const pts = useMemo(() => {
    const out: [number, number, number][][] = [];
    const pairs: [number, number][] = [[0, 3], [1, 5], [2, 6], [4, 0]];
    pairs.forEach(([a, b]) => {
      out.push([
        [(rnd(a) - 0.5) * 16, (rnd(a, 1) - 0.5) * 8, -4 - rnd(a, 2) * 10],
        [(rnd(b) - 0.5) * 16, (rnd(b, 1) - 0.5) * 8, -4 - rnd(b, 2) * 10],
      ]);
    });
    return out;
  }, []);
  const matRefs = useRef<(THREE.Material & { opacity: number })[]>([]);
  useFrame(() => {
    const w = bandWeight(journey.p, BANDS.problem);
    pts.forEach((_, i) => {
      const m = matRefs.current[i];
      if (m) m.opacity = w * 0.3;
    });
  });
  return (
    <group>
      {pts.map((pair, i) => (
        <Line
          key={i}
          points={pair}
          color={MUT}
          lineWidth={1}
          dashed
          dashSize={0.25}
          gapSize={0.35}
          transparent
          opacity={0}
          ref={(el) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const m = (el as any)?.material;
            if (m) matRefs.current[i] = m;
          }}
        />
      ))}
    </group>
  );
}

/* ── Kinetic diagonal speed lines (lead-flow streaks) ───────────── */
const STREAKS = 130;
function SpeedLines() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: STREAKS }, (_, i) => ({
        r: 3.5 + rnd(i) * 11,
        a: rnd(i, 1) * Math.PI * 2,
        z: -40 + rnd(i, 2) * 55,
        len: 1.5 + rnd(i, 3) * 3.5,
        sp: 6 + rnd(i, 4) * 9,
      })),
    []
  );

  useFrame((_, dt) => {
    if (!mesh.current) return;
    const boost = speedState.v;
    seeds.forEach((s, i) => {
      s.z += s.sp * boost * dt;
      if (s.z > 16) s.z = -45;
      dummy.position.set(Math.cos(s.a) * s.r, Math.sin(s.a) * s.r * 0.7, s.z);
      dummy.rotation.set(0.12, 0, 0.18); // the diagonal
      const stretch = s.len * (0.6 + boost * 0.5);
      dummy.scale.set(1, 1, stretch);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    const m = mesh.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.22 + Math.min(boost * 0.1, 0.3);
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, STREAKS]} frustumCulled={false}>
      <boxGeometry args={[0.015, 0.015, 1]} />
      <meshBasicMaterial color={EMERALD_LIGHT} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

/* ── Floating performance metric panels ─────────────────────────── */
const METRICS = [
  { text: "+31%  CALLS FROM SEARCH", pos: [4.6, 1.8, -3] as const },
  { text: "48s  AVG REPLY TIME", pos: [-4.8, -0.6, -5] as const },
  { text: "28  NEW LEADS / MO", pos: [-3.6, 2.3, -8] as const },
  { text: "19  MISSED CALLS RECOVERED", pos: [5.2, -1.4, -7] as const },
];
function MetricPanels() {
  const groups = useRef<(THREE.Group | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const w = Math.max(bandWeight(journey.p, BANDS.hero), bandWeight(journey.p, BANDS.problem) * 0.5, bandWeight(journey.p, BANDS.fuel) * 0.7);
    groups.current.forEach((g, i) => {
      if (!g) return;
      g.position.y = METRICS[i].pos[1] + Math.sin(t * 0.5 + i * 2) * 0.18;
      g.rotation.y = Math.sin(t * 0.2 + i) * 0.1;
      g.children.forEach((c) => {
        const mesh = c as THREE.Mesh;
        const m = mesh.material as THREE.Material & { opacity: number };
        if (m && "opacity" in m) m.opacity = (mesh.type === "Mesh" ? 0.5 : 0.95) * w;
      });
    });
  });
  return (
    <>
      {METRICS.map((mt, i) => (
        <group key={mt.text} position={[mt.pos[0], mt.pos[1], mt.pos[2]]} ref={(el) => { groups.current[i] = el; }}>
          <mesh>
            <planeGeometry args={[2.6, 0.6]} />
            <meshBasicMaterial color={PANEL} transparent opacity={0.5} depthWrite={false} />
          </mesh>
          <Text position={[0, 0, 0.01]} fontSize={0.16} color={EMERALD_LIGHT} anchorX="center" anchorY="middle" letterSpacing={0.08}>
            {mt.text}
          </Text>
        </group>
      ))}
    </>
  );
}

/* ── Leads flowing into the system core ─────────────────────────── */
const P_COUNT = 500;
function FunnelParticles() {
  const geom = useRef<THREE.BufferGeometry>(null);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(8, 3, -14),
        new THREE.Vector3(4, 1.6, -7),
        new THREE.Vector3(1.5, 0.6, -2.5),
        new THREE.Vector3(0, 0, 0),
      ]),
    []
  );
  const state = useMemo(() => {
    const ts = new Float32Array(P_COUNT);
    const jit = new Float32Array(P_COUNT * 3);
    for (let i = 0; i < P_COUNT; i++) {
      ts[i] = rnd(i, 9);
      jit[i * 3] = (rnd(i, 10) - 0.5) * 1.6;
      jit[i * 3 + 1] = (rnd(i, 11) - 0.5) * 1.6;
      jit[i * 3 + 2] = (rnd(i, 12) - 0.5) * 1.6;
    }
    return { ts, jit, positions: new Float32Array(P_COUNT * 3) };
  }, []);

  // One attribute for the whole lifetime — per-frame we only flag it dirty,
  // so three.js issues a cheap bufferSubData instead of recreating the buffer.
  const posAttr = useMemo(() => {
    const a = new THREE.BufferAttribute(state.positions, 3);
    a.setUsage(THREE.DynamicDrawUsage);
    return a;
  }, [state]);

  useFrame((_, dt) => {
    if (!geom.current) return;
    const boost = 0.04 + speedState.v * 0.05;
    for (let i = 0; i < P_COUNT; i++) {
      state.ts[i] += dt * boost * (0.6 + rnd(i, 13));
      if (state.ts[i] > 1) state.ts[i] -= 1;
      const fade = 1 - state.ts[i]; // tighten toward the core
      curve.getPoint(state.ts[i], vA);
      state.positions[i * 3] = vA.x + state.jit[i * 3] * fade;
      state.positions[i * 3 + 1] = vA.y + state.jit[i * 3 + 1] * fade;
      state.positions[i * 3 + 2] = vA.z + state.jit[i * 3 + 2] * fade;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geom}>
        <primitive object={posAttr} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color={EMERALD_LIGHT} size={0.055} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

/* ── Deskii command deck: panels snap into a dashboard grid ─────── */
const DESK_MODULES = ["PROJECTS", "TASKS", "APPROVALS", "REPORTS", "ROADMAP", "MESSAGES"];
function DashboardPanels() {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const data = useMemo(
    () =>
      DESK_MODULES.map((label, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        return {
          label,
          home: new THREE.Vector3(1.6 + (col - 1) * 1.55, 1.05 - row * 1.15, -2.6),
          scatter: new THREE.Vector3(3 + (rnd(i, 20) - 0.5) * 9, 1 + (rnd(i, 21) - 0.5) * 5, -7 - rnd(i, 22) * 6),
        };
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const deskW = bandWeight(journey.p, BANDS.deskii, 0.06);
    data.forEach((d, i) => {
      const g = groups.current[i];
      if (!g) return;
      const form = smooth(clamp01((journey.desk - i * 0.1) / 0.4));
      g.position.lerpVectors(d.scatter, d.home, form);
      g.position.y += Math.sin(t * 0.8 + i) * 0.03 * (1 - form);
      g.rotation.y = -0.35 + (1 - form) * (rnd(i, 23) - 0.5) * 1.4;
      g.rotation.z = (1 - form) * (rnd(i, 24) - 0.5) * 0.5;
      g.visible = deskW > 0.01;
      g.children.forEach((c) => {
        const mesh = c as THREE.Mesh;
        const m = mesh.material as THREE.Material & { opacity: number };
        if (m && "opacity" in m) m.opacity = ("isLineSegments" in c ? 0.7 : c.type === "Mesh" ? 0.88 : 1) * deskW * (0.25 + form * 0.75);
      });
    });
  });

  return (
    <>
      {data.map((d, i) => (
        <group key={d.label} ref={(el) => { groups.current[i] = el; }}>
          <mesh>
            <planeGeometry args={[1.35, 0.92]} />
            <meshBasicMaterial color={PANEL} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
            <Edges color={EMERALD_LIGHT} threshold={15} />
          </mesh>
          <Text position={[-0.55, 0.3, 0.01]} fontSize={0.105} color={EMERALD_LIGHT} anchorX="left" anchorY="middle" letterSpacing={0.14}>
            {d.label}
          </Text>
          {/* skeleton rows suggesting UI */}
          {[0, 1, 2].map((r) => (
            <mesh key={r} position={[0, 0 - r * 0.18, 0.01]}>
              <planeGeometry args={[1.05 - r * 0.18, 0.05]} />
              <meshBasicMaterial color={MUT} transparent opacity={0} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

/* ── Blueprint floor ─────────────────────────────────────────────── */
function DeckFloor() {
  return <gridHelper args={[70, 70, "#1c2b21", "#13211a"]} position={[0, -2.4, -6]} />;
}

/* ── Scene root ──────────────────────────────────────────────────── */
function World() {
  const dirLight = useRef<THREE.DirectionalLight>(null);
  const gemLight = useRef<THREE.PointLight>(null);
  return (
    <>
      {/* No scene background — the canvas is transparent over the .journey CSS
          backdrop, so a failed/blank canvas can never white-out the page. */}
      <fogExp2 attach="fog" args={[INK_BG, 0.045]} />
      <ambientLight color="#223328" intensity={0.5} />
      <directionalLight ref={dirLight} color="#eef5ef" intensity={0.8} position={[6, 10, 6]} />
      <pointLight ref={gemLight} color={EMERALD_MID} intensity={5} distance={30} position={[0, 0, 0]} />
      <pointLight color={EMERALD_LIGHT} intensity={1.6} distance={25} position={[-6, 3, -4]} />
      <Rig dirLight={dirLight} gemLight={gemLight} />
      <SpeedSampler />
      {SHOW.gem && <GemCore />}
      {SHOW.nodes && <SystemNodes />}
      {SHOW.broken && <BrokenLinks />}
      {SHOW.streaks && <SpeedLines />}
      {SHOW.metrics && <MetricPanels />}
      {SHOW.particles && <FunnelParticles />}
      {SHOW.panels && <DashboardPanels />}
      {SHOW.floor && <DeckFloor />}
    </>
  );
}

/** Bisection switches for GPU-crash isolation — all true in production. */
const SHOW = {
  gem: true,
  nodes: true,
  broken: true,
  streaks: true,
  metrics: true,
  particles: true,
  panels: true,
  floor: true,
};

export default function JourneyScene({
  onContextLost,
  paused = false,
}: {
  onContextLost?: () => void;
  paused?: boolean;
}) {
  return (
    <Canvas
      // "never" once the journey is fully scrolled past — the landing zone
      // shouldn't pay for an invisible scene rendering at full rate.
      frameloop={paused ? "never" : "always"}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.6, 14], fov: 50, near: 0.1, far: 120 }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
      aria-hidden
      onCreated={({ gl }) => {
        // If the GPU context dies (driver reset, tab eviction), fall back to
        // the static dark page instead of leaving a dead canvas around.
        // NB: R3F force-loses the context when disposing an instance (e.g.
        // StrictMode's dev double-mount) — only react to losses on a canvas
        // that is still in the DOM and stays lost a beat later.
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          setTimeout(() => {
            if (gl.domElement.isConnected && gl.getContext().isContextLost()) {
              onContextLost?.();
            }
          }, 300);
        });
      }}
    >
      <World />
    </Canvas>
  );
}
