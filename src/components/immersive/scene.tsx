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
import { Billboard, Edges, Line, Text } from "@react-three/drei";
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
  speed = 4.5,
  pop = 0.3,
  children,
}: {
  when: () => boolean;
  position?: [number, number, number];
  speed?: number;
  pop?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = when() ? 1 : 0;
    const cur = (g.userData.w as number) ?? 0;
    const w = cur + (target - cur) * Math.min(1, dt * speed);
    g.userData.w = w;
    g.visible = w > 0.02;
    if (!g.visible) return;
    const s = (0.78 + 0.22 * smooth(w)) * stage.fit;
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

/* ── Tiny vocabulary of parts ───────────────────────────────────── */
function Pane({
  w,
  h,
  color = PANEL,
  edge = EM_LIGHT,
  edgeOpacity = 0.55,
  opacity = 0.92,
  position = [0, 0, 0] as [number, number, number],
}: {
  w: number;
  h: number;
  color?: string;
  edge?: string;
  edgeOpacity?: number;
  opacity?: number;
  position?: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} />
      <Edges color={edge} transparent opacity={edgeOpacity} />
    </mesh>
  );
}

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

/** A miniature app/window frame with a chrome bar. */
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
      <Pane w={w} h={h} />
      <Bar w={w} h={0.22} color={PANEL_2} position={[0, h / 2 - 0.11, 0.005]} />
      <group position={[-w / 2 + 0.14, h / 2 - 0.11, 0.01]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[i * 0.09, 0, 0]}>
            <circleGeometry args={[0.025, 10]} />
            <meshBasicMaterial color={LINE} transparent opacity={0.9} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {title && <Label text={title} size={0.08} color={MUT} position={[0, h / 2 - 0.11, 0.01]} />}
      <group position={[0, -0.11, 0.01]}>{children}</group>
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

const GEM_POSE: Record<SectionId, { y: number; s: number; dim?: boolean }> = {
  hero: { y: 0.15, s: 1.05 },
  problem: { y: 0.35, s: 0.8, dim: true },
  system: { y: 1.75, s: 0.55 },
  fuel: { y: 1.6, s: 0.6 },
  deskii: { y: 2.0, s: 0.38 },
  offer: { y: 1.2, s: 0.5 },
  ownership: { y: 0.45, s: 0.8 },
  industries: { y: 1.75, s: 0.55 },
  process: { y: 1.75, s: 0.5 },
  proof: { y: 1.85, s: 0.5 },
  plans: { y: 1.95, s: 0.5 },
  why: { y: 1.55, s: 0.68 },
  cta: { y: 0.7, s: 0.95 },
};

