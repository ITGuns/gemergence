"use client";

/**
 * Motion v2 — the exhibit stage.
 *
 * One persistent object (the faceted gem = the growth system) glides to the
 * open side of each section. Beside the copy tile, a per-section "exhibit"
 * pops in — a small 3D vignette of what that tile describes — then hands off
 * to the next. The Deskii beat opens the app itself and populates its six
 * modules as you scroll. No speed lines, no scatter: calm ambient motes only.
 */

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Line, Text } from "@react-three/drei";
import { journey, smooth, clamp01, SECTION_IDS, COPY_SIDE, type SectionId } from "./journey-store";

const INK_BG = "#0a0f0c";
const EMERALD = "#0e5c45";
const EM_LIGHT = "#7fc8ad";
const EM_MID = "#1e8f68";
const PANEL = "#121a15";
const PANEL_2 = "#16211a";
const MUT = "#a8b3aa";
const LINE = "#2c3a30";

/**
 * Exhibit x-sign per section — the side opposite the copy tile.
 * COPY_SIDE uses 1 = copy-left; screen-left is negative x, so the exhibit's
 * x-sign (open side) equals COPY_SIDE directly: copy-left (1) → exhibit at
 * +x (right), copy-right (-1) → exhibit at -x (left).
 */
const X_SIDE = (id: SectionId) => COPY_SIDE[id];

/** Shared per-frame stage state (set by Rig, read by everything). */
const stage = { fit: 1 };

/** Exhibit anchor distance from center (world units). */
const AX = 3.0;

/**
 * Active-beat tracker: which section (or pillar beat within the pinned
 * System) is on stage and when it arrived (clock seconds). Lets exhibits
 * stagger child entrances and run entry-relative animations.
 */
const act = { key: "", since: 0 };

const vTmp = new THREE.Vector3();

/* ── Camera + lights: calm. Drift, don't fly. ───────────────────── */
function Rig({ gemLight }: { gemLight: React.RefObject<THREE.PointLight | null> }) {
  const { camera, viewport } = useThree();
  const look = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    stage.fit = clamp01((viewport.aspect - 0.5) / 1.1) * 0.65 + 0.35; // 0.35 narrow → 1 wide
    const t = state.clock.elapsedTime;
    const id = SECTION_IDS[journey.sec];
    const side = X_SIDE(id);
    const beat =
      journey.sec +
      "|" +
      (id === "system"
        ? Math.min(6, Math.floor(journey.sys * 7))
        : id === "deskii"
          ? Math.min(5, Math.floor(journey.desk * 6))
          : 0);
    if (beat !== act.key) {
      act.key = beat;
      act.since = t;
    }
    vTmp.set(
      -side * 0.5 + journey.mx * 0.4,
      0.35 + Math.sin(t * 0.25) * 0.07 + journey.my * 0.22,
      10.5
    );
    camera.position.lerp(vTmp, 0.045);
    vTmp.set(side * 0.7 * stage.fit, 0.1, 0);
    look.current.lerp(vTmp, 0.045);
    camera.lookAt(look.current);
    if (gemLight.current) {
      gemLight.current.intensity = 4.2 + Math.sin(t * 1.3) * 0.9;
      gemLight.current.position.x = gemState.x;
      gemLight.current.position.y = gemState.y;
    }
  });
  return null;
}

/* ── Fade wrapper: pops a vignette in/out by a live predicate ───── */
function Fade({
  when,
  position = [0, 0, 0],
  speed = 5,
  pop = 0.3,
  delay = 0,
  debugId,
  children,
}: {
  when: () => boolean;
  position?: [number, number, number];
  speed?: number;
  pop?: number;
  /** Seconds after the active beat arrives before this element enters. */
  delay?: number;
  debugId?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = when() && state.clock.elapsedTime - act.since >= delay ? 1 : 0;
    if (debugId && typeof window !== "undefined") {
      const w = window as unknown as Record<string, Record<string, unknown>>;
      w.__fades = w.__fades || {};
      w.__fades[debugId] = {
        target,
        w: +(((g.userData.w as number) ?? 0)).toFixed(3),
        vis: g.visible,
        pos: [+g.position.x.toFixed(2), +g.position.y.toFixed(2)],
        scale: +g.scale.x.toFixed(2),
      };
    }
    const cur = (g.userData.w as number) ?? 0;
    const w = cur + (target - cur) * Math.min(1, dt * speed);
    g.userData.w = w;
    g.visible = w > 0.02;
    if (!g.visible) return;
    // ease-out-back: a ~5% overshoot so entrances pop instead of ooze
    const k = smooth(w);
    const back = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
    const s = (0.7 + 0.3 * back) * stage.fit;
    g.scale.setScalar(s);
    g.position.set(position[0] * stage.fit, position[1] + (1 - smooth(w)) * -pop, position[2]);
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as (THREE.Material & { opacity: number }) | undefined;
      if (m && typeof m.opacity === "number") {
        if (m.userData.bo === undefined) m.userData.bo = m.opacity;
        m.transparent = true;
        m.opacity = (m.userData.bo as number) * w;
      }
    });
  });
  return <group ref={ref}>{children}</group>;
}

const backOut = (k: number) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);

/**
 * Time-staggered child entrance: scales in with a pop `delay` seconds after
 * the active beat arrives. Opacity is left to the enclosing Fade, so nesting
 * never fights over materials.
 */
function PopKid({
  delay,
  position = [0, 0, 0],
  children,
}: {
  delay: number;
  position?: [number, number, number];
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const k = clamp01((state.clock.elapsedTime - act.since - delay) * 3.4);
    g.visible = k > 0.01;
    if (g.visible) g.scale.setScalar(Math.max(0.001, backOut(smooth(k))));
  });
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

/* ── Tiny vocabulary of parts ───────────────────────────────────── */
function Bar({
  w,
  h,
  color = EM_MID,
  opacity = 0.95,
  position = [0, 0, 0] as [number, number, number],
}: {
  w: number;
  h: number;
  color?: string;
  opacity?: number;
  position?: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function Label({
  text,
  size = 0.13,
  color = EM_LIGHT,
  position = [0, 0, 0] as [number, number, number],
  anchorX = "center" as const,
}: {
  text: string;
  size?: number;
  color?: string;
  position?: [number, number, number];
  anchorX?: "center" | "left" | "right";
}) {
  return (
    <Text position={position} fontSize={size} color={color} anchorX={anchorX} anchorY="middle" letterSpacing={0.1}>
      {text}
    </Text>
  );
}

/* Rounded-rect geometry cache — sharp planes read schematic, rounded reads product. */
const shapeCache = new Map<string, THREE.ShapeGeometry>();
function rrGeo(w: number, h: number, r: number) {
  const key = `${w}|${h}|${r}`;
  let geo = shapeCache.get(key);
  if (!geo) {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    const rr = Math.min(r, w / 2, h / 2);
    s.moveTo(x + rr, y);
    s.lineTo(x + w - rr, y);
    s.quadraticCurveTo(x + w, y, x + w, y + rr);
    s.lineTo(x + w, y + h - rr);
    s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    s.lineTo(x + rr, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - rr);
    s.lineTo(x, y + rr);
    s.quadraticCurveTo(x, y, x + rr, y);
    geo = new THREE.ShapeGeometry(s, 6);
    shapeCache.set(key, geo);
  }
  return geo;
}

function starShapeGeo() {
  const key = "star";
  let geo = shapeCache.get(key);
  if (!geo) {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
      const r = i % 2 === 0 ? 0.16 : 0.068;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) s.moveTo(px, py);
      else s.lineTo(px, py);
    }
    s.closePath();
    geo = new THREE.ShapeGeometry(s);
    shapeCache.set(key, geo);
  }
  return geo;
}

/** Rounded panel with a hairline border — the premium card primitive. */
function RPane({
  w,
  h,
  r = 0.1,
  color = PANEL,
  opacity = 0.94,
  border = EM_LIGHT,
  borderOpacity = 0.26,
  position = [0, 0, 0] as [number, number, number],
}: {
  w: number;
  h: number;
  r?: number;
  color?: string;
  opacity?: number;
  border?: string;
  borderOpacity?: number;
  position?: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh geometry={rrGeo(w + 0.028, h + 0.028, r + 0.014)} position={[0, 0, -0.003]}>
        <meshBasicMaterial color={border} transparent opacity={borderOpacity} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rrGeo(w, h, r)}>
        <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Small labelled pill. */
function ChipTag({
  text,
  w,
  h = 0.34,
  color = PANEL_2,
  textColor = EM_LIGHT,
  size = 0.085,
  border = EM_LIGHT,
  borderOpacity = 0.3,
  position = [0, 0, 0] as [number, number, number],
}: {
  text: string;
  w: number;
  h?: number;
  color?: string;
  textColor?: string;
  size?: number;
  border?: string;
  borderOpacity?: number;
  position?: [number, number, number];
}) {
  return (
    <group position={position}>
      <RPane w={w} h={h} r={h / 2} color={color} border={border} borderOpacity={borderOpacity} />
      <Label text={text} size={size} color={textColor} position={[0, 0, 0.01]} />
    </group>
  );
}

function Star({
  lit = true,
  position = [0, 0, 0] as [number, number, number],
  scale = 1,
}: {
  lit?: boolean;
  position?: [number, number, number];
  scale?: number;
}) {
  return (
    <mesh geometry={starShapeGeo()} position={position} scale={scale}>
      <meshBasicMaterial color={lit ? EM_LIGHT : LINE} transparent opacity={lit ? 0.95 : 0.7} depthWrite={false} />
    </mesh>
  );
}

/** A miniature app/window frame — rounded, hairline chrome. */
function Window({
  w,
  h,
  title,
  children,
  position = [0, 0, 0] as [number, number, number],
}: {
  w: number;
  h: number;
  title?: string;
  children?: React.ReactNode;
  position?: [number, number, number];
}) {
  return (
    <group position={position}>
      <RPane w={w} h={h} r={0.12} />
      <Bar w={w - 0.04} h={0.012} color={LINE} position={[0, h / 2 - 0.3, 0.006]} />
      <group position={[-w / 2 + 0.22, h / 2 - 0.155, 0.01]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[i * 0.11, 0, 0]}>
            <circleGeometry args={[0.028, 12]} />
            <meshBasicMaterial color={i === 0 ? EM_MID : LINE} transparent opacity={0.9} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {title && <Label text={title} size={0.09} color={MUT} position={[0, h / 2 - 0.155, 0.01]} />}
      <group position={[0, -0.14, 0.01]}>{children}</group>
    </group>
  );
}

function CheckMark({ position = [0, 0, 0] as [number, number, number], scale = 1 }: { position?: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, 0, -0.1]}>
      <mesh position={[-0.06, -0.02, 0]} rotation={[0, 0, -0.8]}>
        <planeGeometry args={[0.14, 0.045]} />
        <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <mesh position={[0.05, 0.02, 0]} rotation={[0, 0, 0.7]}>
        <planeGeometry args={[0.24, 0.045]} />
        <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.95} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ── The growth-system object ───────────────────────────────────── */
