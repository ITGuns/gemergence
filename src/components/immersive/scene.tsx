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

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Line, Text } from "@react-three/drei";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
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

/** Shared per-frame stage state (set by Rig, read by everything).
 * `mobile` = portrait phones: the gem + exhibits move to a centered band in
 * the top of the viewport (copy flows below them in the DOM), scaled up from
 * the desktop narrow-fit so the journey actually reads on a phone. */
const stage = { fit: 1, mobile: false };
/** World-space y lift for the centered mobile band. */
const M_LIFT = 1.35;

/**
 * Exhibit anchor distance from center (world units). The camera leans 0.7
 * toward the exhibit side, and the copy tile ends near world x≈0.4, so the
 * visual center of the open half sits around |x|≈4 — not 3.
 */
const AX = 4.0;

/**
 * Active-beat tracker: which section (or pillar beat within the pinned
 * System) is on stage and when it arrived (clock seconds). Lets exhibits
 * stagger child entrances and run entry-relative animations.
 */
const act = { key: "", since: 0 };

const vTmp = new THREE.Vector3();

/* ── Environment: a one-time PMREM room so faceted PBR materials pick up
 * believable reflections (the difference between "green blob" and "jewel").
 * No HDR download — RoomEnvironment is procedural. ── */
function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = tex;
    return () => {
      scene.environment = null;
      tex.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/* ── Camera + lights: calm. Drift, don't fly. ───────────────────── */
function Rig({ gemLight }: { gemLight: React.RefObject<THREE.PointLight | null> }) {
  const { camera, viewport } = useThree();
  const look = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    stage.mobile = viewport.aspect < 0.9;
    stage.fit = stage.mobile
      ? 0.46
      : clamp01((viewport.aspect - 0.4) / 1.25) * 0.7 + 0.3; // 0.3 narrow → 1 wide
    const t = state.clock.elapsedTime;
    const id = SECTION_IDS[journey.sec];
    const side = stage.mobile ? 0 : X_SIDE(id);
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
  speed = 4.2,
  pop = 0.45,
  slide = 0,
  delay = 0,
  debugId,
  children,
}: {
  when: () => boolean;
  position?: [number, number, number];
  speed?: number;
  pop?: number;
  /** Horizontal glide distance: the exhibit flows in from this x-offset. */
  slide?: number;
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
    const s = (0.7 + 0.3 * back) * 1.06 * stage.fit;
    g.scale.setScalar(s);
    g.position.set(
      stage.mobile ? (1 - k) * slide * stage.fit : (position[0] + (1 - k) * slide) * stage.fit,
      position[1] + (stage.mobile ? M_LIFT : 0) + (1 - k) * -pop,
      position[2]
    );
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

/* ── Gem emergence (built one section at a time) ─────────────────────
 * Assets stay collapsed INSIDE the gem until it finishes gliding into place,
 * then grow out — solid (scale 0→1 from a point at the gem to their resting
 * spot), no opacity fade. `gemArrive` records when the gem actually reached
 * the active section (set in the Gem component); parts only grow after that.
 */
const gemArrive = { sec: -1, beat: 0, t: 0 };

/** Beat within a 2-beat pinned chapter (0 elsewhere). */
const chapterBeat = (id: SectionId) =>
  id === "trust" ? (journey.trust < 0.5 ? 0 : 1) : 0;

/** Positions/scales a section's stage to match the rest of the site. */
function GemStage({
  position,
  children,
}: {
  position: [number, number, number];
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    if (stage.mobile) {
      // centered band in the top of the phone viewport
      g.position.set(0, position[1] + M_LIFT, position[2]);
    } else {
      g.position.set(position[0] * stage.fit, position[1], position[2]);
    }
    g.scale.setScalar(1.06 * stage.fit);
  });
  return <group ref={ref}>{children}</group>;
}

/** Position travel — the asset erupts from the gem and decelerates into its spot. */
const flyOut = (x: number) => {
  const inv = 1 - clamp01(x);
  return 1 - inv * inv * inv; // easeOutCubic: quick launch, eases into place
};

/** Scale growth — from literal nothing, a steady deliberate ramp (always visibly
 *  growing, never a pop), finishing with a gentle bloom that opens ~5% past full
 *  and settles back to exact size — a seed sprouting into a flower. */
const grow = (x: number) => {
  const p = clamp01(x);
  if (p <= 0) return 0.0001;
  if (p >= 1) return 1;
  const bloom = Math.sin(clamp01((p - 0.8) / 0.2) * Math.PI) * 0.14; // soft late bloom only
  return p + bloom;
};

/** A part that grows solidly out of the gem (stage origin) out to `to` — like a
 *  seed sprouting into a plant: a SLOW, organic scale-and-travel from a point at
 *  the gem to its resting spot. Solid the whole way; opacity is never touched. */
function GemPart({
  sec,
  to,
  from = [0, 0, 0],
  delay = 0,
  dur = 1.6,
  beat = 0,
  children,
}: {
  sec: number;
  to: [number, number, number];
  from?: [number, number, number];
  delay?: number;
  /** seconds the growth takes once this part is cleared to start (the sprout) */
  dur?: number;
  /** which beat of a 2-beat pinned chapter this part belongs to (0 elsewhere) */
  beat?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const active =
      journey.sec === sec &&
      gemArrive.sec === sec &&
      gemArrive.beat === beat &&
      chapterBeat(SECTION_IDS[sec]) === beat;
    const cur = (g.userData.w as number) ?? 0;
    let w: number;
    if (active) {
      // time-based: grow over `dur` seconds after the gem lands (+ this part's delay)
      const since = state.clock.elapsedTime - gemArrive.t - delay;
      w = Math.max(cur, clamp01(since / dur));
    } else {
      // section left → fold smoothly back toward the gem
      w = cur + (0 - cur) * Math.min(1, dt * 4);
    }
    g.userData.w = w;
    g.visible = w > 0.003;
    if (!g.visible) return;
    // flat UI must paint OVER the gem body (a part can settle right where the
    // gem sits); 3D solids keep their depth. Done once, when first shown.
    if (!g.userData.flat) {
      g.userData.flat = true;
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as
          | (THREE.Material & { opacity?: number; isMeshStandardMaterial?: boolean })
          | undefined;
        if (m && typeof m.opacity === "number" && !m.isMeshStandardMaterial) {
          m.depthTest = false;
          m.depthWrite = false;
        }
      });
    }
    // scale grows from nothing → deliberate ramp → gentle bloom; opacity untouched
    const sc = grow(w);
    g.scale.setScalar(Math.max(0.0001, sc));
    // position erupts from the gem and travels out to the resting spot
    const tr = flyOut(w);
    g.position.set(
      from[0] + (to[0] - from[0]) * tr,
      from[1] + (to[1] - from[1]) * tr,
      from[2] + (to[2] - from[2]) * tr
    );
  });
  return <group ref={ref}>{children}</group>;
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

/* ── Hi-fi screen panels: canvas-textured real UI ─────────────────
 * A ScreenPanel draws an actual interface (real type, real layout) onto an
 * offscreen canvas and maps it on a rounded pane, stacked with a soft drop
 * shadow and a glowing hairline — the difference between "schematic" and
 * "product shot". ShapeGeometry UVs equal vertex positions, so the texture
 * is remapped via repeat/offset to fit the pane exactly. */
const texShadow: { tex?: THREE.CanvasTexture } = {};
function softShadowTex() {
  if (!texShadow.tex) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 8, 64, 64, 64);
    grad.addColorStop(0, "rgba(0,0,0,0.55)");
    grad.addColorStop(0.6, "rgba(0,0,0,0.28)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    texShadow.tex = new THREE.CanvasTexture(c);
  }
  return texShadow.tex;
}