function Gem() {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Sprite>(null);
  const core = useRef<THREE.MeshStandardMaterial>(null);
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
    const x = X_SIDE(id) * 2.55 * stage.fit;

    // glide
    g.position.x += (x - g.position.x) * Math.min(1, dt * 2.6);
    g.position.y += (pose.y + Math.sin(t * 0.5) * 0.06 - g.position.y) * Math.min(1, dt * 2.6);
    gemState.x = g.position.x;
    gemState.y = g.position.y;

    // beat pulse: pillar locks + deskii module pops
    const beat =
      id === "system" ? Math.floor(journey.sys * 7.0001) : id === "deskii" ? 100 + Math.floor(journey.desk * 6.0001) : -1;
    if (beat !== lastBeat.current && beat >= 0) {
      lastBeat.current = beat;
      pulse.current = 1;
    }
    pulse.current = Math.max(0, pulse.current - dt * 2.4);

    const s = pose.s * stage.fit * (1 + pulse.current * 0.1 + Math.sin(t * 1.5) * 0.015);
    g.scale.setScalar(s);
    if (spin.current) {
      spin.current.rotation.y = t * 0.18;
      spin.current.rotation.x = Math.sin(t * 0.12) * 0.1;
    }

    dim.current += ((pose.dim ? 0.35 : 1) - dim.current) * Math.min(1, dt * 3);
    if (core.current) core.current.emissiveIntensity = 0.95 * dim.current;
    if (glow.current) {
      glow.current.scale.setScalar(3.6 + pulse.current * 1.2 + Math.sin(t * 1.5) * 0.15);
      (glow.current.material as THREE.SpriteMaterial).opacity = 0.85 * dim.current;
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

  return (
    <group ref={root}>
      <group ref={spin}>
        <mesh>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial ref={core} color={EMERALD} emissive="#0a4634" emissiveIntensity={0.95} roughness={0.25} metalness={0.35} flatShading />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.38, 1]} />
          <meshBasicMaterial color={EM_LIGHT} wireframe transparent opacity={0.12} />
        </mesh>
      </group>
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

/* ── Pillar vignettes (System set piece) ────────────────────────── */
function PillarWebsite() {
  return (
    <Window w={2.5} h={1.7} title="yourbusiness.com">
      <Bar w={2.1} h={0.16} color={PANEL_2} position={[0, 0.5, 0]} />
      <Bar w={1.5} h={0.1} color={LINE} position={[-0.3, 0.26, 0]} />
      <Bar w={1.1} h={0.1} color={LINE} position={[-0.5, 0.08, 0]} />
      <Bar w={0.78} h={0.24} color={EMERALD} position={[-0.66, -0.22, 0]} />
      <Label text="GET A QUOTE" size={0.066} color="#dff0e8" position={[-0.66, -0.22, 0.01]} />
      <Bar w={0.7} h={0.5} color={PANEL_2} position={[0.7, -0.32, 0]} />
    </Window>
  );
}
function PillarVisibility() {
  return (
    <group>
      {[0.55, 0.95, 1.35].map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2.35, 0, 0]} position={[0, -0.45, 0]}>
          <torusGeometry args={[r, 0.012, 8, 64]} />
          <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.45 - i * 0.12} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.28, 0.62, 16]} />
        <meshStandardMaterial color={EM_MID} emissive={EMERALD} emissiveIntensity={0.7} flatShading />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.17, 16, 16]} />
        <meshStandardMaterial color={EM_LIGHT} emissive={EM_MID} emissiveIntensity={0.6} />
      </mesh>
      <Label text="FOUND ON GOOGLE · MAPS · AI" size={0.1} position={[0, -1.15, 0]} />
    </group>
  );
}
function PillarCapture() {
  return (
    <Window w={2.1} h={1.8} title="New request">
      {[0.42, 0.12, -0.18].map((y) => (
        <group key={y}>
          <Bar w={1.6} h={0.18} color={PANEL_2} position={[0, y, 0]} />
          <Bar w={0.7} h={0.06} color={LINE} position={[-0.4, y, 0.005]} />
        </group>
      ))}
      <Bar w={1.6} h={0.26} color={EMERALD} position={[0, -0.55, 0]} />
      <Label text="REQUEST MY QUOTE" size={0.075} color="#dff0e8" position={[0, -0.55, 0.01]} />
    </Window>
  );
}
function PillarFollowUp() {
  return (
    <group>
      <group position={[-0.45, 0.35, 0]}>
        <Pane w={1.5} h={0.42} color={PANEL_2} edgeOpacity={0.3} />
        <Label text="Missed your call —" size={0.085} color={MUT} position={[0, 0.06, 0.01]} />
        <Label text="how can we help?" size={0.085} color={MUT} position={[0, -0.09, 0.01]} />
      </group>
      <group position={[0.55, -0.25, 0]}>
        <Pane w={1.3} h={0.34} color={EMERALD} edge={EM_LIGHT} edgeOpacity={0.4} />
        <Label text="That was fast!" size={0.09} color="#dff0e8" position={[0, 0, 0.01]} />
      </group>
      <Label text="REPLY IN 48s" size={0.1} position={[0, -0.85, 0]} />
    </group>
  );
}
function PillarReviews() {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[(i - 2) * 0.42, 0.15, 0]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.26, 0.26]} />
          <meshBasicMaterial color={i < 4 ? EM_LIGHT : LINE} transparent opacity={0.95} depthWrite={false} />
        </mesh>
      ))}
      <Label text="4.9 AVERAGE · +6 THIS MONTH" size={0.1} position={[0, -0.5, 0]} />
    </group>
  );
}
function PillarReporting() {
  const heights = [0.35, 0.55, 0.42, 0.75, 0.95];
  return (
    <Window w={2.3} h={1.7} title="This month">
      {heights.map((h, i) => (
        <Bar key={i} w={0.26} h={h} color={i === 4 ? EM_LIGHT : EM_MID} position={[(i - 2) * 0.38, h / 2 - 0.6, 0]} />
      ))}
      <Label text="+31%" size={0.16} color={EM_LIGHT} position={[0.62, 0.42, 0.01]} />
    </Window>
  );
}
function PillarTools() {
  return (
    <group>
      <mesh position={[-0.35, 0.1, 0]} rotation={[0.4, 0.6, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={EM_MID} emissive={EMERALD} emissiveIntensity={0.5} flatShading transparent opacity={0.95} />
      </mesh>
      <mesh position={[0.38, 0.32, 0.2]} rotation={[0.2, 0.3, 0.4]}>
        <boxGeometry args={[0.34, 0.34, 0.34]} />
        <meshStandardMaterial color={PANEL_2} emissive={EM_MID} emissiveIntensity={0.3} flatShading transparent opacity={0.95} />
      </mesh>
      <mesh position={[0.15, -0.42, 0.1]} rotation={[-Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.34, 0.07, 8, 9]} />
        <meshStandardMaterial color={EM_MID} emissive={EMERALD} emissiveIntensity={0.5} flatShading transparent opacity={0.95} />
      </mesh>
      <Label text="BUILT TO FIT" size={0.1} position={[0, -1.0, 0]} />
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
      position={[-0.18 + (col - 1) * 1.06, 0.42 - row * 0.95, 0.02]}
      pop={0.18}
      speed={5}
    >
      <Pane w={0.96} h={0.82} color={PANEL_2} edgeOpacity={0.35} />
      <Label text={label} size={0.062} position={[-0.42, 0.3, 0.01]} anchorX="left" />
      <group position={[0, -0.08, 0.01]}>{children}</group>
    </Fade>
  );
}

function DeskiiApp() {
  return (
    <group>
      <Window w={3.7} h={2.5} title="app.deskii.com">
        {/* sidebar */}
        <group position={[-1.55, 0.06, 0.01]}>
          <Bar w={0.5} h={2.1} color={PANEL_2} position={[0, 0, -0.002]} />
          {["DASH", "TASKS", "APPR", "RPTS", "ROAD", "MSGS"].map((s, i) => (
            <Label key={s} text={s} size={0.05} color={i === 0 ? EM_LIGHT : MUT} position={[0, 0.85 - i * 0.32, 0.01]} />
          ))}
        </group>
      </Window>
      {/* six module cards pop in as the pin progresses */}
      <DeskiiModule i={0} label="PROJECTS">
        <Bar w={0.7} h={0.05} color={LINE} position={[0, 0.1, 0]} />
        <Bar w={0.5} h={0.05} color={EM_MID} position={[-0.1, 0.1, 0.003]} />
        <Bar w={0.7} h={0.05} color={LINE} position={[0, -0.08, 0]} />
        <Bar w={0.28} h={0.05} color={EM_MID} position={[-0.21, -0.08, 0.003]} />
      </DeskiiModule>
      <DeskiiModule i={1} label="TASKS">
        {[0.12, -0.06, -0.24].map((y, i) => (
          <group key={y}>
            <CheckMark position={[-0.32, y, 0]} scale={0.55} />
            <Bar w={0.42} h={0.04} color={i === 2 ? LINE : MUT} position={[0.05, y, 0]} opacity={0.7} />
          </group>
        ))}
      </DeskiiModule>
      <DeskiiModule i={2} label="APPROVALS">
        <Bar w={0.66} h={0.07} color={LINE} position={[0, 0.1, 0]} />
        <Bar w={0.3} h={0.14} color={EMERALD} position={[-0.16, -0.12, 0]} />
        <Label text="APPROVE" size={0.04} color="#dff0e8" position={[-0.16, -0.12, 0.01]} />
        <Pane w={0.26} h={0.14} color={PANEL} edgeOpacity={0.3} position={[0.2, -0.12, 0]} />
      </DeskiiModule>
      <DeskiiModule i={3} label="REPORTS">
        {[0.18, 0.3, 0.24, 0.42].map((h, i) => (
          <Bar key={i} w={0.12} h={h} color={i === 3 ? EM_LIGHT : EM_MID} position={[(i - 1.5) * 0.18, h / 2 - 0.22, 0]} />
        ))}
      </DeskiiModule>
      <DeskiiModule i={4} label="ROADMAP">
        {[0, 1, 2].map((i) => (
          <group key={i} position={[-0.25 + i * 0.25, 0.05 - i * 0.14, 0]}>
            <mesh>
              <circleGeometry args={[0.035, 12]} />
              <meshBasicMaterial color={i === 0 ? EM_LIGHT : LINE} transparent opacity={0.95} depthWrite={false} />
            </mesh>
            <Bar w={0.22} h={0.012} color={LINE} position={[0.13, -0.07, 0]} />
          </group>
        ))}
      </DeskiiModule>
      <DeskiiModule i={5} label="MESSAGES">
        <Pane w={0.6} h={0.16} color={PANEL} edgeOpacity={0.25} position={[-0.1, 0.08, 0]} />
        <Pane w={0.5} h={0.16} color={EMERALD} edgeOpacity={0.25} position={[0.12, -0.14, 0]} />
      </DeskiiModule>
    </group>
  );
}

/* ── Remaining section exhibits ─────────────────────────────────── */
function ProblemExhibit() {
  const g = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    g.current?.children.forEach((c, i) => {
      c.position.y = (i - 1) * 0.55 + Math.sin(t * 0.6 + i * 2) * 0.06;
      c.rotation.z = Math.sin(t * 0.4 + i) * 0.08 + (i - 1) * 0.12;
    });
  });
  return (
    <group>
      <group ref={g}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[(i - 1) * 0.9, (i - 1) * 0.55, (i - 1) * -0.3]}>
            <Pane w={1.5} h={0.85} color={PANEL} edge={MUT} edgeOpacity={0.25} opacity={0.7} />
            <Bar w={1.1} h={0.07} color={LINE} position={[-0.08, 0.2, 0.01]} />
            <Bar w={0.8} h={0.07} color={LINE} position={[-0.23, 0.02, 0.01]} />
          </group>
        ))}
      </group>
      <Line points={[[-1.1, 0.9, 0], [0.9, -0.7, 0]]} color={MUT} lineWidth={1} dashed dashSize={0.12} gapSize={0.16} transparent opacity={0.25} />
    </group>
  );
}