const gemState = { x: 0, y: 0 };

/** Per-section gem pose. `dx` shifts along the exhibit side (mirrored with it). */
const GEM_POSE: Record<SectionId, { y: number; s: number; dx?: number; dim?: boolean }> = {
  hero: { y: 0.1, s: 1.6 },
  problem: { y: 2.2, s: 0.5, dim: true },
  system: { y: 2.5, s: 0.6 },
  fuel: { y: -0.1, s: 0.85 },
  deskii: { y: 2.7, s: 0.38 },
  offer: { y: 1.2, s: 0.65, dx: -1.5 },
  ownership: { y: 0.25, s: 1.0, dx: 0.45 },
  industries: { y: 2.45, s: 0.52 },
  process: { y: 2.5, s: 0.5 },
  proof: { y: 2.5, s: 0.5 },
  plans: { y: 2.55, s: 0.5 },
  why: { y: 2.4, s: 0.55 },
  cta: { y: 0.8, s: 1.35 },
};

function Gem() {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Sprite>(null);
  const core = useRef<THREE.MeshStandardMaterial>(null);
  const heart = useRef<THREE.MeshBasicMaterial>(null);
  const rim = useRef<THREE.MeshBasicMaterial>(null);
  const shock = useRef<THREE.Mesh>(null);
  const sparkles = useRef<THREE.Points>(null);
  const gyro = useRef<THREE.Group>(null);
  const shards = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  const pulse = useRef(0);
  const lastBeat = useRef(-1);
  const dim = useRef(1);

  const glowMap = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(64,190,140,0.8)");
    grad.addColorStop(0.45, "rgba(30,143,104,0.22)");
    grad.addColorStop(1, "rgba(30,143,104,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);

  const shardOffsets: [number, number, number][] = [
    [1.15, 0.5, 0.2], [-1.15, 0.35, 0.1], [0.6, -0.7, 0.4], [-0.6, 0.85, -0.3],
  ];
  const ringPts = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return [Math.cos(a) * 1.9, Math.sin(a) * 0.55, Math.sin(a) * -0.4] as [number, number, number];
      }),
    []
  );

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const id = SECTION_IDS[journey.sec];
    const pose = GEM_POSE[id];
    const x = X_SIDE(id) * (AX + (pose.dx ?? 0)) * stage.fit;

    // glide — snappier than v2 so section changes read as a move, not a drift
    g.position.x += (x - g.position.x) * Math.min(1, dt * 3.2);
    g.position.y += (pose.y + Math.sin(t * 0.5) * 0.06 - g.position.y) * Math.min(1, dt * 3.2);
    gemState.x = g.position.x;
    gemState.y = g.position.y;

    // beat pulse: section arrivals + pillar locks + deskii module pops
    const beat =
      id === "system"
        ? 200 + Math.floor(journey.sys * 7.0001)
        : id === "deskii"
          ? 100 + Math.floor(journey.desk * 6.0001)
          : journey.sec;
    if (beat !== lastBeat.current && beat >= 0) {
      lastBeat.current = beat;
      pulse.current = 1;
    }
    pulse.current = Math.max(0, pulse.current - dt * 2.4);

    const s = pose.s * stage.fit * (1 + pulse.current * 0.12 + Math.sin(t * 1.5) * 0.015);
    g.scale.setScalar(s);
    if (spin.current) {
      spin.current.rotation.y = t * 0.22;
      spin.current.rotation.x = Math.sin(t * 0.12) * 0.12;
    }
    if (gyro.current) {
      gyro.current.rotation.y = -t * 0.14;
      gyro.current.rotation.z = Math.sin(t * 0.1) * 0.18;
    }
    if (sparkles.current) {
      sparkles.current.rotation.y = t * 0.1;
      (sparkles.current.material as THREE.PointsMaterial).opacity = (0.4 + pulse.current * 0.4) * dim.current;
    }

    dim.current += ((pose.dim ? 0.35 : 1) - dim.current) * Math.min(1, dt * 3);
    if (core.current) core.current.emissiveIntensity = (1.15 + pulse.current * 0.6) * dim.current;
    if (heart.current) heart.current.opacity = (0.5 + Math.sin(t * 2.1) * 0.15 + pulse.current * 0.35) * dim.current;
    if (rim.current) rim.current.opacity = 0.16 * dim.current;
    if (glow.current) {
      glow.current.scale.setScalar(4.2 + pulse.current * 1.4 + Math.sin(t * 1.5) * 0.18);
      (glow.current.material as THREE.SpriteMaterial).opacity = 0.9 * dim.current;
    }
    // shockwave ring expands and fades on every beat
    if (shock.current) {
      const k = 1 - pulse.current;
      shock.current.visible = pulse.current > 0.01;
      shock.current.scale.setScalar(1.25 + k * 2.2);
      (shock.current.material as THREE.MeshBasicMaterial).opacity = pulse.current * 0.45;
    }

    // ownership: facets drift out with the declarations, then re-fuse
    const own = id === "ownership" ? smooth(clamp01(journey.t * 1.6)) * (1 - smooth(clamp01((journey.t - 0.75) * 4))) : 0;
    shards.current?.children.forEach((sh, i) => {
      const o = shardOffsets[i];
      sh.position.set(o[0] * own, o[1] * own, o[2] * own);
      sh.rotation.y = t * 0.25 + i;
    });

    // module ring: previews the system assembling (system beat only)
    if (ring.current) {
      ring.current.visible = id === "system" || id === "fuel";
      ring.current.rotation.y = t * 0.22;
      ring.current.children.forEach((p, i) => {
        const lock = id === "fuel" ? 1 : smooth(clamp01(journey.sys * 7 - i));
        p.scale.setScalar(0.6 + lock * 0.7);
        const m = (p as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = 0.25 + lock * 0.75;
      });
    }
  });

  const sparklePos = useMemo(() => {
    const n = 42;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (Math.sin(i * 91.7) * 0.5 + 0.5) * Math.PI * 2;
      const b = Math.acos((Math.sin(i * 47.3) * 0.5 + 0.5) * 2 - 1);
      const r = 1.45 + (Math.sin(i * 13.9) * 0.5 + 0.5) * 0.45;
      pos[i * 3] = Math.sin(b) * Math.cos(a) * r;
      pos[i * 3 + 1] = Math.cos(b) * r;
      pos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r;
    }
    return pos;
  }, []);

  return (
    <group ref={root}>
      <group ref={spin}>
        <mesh>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial ref={core} color={EMERALD} emissive="#0d5740" emissiveIntensity={1.15} roughness={0.22} metalness={0.4} flatShading />
        </mesh>
        {/* luminous heart */}
        <mesh>
          <octahedronGeometry args={[0.52, 0]} />
          <meshBasicMaterial ref={heart} color="#5ee6ae" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* fresnel-ish rim halo */}
        <mesh>
          <icosahedronGeometry args={[1.16, 0]} />
          <meshBasicMaterial ref={rim} color={EM_MID} transparent opacity={0.16} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.38, 1]} />
          <meshBasicMaterial color={EM_LIGHT} wireframe transparent opacity={0.14} />
        </mesh>
      </group>
      {/* gyroscope rings — the "system" orbiting its core */}
      <group ref={gyro}>
        <mesh rotation={[Math.PI / 2.4, 0, 0.3]}>
          <torusGeometry args={[1.62, 0.012, 8, 80]} />
          <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.22} depthWrite={false} />
        </mesh>
        <mesh rotation={[Math.PI / 1.8, 0.5, -0.4]}>
          <torusGeometry args={[1.86, 0.008, 8, 80]} />
          <meshBasicMaterial color={EM_MID} transparent opacity={0.16} depthWrite={false} />
        </mesh>
      </group>
      {/* sparkle field */}
      <points ref={sparkles} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparklePos, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#a5e3c9" size={0.05} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
      </points>
      {/* beat shockwave */}
      <mesh ref={shock} visible={false}>
        <ringGeometry args={[0.96, 1, 64]} />
        <meshBasicMaterial color={EM_LIGHT} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={shards}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i}>
            <tetrahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color={EM_MID} emissive={EMERALD} emissiveIntensity={0.8} roughness={0.3} flatShading />
          </mesh>
        ))}
      </group>
      <group ref={ring}>
        {Array.from({ length: 7 }, (_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.9, Math.sin(a) * 0.5, Math.sin(a) * -0.35]}>
              <octahedronGeometry args={[0.13, 0]} />
              <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.4} depthWrite={false} />
            </mesh>
          );
        })}
      </group>
      {/* faint connectors for the preview ring */}
      {ringPts.map((p, i) => (
        <Line key={i} points={[p, [0, 0, 0]]} color={EM_LIGHT} lineWidth={1} transparent opacity={0.0} visible={false} />
      ))}
      <sprite ref={glow} scale={3.6}>
        <spriteMaterial map={glowMap} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/* ── Ambient motes: the only free-floating motion. Slow. Quiet. ── */