/** Rounded-rect path helper for canvas draws. */
function rrPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function ScreenPanel({
  w,
  h,
  px = 1024,
  draw,
  r = 0.1,
  glow = EM_LIGHT,
  glowOpacity = 0.3,
  shadow = true,
  position = [0, 0, 0] as [number, number, number],
}: {
  w: number;
  h: number;
  /** canvas resolution across the panel width */
  px?: number;
  draw: (g: CanvasRenderingContext2D, W: number, H: number) => void;
  r?: number;
  glow?: string;
  glowOpacity?: number;
  shadow?: boolean;
  position?: [number, number, number];
}) {
  const tex = useMemo(() => {
    const W = px;
    const H = Math.round((px * h) / w);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d")!;
    draw(g, W, H);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    // ShapeGeometry UVs = vertex positions; remap so -w/2..w/2 → 0..1
    t.repeat.set(1 / w, 1 / h);
    t.offset.set(0.5, 0.5);
    // web fonts may land after first paint — redraw crisp when ready
    document.fonts?.ready.then(() => {
      draw(g, W, H);
      t.needsUpdate = true;
    });
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, px]);
  return (
    <group position={position}>
      {shadow && (
        <mesh position={[0, -0.16, -0.01]}>
          <planeGeometry args={[w * 1.35, h * 1.35]} />
          <meshBasicMaterial map={softShadowTex()} transparent opacity={0.55} depthWrite={false} />
        </mesh>
      )}
      <mesh geometry={rrGeo(w + 0.034, h + 0.034, r + 0.017)} position={[0, 0, -0.004]}>
        <meshBasicMaterial color={glow} transparent opacity={glowOpacity} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* fog would gray the screen down 25% at stage depth — screens punch through */}
      <mesh geometry={rrGeo(w, h, r)}>
        <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}

/** A panel textured with a baked screenshot of a REAL page (2x PNG in
 *  /public/exhibits) — pixel-real websites, same shadow/glow stack. */
function ImagePanel({
  url,
  w,
  h,
  r = 0.1,
  glow = EM_LIGHT,
  glowOpacity = 0.3,
  shadow = true,
  position = [0, 0, 0] as [number, number, number],
}: {
  url: string;
  w: number;
  h: number;
  r?: number;
  glow?: string;
  glowOpacity?: number;
  shadow?: boolean;
  position?: [number, number, number];
}) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const t = new THREE.TextureLoader().load(url, () => setTex(t));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.repeat.set(1 / w, 1 / h);
    t.offset.set(0.5, 0.5);
    return () => {
      t.dispose();
    };
  }, [url, w, h]);
  return (
    <group position={position}>
      {shadow && (
        <mesh position={[0, -0.16, -0.01]}>
          <planeGeometry args={[w * 1.35, h * 1.35]} />
          <meshBasicMaterial map={softShadowTex()} transparent opacity={0.55} depthWrite={false} />
        </mesh>
      )}
      <mesh geometry={rrGeo(w + 0.034, h + 0.034, r + 0.017)} position={[0, 0, -0.004]}>
        <meshBasicMaterial color={glow} transparent opacity={glowOpacity} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rrGeo(w, h, r)}>
        <meshBasicMaterial
          map={tex}
          color={tex ? "#ffffff" : "#fbfbf8"}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
          fog={false}
        />
      </mesh>
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
type GemPose = { y: number; s: number; dx?: number; z?: number; dim?: boolean };
const GEM_POSE: Record<SectionId, GemPose> = {
  hero: { y: 0.1, s: 1.6 },
  problem: { y: 0.1, s: 0.6, dim: true },
  system: { y: 2.5, s: 0.6 },
  fuel: { y: -0.1, s: 0.85 },
  deskii: { y: 2.7, s: 0.38 },
  offer: { y: 1.2, s: 0.65, dx: -1.5 },
  industries: { y: -0.15, s: 0.62 },
  process: { y: 0, s: 0.6, z: -0.9 },
  plans: { y: 2.6, s: 0.55, z: -1.5 },
  trust: { y: 0.25, s: 1.0, dx: 0.3 },
  cta: { y: 0.8, s: 1.35 },
};
/** Second-beat pose inside the 2-beat pinned Trust chapter (why). */
const BEAT_POSE: Partial<Record<SectionId, GemPose>> = {
  trust: { y: 2.4, s: 0.55 },
};

function Gem() {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Sprite>(null);
  const core = useRef<THREE.MeshPhysicalMaterial>(null);
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
    const b = chapterBeat(id);
    const pose = (b === 1 && BEAT_POSE[id]) || GEM_POSE[id];
    const x = stage.mobile ? 0 : X_SIDE(id) * (AX + (pose.dx ?? 0)) * stage.fit;

    // glide — slow enough to read as one continuous flowing move
    const ty = pose.y + (stage.mobile ? M_LIFT : 0) + Math.sin(t * 0.5) * 0.06;
    const tz = pose.z ?? 0;
    g.position.x += (x - g.position.x) * Math.min(1, dt * 6);
    g.position.y += (ty - g.position.y) * Math.min(1, dt * 6);
    g.position.z += (tz - g.position.z) * Math.min(1, dt * 6);
    gemState.x = g.position.x;
    gemState.y = g.position.y;

    // mark the moment the gem actually reaches the active section (and beat —
    // the 2-beat pinned chapters re-glide and re-arrive per beat); exhibits
    // built on GemPart wait for this before growing out of the gem.
    if (
      (gemArrive.sec !== journey.sec || gemArrive.beat !== b) &&
      Math.abs(g.position.x - x) < 0.12 &&
      Math.abs(g.position.y - ty) < 0.12
    ) {
      gemArrive.sec = journey.sec;
      gemArrive.beat = b;
      gemArrive.t = t;
    }

    // beat pulse: section arrivals + pillar locks + deskii module pops +
    // beat flips inside the 2-beat pinned chapters
    const beat =
      id === "system"
        ? 200 + Math.floor(journey.sys * 7.0001)
        : id === "deskii"
          ? 100 + Math.floor(journey.desk * 6.0001)
          : 300 + journey.sec * 2 + b;
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
    if (core.current) core.current.emissiveIntensity = (0.75 + pulse.current * 0.5) * dim.current;
    if (heart.current) heart.current.opacity = (0.5 + Math.sin(t * 2.1) * 0.15 + pulse.current * 0.35) * dim.current;
    if (rim.current) rim.current.opacity = 0.16 * dim.current;
    if (glow.current) {
      glow.current.scale.setScalar(3.3 + pulse.current * 1.2 + Math.sin(t * 1.5) * 0.15);
      (glow.current.material as THREE.SpriteMaterial).opacity = 0.5 * dim.current;
    }
    // shockwave ring expands and fades on every beat
    if (shock.current) {
      const k = 1 - pulse.current;
      shock.current.visible = pulse.current > 0.01;
      shock.current.scale.setScalar(1.25 + k * 2.2);
      (shock.current.material as THREE.MeshBasicMaterial).opacity = pulse.current * 0.45;
    }

    // ownership (trust beat 0): facets drift out with the declarations, then re-fuse
    const ownT = id === "trust" && b === 0 ? clamp01(journey.trust * 2) : 0;
    const own = smooth(clamp01(ownT * 1.6)) * (1 - smooth(clamp01((ownT - 0.75) * 4)));
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
          <meshPhysicalMaterial
            ref={core}
            color={EMERALD}
            emissive="#0d5740"
            emissiveIntensity={0.75}
            roughness={0.12}
            metalness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.18}
            envMapIntensity={1.5}
            flatShading
          />
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
          <meshBasicMaterial color={EM_LIGHT} wireframe transparent opacity={0.09} />
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
/** 01 Website — the FIRST Growth-System pillar. Unlike the other pillars (which
 *  stay on the Fade handoff as the gem rings out), this one grows out of the gem
 *  two-tier: the browser window frame erupts from the gem, then the page contents
 *  grow out of the window's centre. The pillar-to-pillar transition still uses the
 *  same opacity fade as the others, and the gem itself is left untouched. */