function FuelExhibit() {
  const ring = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ring.current) ring.current.rotation.z = state.clock.elapsedTime * 0.1;
  });
  const chips = ["GOOGLE ADS", "META", "RETARGETING", "EMAIL · SMS", "SOCIAL", "LANDING PAGES"];
  return (
    <group>
      <group ref={ring}>
        {chips.map((c, i) => {
          const a = (i / chips.length) * Math.PI * 2;
          return (
            <group key={c} position={[Math.cos(a) * 1.55, Math.sin(a) * 1.05, 0]} rotation={[0, 0, 0]}>
              <Pane w={0.95} h={0.3} color={PANEL_2} edgeOpacity={0.4} />
              <Billboard>
                <Label text={c} size={0.072} />
              </Billboard>
            </group>
          );
        })}
      </group>
      <Label text="FUEL FEEDS THE SYSTEM" size={0.1} position={[0, -1.7, 0]} />
    </group>
  );
}

function OfferExhibit() {
  return (
    <group>
      <Window w={2.2} h={1.5} title="yourbusiness.com" position={[-0.4, -0.2, 0]}>
        <Bar w={1.7} h={0.12} color={PANEL_2} position={[0, 0.3, 0]} />
        <Bar w={0.65} h={0.2} color={EMERALD} position={[-0.5, -0.05, 0]} />
        <Bar w={0.7} h={0.42} color={PANEL_2} position={[0.5, -0.16, 0]} />
      </Window>
      <mesh position={[1.25, 0.75, 0.3]}>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color={EMERALD} emissive="#0a4634" emissiveIntensity={0.9} roughness={0.25} flatShading />
      </mesh>
      <Line points={[[1.0, 0.55, 0.3], [0.35, 0.12, 0.05]]} color={EM_LIGHT} lineWidth={1} transparent opacity={0.5} />
      <Label text="THE BUILD COMES WITH THE SYSTEM" size={0.09} position={[0, -1.25, 0]} />
    </group>
  );
}