const MOTES = 130;
function Motes() {
  const geom = useRef<THREE.BufferGeometry>(null);
  const data = useMemo(() => {
    const pos = new Float32Array(MOTES * 3);
    const sp = new Float32Array(MOTES);
    for (let i = 0; i < MOTES; i++) {
      pos[i * 3] = (Math.sin(i * 127.1) * 0.5 + 0.5 - 0.5) * 18;
      pos[i * 3 + 1] = (Math.sin(i * 311.7) * 0.5 + 0.5 - 0.5) * 10;
      pos[i * 3 + 2] = -7 + (Math.sin(i * 74.3) * 0.5 + 0.5) * 11;
      sp[i] = 0.05 + (Math.sin(i * 53.1) * 0.5 + 0.5) * 0.09;
    }
    return { pos, sp };
  }, []);
  const attr = useMemo(() => {
    const a = new THREE.BufferAttribute(data.pos, 3);
    a.setUsage(THREE.DynamicDrawUsage);
    return a;
  }, [data]);

  useFrame((_, dt) => {
    for (let i = 0; i < MOTES; i++) {
      data.pos[i * 3 + 1] += data.sp[i] * dt;
      if (data.pos[i * 3 + 1] > 5.5) data.pos[i * 3 + 1] = -5.5;
    }
    attr.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geom}>
        <primitive object={attr} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color={EM_LIGHT} size={0.045} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

/* ── Pillar vignettes (System set piece) — sized to fill the open half ── */

/** 01 Website — premium foundation; a cursor drifts to the CTA and clicks. */
function PillarWebsite() {
  const cursor = useRef<THREE.Group>(null);
  const click = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime - act.since;
    const k = smooth(clamp01((t % 4.5) / 1.6));
    const cx = 1.5 + (-1.42 - 1.5) * k;
    const cy = -1.05 + (-0.32 + 1.05) * k * (1 + (1 - k) * 0.4);
    cursor.current?.position.set(cx, cy, 0.04);
    if (click.current) {
      const c = clamp01(((t % 4.5) - 1.7) / 0.7);
      click.current.visible = c > 0 && c < 1;
      click.current.scale.setScalar(0.2 + c * 1.1);
      (click.current.material as THREE.MeshBasicMaterial).opacity = (1 - c) * 0.7;
    }
  });
  return (
    <Window w={4.4} h={2.9} title="yourbusiness.com">
      {/* nav */}
      <mesh position={[-1.92, 0.98, 0]}>
        <circleGeometry args={[0.06, 14]} />
        <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <Bar w={0.5} h={0.06} color={MUT} position={[-1.55, 0.98, 0]} opacity={0.7} />
      {[1.1, 1.5, 1.9].map((x) => (
        <Bar key={x} w={0.28} h={0.05} color={LINE} position={[x, 0.98, 0]} />
      ))}
      {/* hero copy block */}
      <Bar w={2.0} h={0.17} color="#dfe9e2" position={[-0.95, 0.55, 0]} opacity={0.9} />
      <Bar w={1.55} h={0.17} color="#dfe9e2" position={[-1.18, 0.29, 0]} opacity={0.9} />
      <Bar w={1.75} h={0.07} color={MUT} position={[-1.08, 0.02, 0]} opacity={0.55} />
      <Bar w={1.35} h={0.07} color={MUT} position={[-1.28, -0.12, 0]} opacity={0.55} />
      <group position={[-1.42, -0.52, 0.01]}>
        <RPane w={1.1} h={0.36} r={0.18} color={EMERALD} border={EM_LIGHT} borderOpacity={0.5} />
        <Label text="GET A QUOTE" size={0.078} color="#eaf6ef" position={[0, 0, 0.01]} />
      </group>
      {/* hero art pane */}
      <group position={[1.18, 0.18, 0]}>
        <RPane w={1.7} h={1.46} r={0.1} color="#1b2a21" borderOpacity={0.32} />
        <mesh position={[-0.3, -0.25, 0.01]}>
          <circleGeometry args={[0.5, 3]} />
          <meshBasicMaterial color={EM_MID} transparent opacity={0.85} depthWrite={false} />
        </mesh>
        <mesh position={[0.35, -0.32, 0.012]}>
          <circleGeometry args={[0.38, 3]} />
          <meshBasicMaterial color="#2da57a" transparent opacity={0.8} depthWrite={false} />
        </mesh>
        <mesh position={[0.45, 0.4, 0.01]}>
          <circleGeometry args={[0.12, 18]} />
          <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      </group>
      {/* service cards */}
      {[-1.45, 0, 1.45].map((x, i) => (
        <PopKid key={x} delay={0.25 + i * 0.12} position={[x, -1.08, 0]}>
          <RPane w={1.26} h={0.52} r={0.08} color="#1b2a21" borderOpacity={0.3} />
          <Bar w={0.7} h={0.06} color={MUT} position={[-0.16, 0.1, 0.01]} opacity={0.7} />
          <Bar w={0.92} h={0.045} color={LINE} position={[-0.05, -0.08, 0.01]} />
        </PopKid>
      ))}
      {/* cursor + click pulse */}
      <group ref={cursor}>
        <mesh rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.05, 0.14, 3]} />
          <meshBasicMaterial color="#eaf6ef" transparent opacity={0.95} depthWrite={false} />
        </mesh>
      </group>
      <mesh ref={click} position={[-1.42, -0.52, 0.03]} visible={false}>
        <ringGeometry args={[0.3, 0.33, 32]} />
        <meshBasicMaterial color={EM_LIGHT} transparent opacity={0} depthWrite={false} />
      </mesh>
    </Window>
  );
}

/** 02 Visibility — found on Google, on maps, and in AI answers. */
function PillarVisibility() {
  const rings = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    rings.current?.children.forEach((r, i) => {
      const k = (t * 0.35 + i / 2) % 1;
      r.scale.setScalar(0.3 + k * 1.5);
      ((r as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.5;
    });
  });
  const chips: [string, number][] = [["GOOGLE", 0.55], ["MAPS", 0.0], ["AI ANSWERS", -0.55]];
  return (
    <group>
      {/* search bar with the money query */}
      <PopKid delay={0.1} position={[0, 1.5, 0.02]}>
        <RPane w={3.4} h={0.46} r={0.23} color={PANEL_2} borderOpacity={0.4} />
        <mesh position={[-1.45, 0.02, 0.01]}>
          <ringGeometry args={[0.07, 0.095, 20]} />
          <meshBasicMaterial color={MUT} transparent opacity={0.9} depthWrite={false} />
        </mesh>
        <Label text="best service company near me" size={0.105} color={MUT} position={[-1.2, 0, 0.01]} anchorX="left" />
        <group position={[1.38, 0, 0.012]}>
          <RPane w={0.5} h={0.3} r={0.15} color={EMERALD} border={EM_LIGHT} borderOpacity={0.5} />
          <Label text="#1" size={0.11} color="#eaf6ef" position={[0, 0, 0.01]} />
        </group>
      </PopKid>
      {/* map disc + pin */}
      <group position={[-0.7, -0.45, 0]}>
        <mesh rotation={[-Math.PI / 2.5, 0, 0]}>
          <circleGeometry args={[1.55, 48]} />
          <meshBasicMaterial color={PANEL_2} transparent opacity={0.55} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        {[0.6, 1.05, 1.5].map((r, i) => (
          <mesh key={r} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, 0.012 * (i + 1), 0]}>
            <torusGeometry args={[r, 0.012, 8, 64]} />
            <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.4 - i * 0.1} depthWrite={false} />
          </mesh>
        ))}
        <group ref={rings}>
          {[0, 1].map((i) => (
            <mesh key={i} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, 0.08, 0]}>
              <torusGeometry args={[1, 0.015, 8, 64]} />
              <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.4} depthWrite={false} />
            </mesh>
          ))}
        </group>
        <mesh position={[0, 0.62, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.3, 0.66, 18]} />
          <meshStandardMaterial color={EM_MID} emissive={EMERALD} emissiveIntensity={0.8} flatShading />
        </mesh>
        <mesh position={[0, 1.02, 0]}>
          <sphereGeometry args={[0.19, 18, 18]} />
          <meshStandardMaterial color={EM_LIGHT} emissive={EM_MID} emissiveIntensity={0.7} />
        </mesh>
      </group>
      {/* the three places you get found */}
      {chips.map(([c, y], i) => (
        <PopKid key={c} delay={0.35 + i * 0.15} position={[1.65, y - 0.35, 0.02]}>
          <RPane w={1.5} h={0.42} r={0.21} color={PANEL_2} borderOpacity={0.35} />
          <CheckMark position={[-0.5, 0, 0.01]} scale={0.55} />
          <Label text={c} size={0.095} position={[0.12, 0, 0.01]} />
        </PopKid>
      ))}
      <Label text="FOUND ON GOOGLE · MAPS · AI" size={0.115} position={[0, -2.0, 0]} />
    </group>
  );
}