function PillarWebsite() {
  const SYS = SECTION_IDS.indexOf("system");
  const W = 4.4;
  const H = 2.9;
  const cursor = useRef<THREE.Group>(null);
  const click = useRef<THREE.Mesh>(null);
  const root = useRef<THREE.Group>(null);
  const frame = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const inSys = SECTION_IDS[journey.sec] === "system";
    const pillar0 = inSys && Math.min(6, Math.floor(journey.sys * 7)) === 0;

    // sit at the pillar's spot and inherit the stage scale (matches the others)
    g.position.set(X_SIDE("system") * AX * stage.fit, -0.15, 0);
    g.scale.setScalar(1.06 * stage.fit);

    // opacity transition — the same fade the other pillars use for the handoff
    const prev = (g.userData.o as number) ?? 0;
    const o = prev + ((pillar0 ? 1 : 0) - prev) * Math.min(1, dt * 5);
    g.userData.o = o;
    g.visible = o > 0.02;
    if (!g.visible) return;
    g.traverse((obj) => {
      const m = (obj as THREE.Mesh).material as (THREE.Material & { opacity: number }) | undefined;
      if (m && typeof m.opacity === "number") {
        if (m.userData.bo === undefined) m.userData.bo = m.opacity;
        m.transparent = true;
        m.opacity = (m.userData.bo as number) * o;
      }
    });

    // two-tier grow, keyed to the gem reaching the system section (plays once)
    const gt = gemArrive.sec === SYS ? t - gemArrive.t : -1;
    const gemY = 2.65 / (1.06 * stage.fit); // the gem floats above; the frame erupts from it
    if (frame.current) {
      const w1 = clamp01(gt / 1.3);
      frame.current.scale.setScalar(Math.max(0.0001, grow(w1)));
      frame.current.position.set(0, gemY * (1 - flyOut(w1)), 0);
    }
    if (inner.current) {
      const w2 = clamp01((gt - 0.9) / 1.2);
      inner.current.scale.setScalar(Math.max(0.0001, grow(w2)));
    }

    // the demo cursor that clicks the button (runs once the page is grown)
    const ct = t - act.since;
    const ck = smooth(clamp01((ct % 4.5) / 1.6));
    cursor.current?.position.set(1.5 + (-1.56 - 1.5) * ck, -1.05 + (0.12 + 1.05) * ck * (1 + (1 - ck) * 0.4), 0.04);
    if (click.current) {
      const c = clamp01(((ct % 4.5) - 1.7) / 0.7);
      click.current.visible = c > 0 && c < 1;
      click.current.scale.setScalar(0.2 + c * 1.1);
      (click.current.material as THREE.MeshBasicMaterial).opacity = (1 - c) * 0.7;
    }
  });
  return (
    <group ref={root}>
      {/* tier 1 — the browser shell (chrome + blank paper page) grows out of the gem */}
      <group ref={frame}>
        <ScreenPanel w={W} h={H} px={1024} r={0.12} draw={drawGemfieldSitePart("shell")} glowOpacity={0.3} />
      </group>
      {/* tier 2 — the finished page content grows out of the window centre */}
      <group ref={inner} position={[0, 0, 0.01]}>
        <ImagePanel url="/exhibits/site-summit-pillar.jpg" w={W} h={H * (619 / 675)} r={0.06} glowOpacity={0} shadow={false} position={[0, -(H - H * (619 / 675)) / 2, 0]} />
        {/* cursor + click pulse — aimed at the drawn CTA */}
        <group ref={cursor}>
          <mesh rotation={[0, 0, -0.5]}>
            <coneGeometry args={[0.05, 0.14, 3]} />
            <meshBasicMaterial color="#15171a" transparent opacity={0.95} depthWrite={false} />
          </mesh>
        </group>
        <mesh ref={click} position={[-1.56, -0.02, 0.03]} visible={false}>
          <ringGeometry args={[0.3, 0.33, 32]} />
          <meshBasicMaterial color={EMERALD} transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
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
// gem floats high above the Deskii stage; window + modules erupt from this point
const DESKII_GEM_FROM: [number, number, number] = [0, 2.6, 0];

/* Real-Deskii palette (matches the product: dark navy, cyan accent). */
const DK = {
  bg: "#0b1017",
  side: "#0d131d",
  panel: "#121a26",
  line: "rgba(110,150,190,0.18)",
  cyan: "#38bdf8",
  cyanSoft: "rgba(56,189,248,0.12)",
  text: "#e7eef6",
  mut: "#7e8ea1",
  warn: "#d9b13b",
};
const DKF = (n: number, bold = false) => `${bold ? "600 " : ""}${n}px 'Helvetica Neue', Arial, sans-serif`;

/** The real Deskii shell: sidebar, welcome header, command-center banner.
 *  The content area below stays dark — the six module cards erupt into it. */
function drawDeskiiShell(g: CanvasRenderingContext2D, W: number, H: number) {
  const s = W / 1280;
  g.fillStyle = DK.bg;
  g.fillRect(0, 0, W, H);
  // ── sidebar ──
  g.fillStyle = DK.side;
  g.fillRect(0, 0, 300 * s, H);
  g.strokeStyle = DK.line;
  g.lineWidth = 1.5 * s;
  g.beginPath();
  g.moveTo(300 * s, 0);
  g.lineTo(300 * s, H);
  g.stroke();
  // logo tile
  g.strokeStyle = DK.cyan;
  g.fillStyle = DK.cyanSoft;
  rrPath(g, 22 * s, 22 * s, 44 * s, 44 * s, 10 * s);
  g.fill();
  g.stroke();
  g.fillStyle = DK.cyan;
  g.font = DKF(24 * s, true);
  g.textAlign = "center";
  g.fillText("D", 44 * s, 52 * s);
  g.textAlign = "left";
  g.fillStyle = DK.text;
  g.font = DKF(21 * s, true);
  g.fillText("Deskii", 80 * s, 42 * s);
  g.fillStyle = DK.mut;
  g.font = DKF(13 * s);
  g.fillText("Your workspace", 80 * s, 62 * s);
  // nav groups
  const group = (label: string, y: number) => {
    g.fillStyle = DK.mut;
    g.font = DKF(11 * s, true);
    g.fillText(label.toUpperCase(), 26 * s, y * s);
  };
  const item = (label: string, y: number, active = false) => {
    if (active) {
      g.strokeStyle = DK.cyan;
      g.fillStyle = DK.cyanSoft;
      rrPath(g, 16 * s, (y - 27) * s, 252 * s, 40 * s, 9 * s);
      g.fill();
      g.stroke();
    }
    g.fillStyle = active ? DK.text : DK.mut;
    g.strokeStyle = active ? DK.cyan : DK.mut;
    g.lineWidth = 1.6 * s;
    rrPath(g, 30 * s, (y - 13) * s, 14 * s, 14 * s, 3.5 * s);
    g.stroke();
    g.font = DKF(14.5 * s, active);
    g.fillText(label, 56 * s, y * s);
  };
  group("Work", 112);
  item("Dashboard", 148, true);
  item("Task Tracking", 194);
  item("Daily Logs", 240);
  item("Payroll Calendar", 286);
  item("My Payslips", 332);
  group("Company", 384);
  item("Announcements", 420);
  item("Messages & Chat", 466);
  item("File Directory", 512);
  group("Admin", 564);
  item("Operations", 600);
  item("Clients", 646);
  // sidebar footer
  g.fillStyle = DK.panel;
  g.beginPath();
  g.arc(44 * s, (870 - 52) * s, 18 * s, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = DK.text;
  g.font = DKF(14 * s, true);
  g.fillText("Admin", 72 * s, (870 - 58) * s);
  g.fillStyle = DK.mut;
  g.font = DKF(12 * s);
  g.fillText("admin@yourbusiness.com", 72 * s, (870 - 40) * s);
  // ── header ──
  g.fillStyle = DK.text;
  g.font = DKF(28 * s, true);
  g.fillText("Welcome back, Admin", 340 * s, 52 * s);
  g.fillStyle = DK.mut;
  g.font = DKF(14 * s);
  g.fillText("Your work status and next actions for today", 340 * s, 78 * s);
  // search pill
  g.strokeStyle = DK.line;
  g.lineWidth = 1.5 * s;
  rrPath(g, 830 * s, 26 * s, 190 * s, 38 * s, 9 * s);
  g.stroke();
  g.fillStyle = DK.mut;
  g.font = DKF(13.5 * s);
  g.fillText("Search", 852 * s, 50 * s);
  g.strokeStyle = DK.line;
  rrPath(g, 952 * s, 34 * s, 54 * s, 22 * s, 5 * s);
  g.stroke();
  g.font = DKF(11 * s);
  g.fillText("Ctrl K", 960 * s, 50 * s);
  // ready pill + clock in
  g.strokeStyle = DK.line;
  rrPath(g, 1036 * s, 26 * s, 92 * s, 38 * s, 9 * s);
  g.stroke();
  g.fillStyle = DK.cyan;
  g.beginPath();
  g.arc(1052 * s, 45 * s, 4 * s, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = DK.mut;
  g.font = DKF(11.5 * s, true);
  g.fillText("READY", 1064 * s, 49 * s);
  g.fillStyle = DK.cyan;
  rrPath(g, 1142 * s, 26 * s, 112 * s, 38 * s, 9 * s);
  g.fill();
  g.fillStyle = "#062333";
  g.font = DKF(14 * s, true);
  g.fillText("▶  Clock In", 1160 * s, 50 * s);
  // ── command-center banner ──
  g.strokeStyle = DK.line;
  g.fillStyle = DK.panel;
  rrPath(g, 340 * s, 104 * s, 914 * s, 140 * s, 12 * s);
  g.fill();
  g.stroke();
  g.strokeStyle = DK.cyan;
  rrPath(g, 366 * s, 124 * s, 198 * s, 26 * s, 7 * s);
  g.stroke();
  g.fillStyle = DK.cyan;
  g.font = DKF(11.5 * s, true);
  g.fillText("TEAM COMMAND CENTER", 380 * s, 141 * s);
  g.fillStyle = DK.text;
  g.font = DKF(27 * s, true);
  g.fillText("Review today before work piles up.", 366 * s, 185 * s);
  g.fillStyle = DK.mut;
  g.font = DKF(13.5 * s);
  g.fillText("Use the alerts and quick actions below to keep approvals, tasks, logs, and time entries moving.", 366 * s, 216 * s);
}

/** One real-Deskii module card face. `kind` picks the content. */
function drawDeskiiCard(title: string, kind: number) {
  return (g: CanvasRenderingContext2D, W: number, H: number) => {
    const s = W / 320;
    g.fillStyle = DK.panel;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = DK.line;
    g.lineWidth = 2 * s;
    g.strokeRect(1, 1, W - 2, H - 2);
    // icon tile + title
    g.strokeStyle = DK.cyan;
    g.fillStyle = DK.cyanSoft;
    rrPath(g, 16 * s, 14 * s, 30 * s, 30 * s, 8 * s);
    g.fill();
    g.stroke();
    g.strokeStyle = DK.cyan;
    g.lineWidth = 2 * s;
    rrPath(g, 25 * s, 23 * s, 12 * s, 12 * s, 3 * s);
    g.stroke();
    g.fillStyle = DK.text;
    g.font = DKF(15 * s, true);
    g.textAlign = "left";
    g.fillText(title, 56 * s, 34 * s);
    g.strokeStyle = DK.line;
    g.beginPath();
    g.moveTo(16 * s, 58 * s);
    g.lineTo(W - 16 * s, 58 * s);
    g.stroke();
    const track = (y: number, label: string, k: number, pct: string) => {
      g.fillStyle = DK.mut;
      g.font = DKF(12 * s);
      g.fillText(label, 18 * s, y * s);
      g.fillStyle = DK.cyan;
      g.font = DKF(12 * s, true);
      g.textAlign = "right";
      g.fillText(pct, (W - 18 * s) / s * s, y * s);
      g.textAlign = "left";
      g.fillStyle = "rgba(110,150,190,0.22)";
      rrPath(g, 18 * s, (y + 8) * s, 284 * s, 9 * s, 4.5 * s);
      g.fill();
      g.fillStyle = DK.cyan;
      rrPath(g, 18 * s, (y + 8) * s, 284 * k * s, 9 * s, 4.5 * s);
      g.fill();
    };
    if (kind === 0) {
      track(88, "Website build", 0.78, "78%");
      track(148, "Local SEO", 0.45, "45%");
      g.fillStyle = DK.mut;
      g.font = DKF(11.5 * s);
      g.fillText("2 active projects", 18 * s, 224 * s);
    }
    if (kind === 1) {
      const row = (y: number, label: string, done: boolean) => {
        g.strokeStyle = done ? DK.cyan : DK.mut;
        g.lineWidth = 1.8 * s;
        rrPath(g, 18 * s, (y - 12) * s, 15 * s, 15 * s, 4 * s);
        if (done) {
          g.fillStyle = DK.cyanSoft;
          g.fill();
        }
        g.stroke();
        if (done) {
          g.strokeStyle = DK.cyan;
          g.beginPath();
          g.moveTo(21 * s, (y - 5) * s);
          g.lineTo(25 * s, (y - 1) * s);
          g.lineTo(31 * s, (y - 10) * s);
          g.stroke();
        }
        g.fillStyle = done ? DK.mut : DK.text;
        g.font = DKF(12.5 * s);
        g.fillText(label, 44 * s, y * s);
      };
      row(92, "Publish service pages", true);
      row(136, "Connect call tracking", true);
      row(180, "Review ad copy draft", false);
      g.fillStyle = DK.mut;
      g.font = DKF(11.5 * s);
      g.fillText("2 of 3 done today", 18 * s, 224 * s);
    }
    if (kind === 2) {
      g.fillStyle = DK.text;
      g.font = DKF(13.5 * s, true);
      g.fillText("Homepage copy v2", 18 * s, 92 * s);
      g.fillStyle = DK.mut;
      g.font = DKF(12 * s);
      g.fillText("Awaiting your review", 18 * s, 112 * s);
      g.fillStyle = DK.cyan;
      rrPath(g, 18 * s, 140 * s, 108 * s, 34 * s, 8 * s);
      g.fill();
      g.fillStyle = "#062333";
      g.font = DKF(13 * s, true);
      g.fillText("Approve", 40 * s, 162 * s);
      g.strokeStyle = DK.line;
      rrPath(g, 138 * s, 140 * s, 74 * s, 34 * s, 8 * s);
      g.stroke();
      g.fillStyle = DK.mut;
      g.fillText("View", 158 * s, 162 * s);
      g.fillStyle = DK.mut;
      g.font = DKF(11.5 * s);
      g.fillText("1 pending item", 18 * s, 224 * s);
    }
    if (kind === 3) {
      const bars = [0.35, 0.55, 0.45, 0.8];
      bars.forEach((k, i) => {
        g.fillStyle = i === 3 ? DK.cyan : "rgba(56,189,248,0.4)";
        const bh = 96 * k;
        rrPath(g, (20 + i * 38) * s, (188 - bh) * s, 26 * s, bh * s, 5 * s);
        g.fill();
      });
      g.fillStyle = DK.cyan;
      g.font = DKF(26 * s, true);
      g.fillText("+31%", 186 * s, 128 * s);
      g.fillStyle = DK.mut;
      g.font = DKF(11.5 * s);
      g.fillText("calls this month", 186 * s, 150 * s);
      g.fillText("Monthly report ready", 18 * s, 224 * s);
    }
    if (kind === 4) {
      const step = (y: number, label: string, state: number) => {
        g.beginPath();
        g.arc(28 * s, y * s, 7 * s, 0, Math.PI * 2);
        if (state === 0) {
          g.fillStyle = DK.cyan;
          g.fill();
        } else {
          g.strokeStyle = state === 1 ? DK.cyan : DK.mut;
          g.lineWidth = 2 * s;
          g.stroke();
        }
        g.fillStyle = state === 2 ? DK.mut : DK.text;
        g.font = DKF(12.5 * s, state === 1);
        g.fillText(label, 50 * s, (y + 4) * s);
      };
      g.strokeStyle = DK.line;
      g.beginPath();
      g.moveTo(28 * s, 96 * s);
      g.lineTo(28 * s, 196 * s);
      g.stroke();
      step(88, "Launch site — done", 0);
      step(140, "Local SEO — in progress", 1);
      step(192, "Review engine — next", 2);
    }
    if (kind === 5) {
      g.fillStyle = "rgba(110,150,190,0.16)";
      rrPath(g, 18 * s, 76 * s, 190 * s, 34 * s, 10 * s);
      g.fill();
      g.fillStyle = DK.text;
      g.font = DKF(12.5 * s);
      g.fillText("The new site is live!", 32 * s, 98 * s);
      g.fillStyle = DK.cyanSoft;
      g.strokeStyle = DK.cyan;
      g.lineWidth = 1.5 * s;
      rrPath(g, 96 * s, 122 * s, 206 * s, 34 * s, 10 * s);
      g.fill();
      g.stroke();
      g.fillStyle = DK.text;
      g.fillText("Calls are already up.", 112 * s, 144 * s);
      // typing dots live as animated 3D children on top
    }
  };
}

function DeskiiModule({ i, label, children }: { i: number; label: string; children?: React.ReactNode }) {
  const DSK = SECTION_IDS.indexOf("deskii");
  const col = i % 3;
  const row = Math.floor(i / 3);
  // each module grows solidly out of the gem to its slot in the app's content
  // area (right of the drawn sidebar), staggered in after the shell has grown
  return (
    <GemPart sec={DSK} from={DESKII_GEM_FROM} to={[-0.73 + col * 1.35, 0.12 - row * 1.2, 0.02]} delay={1.1 + i * 0.13}>
      <ScreenPanel w={1.26} h={1.1} px={320} r={0.06} draw={drawDeskiiCard(label, i)} glow={DK.cyan} glowOpacity={0.2} shadow={false} />
      {children && <group position={[0, 0, 0.01]}>{children}</group>}
    </GemPart>
  );
}

function DeskiiApp() {
  const DSK = SECTION_IDS.indexOf("deskii");
  const typing = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    typing.current?.children.forEach((d, i) => {
      const m = (d as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.25 + (Math.sin(t * 3.2 - i * 0.8) * 0.5 + 0.5) * 0.65;
    });
  });
  return (
    <>
      {/* tier 1 — the real Deskii shell erupts out of the gem */}
      <GemPart sec={DSK} from={DESKII_GEM_FROM} to={[0, 0, 0]} delay={0}>
        <ScreenPanel w={5.3} h={3.6} px={1280} r={0.1} draw={drawDeskiiShell} glow={DK.cyan} glowOpacity={0.25} />
      </GemPart>
      {/* six module cards erupt from the gem into the dashboard grid */}
      <DeskiiModule i={0} label="Projects" />
      <DeskiiModule i={1} label="Tasks" />
      <DeskiiModule i={2} label="Approvals" />
      <DeskiiModule i={3} label="Reports" />
      <DeskiiModule i={4} label="Roadmap" />
      <DeskiiModule i={5} label="Messages">
        <group ref={typing} position={[-0.36, -0.38, 0.01]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[i * 0.09, 0, 0]}>
              <circleGeometry args={[0.026, 10]} />
              <meshBasicMaterial color={DK.cyan} transparent opacity={0.5} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </DeskiiModule>
    </>
  );
}

/* ── Remaining section exhibits ─────────────────────────────────── */

/** Problem — a site built to exist: dim, no action path, leads leaking out. */
/** The generic template site every service business gets sold — drawn as a
 *  real page (deliberately bland grays/blues; Georgia/Arial on purpose) so it
 *  reads as "their world" against the dark emerald scene. */
function drawBrochureSite(g: CanvasRenderingContext2D, W: number, H: number) {
  const s = W / 1024; // scale factor so the layout survives px changes
  // browser chrome
  g.fillStyle = "#26282c";
  g.fillRect(0, 0, W, 64 * s);
  ["#5a5f66", "#5a5f66", "#5a5f66"].forEach((c, i) => {
    g.fillStyle = c;
    g.beginPath();
    g.arc((34 + i * 30) * s, 32 * s, 8 * s, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = "#33363b";
  rrPath(g, 300 * s, 16 * s, 424 * s, 32 * s, 16 * s);
  g.fill();
  g.fillStyle = "#9aa0a8";
  g.font = `${15 * s}px Arial`;
  g.textAlign = "center";
  g.fillText("yourbusiness.com", 512 * s, 37 * s);
  // page
  g.fillStyle = "#f3f2ee";
  g.fillRect(0, 64 * s, W, H - 64 * s);
  // header
  g.fillStyle = "#2e3f57";
  g.font = `bold ${26 * s}px Arial`;
  g.textAlign = "left";
  g.fillText("ACME SERVICES", 44 * s, 118 * s);
  g.fillStyle = "#8e8e88";
  g.font = `${15 * s}px Arial`;
  g.textAlign = "right";
  g.fillText("Home      About      Services      Gallery      Contact", 980 * s, 116 * s);
  g.strokeStyle = "#e2e1db";
  g.lineWidth = 1.5 * s;
  g.beginPath();
  g.moveTo(0, 140 * s);
  g.lineTo(W, 140 * s);
  g.stroke();
  // hero band — dull gradient, centered serif welcome, no action anywhere
  const grad = g.createLinearGradient(0, 140 * s, 0, 320 * s);
  grad.addColorStop(0, "#93a0ab");
  grad.addColorStop(1, "#b8bfc6");
  g.fillStyle = grad;
  g.fillRect(0, 140 * s, W, 180 * s);
  g.fillStyle = "#ffffff";
  g.font = `italic ${38 * s}px Georgia`;
  g.textAlign = "center";
  g.fillText("Welcome To Our Website!", 512 * s, 225 * s);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.font = `${17 * s}px Georgia`;
  g.fillText("Proudly serving the community since 1987", 512 * s, 262 * s);
  // the hole where the CTA should be
  g.setLineDash([7 * s, 7 * s]);
  g.strokeStyle = "rgba(255,255,255,0.7)";
  g.lineWidth = 2 * s;
  rrPath(g, 432 * s, 282 * s, 160 * s, 30 * s, 15 * s);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = "rgba(255,255,255,0.8)";
  g.font = `${16 * s}px Georgia`;
  g.fillText("?", 512 * s, 303 * s);
  // body — real (gray) copy column + stock-photo placeholder
  g.textAlign = "left";
  g.fillStyle = "#5c5c57";
  g.font = `bold ${19 * s}px Arial`;
  g.fillText("About Our Company", 44 * s, 372 * s);
  g.fillStyle = "#a3a29b";
  g.font = `${14 * s}px Arial`;
  const lines = [
    "We are a family owned and operated business with",
    "many years of experience. Customer satisfaction is",
    "our number one priority. We offer a wide variety of",
    "services to meet all of your needs, big or small.",
    "",
    "Please browse our website to learn more about",
    "everything we can do for you and yours.",
  ];
  lines.forEach((ln, i) => g.fillText(ln, 44 * s, (402 + i * 24) * s));
  // stock photo
  g.fillStyle = "#dddcd5";
  rrPath(g, 560 * s, 352 * s, 420 * s, 220 * s, 6 * s);
  g.fill();
  g.fillStyle = "#c2c1b9";
  g.beginPath(); // mountains
  g.moveTo(600 * s, 540 * s);
  g.lineTo(720 * s, 420 * s);
  g.lineTo(800 * s, 500 * s);
  g.lineTo(860 * s, 440 * s);
  g.lineTo(950 * s, 540 * s);
  g.closePath();
  g.fill();
  g.beginPath(); // sun
  g.arc(880 * s, 400 * s, 24 * s, 0, Math.PI * 2);
  g.fill();
  // footer
  g.fillStyle = "#efeee8";
  g.fillRect(0, H - 46 * s, W, 46 * s);
  g.fillStyle = "#b0afa8";
  g.font = `${13 * s}px Arial`;
  g.textAlign = "center";
  g.fillText("© 2019 Acme Services. All Rights Reserved.", 512 * s, H - 18 * s);
}

function ProblemExhibit() {
  const PROB = SECTION_IDS.indexOf("problem");
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
    <>
      {/* the dead brochure site grows solidly out of the gem — a REAL page
          (canvas-rendered type and layout), deliberately pale and generic
          against the dark scene; the CTA hole is drawn into the hero */}
      <GemPart sec={PROB} to={[-0.55, 0.15, 0]} delay={0}>
        <group ref={tilt}>
          <ScreenPanel w={3.9} h={2.55} r={0.12} draw={drawBrochureSite} glow={MUT} glowOpacity={0.18} />
        </group>
      </GemPart>
      {/* leads leaking out the bottom — held inside the gem until it lands */}
      <GemPart sec={PROB} to={[0, 0, 0]} from={[0, 0, 0]} delay={0.18}>
        <group ref={leak}>
          {Array.from({ length: 10 }, (_, i) => (
            <mesh key={i}>
              <circleGeometry args={[0.045, 10]} />
              <meshBasicMaterial color={EM_LIGHT} transparent opacity={0.5} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </GemPart>
      {/* everything it isn't connected to — grow out of the gem to the right */}
      {ghostChips.map(([c, x, y], i) => (
        <GemPart key={c} sec={PROB} to={[x, y, 0.02]} delay={0.25 + i * 0.12}>
          <ChipTag text={c} w={1.55} h={0.38} color={PANEL} textColor={MUT} border={MUT} borderOpacity={0.25} size={0.08} />
        </GemPart>
      ))}
      {/* the dashed "not connected" link draws out of the gem in place */}
      <GemPart sec={PROB} to={[0, 0, 0]} from={[0, 0, 0]} delay={0.45}>
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
      </GemPart>
      {/* caption grows in place at the bottom, last */}
      <GemPart sec={PROB} to={[0, -2.15, 0]} from={[0, -2.15, 0]} delay={0.6}>
        <Label text="LEADS LEAK OUT EVERY DAY" size={0.105} color={MUT} position={[0, 0, 0]} />
      </GemPart>
    </>
  );
}

/** Fuel — channels feed the system: energy flows from every chip into the gem. */
function FuelExhibit() {
  const FUEL = SECTION_IDS.indexOf("fuel");
  const chips = ["GOOGLE ADS", "META & IG", "RETARGETING", "EMAIL · SMS", "SOCIAL", "LANDING PAGES"];
  const pos = (i: number): [number, number] => {
    const a = (i / chips.length) * Math.PI * 2 + Math.PI / 6;
    return [Math.cos(a) * 2.3, Math.sin(a) * 1.55];
  };
  return (
    <>
      {/* each channel chip rings out of the gem to its place, staggered */}
      {chips.map((c, i) => {
        const [x, y] = pos(i);
        return (
          <GemPart key={c} sec={FUEL} to={[x, y, 0.02]} delay={i * 0.08}>
            <ChipTag text={c} w={1.62} h={0.46} size={0.095} borderOpacity={0.38} />
          </GemPart>
        );
      })}
      {/* caption grows in place at the bottom, last */}
      <GemPart sec={FUEL} to={[0, -2.25, 0]} from={[0, -2.25, 0]} delay={0.5}>
        <Label text="FUEL FEEDS THE SYSTEM — NEVER THE OTHER WAY" size={0.105} />
      </GemPart>
    </>
  );
}

/** The site Gemfield builds — paper-and-emerald, one clear action, alive.
 *  The deliberate opposite of the dead ACME brochure in the Problem chapter. */
function drawGemfieldSitePart(part: "full" | "shell" | "content") {
  return (g: CanvasRenderingContext2D, W: number, H: number) => {
  const s = W / 1024;
  const EM = "#0e5c45";
  if (part !== "content") {
  // browser chrome
  g.fillStyle = "#26282c";
  g.fillRect(0, 0, W, 56 * s);
  [0, 1, 2].forEach((i) => {
    g.fillStyle = i === 0 ? "#2f7a5f" : "#5a5f66";
    g.beginPath();
    g.arc((32 + i * 28) * s, 28 * s, 7 * s, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = "#33363b";
  rrPath(g, 310 * s, 13 * s, 404 * s, 30 * s, 15 * s);
  g.fill();
  g.fillStyle = "#9aa0a8";
  g.font = `14px Arial`;
  g.font = `${14 * s}px Arial`;
  g.textAlign = "center";
  g.fillText("summithomeservices.com", 512 * s, 33 * s);
  // page
  g.fillStyle = "#fafaf7";
  g.fillRect(0, 56 * s, W, H - 56 * s);
  }
  if (part === "shell") return;
  // top bar: name + phone CTA (always reachable)
  g.fillStyle = "#15171a";
  g.font = `600 ${22 * s}px 'Helvetica Neue', Arial, sans-serif`;
  g.textAlign = "left";
  g.fillText("SUMMIT HOME SERVICES", 44 * s, 106 * s);
  g.fillStyle = EM;
  g.font = `600 ${17 * s}px 'Helvetica Neue', Arial, sans-serif`;
  g.textAlign = "right";
  g.fillText("(415) 555-0119", 980 * s, 104 * s);
  g.strokeStyle = "#e3e3dc";
  g.lineWidth = 1.5 * s;
  g.beginPath();
  g.moveTo(0, 128 * s);
  g.lineTo(W, 128 * s);
  g.stroke();
  // hero: strong claim + ONE clear action
  g.textAlign = "left";
  g.fillStyle = "#15171a";
  g.font = `600 ${40 * s}px Georgia, serif`;
  g.fillText("Same-day quotes.", 44 * s, 204 * s);
  g.fillText("Guaranteed work.", 44 * s, 252 * s);
  g.fillStyle = "#4a4f55";
  g.font = `${16 * s}px 'Helvetica Neue', Arial, sans-serif`;
  g.fillText("Serving the Bay Area since 2009 — licensed, insured, on time.", 44 * s, 288 * s);
  // CTA button
  g.fillStyle = EM;
  rrPath(g, 44 * s, 316 * s, 208 * s, 48 * s, 9 * s);
  g.fill();
  g.fillStyle = "#ffffff";
  g.font = `600 ${17 * s}px 'Helvetica Neue', Arial, sans-serif`;
  g.fillText("Get a Free Quote  →", 68 * s, 346 * s);
  g.fillStyle = EM;
  g.fillText("See our work", 288 * s, 346 * s);
  // review card, upper right
  g.fillStyle = "#ffffff";
  g.strokeStyle = "#e3e3dc";
  rrPath(g, 660 * s, 168 * s, 320 * s, 120 * s, 10 * s);
  g.fill();
  g.stroke();
  g.fillStyle = EM;
  g.font = `${22 * s}px Arial`;
  for (let i = 0; i < 5; i++) g.fillText("★", (688 + i * 30) * s, 216 * s);
  g.fillStyle = "#15171a";
  g.font = `600 ${17 * s}px 'Helvetica Neue', Arial, sans-serif`;
  g.fillText("4.9 · 127 reviews", 688 * s, 250 * s);
  g.fillStyle = "#8a8f94";
  g.font = `${13 * s}px 'Helvetica Neue', Arial, sans-serif`;
  g.fillText("Google · verified", 688 * s, 272 * s);
  // service tiles
  const tile = (x: number, label: string) => {
    g.fillStyle = "#ffffff";
    g.strokeStyle = "#e3e3dc";
    rrPath(g, x * s, 420 * s, 292 * s, 148 * s, 10 * s);
    g.fill();
    g.stroke();
    g.fillStyle = "#e8f1ed";
    rrPath(g, (x + 22) * s, 442 * s, 40 * s, 40 * s, 9 * s);
    g.fill();
    g.strokeStyle = EM;
    g.lineWidth = 2.2 * s;
    rrPath(g, (x + 33) * s, 453 * s, 18 * s, 18 * s, 4 * s);
    g.stroke();
    g.fillStyle = "#15171a";
    g.font = `600 ${17 * s}px 'Helvetica Neue', Arial, sans-serif`;
    g.fillText(label, (x + 22) * s, 520 * s);
    g.fillStyle = "#8a8f94";
    g.font = `${13 * s}px 'Helvetica Neue', Arial, sans-serif`;
    g.fillText("Fast, clean, warrantied", (x + 22) * s, 544 * s);
  };
  tile(44, "Roof Repair");
  tile(366, "Remodels");
  tile(688, "Emergency Calls");
  // footer trust strip
  g.fillStyle = "#f2f2ec";
  g.fillRect(0, H - 60 * s, W, 60 * s);
  g.fillStyle = "#4a4f55";
  g.font = `${14 * s}px 'Helvetica Neue', Arial, sans-serif`;
  g.textAlign = "center";
  g.fillText("Licensed & insured  ·  Same-week starts  ·  Every call answered", 512 * s, H - 24 * s);
  };
}

/** Offer — the website ships WITH the system; the gem powers the build. */
function OfferExhibit() {
  const OFR = SECTION_IDS.indexOf("offer");
  const GEM: [number, number, number] = [1.5, 1.3, 0]; // gem, upper-right (stage-local)
  const WIN: [number, number, number] = [0, -0.35, 0]; // the website's resting spot (centered)
  return (
    <>
      {/* the finished site grows solidly out of the gem — bright, alive, one
          clear action: everything the Problem chapter's brochure isn't */}
      <GemPart sec={OFR} from={GEM} to={WIN} delay={0}>
        <ImagePanel url="/exhibits/site-summit-offer.jpg" w={3.7} h={2.54} r={0.1} glowOpacity={0.35} />
      </GemPart>
      {/* the caption grows out of the built website */}
      <GemPart sec={OFR} from={WIN} to={[0, -2.05, 0]} delay={1.2}>
        <Label text="THE BUILD COMES WITH THE SYSTEM" size={0.105} position={[0, 0, 0]} />
      </GemPart>
    </>
  );
}

/** Ownership — the gem hands the keys outward to four declarations. */
function OwnershipExhibit() {
  const TRUST = SECTION_IDS.indexOf("trust");
  const tags: [string, string, number, number][] = [
    ["YOUR DOMAIN", "REGISTERED TO YOU", -1.75, 1.15],
    ["YOUR CONTENT", "YOURS FROM DAY ONE", 1.75, 1.15],
    ["YOUR DATA", "EXPORTS WITH YOU, IN FULL", -1.75, -1.15],
    ["YOUR ACCOUNTS", "IN YOUR NAME", 1.75, -1.15],
  ];
  return (
    <>
      {/* each plaque grows solidly out of the gem to its corner, staggered */}
      {tags.map(([k, sub, x, y], i) => (
        <GemPart key={k} sec={TRUST} to={[x, y, 0.02]} delay={i * 0.1}>
          <RPane w={2.0} h={0.72} r={0.12} color={PANEL_2} borderOpacity={0.35} />
          <Label text={k} size={0.105} color="#eaf6ef" position={[0, 0.13, 0.01]} />
          <Label text={sub} size={0.066} color={MUT} position={[0, -0.15, 0.01]} />
        </GemPart>
      ))}
      {/* caption grows in place at the bottom, last */}
      <GemPart sec={TRUST} to={[0, -2.4, 0]} from={[0, -2.4, 0]} delay={0.5}>
        <Label text="MONTH-TO-MONTH · LEAVE ANYTIME" size={0.105} />
      </GemPart>
    </>
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
  const IND = SECTION_IDS.indexOf("industries");
  const cards = ["HOME SERVICES", "SPORTS REHAB & WELLNESS", "MED SPAS & AESTHETICS", "DENTAL & ORTHODONTICS", "PROFESSIONAL SERVICES"];
  return (
    <>
      {/* each service card grows out of the gem to its place in the column */}
      {cards.map((name, i) => (
        <GemPart key={name} sec={IND} to={[i % 2 === 0 ? -0.45 : 0.45, 1.6 - i * 0.78, 0.02]} delay={i * 0.09}>
          <RPane w={2.85} h={0.66} r={0.12} color={PANEL_2} borderOpacity={0.3} />
          <group position={[-1.15, 0, 0.01]}>
            <IndustryGlyph kind={i} />
          </group>
          <Label text={name} size={0.092} position={[-0.85, 0.07, 0.01]} anchorX="left" />
          <Bar w={1.55} h={0.04} color={LINE} position={[-0.07, -0.16, 0.01]} />
        </GemPart>
      ))}
      <GemPart sec={IND} to={[0, -2.3, 0]} from={[0, -2.3, 0]} delay={0.6}>
        <Label text="BUILT FOR BUSINESSES THAT RUN ON QUALIFIED LEADS" size={0.095} />
      </GemPart>
    </>
  );
}

/** Process — five cut stones ascending; a light travels the path. */
function ProcessExhibit() {
  const PROC = SECTION_IDS.indexOf("process");
  const stoneRefs = useRef<(THREE.Mesh | null)[]>([]);
  const names = ["AUDIT", "STRATEGY", "BUILD", "LAUNCH", "IMPROVE"];
  const pos = (i: number): [number, number, number] => [-2.0 + i * 1.0, -0.95 + i * 0.5, 0];
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const f = ((t * 0.14) % 1) * 4;
    stoneRefs.current.forEach((s, j) => {
      if (!s) return;
      s.rotation.y = t * 0.3 + j;
      const near = Math.max(0, 1 - Math.abs(f - j));
      s.scale.setScalar(0.34 + near * 0.06);
    });
  });
  return (
    <>
      {/* the path draws out of the gem, connecting the stones */}
      <GemPart sec={PROC} to={[0, 0, 0]} from={[0, 0, 0]} delay={0.12}>
        <Line points={names.map((_, i) => pos(i))} color={LINE} lineWidth={1.5} transparent opacity={0.8} />
      </GemPart>
      {/* each cut stone grows solidly out of the gem to its place on the path,
          ascending in order; stones keep their idle spin + proximity pulse */}
      {names.map((n, i) => (
        // every stone is a normal coplanar node on the path; the gem is recessed
        // in z (GEM_POSE.process.z) so the center stone reads in front of it.
        <GemPart key={n} sec={PROC} to={pos(i)} delay={i * 0.1}>
          <mesh
            ref={(el) => {
              stoneRefs.current[i] = el;
            }}
            scale={0.34}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={EM_MID} emissive={EMERALD} emissiveIntensity={0.55} flatShading transparent opacity={0.97} />
          </mesh>
          <Billboard position={[0, 0.62, 0.05]}>
            <Label text={`${i + 1}`} size={0.15} color="#eaf6ef" />
          </Billboard>
          <Billboard position={[0, -0.52, 0.05]}>
            <Label text={n} size={0.095} />
          </Billboard>
        </GemPart>
      ))}
      {/* caption grows in place at the bottom, last */}
      <GemPart sec={PROC} to={[0, -2.1, 0]} from={[0, -2.1, 0]} delay={0.65}>
        <Label text="WEEKS, NOT MONTHS" size={0.105} position={[0, 0, 0]} />
      </GemPart>
    </>
  );
}

/** Plans — four tiers rise from the platform; Growth carries the glow. */
function PlansExhibit() {
  const PLANS = SECTION_IDS.indexOf("plans");
  const tiers: [string, string, number][] = [
    ["FOUNDATION", "$497", 1.0],
    ["GROWTH", "$997", 1.6],
    ["SCALE", "$1,497+", 2.05],
    ["STRATEGIC", "$3,500+", 2.5],
  ];
  const cx = (i: number) => -1.8 + i * 1.2;
  const base = -1.35; // platform level (the tiers' resting base)
  // the gem now floats ABOVE and BEHIND the tiers; everything grows out of it
  // (stage-local position of GEM_POSE.plans {y:2.6, z:-1.5} at stage y 0.9, fit≈1)
  const from: [number, number, number] = [0, 1.6, -1.42];
  return (
    <>
      {/* the platform grows solidly out of the gem */}
      <GemPart sec={PLANS} from={from} to={[0, base - 0.08, 0]} delay={0.05}>
        <mesh rotation={[-Math.PI / 2.3, 0, 0]}>
          <circleGeometry args={[2.5, 56]} />
          <meshBasicMaterial color={PANEL} transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2.3, 0, 0]} position={[0, 0.02, 0]}>
          <torusGeometry args={[2.5, 0.014, 8, 72]} />
          <meshBasicMaterial color={EM_MID} transparent opacity={0.3} depthWrite={false} />
        </mesh>
      </GemPart>
      {/* each tier column starts as a point at the gem and grows up into its tower */}
      {tiers.map(([, , h], i) => (
        <GemPart key={i} sec={PLANS} from={from} to={[cx(i), base + h / 2, 0]} delay={0.12 + i * 0.12}>
          <mesh>
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
        </GemPart>
      ))}
      {/* price + tier labels grow out of the gem to crown each column */}
      {tiers.map(([name, price, h], i) => (
        <GemPart key={name} sec={PLANS} from={from} to={[cx(i), base + h + 0.42, 0]} delay={0.32 + i * 0.12}>
          <Billboard>
            <Label text={price} size={0.14} color={i === 1 ? EM_LIGHT : "#dfe9e2"} position={[0, 0.1, 0]} />
            <Label text={name} size={0.075} color={MUT} position={[0, -0.14, 0]} />
          </Billboard>
        </GemPart>
      ))}
      {/* the MOST CHOSEN flag grows out of the gem, last */}
      <GemPart sec={PLANS} from={from} to={[-0.6, base + 2.6, 0.05]} delay={0.9}>
        <ChipTag text="MOST CHOSEN" w={1.25} h={0.34} color={EMERALD} textColor="#eaf6ef" border={EM_LIGHT} borderOpacity={0.55} size={0.075} />
      </GemPart>
      {/* caption grows in place at the base */}
      <GemPart sec={PLANS} to={[0, base - 0.75, 0]} from={[0, base - 0.75, 0]} delay={0.55}>
        <Label text="REAL PRICES, PUBLISHED" size={0.105} position={[0, 0, 0]} />
      </GemPart>
    </>
  );
}

/** Why — the operator's checklist, signed by the founder. */
function WhyExhibit() {
  const WHY = SECTION_IDS.indexOf("trust"); // beat 1 of the pinned Trust chapter
  const FROM_GEM: [number, number, number] = [0, 2.26, 0]; // gem floats high above the stage
  const PANEL_C: [number, number, number] = [0, 0.35, 0]; // panel centre (tier-2 origin)
  const points = [
    "WEBSITES CONNECTED TO REVENUE",
    "EVERY MOVE VISIBLE IN DESKII",
    "AI WHERE IT HELPS — NEVER GENERIC",
    "CUSTOM TOOLS WHEN NEEDED",
    "FIND · CAPTURE · FOLLOW UP · TRUST",
  ];
  return (
    <>
      {/* tier 1 — the panel (title + divider) grows out of the gem */}
      <GemPart sec={WHY} beat={1} from={FROM_GEM} to={[0, 0, 0]} delay={0}>
        <RPane w={4.2} h={2.75} r={0.14} color={PANEL} borderOpacity={0.3} position={[0, 0.35, 0]} />
        <Label text="OPERATORS, NOT TEMPLATE SELLERS" size={0.1} color="#eaf6ef" position={[0, 1.45, 0.01]} />
        <Bar w={3.8} h={0.012} color={LINE} position={[0, 1.22, 0.01]} />
      </GemPart>
      {/* tier 2 — the checklist points grow out from the panel centre */}
      {points.map((p, i) => (
        <GemPart key={p} sec={WHY} beat={1} from={PANEL_C} to={[0, 0.88 - i * 0.42, 0.01]} delay={1.2 + i * 0.12}>
          <CheckMark position={[-1.85, 0, 0]} scale={0.75} />
          <Label text={p} size={0.095} color="#dfe9e2" position={[-1.55, 0, 0]} anchorX="left" />
        </GemPart>
      ))}
      {/* the founder mark grows out from the panel centre, last */}
      <GemPart sec={WHY} beat={1} from={PANEL_C} to={[0, -1.75, 0]} delay={1.9}>
        <RPane w={3.6} h={0.6} r={0.3} color={PANEL_2} borderOpacity={0.3} />
        <mesh position={[-1.5, 0, 0.01]}>
          <circleGeometry args={[0.17, 20]} />
          <meshBasicMaterial color={EMERALD} transparent opacity={0.95} depthWrite={false} />
        </mesh>
        <Label text="G" size={0.14} color="#eaf6ef" position={[-1.5, 0, 0.02]} />
        <Label text="EVERY AUDIT REVIEWED PERSONALLY" size={0.082} position={[0.18, 0, 0.01]} />
      </GemPart>
    </>
  );
}

/** CTA — the gem arrives at the beacon; the beacon assembles out of it. */
function CtaExhibit() {
  const CTA = SECTION_IDS.indexOf("cta");
  const chip = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    chip.current?.scale.setScalar(1 + Math.sin(t * 2.2) * 0.035);
  });
  return (
    <>
      {/* the one action — grows out, then breathes */}
      <GemPart sec={CTA} to={[0, -1.95, 0.05]} delay={0.4}>
        <group ref={chip}>
          <ChipTag text="START WITH THE FREE AUDIT" w={2.7} h={0.5} color={EMERALD} textColor="#eaf6ef" border={EM_LIGHT} borderOpacity={0.6} size={0.105} />
        </group>
      </GemPart>
      {/* caption grows in place, last */}
      <GemPart sec={CTA} to={[0, -2.5, 0]} from={[0, -2.5, 0]} delay={0.55}>
        <Label text="ABOUT 90 SECONDS — WE TIMED IT" size={0.085} color={MUT} position={[0, 0, 0]} />
      </GemPart>
    </>
  );
}

/* ── Exhibit stage: one Fade per section, anchored to the open side ── */
function Exhibits() {
  const at = (id: SectionId, y = -0.1): [number, number, number] => [X_SIDE(id) * AX, y, 0];
  const is = (id: SectionId) => () => SECTION_IDS[journey.sec] === id;
  /** Exhibits flow in from the screen edge toward their anchor. */
  const sl = (id: SectionId) => X_SIDE(id) * 0.7;
  const pillar = (i: number) => () =>
    SECTION_IDS[journey.sec] === "system" && Math.min(6, Math.floor(journey.sys * 7)) === i;

  return (
    <>
      {/* PROBLEM — rebuilt: the brochure panel + ghost chips grow solidly out
          of the gem once it arrives (gem re-centered onto the content). */}
      <GemStage position={[X_SIDE("problem") * AX, 0.1, 0]}>
        <ProblemExhibit />
      </GemStage>
      {PILLAR_VIGNETTES.map((V, i) =>
        i === 0 ? (
          // first pillar (Website) grows out of the gem; it positions + fades itself
          <V key={i} />
        ) : (
          <Fade key={i} when={pillar(i)} position={at("system", -0.15)} speed={5} pop={0.35}>
            <V />
          </Fade>
        )
      )}
      {/* FUEL — rebuilt: chips ring out of the gem once it arrives. */}
      <GemStage position={[X_SIDE("fuel") * AX, -0.1, 0]}>
        <FuelExhibit />
      </GemStage>
      {/* DESKII — rebuilt: the app window grows out of the gem (two-tier) and all
          six module cards erupt from the gem into the dashboard grid. */}
      <GemStage position={[X_SIDE("deskii") * AX, -0.05, 0]}>
        <DeskiiApp />
      </GemStage>
      {/* OFFER — rebuilt: the website grows out of the gem (all at once), then the
          deal chips + caption grow out of the website; the gem keeps its beam. */}
      <GemStage position={[X_SIDE("offer") * AX, 0, 0]}>
        <OfferExhibit />
      </GemStage>
      {/* OWNERSHIP (trust beat 0) — plaques grow solidly out of the gem once
          it arrives (stage sits on the gem's resting spot). */}
      <GemStage position={[X_SIDE("trust") * (AX + 0.3), 0.25, 0]}>
        <OwnershipExhibit />
      </GemStage>
      {/* INDUSTRIES — rebuilt: cards grow out of the gem (re-centered onto the
          card column for this section). */}
      <GemStage position={[X_SIDE("industries") * AX, -0.15, 0]}>
        <IndustriesExhibit />
      </GemStage>
      {/* PROCESS — rebuilt: the path + cut stones grow out of the gem once it
          arrives (gem re-centered onto the path). */}
      <GemStage position={[X_SIDE("process") * AX, 0, 0]}>
        <ProcessExhibit />
      </GemStage>
      {/* PLANS — platform + tier columns rise in the open upper-right, clear
          of the DOM pricing cards that now span the lower half. */}
      <GemStage position={[X_SIDE("plans") * AX, 0.9, 0]}>
        <PlansExhibit />
      </GemStage>
      {/* WHY (trust beat 1) — the panel grows out of the gem (two-tier), then
          the checklist points + founder mark grow out from the panel centre. */}
      <GemStage position={[X_SIDE("trust") * AX, 0, 0]}>
        <WhyExhibit />
      </GemStage>
      {/* CTA — rebuilt: the beacon (beam, platform, rings, chip) assembles out
          of the gem once it arrives. Gem stays at its finale pose. */}
      <GemStage position={[X_SIDE("cta") * AX, 0.5, 0]}>
        <CtaExhibit />
      </GemStage>
    </>
  );
}

/* ── Scene root ─────────────────────────────────────────────────── */
function World() {
  const gemLight = useRef<THREE.PointLight>(null);
  return (
    <>
      <fogExp2 attach="fog" args={[INK_BG, 0.05]} />
      <ambientLight color="#223328" intensity={0.5} />
      <directionalLight color="#eef5ef" intensity={1.05} position={[6, 10, 6]} />
      {/* cool back-left kicker: gives the far facets an edge so the cut reads */}
      <directionalLight color="#bfe8d6" intensity={0.35} position={[-8, 4, -6]} />
      <pointLight ref={gemLight} color={EM_MID} intensity={4.2} distance={26} position={[0, 0.5, 1]} />
      <pointLight color={EM_LIGHT} intensity={1.2} distance={22} position={[-6, 3, -4]} />
      <Env />
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