function OwnershipExhibit() {
  const tags = ["DOMAIN", "CONTENT", "DATA", "ACCOUNTS"];
  return (
    <group>
      {tags.map((tag, i) => {
        const a = (i / tags.length) * Math.PI * 2 + 0.6;
        return (
          <group key={tag} position={[Math.cos(a) * 1.5, Math.sin(a) * 0.95, 0.2]}>
            <Pane w={0.85} h={0.28} color={PANEL_2} edgeOpacity={0.45} />
            <Label text={tag} size={0.082} />
          </group>
        );
      })}
      <Label text="YOURS FROM DAY ONE" size={0.1} position={[0, -1.55, 0]} />
    </group>
  );
}

function IndustriesExhibit() {
  const tags = ["HOME SERVICES", "REHAB & WELLNESS", "MED SPAS", "DENTAL & ORTHO", "PRO SERVICES"];
  return (
    <group>
      {tags.map((tag, i) => (
        <group key={tag} position={[(i % 2 === 0 ? -0.62 : 0.62) * (i === 4 ? 0 : 1), 0.95 - i * 0.48, 0]}>
          <Pane w={1.5} h={0.34} color={PANEL_2} edgeOpacity={0.4} />
          <Label text={tag} size={0.085} />
        </group>
      ))}
    </group>
  );
}