/** 03 Lead Capture — a form fills itself and a lead lands. */
function PillarCapture() {
  const fills = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime - act.since;
    fills.current?.children.forEach((f, i) => {
      const k = smooth(clamp01((t - 0.3 - i * 0.4) * 2.2));
      f.scale.x = Math.max(0.001, k);
      f.visible = k > 0.01;
    });
  });
  const rows: [string, number, number][] = [
    ["NAME", 0.72, 1.5],
    ["PHONE", 0.22, 1.1],
    ["WHAT DO YOU NEED?", -0.28, 2.0],
  ];
  return (
    <group>
      <Window w={3.7} h={3.1} title="Request a quote">
        {rows.map(([label, y]) => (
          <group key={label} position={[0, y, 0]}>
            <Label text={label} size={0.062} color={MUT} position={[-1.5, 0.21, 0.01]} anchorX="left" />
            <RPane w={3.0} h={0.34} r={0.07} color="#1b2a21" borderOpacity={0.3} />
          </group>
        ))}
        {/* typing fills — drawn after every field pane (paint order = tree order) */}
        <group ref={fills}>
          {rows.map(([, ry, rw], j) => (
            <group key={j} position={[-1.4, ry, 0.012]}>
              <mesh position={[rw / 2, 0, 0]}>
                <planeGeometry args={[rw, 0.07]} />
                <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.75} depthWrite={false} />
              </mesh>
            </group>
          ))}
        </group>
        <PopKid delay={1.7} position={[0, -0.95, 0.01]}>
          <RPane w={3.0} h={0.42} r={0.21} color={EMERALD} border={EM_LIGHT} borderOpacity={0.55} />
          <Label text="REQUEST MY QUOTE" size={0.095} color="#eaf6ef" position={[0, 0, 0.01]} />
        </PopKid>
      </Window>
      <PopKid delay={2.2} position={[1.75, 1.85, 0.05]}>
        <RPane w={1.5} h={0.44} r={0.22} color={PANEL} border={EM_LIGHT} borderOpacity={0.6} />
        <CheckMark position={[-0.5, 0, 0.01]} scale={0.6} />
        <Label text="NEW LEAD" size={0.095} position={[0.08, 0, 0.01]} />
      </PopKid>
    </group>
  );
}

/** 04 Follow-Up — missed call recovered in seconds. */
function PillarFollowUp() {
  const dots = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    dots.current?.children.forEach((d, i) => {
      const m = (d as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.3 + (Math.sin(t * 3 - i * 0.7) * 0.5 + 0.5) * 0.6;
    });
  });
  return (
    <group>
      <PopKid delay={0.1} position={[-0.85, 1.45, 0]}>
        <ChipTag text="MISSED CALL — 2:14 PM" w={2.1} h={0.36} color={PANEL_2} textColor={MUT} border={MUT} borderOpacity={0.25} />
      </PopKid>
      <PopKid delay={0.55} position={[0.75, 0.7, 0]}>
        <RPane w={2.6} h={0.74} r={0.18} color={EMERALD} border={EM_LIGHT} borderOpacity={0.45} />
        <Label text="Sorry we missed you!" size={0.115} color="#eaf6ef" position={[0, 0.13, 0.01]} />
        <Label text="How can we help today?" size={0.115} color="#cfe9dc" position={[0, -0.14, 0.01]} />
      </PopKid>
      <PopKid delay={0.95} position={[0.75, 0.13, 0]}>
        <ChipTag text="AUTO-REPLY IN 48 SECONDS" w={2.0} h={0.3} size={0.07} />
      </PopKid>
      <PopKid delay={1.4} position={[-0.85, -0.62, 0]}>
        <RPane w={2.3} h={0.6} r={0.18} color={PANEL_2} borderOpacity={0.3} />
        <Label text="Great — I need a quote" size={0.11} color={MUT} position={[0, 0.1, 0.01]} />
        <Label text="for next week." size={0.11} color={MUT} position={[0, -0.13, 0.01]} />
      </PopKid>
      <PopKid delay={1.9} position={[0.75, -1.4, 0]}>
        <RPane w={2.4} h={0.5} r={0.18} color={EMERALD} border={EM_LIGHT} borderOpacity={0.45} />
        <Label text="Booked for Tuesday" size={0.115} color="#eaf6ef" position={[-0.18, 0, 0.01]} />
        <CheckMark position={[0.92, 0, 0.01]} scale={0.6} />
      </PopKid>
      {/* typing indicator */}
      <group ref={dots} position={[-1.7, -1.4, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[i * 0.14, 0, 0]}>
            <circleGeometry args={[0.04, 10]} />
            <meshBasicMaterial color={MUT} transparent opacity={0.5} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <Label text="NEVER MISS A CLIENT AGAIN" size={0.115} position={[0, -2.0, 0]} />
    </group>
  );
}

/** 05 Reviews & Trust — the rating grows while you watch. */
function PillarReviews() {
  return (
    <group>
      <Label text="4.9" size={0.56} color="#eaf6ef" position={[-1.35, 1.15, 0]} />
      <group position={[0.62, 1.15, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <PopKid key={i} delay={0.15 + i * 0.12} position={[(i - 2) * 0.42, 0, 0]}>
            <Star lit={i < 4} scale={1.15} />
          </PopKid>
        ))}
      </group>
      {[
        ["M", "Fixed same day — fantastic work.", 0.15, 0.45],
        ["J", "Fast quote, fair price. Hired again.", -0.85, 0.75],
      ].map(([init, line, y, d]) => (
        <PopKid key={init as string} delay={d as number} position={[0, y as number, 0]}>
          <RPane w={3.3} h={0.78} r={0.12} color={PANEL_2} borderOpacity={0.28} />
          <mesh position={[-1.35, 0.12, 0.01]}>
            <circleGeometry args={[0.14, 18]} />
            <meshBasicMaterial color={EMERALD} transparent opacity={0.95} depthWrite={false} />
          </mesh>
          <Label text={init as string} size={0.11} color="#eaf6ef" position={[-1.35, 0.12, 0.02]} />
          <group position={[-1.02, 0.14, 0.01]}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} position={[i * 0.16, 0, 0]} scale={0.42} />
            ))}
          </group>
          <Label text={line as string} size={0.1} color={MUT} position={[-1.5, -0.2, 0.01]} anchorX="left" />
        </PopKid>
      ))}
      <PopKid delay={1.1} position={[0, -1.75, 0]}>
        <ChipTag text="+6 NEW REVIEWS THIS MONTH" w={2.5} h={0.4} color={EMERALD} textColor="#eaf6ef" border={EM_LIGHT} borderOpacity={0.5} />
      </PopKid>
    </group>
  );
}

/** 06 Reporting (Deskii) — numbers that grow on stage. */
function PillarReporting() {
  const bars = useRef<THREE.Group>(null);
  const sparkDot = useRef<THREE.Mesh>(null);
  const sparkPts = useMemo(
    () => [-0.0, 0.08, 0.05, 0.2, 0.16, 0.34, 0.5].map((v, i) => [i * 0.27, v, 0] as [number, number, number]),
    []
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime - act.since;
    bars.current?.children.forEach((b, i) => {
      const k = smooth(clamp01((t - 0.35 - i * 0.12) * 2.2));
      b.scale.y = Math.max(0.001, k);
    });
    if (sparkDot.current) {
      const p = sparkPts[sparkPts.length - 1];
      const pul = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.25;
      sparkDot.current.position.set(0.62 + p[0], -0.18 + p[1], 0.02);
      sparkDot.current.scale.setScalar(pul);
    }
  });
  const heights = [0.3, 0.46, 0.4, 0.62, 0.78, 0.95];
  return (
    <Window w={4.3} h={2.95} title="This month — Deskii report">
      {/* KPI chips */}
      {[
        ["CALLS", "+31%", -1.4],
        ["LEADS", "42", 0],
        ["REVIEWS", "+6", 1.4],
      ].map(([k, v, x], i) => (
        <PopKid key={k} delay={0.15 + i * 0.12} position={[x as number, 0.82, 0.01]}>
          <RPane w={1.24} h={0.56} r={0.09} color="#1b2a21" borderOpacity={0.32} />
          <Label text={k as string} size={0.066} color={MUT} position={[0, 0.12, 0.01]} />
          <Label text={v as string} size={0.15} color={EM_LIGHT} position={[0, -0.12, 0.01]} />
        </PopKid>
      ))}
      {/* growing bar chart */}
      <group position={[-1.05, -1.18, 0.01]}>
        <Bar w={2.0} h={0.014} color={LINE} position={[0.85, 0, 0]} />
        <group ref={bars}>
          {heights.map((h, i) => (
            <group key={i} position={[i * 0.34, 0, 0]}>
              <mesh position={[0, h / 2, 0]}>
                <planeGeometry args={[0.22, h]} />
                <meshBasicMaterial color={i === heights.length - 1 ? EM_LIGHT : EM_MID} transparent opacity={0.95} depthWrite={false} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
      {/* sparkline */}
      <group position={[0.62, -0.18, 0.01]}>
        <Line points={sparkPts} color={EM_LIGHT} lineWidth={2} transparent opacity={0.85} />
      </group>
      <mesh ref={sparkDot}>
        <circleGeometry args={[0.05, 12]} />
        <meshBasicMaterial color="#eaf6ef" transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <Label text="EVERY NUMBER, VISIBLE" size={0.08} color={MUT} position={[0.62, -1.05, 0.01]} />
    </Window>
  );
}

/** 07 Custom Tools — parts dock into the workflow that needs them. */
function PillarTools() {
  const gear = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (gear.current) gear.current.rotation.z = state.clock.elapsedTime * 0.4;
  });
  const sockets: [number, number][] = [
    [-0.52, 0.52],
    [0.52, 0.52],
    [-0.52, -0.52],
    [0.52, -0.52],
  ];
  return (
    <group>
      {/* gear */}
      <group ref={gear} position={[-1.7, 0.45, 0]}>
        <mesh>
          <torusGeometry args={[0.42, 0.1, 10, 28]} />
          <meshStandardMaterial color={EM_MID} emissive={EMERALD} emissiveIntensity={0.6} flatShading transparent opacity={0.95} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.16, 0.12, 0.12]} />
              <meshStandardMaterial color={EM_MID} emissive={EMERALD} emissiveIntensity={0.6} flatShading transparent opacity={0.95} />
            </mesh>
          );
        })}
        <mesh>
          <circleGeometry args={[0.16, 18]} />
          <meshBasicMaterial color={INK_BG} transparent opacity={0.9} depthWrite={false} />
        </mesh>
      </group>
      {/* slot board with docking blocks */}
      <group position={[0.85, 0.05, 0]}>
        <RPane w={2.5} h={2.5} r={0.14} color={PANEL} borderOpacity={0.3} />
        {sockets.map(([x, y], i) => (
          <group key={i} position={[x, y, 0.01]}>
            <RPane w={0.86} h={0.86} r={0.1} color={PANEL_2} border={LINE} borderOpacity={0.8} opacity={0.6} />
            <PopKid delay={0.3 + i * 0.28}>
              <mesh rotation={[0.5, 0.65, 0]}>
                <boxGeometry args={[0.46, 0.46, 0.46]} />
                <meshStandardMaterial
                  color={i % 2 ? "#1f4434" : EM_MID}
                  emissive={i % 2 ? EM_MID : EMERALD}
                  emissiveIntensity={i % 2 ? 0.55 : 0.7}
                  flatShading
                  transparent
                  opacity={0.97}
                />
              </mesh>
            </PopKid>
          </group>
        ))}
      </group>
      <Label text="BUILT AROUND YOUR WORKFLOW" size={0.115} position={[0, -1.85, 0]} />
    </group>
  );
}

const PILLAR_VIGNETTES = [PillarWebsite, PillarVisibility, PillarCapture, PillarFollowUp, PillarReviews, PillarReporting, PillarTools];

/* ── The Deskii app showcase ────────────────────────────────────── */
function DeskiiModule({ i, label, children }: { i: number; label: string; children: React.ReactNode }) {
  const col = i % 3;
  const row = Math.floor(i / 3);
  return (
    <Fade
      when={() => SECTION_IDS[journey.sec] === "deskii" && journey.desk * 6 >= i + 0.35}
      position={[-0.9 + col * 1.4, 0.48 - row * 1.4, 0.02]}
      pop={0.2}
      speed={5.5}
    >
      <RPane w={1.3} h={1.26} r={0.1} color="#1b2a21" borderOpacity={0.45} />
      <Label text={label} size={0.075} position={[-0.56, 0.48, 0.01]} anchorX="left" />
      <Bar w={1.14} h={0.01} color={LINE} position={[0, 0.36, 0.01]} />
      <group position={[0, -0.12, 0.01]}>{children}</group>
    </Fade>
  );
}

function DeskiiApp() {
  const typing = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    typing.current?.children.forEach((d, i) => {
      const m = (d as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.25 + (Math.sin(t * 3.2 - i * 0.8) * 0.5 + 0.5) * 0.65;
    });
  });
  return (
    <group>
      <Window w={5.3} h={3.6} title="app.deskii.com">
        {/* sidebar */}
        <group position={[-2.18, -0.02, 0.005]}>
          <RPane w={0.78} h={2.95} r={0.08} color={PANEL_2} borderOpacity={0.18} opacity={0.8} />
          <mesh position={[0, 1.28, 0.01]}>
            <circleGeometry args={[0.09, 14]} />
            <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.95} depthWrite={false} />
          </mesh>
          {["PROJECTS", "TASKS", "APPROVALS", "REPORTS", "ROADMAP", "MESSAGES"].map((s, i) => (
            <group key={s} position={[0, 0.88 - i * 0.4, 0.01]}>
              <mesh position={[-0.26, 0, 0]}>
                <planeGeometry args={[0.09, 0.09]} />
                <meshBasicMaterial color={i === 0 ? EM_LIGHT : LINE} transparent opacity={0.9} depthWrite={false} />
              </mesh>
              <Label text={s} size={0.052} color={i === 0 ? EM_LIGHT : MUT} position={[-0.14, 0, 0]} anchorX="left" />
            </group>
          ))}
        </group>
        {/* header avatar + greeting */}
        <mesh position={[2.3, 1.62, 0.01]}>
          <circleGeometry args={[0.09, 14]} />
          <meshBasicMaterial color={EMERALD} transparent opacity={0.95} depthWrite={false} />
        </mesh>
      </Window>
      {/* six module cards pop in as the pin progresses */}
      <DeskiiModule i={0} label="PROJECTS">
        {[
          ["Website build", 0.78, 0.14],
          ["Local SEO", 0.45, -0.18],
        ].map(([name, k, y]) => (
          <group key={name as string} position={[0, y as number, 0]}>
            <Label text={name as string} size={0.06} color={MUT} position={[-0.54, 0.1, 0]} anchorX="left" />
            <Bar w={1.08} h={0.06} color={LINE} position={[0, -0.04, 0]} />
            <Bar w={1.08 * (k as number)} h={0.06} color={EM_MID} position={[(-1.08 * (1 - (k as number))) / 2, -0.04, 0.004]} />
          </group>
        ))}
      </DeskiiModule>
      <DeskiiModule i={1} label="TASKS">
        {[0.16, -0.08, -0.32].map((y, i) => (
          <group key={y}>
            <CheckMark position={[-0.44, y, 0]} scale={0.6} />
            <Bar w={0.62} h={0.05} color={i === 2 ? LINE : MUT} position={[0.05, y, 0]} opacity={0.7} />
          </group>
        ))}
      </DeskiiModule>
      <DeskiiModule i={2} label="APPROVALS">
        <Bar w={0.95} h={0.07} color={LINE} position={[0, 0.16, 0]} />
        <Bar w={0.7} h={0.07} color={LINE} position={[-0.12, 0.02, 0]} />
        <PopKid delay={0.5} position={[-0.24, -0.26, 0]}>
          <RPane w={0.56} h={0.22} r={0.11} color={EMERALD} border={EM_LIGHT} borderOpacity={0.5} />
          <Label text="APPROVE" size={0.055} color="#eaf6ef" position={[0, 0, 0.01]} />
        </PopKid>
        <PopKid delay={0.85} position={[0.36, -0.26, 0]}>
          <CheckMark scale={0.7} />
        </PopKid>
      </DeskiiModule>
      <DeskiiModule i={3} label="REPORTS">
        {[0.22, 0.36, 0.3, 0.52].map((h, i) => (
          <Bar key={i} w={0.16} h={h} color={i === 3 ? EM_LIGHT : EM_MID} position={[-0.34 + i * 0.24, h / 2 - 0.36, 0]} />
        ))}
        <Label text="+31%" size={0.1} color={EM_LIGHT} position={[0.36, 0.18, 0]} />
      </DeskiiModule>
      <DeskiiModule i={4} label="ROADMAP">
        <Line
          points={[
            [-0.42, 0.12, 0],
            [0, -0.04, 0],
            [0.42, -0.2, 0],
          ]}
          color={LINE}
          lineWidth={1.5}
          transparent
          opacity={0.8}
        />
        {[0, 1, 2].map((i) => (
          <group key={i} position={[-0.42 + i * 0.42, 0.12 - i * 0.16, 0.004]}>
            <mesh>
              <circleGeometry args={[0.055, 14]} />
              <meshBasicMaterial color={i === 0 ? EM_LIGHT : PANEL} transparent opacity={0.95} depthWrite={false} />
            </mesh>
            <mesh>
              <ringGeometry args={[0.05, 0.062, 14]} />
              <meshBasicMaterial color={i === 0 ? EM_LIGHT : MUT} transparent opacity={0.9} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </DeskiiModule>
      <DeskiiModule i={5} label="MESSAGES">
        <RPane w={0.86} h={0.24} r={0.1} color={PANEL} borderOpacity={0.2} position={[-0.14, 0.14, 0]} />
        <RPane w={0.72} h={0.24} r={0.1} color={EMERALD} borderOpacity={0.3} position={[0.18, -0.16, 0]} />
        <group ref={typing} position={[-0.38, -0.4, 0.01]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[i * 0.11, 0, 0]}>
              <circleGeometry args={[0.032, 10]} />
              <meshBasicMaterial color={MUT} transparent opacity={0.5} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </DeskiiModule>
    </group>
  );
}

/* ── Remaining section exhibits ─────────────────────────────────── */

/** Problem — a site built to exist: dim, no action path, leads leaking out. */
function ProblemExhibit() {
  const leak = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (tilt.current) tilt.current.rotation.z = -0.04 + Math.sin(t * 0.4) * 0.012;
    leak.current?.children.forEach((d, i) => {
      const k = (t * 0.22 + i * 0.13) % 1;
      const x = -1.1 + (i % 5) * 0.55 + Math.sin(i * 7.3) * 0.18;
      d.position.set(x, -1.35 - k * 1.3, 0.05);
      ((d as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.55;
    });
  });
  const ghostChips: [string, number, number][] = [
    ["NO FOLLOW-UP", 2.05, 0.85],
    ["NO REVIEWS", 2.15, 0.0],
    ["NO REPORTING", 2.0, -0.85],
  ];
  return (
    <group>
      <group ref={tilt} position={[-0.55, 0.15, 0]}>
        {/* the dim brochure site */}
        <RPane w={3.9} h={2.55} r={0.12} color={PANEL} border={MUT} borderOpacity={0.18} opacity={0.85} />
        <Bar w={3.86} h={0.012} color={LINE} position={[0, 1.0, 0.006]} />
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[-1.72 + i * 0.1, 1.13, 0.01]}>
            <circleGeometry args={[0.026, 12]} />
            <meshBasicMaterial color={LINE} transparent opacity={0.9} depthWrite={false} />
          </mesh>
        ))}
        <Bar w={1.9} h={0.15} color={LINE} position={[-0.75, 0.6, 0.01]} />
        <Bar w={1.4} h={0.15} color={LINE} position={[-1.0, 0.36, 0.01]} />
        <Bar w={1.6} h={0.06} color={LINE} position={[-0.9, 0.12, 0.01]} opacity={0.7} />
        <RPane w={1.3} h={1.15} r={0.08} color={PANEL_2} borderOpacity={0.12} position={[1.05, 0.18, 0.01]} opacity={0.7} />
        {/* the hole where the CTA should be */}
        <group position={[-1.18, -0.45, 0.01]}>
          <RPane w={1.15} h={0.36} r={0.18} color={PANEL} border={MUT} borderOpacity={0.3} opacity={0.25} />
          <Label text="?" size={0.16} color={MUT} position={[0, 0, 0.01]} />
        </group>
        <Bar w={3.2} h={0.05} color={LINE} position={[0, -0.95, 0.01]} opacity={0.6} />
      </group>
      {/* leads leaking out the bottom */}
      <group ref={leak}>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i}>
            <circleGeometry args={[0.045, 10]} />
            <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.5} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {/* everything it isn't connected to */}
      {ghostChips.map(([c, x, y], i) => (
        <PopKid key={c} delay={0.3 + i * 0.18} position={[x, y, 0.02]}>
          <ChipTag text={c} w={1.55} h={0.38} color={PANEL} textColor={MUT} border={MUT} borderOpacity={0.25} size={0.08} />
        </PopKid>
      ))}
      <Line
        points={[
          [1.4, 0.15, 0],
          [1.65, 0.0, 0],
        ]}
        color={MUT}
        lineWidth={1}
        dashed
        dashSize={0.07}
        gapSize={0.09}
        transparent
        opacity={0.35}
      />
      <Label text="LEADS LEAK OUT EVERY DAY" size={0.105} color={MUT} position={[0, -2.15, 0]} />
    </group>
  );
}