function ProcessExhibit() {
  const dot = useRef<THREE.Mesh>(null);
  const steps = ["1", "2", "3", "4", "5"];
  const pos = (i: number): [number, number, number] => [(i - 2) * 0.78, Math.sin(i * 1.2) * 0.22, 0];
  useFrame((state) => {
    const t = (state.clock.elapsedTime * 0.18) % 1;
    const f = t * 4;
    const i = Math.min(3, Math.floor(f));
    const a = pos(i);
    const b = pos(i + 1);
    const k = f - i;
    dot.current?.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + 0.0, 0.06);
  });
  return (
    <group>
      <Line points={steps.map((_, i) => pos(i))} color={LINE} lineWidth={1} transparent opacity={0.7} />
      {steps.map((s, i) => (
        <group key={s} position={pos(i)}>
          <mesh rotation={[0, 0.5, 0]}>
            <boxGeometry args={[0.36, 0.36, 0.36]} />
            <meshStandardMaterial color={PANEL_2} emissive={EM_MID} emissiveIntensity={0.35} flatShading transparent opacity={0.95} />
          </mesh>
          <Billboard position={[0, 0, 0.25]}>
            <Label text={s} size={0.13} />
          </Billboard>
        </group>
      ))}
      <mesh ref={dot}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <Label text="AUDIT → STRATEGY → BUILD → LAUNCH → IMPROVE" size={0.078} position={[0, -0.85, 0]} />
    </group>
  );
}