/** Fuel — channels feed the system: energy flows from every chip into the gem. */
function FuelExhibit() {
  const flows = useRef<THREE.Group>(null);
  const chips = ["GOOGLE ADS", "META & IG", "RETARGETING", "EMAIL · SMS", "SOCIAL", "LANDING PAGES"];
  const pos = (i: number): [number, number] => {
    const a = (i / chips.length) * Math.PI * 2 + Math.PI / 6;
    return [Math.cos(a) * 2.3, Math.sin(a) * 1.55];
  };
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    flows.current?.children.forEach((d, i) => {
      const [cx, cy] = pos(i % chips.length);
      const k = (t * 0.3 + (i * 0.37) % 1) % 1;
      d.position.set(cx * (1 - k), cy * (1 - k), 0.03);
      const m = (d as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = Math.sin(k * Math.PI) * 0.85;
      d.scale.setScalar(1 - k * 0.5);
    });
  });
  return (
    <group>
      {chips.map((c, i) => {
        const [x, y] = pos(i);
        return (
          <group key={c}>
            <Line
              points={[
                [x * 0.82, y * 0.82, 0],
                [x * 0.3, y * 0.3, 0],
              ]}
              color={EM_MID}
              lineWidth={1}
              transparent
              opacity={0.28}
            />
            <PopKid delay={0.15 + i * 0.12} position={[x, y, 0.02]}>
              <ChipTag text={c} w={1.62} h={0.46} size={0.095} borderOpacity={0.38} />
            </PopKid>
          </group>
        );
      })}
      <group ref={flows}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i}>
            <circleGeometry args={[0.05, 10]} />
            <meshBasicMaterial color={EM_LIGHT} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
      <Label text="FUEL FEEDS THE SYSTEM — NEVER THE OTHER WAY" size={0.105} position={[0, -2.25, 0]} />
    </group>
  );
}

/** Offer — the website ships WITH the system; the gem powers the build. */
function OfferExhibit() {
  const beamDot = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const k = (state.clock.elapsedTime * 0.45) % 1;
    // gem (rel +1.5, +1.3) → window CTA (rel -0.85, -0.55)
    beamDot.current?.position.set(1.5 - 2.35 * k, 1.3 - 1.85 * k, 0.06);
    if (beamDot.current)
      ((beamDot.current as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.9;
  });
  return (
    <group>
      <Window w={3.5} h={2.4} title="yourbusiness.com" position={[-0.85, -0.55, 0]}>
        <Bar w={1.7} h={0.15} color="#dfe9e2" position={[-0.6, 0.5, 0]} opacity={0.9} />
        <Bar w={1.3} h={0.15} color="#dfe9e2" position={[-0.8, 0.26, 0]} opacity={0.9} />
        <Bar w={1.5} h={0.06} color={MUT} position={[-0.7, 0.04, 0]} opacity={0.55} />
        <group position={[-1.05, -0.36, 0.01]}>
          <RPane w={0.95} h={0.32} r={0.16} color={EMERALD} border={EM_LIGHT} borderOpacity={0.5} />
          <Label text="GET A QUOTE" size={0.07} color="#eaf6ef" position={[0, 0, 0.01]} />
        </group>
        <RPane w={1.25} h={1.15} r={0.08} color="#1b2a21" borderOpacity={0.28} position={[0.95, 0.05, 0]} />
        <Bar w={2.9} h={0.05} color={LINE} position={[0, -0.85, 0]} opacity={0.7} />
      </Window>
      {/* energy from the system into the build */}
      <Line
        points={[
          [1.5, 1.3, 0],
          [-0.85, -0.55, 0],
        ]}
        color={EM_LIGHT}
        lineWidth={1}
        transparent
        opacity={0.3}
      />
      <mesh ref={beamDot}>
        <circleGeometry args={[0.06, 12]} />
        <meshBasicMaterial color={EM_LIGHT} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* the deal, plainly */}
      <PopKid delay={0.5} position={[1.3, -0.1, 0.02]}>
        <group>
          <ChipTag text="LARGE UPFRONT FEE" w={1.9} h={0.4} color={PANEL} textColor={MUT} border={MUT} borderOpacity={0.25} size={0.085} />
          <Bar w={1.7} h={0.03} color={MUT} position={[0, 0, 0.02]} opacity={0.8} />
        </group>
      </PopKid>
      <PopKid delay={0.85} position={[1.3, -0.7, 0.02]}>
        <ChipTag text="INCLUDED IN YOUR PLAN" w={2.1} h={0.46} color={EMERALD} textColor="#eaf6ef" border={EM_LIGHT} borderOpacity={0.55} size={0.092} />
      </PopKid>
      <Label text="THE BUILD COMES WITH THE SYSTEM" size={0.105} position={[0, -2.15, 0]} />
    </group>
  );
}

/** Ownership — the gem hands the keys outward to four declarations. */
function OwnershipExhibit() {
  const flows = useRef<THREE.Group>(null);
  const tags: [string, string, number, number][] = [
    ["YOUR DOMAIN", "REGISTERED TO YOU", -1.75, 1.15],
    ["YOUR CONTENT", "YOURS FROM DAY ONE", 1.75, 1.15],
    ["YOUR DATA", "EXPORTS WITH YOU, IN FULL", -1.75, -1.15],
    ["YOUR ACCOUNTS", "IN YOUR NAME", 1.75, -1.15],
  ];
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    flows.current?.children.forEach((d, i) => {
      const [, , x, y] = tags[i % 4];
      const k = (t * 0.32 + i * 0.25) % 1;
      d.position.set(x * k * 0.82, 0.25 + (y - 0.25) * k * 0.82, 0.03);
      ((d as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.8;
    });
  });
  return (
    <group>
      {tags.map(([k, sub, x, y], i) => (
        <group key={k}>
          <Line
            points={[
              [x * 0.25, 0.25 + (y - 0.25) * 0.25, 0],
              [x * 0.8, 0.25 + (y - 0.25) * 0.8, 0],
            ]}
            color={EM_MID}
            lineWidth={1}
            transparent
            opacity={0.25}
          />
          <PopKid delay={0.2 + i * 0.16} position={[x, y, 0.02]}>
            <RPane w={2.0} h={0.72} r={0.12} color={PANEL_2} borderOpacity={0.35} />
            <Label text={k} size={0.105} color="#eaf6ef" position={[0, 0.13, 0.01]} />
            <Label text={sub} size={0.066} color={MUT} position={[0, -0.15, 0.01]} />
          </PopKid>
        </group>
      ))}
      <group ref={flows}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i}>
            <circleGeometry args={[0.045, 10]} />
            <meshBasicMaterial color={EM_LIGHT} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
      <Label text="MONTH-TO-MONTH · LEAVE ANYTIME" size={0.105} position={[0, -2.15, 0]} />
    </group>
  );
}

/** Industries — five cards with built-from-primitive glyphs. */
function IndustryGlyph({ kind }: { kind: number }) {
  if (kind === 0)
    return (
      <group>
        <mesh position={[0, 0.07, 0]}>
          <circleGeometry args={[0.13, 3]} />
          <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.9} depthWrite={false} />
        </mesh>
        <Bar w={0.16} h={0.12} color={EM_LIGHT} position={[0, -0.07, 0]} opacity={0.9} />
      </group>
    );
  if (kind === 1)
    return (
      <Line
        points={[
          [-0.15, 0, 0],
          [-0.06, 0, 0],
          [-0.02, 0.12, 0],
          [0.04, -0.12, 0],
          [0.08, 0, 0],
          [0.16, 0, 0],
        ]}
        color={EM_LIGHT}
        lineWidth={2}
        transparent
        opacity={0.9}
      />
    );
  if (kind === 2) return <Star scale={0.85} />;
  if (kind === 3)
    return (
      <group>
        <Bar w={0.26} h={0.09} color={EM_LIGHT} opacity={0.9} />
        <Bar w={0.09} h={0.26} color={EM_LIGHT} opacity={0.9} />
      </group>
    );
  return (
    <group>
      <RPane w={0.26} h={0.18} r={0.03} color={EM_LIGHT} opacity={0.9} borderOpacity={0} position={[0, -0.02, 0]} />
      <Bar w={0.1} h={0.04} color={EM_LIGHT} position={[0, 0.09, 0]} opacity={0.9} />
    </group>
  );
}

function IndustriesExhibit() {
  const cards = ["HOME SERVICES", "SPORTS REHAB & WELLNESS", "MED SPAS & AESTHETICS", "DENTAL & ORTHODONTICS", "PROFESSIONAL SERVICES"];
  return (
    <group>
      {cards.map((name, i) => (
        <PopKid key={name} delay={0.15 + i * 0.13} position={[i % 2 === 0 ? -0.45 : 0.45, 1.55 - i * 0.8, 0]}>
          <RPane w={2.85} h={0.66} r={0.12} color={PANEL_2} borderOpacity={0.3} />
          <group position={[-1.15, 0, 0.01]}>
            <IndustryGlyph kind={i} />
          </group>
          <Label text={name} size={0.092} position={[-0.85, 0.07, 0.01]} anchorX="left" />
          <Bar w={1.55} h={0.04} color={LINE} position={[-0.07, -0.16, 0.01]} />
        </PopKid>
      ))}
      <Label text="BUILT FOR BUSINESSES THAT RUN ON QUALIFIED LEADS" size={0.095} position={[0, -2.0, 0]} />
    </group>
  );
}

/** Process — five cut stones ascending; a light travels the path. */
function ProcessExhibit() {
  const dot = useRef<THREE.Mesh>(null);
  const stones = useRef<THREE.Group>(null);
  const names = ["AUDIT", "STRATEGY", "BUILD", "LAUNCH", "IMPROVE"];
  const pos = (i: number): [number, number, number] => [-2.0 + i * 1.0, -0.95 + i * 0.5, 0];
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const f = ((t * 0.14) % 1) * 4;
    const i = Math.min(3, Math.floor(f));
    const a = pos(i);
    const b = pos(i + 1);
    const k = smooth(f - i);
    dot.current?.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, 0.12);
    stones.current?.children.forEach((s, j) => {
      s.rotation.y = t * 0.3 + j;
      const near = Math.max(0, 1 - Math.abs(f - j));
      s.scale.setScalar(0.34 + near * 0.06);
    });
  });
  return (
    <group>
      <Line points={names.map((_, i) => pos(i))} color={LINE} lineWidth={1.5} transparent opacity={0.8} />
      <group ref={stones}>
        {names.map((_, i) => (
          <mesh key={i} position={pos(i)} scale={0.34}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={EM_MID} emissive={EMERALD} emissiveIntensity={0.55} flatShading transparent opacity={0.97} />
          </mesh>
        ))}
      </group>
      {names.map((n, i) => (
        <PopKid key={n} delay={0.15 + i * 0.13} position={pos(i)}>
          <Billboard position={[0, 0.62, 0.05]}>
            <Label text={`${i + 1}`} size={0.15} color="#eaf6ef" />
          </Billboard>
          <Billboard position={[0, -0.52, 0.05]}>
            <Label text={n} size={0.095} />
          </Billboard>
        </PopKid>
      ))}
      <mesh ref={dot}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#eaf6ef" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <Label text="WEEKS, NOT MONTHS" size={0.105} position={[0, -2.1, 0]} />
    </group>
  );
}

/** Proof — the audit scorecard you actually receive. */
function ProofExhibit() {
  const fills = useRef<THREE.Group>(null);
  const rows: [string, number, string][] = [
    ["CONVERSION", 0.38, "38"],
    ["VISIBILITY", 0.45, "45"],
    ["FOLLOW-UP", 0.22, "22"],
    ["TRUST", 0.61, "61"],
  ];
  useFrame((state) => {
    const t = state.clock.elapsedTime - act.since;
    fills.current?.children.forEach((f, i) => {
      const k = smooth(clamp01((t - 0.4 - i * 0.18) * 1.8));
      f.scale.x = Math.max(0.001, k);
    });
  });
  return (
    <group>
      {/* the roadmap doc peeking behind */}
      <group position={[1.15, 0.55, -0.18]} rotation={[0, 0, -0.06]}>
        <RPane w={2.4} h={2.9} r={0.1} color={PANEL_2} borderOpacity={0.16} opacity={0.7} />
        {[0.95, 0.65, 0.35, 0.05, -0.25].map((y, i) => (
          <Bar key={y} w={i === 0 ? 1.2 : 1.8} h={i === 0 ? 0.1 : 0.05} color={LINE} position={[-0.1, y, 0.01]} opacity={0.8} />
        ))}
      </group>
      <Window w={4.1} h={3.05} title="Growth audit — sample">
        {rows.map(([label, , score], i) => (
          <group key={label} position={[0, 0.78 - i * 0.46, 0]}>
            <Label text={label} size={0.085} color={MUT} position={[-1.78, 0, 0.01]} anchorX="left" />
            <Bar w={1.9} h={0.1} color="#1f2e25" position={[0.25, 0, 0]} />
            <group position={[1.6, 0, 0.01]}>
              <RPane w={0.46} h={0.3} r={0.07} color="#1b2a21" borderOpacity={0.35} />
              <Label text={`${score}`} size={0.1} color={EM_LIGHT} position={[0, 0, 0.01]} />
            </group>
          </group>
        ))}
        {/* score fills — after every track bar (paint order = tree order) */}
        <group ref={fills}>
          {rows.map(([, rv], j) => (
            <group key={j} position={[-0.7, 0.78 - j * 0.46, 0.006]}>
              <mesh position={[(1.9 * rv) / 2, 0, 0]}>
                <planeGeometry args={[1.9 * rv, 0.1]} />
                <meshBasicMaterial color={EM_MID} transparent opacity={0.95} depthWrite={false} />
              </mesh>
            </group>
          ))}
        </group>
        <PopKid delay={1.3} position={[0, -1.18, 0.01]}>
          <ChipTag text="90-DAY ROADMAP INCLUDED" w={2.4} h={0.4} color={EMERALD} textColor="#eaf6ef" border={EM_LIGHT} borderOpacity={0.5} size={0.085} />
        </PopKid>
      </Window>
    </group>
  );
}