function ProofExhibit() {
  const rows: [string, number][] = [["CONVERSION", 0.38], ["VISIBILITY", 0.45], ["FOLLOW-UP", 0.22], ["TRUST", 0.61]];
  return (
    <Window w={2.7} h={2.0} title="Growth audit — sample">
      {rows.map(([label, v], i) => (
        <group key={label} position={[0, 0.5 - i * 0.34, 0]}>
          <Label text={label} size={0.07} color={MUT} position={[-1.1, 0, 0.01]} anchorX="left" />
          <Bar w={1.1} h={0.07} color={PANEL_2} position={[0.35, 0, 0]} />
          <Bar w={1.1 * v} h={0.07} color={EM_MID} position={[0.35 - (1.1 * (1 - v)) / 2, 0, 0.004]} />
        </group>
      ))}
      <Label text="90-DAY ROADMAP INCLUDED" size={0.07} position={[0, -0.78, 0.01]} />
    </Window>
  );
}

function PlansExhibit() {
  const tiers: [string, number][] = [["$497", 0.55], ["$997", 0.85], ["$1,497", 1.15], ["$3,500", 1.5]];
  return (
    <group position={[0, -0.7, 0]}>
      {tiers.map(([price, h], i) => (
        <group key={price} position={[(i - 1.5) * 0.72, 0, 0]}>
          <mesh position={[0, h / 2, 0]}>
            <boxGeometry args={[0.5, h, 0.5]} />
            <meshStandardMaterial
              color={i === 1 ? EMERALD : PANEL_2}
              emissive={i === 1 ? EMERALD : EM_MID}
              emissiveIntensity={i === 1 ? 0.5 : 0.2}
              flatShading
              transparent
              opacity={0.95}
            />
          </mesh>
          <Billboard position={[0, h + 0.22, 0]}>
            <Label text={price} size={0.105} color={i === 1 ? EM_LIGHT : MUT} />
          </Billboard>
        </group>
      ))}
    </group>
  );
}

function WhyExhibit() {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = Math.PI * (0.15 + (i / 4) * 0.7);
        return <CheckMark key={i} position={[Math.cos(a) * 1.5, Math.sin(a) * 1.1 - 0.5, 0]} scale={1.05} />;
      })}
      <Label text="OPERATORS, NOT TEMPLATE SELLERS" size={0.09} position={[0, -1.15, 0]} />
    </group>
  );
}

function CtaExhibit() {
  const rings = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    rings.current?.children.forEach((r, i) => {
      const k = ((t * 0.25 + i / 3) % 1);
      r.scale.setScalar(0.6 + k * 1.6);
      ((r as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.3;
    });
  });
  return (
    <group>
      <group ref={rings}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2.3, 0, 0]} position={[0, -0.6, 0]}>
            <torusGeometry args={[1.1, 0.012, 8, 64]} />
            <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.25} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <Label text="START WITH THE AUDIT" size={0.11} position={[0, -1.5, 0]} />
    </group>
  );
}

/* ── Exhibit stage: one Fade per section, anchored to the open side ── */
function Exhibits() {
  const at = (id: SectionId, y = -0.1): [number, number, number] => [X_SIDE(id) * 2.55, y, 0];
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
      <Fade when={is("fuel")} position={at("fuel", -0.05)}>
        <FuelExhibit />
      </Fade>
      <Fade when={is("deskii")} position={at("deskii", -0.1)}>
        <DeskiiApp />
      </Fade>
      <Fade when={is("offer")} position={at("offer", 0)}>
        <OfferExhibit />
      </Fade>
      <Fade when={is("ownership")} position={at("ownership", 0.35)}>
        <OwnershipExhibit />
      </Fade>
      <Fade when={is("industries")} position={at("industries", -0.15)}>
        <IndustriesExhibit />
      </Fade>
      <Fade when={is("process")} position={at("process", -0.05)}>
        <ProcessExhibit />
      </Fade>
      <Fade when={is("proof")} position={at("proof", -0.1)}>
        <ProofExhibit />
      </Fade>
      <Fade when={is("plans")} position={at("plans", -0.35)}>
        <PlansExhibit />
      </Fade>
      <Fade when={is("why")} position={at("why", 0)}>
        <WhyExhibit />
      </Fade>
      <Fade when={is("cta")} position={at("cta", 0)}>
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
      <Gem />
      <Exhibits />
      <Motes />
      <gridHelper args={[60, 60, "#18241c", "#101a14"]} position={[0, -2.6, -4]} />
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