/** Plans — four tiers rise from the platform; Growth carries the glow. */
function PlansExhibit() {
  const cols = useRef<THREE.Group>(null);
  const tiers: [string, string, number][] = [
    ["FOUNDATION", "$497", 1.0],
    ["GROWTH", "$997", 1.6],
    ["SCALE", "$1,497+", 2.05],
    ["STRATEGIC", "$3,500+", 2.5],
  ];
  useFrame((state) => {
    const t = state.clock.elapsedTime - act.since;
    cols.current?.children.forEach((c, i) => {
      const k = smooth(clamp01((t - 0.25 - i * 0.16) * 2.0));
      c.scale.y = Math.max(0.001, k);
    });
  });
  return (
    <group position={[0, -1.35, 0]}>
      {/* platform */}
      <mesh rotation={[-Math.PI / 2.3, 0, 0]} position={[0, -0.08, 0]}>
        <circleGeometry args={[2.5, 56]} />
        <meshBasicMaterial color={PANEL} transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2.3, 0, 0]} position={[0, -0.06, 0]}>
        <torusGeometry args={[2.5, 0.014, 8, 72]} />
        <meshBasicMaterial color={EM_MID} transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <group ref={cols}>
        {tiers.map(([, , h], i) => (
          <group key={i} position={[-1.8 + i * 1.2, 0, 0]}>
            <mesh position={[0, h / 2, 0]}>
              <boxGeometry args={[0.78, h, 0.78]} />
              <meshStandardMaterial
                color={i === 1 ? EMERALD : PANEL_2}
                emissive={i === 1 ? EMERALD : EM_MID}
                emissiveIntensity={i === 1 ? 0.55 : 0.22}
                flatShading
                transparent
                opacity={0.97}
              />
            </mesh>
          </group>
        ))}
      </group>
      {tiers.map(([name, price, h], i) => (
        <PopKid key={name} delay={0.45 + i * 0.16} position={[-1.8 + i * 1.2, h + 0.42, 0]}>
          <Billboard>
            <Label text={price} size={0.14} color={i === 1 ? EM_LIGHT : "#dfe9e2"} position={[0, 0.1, 0]} />
            <Label text={name} size={0.075} color={MUT} position={[0, -0.14, 0]} />
          </Billboard>
        </PopKid>
      ))}
      <PopKid delay={1.2} position={[-0.6, 2.6, 0.05]}>
        <ChipTag text="MOST CHOSEN" w={1.25} h={0.34} color={EMERALD} textColor="#eaf6ef" border={EM_LIGHT} borderOpacity={0.55} size={0.075} />
      </PopKid>
      <Label text="REAL PRICES, PUBLISHED" size={0.105} position={[0, -0.75, 0]} />
    </group>
  );
}

/** Why — the operator's checklist, signed by the founder. */
function WhyExhibit() {
  const points = [
    "WEBSITES CONNECTED TO REVENUE",
    "EVERY MOVE VISIBLE IN DESKII",
    "AI WHERE IT HELPS — NEVER GENERIC",
    "CUSTOM TOOLS WHEN NEEDED",
    "FIND · CAPTURE · FOLLOW UP · TRUST",
  ];
  return (
    <group>
      <RPane w={4.2} h={2.75} r={0.14} color={PANEL} borderOpacity={0.3} position={[0, 0.35, 0]} />
      <Label text="OPERATORS, NOT TEMPLATE SELLERS" size={0.1} color="#eaf6ef" position={[0, 1.45, 0.01]} />
      <Bar w={3.8} h={0.012} color={LINE} position={[0, 1.22, 0.01]} />
      {points.map((p, i) => (
        <PopKid key={p} delay={0.2 + i * 0.14} position={[0, 0.88 - i * 0.42, 0.01]}>
          <CheckMark position={[-1.85, 0, 0]} scale={0.75} />
          <Label text={p} size={0.095} color="#dfe9e2" position={[-1.55, 0, 0]} anchorX="left" />
        </PopKid>
      ))}
      {/* founder mark */}
      <PopKid delay={1.0} position={[0, -1.75, 0]}>
        <RPane w={3.6} h={0.6} r={0.3} color={PANEL_2} borderOpacity={0.3} />
        <mesh position={[-1.5, 0, 0.01]}>
          <circleGeometry args={[0.17, 20]} />
          <meshBasicMaterial color={EMERALD} transparent opacity={0.95} depthWrite={false} />
        </mesh>
        <Label text="G" size={0.14} color="#eaf6ef" position={[-1.5, 0, 0.02]} />
        <Label text="EVERY AUDIT REVIEWED PERSONALLY" size={0.082} position={[0.18, 0, 0.01]} />
      </PopKid>
    </group>
  );
}

/** CTA — the gem arrives at the beacon; one action left to take. */
function CtaExhibit() {
  const rings = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  const chip = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    rings.current?.children.forEach((r, i) => {
      const k = (t * 0.22 + i / 3) % 1;
      r.scale.setScalar(0.5 + k * 1.9);
      ((r as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.35;
    });
    if (beam.current)
      (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(t * 1.4) * 0.04;
    chip.current?.scale.setScalar(1 + Math.sin(t * 2.2) * 0.035);
  });
  return (
    <group>
      {/* light beam under the gem */}
      <mesh ref={beam} position={[0, 0.1, -0.3]}>
        <cylinderGeometry args={[0.55, 1.05, 2.4, 24, 1, true]} />
        <meshBasicMaterial color={EM_MID} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <group ref={rings}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2.3, 0, 0]} position={[0, -1.15, 0]}>
            <torusGeometry args={[1.3, 0.014, 8, 72]} />
            <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.3} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <mesh rotation={[-Math.PI / 2.3, 0, 0]} position={[0, -1.17, 0]}>
        <circleGeometry args={[1.25, 56]} />
        <meshBasicMaterial color={PANEL} transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={chip} position={[0, -1.95, 0.05]}>
        <ChipTag text="START WITH THE FREE AUDIT" w={2.7} h={0.5} color={EMERALD} textColor="#eaf6ef" border={EM_LIGHT} borderOpacity={0.6} size={0.105} />
      </group>
      <Label text="ABOUT 90 SECONDS — WE TIMED IT" size={0.085} color={MUT} position={[0, -2.5, 0]} />
    </group>
  );
}

/* ── Exhibit stage: one Fade per section, anchored to the open side ── */
function Exhibits() {
  const at = (id: SectionId, y = -0.1): [number, number, number] => [X_SIDE(id) * AX, y, 0];
  const is = (id: SectionId) => () => SECTION_IDS[journey.sec] === id;
  const pillar = (i: number) => () =>
    SECTION_IDS[journey.sec] === "system" && Math.min(6, Math.floor(journey.sys * 7)) === i;

  return (
    <>
      <Fade when={is("problem")} position={at("problem", 0.1)}>
        <ProblemExhibit />
      </Fade>
      {PILLAR_VIGNETTES.map((V, i) => (
        <Fade key={i} when={pillar(i)} position={at("system", -0.15)} speed={5.5}>
          <V />
        </Fade>
      ))}
      <Fade when={is("fuel")} position={at("fuel", -0.1)}>
        <FuelExhibit />
      </Fade>
      <Fade when={is("deskii")} position={at("deskii", -0.05)}>
        <DeskiiApp />
      </Fade>
      <Fade when={is("offer")} position={at("offer", 0)}>
        <OfferExhibit />
      </Fade>
      {/* nudged outward so the left plaque column clears the copy tile */}
      <Fade when={is("ownership")} position={[X_SIDE("ownership") * (AX + 0.45), 0, 0]}>
        <OwnershipExhibit />
      </Fade>
      <Fade when={is("industries")} position={at("industries", -0.15)}>
        <IndustriesExhibit />
      </Fade>
      <Fade when={is("process")} position={at("process", 0)}>
        <ProcessExhibit />
      </Fade>
      <Fade when={is("proof")} position={at("proof", -0.1)}>
        <ProofExhibit />
      </Fade>
      <Fade when={is("plans")} position={at("plans", 0)}>
        <PlansExhibit />
      </Fade>
      <Fade when={is("why")} position={at("why", 0)}>
        <WhyExhibit />
      </Fade>
      <Fade when={is("cta")} position={at("cta", 0.5)}>
        <CtaExhibit />
      </Fade>
    </>
  );
}

/* ── Scene root ─────────────────────────────────────────────────── */
function World() {
  const gemLight = useRef<THREE.PointLight>(null);
  return (
    <>
      <fogExp2 attach="fog" args={[INK_BG, 0.05]} />
      <ambientLight color="#223328" intensity={0.55} />
      <directionalLight color="#eef5ef" intensity={0.75} position={[6, 10, 6]} />
      <pointLight ref={gemLight} color={EM_MID} intensity={4.2} distance={26} position={[0, 0.5, 1]} />
      <pointLight color={EM_LIGHT} intensity={1.2} distance={22} position={[-6, 3, -4]} />
      <Rig gemLight={gemLight} />
      {/* Tree order IS paint order (renderer sorting is off — see onCreated):
          background first, then gem, then the UI exhibits on top. */}
      <gridHelper args={[60, 60, "#18241c", "#101a14"]} position={[0, -2.6, -4]} />
      <Motes />
      <Gem />
      <Exhibits />
    </>
  );
}

export default function JourneyScene({
  onContextLost,
  paused = false,
}: {
  onContextLost?: () => void;
  paused?: boolean;
}) {
  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.35, 10.5], fov: 46, near: 0.1, far: 80 }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
      aria-hidden
      onCreated={({ gl }) => {
        // The exhibits are flat UI stacks at z≈0 with depthWrite off; the
        // renderer's distance sort flips layers that sit far from a panel's
        // center (camera tilt makes the margins razor-thin). Scene-graph
        // order is the intended paint order, so disable sorting outright.
        gl.sortObjects = false;
        // Two context-loss sources exist: (1) R3F's dispose force-loses the
        // context during StrictMode's dev double-mount, and the SECOND
        // renderer instance inherits the same (now dead) canvas context;
        // (2) real driver resets / GPU-starved embedded views. For both, the
        // right first move is to try restoring the context — three.js
        // rebuilds its GL state on "webglcontextrestored". Only if the
        // context stays dead do we fall back to the static page.
        const ctx = gl.getContext();
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          setTimeout(() => {
            try {
              ctx.getExtension("WEBGL_lose_context")?.restoreContext();
            } catch {
              /* extension unavailable — fall through to the check below */
            }
          }, 60);
          setTimeout(() => {
            if (gl.domElement.isConnected && ctx.isContextLost()) {
              onContextLost?.();
            }
          }, 900);
        });
      }}
    >
      <World />
    </Canvas>
  );
}
