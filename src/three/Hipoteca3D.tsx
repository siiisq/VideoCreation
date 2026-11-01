import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { display } from "../fonts";
import { ANIM_FPS, useFrame } from "../time";

/*
 * PRUEBA 3D real con @remotion/three: gancho de la hipoteca (casa + pilas de monedas + marcador).
 * Todo se anima con el fotograma de Remotion (nunca con el useFrame de react-three-fiber).
 * Materiales físicos (metal, pintura, tejas) + luz de estudio generada (RoomEnvironment) + sombras suaves.
 */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const fps = ANIM_FPS;

/** Ilumina la escena con un entorno de estudio (reflejos realistas en el metal) y pone el fondo. */
const Studio: React.FC = () => {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.45;
    scene.background = new THREE.Color("#0b0c0f");
    scene.fog = new THREE.Fog("#0b0c0f", 14, 30);
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.9;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    return () => { env.dispose(); pm.dispose(); };
  }, [gl, scene]);
  return null;
};

/** Cámara de grúa: baja y se acerca mientras gira un poco alrededor de la casa. */
const CraneCamera: React.FC<{ t: number }> = ({ t }) => {
  const { camera } = useThree();
  const p = interpolate(t, [0, 150], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) });
  const ang = -0.5 + p * 0.45;
  const r = 21 - p * 5;
  camera.position.set(Math.sin(ang) * r + 0.3, 8 - p * 4, Math.cos(ang) * r);
  camera.lookAt(0.3, 2.9 - p * 0.3, 0);
  camera.updateProjectionMatrix();
  return null;
};

/** Moneda con canto estriado: perfil de torno (borde elevado), metal pulido. */
const coinGeo = (() => {
  const pts = [
    [0, 0.0], [0.42, 0.0], [0.5, 0.01], [0.5, 0.11], [0.42, 0.12], [0.4, 0.105], [0, 0.105],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 72);
})();

/** Textura dibujada en un canvas (sin descargas): listones, tejas, baldosas… */
const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat: [number, number]) => {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  draw(cv.getContext("2d")!);
  const tx = new THREE.CanvasTexture(cv); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(...repeat); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  return tx;
};
const noise = (c: CanvasRenderingContext2D, w: number, h: number, a: number) => {
  for (let i = 0; i < w * h * 0.02; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * a})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
};

const House: React.FC<{ t: number }> = ({ t }) => {
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(256, 256, (c) => {
    c.fillStyle = "#d8c3a0"; c.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) { const g = c.createLinearGradient(0, y, 0, y + 32); g.addColorStop(0, "#e4d1b0"); g.addColorStop(1, "#bfa67f"); c.fillStyle = g; c.fillRect(0, y, 256, 30); }
    noise(c, 256, 256, 0.12);
  }, [2, 2]) }), []);
  const roof = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05, map: canvasTex(256, 256, (c) => {
    c.fillStyle = "#4a1810"; c.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 8; row++) for (let col = -1; col < 9; col++) {
      const x = col * 32 + (row % 2) * 16, y = row * 32;
      const g = c.createRadialGradient(x + 12, y + 8, 2, x + 16, y + 16, 22); g.addColorStop(0, "#a8442f"); g.addColorStop(1, "#5e2016");
      c.fillStyle = g; c.beginPath(); c.roundRect(x + 1, y + 1, 30, 30, [0, 0, 14, 14]); c.fill();
    }
    noise(c, 256, 256, 0.15);
  }, [3, 2]) }), []);
  const roofGeo = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(-1.75, 0); s.lineTo(0, 1.35); s.lineTo(1.75, 0); s.lineTo(-1.75, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 3.0, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
    g.translate(0, 0, -1.5); return g;
  }, []);
  const flicker = 1 + Math.sin(t / 7) * 0.05;
  return (
    <group position={[-1.1, 0, -0.4]} scale={0.85}>
      <mesh castShadow receiveShadow position={[0, 1.1, 0]} material={wall}><boxGeometry args={[3.2, 2.2, 2.6]} /></mesh>
      <mesh castShadow position={[0, 2.2, 0]} material={roof} geometry={roofGeo} />
      <mesh castShadow position={[0.8, 3.1, -0.4]} material={roof}><boxGeometry args={[0.35, 0.8, 0.35]} /></mesh>
      {/* ventanas con luz cálida */}
      {[-0.8, 0.8].map((x) => (
        <group key={x} position={[x, 1.35, 1.31]}>
          <mesh><planeGeometry args={[0.7, 0.7]} /><meshStandardMaterial color="#ffcf73" emissive="#ffb347" emissiveIntensity={2.2 * flicker} /></mesh>
          <mesh position={[0, 0, 0.01]}><boxGeometry args={[0.06, 0.72, 0.02]} /><meshStandardMaterial color="#5a4128" /></mesh>
          <mesh position={[0, 0, 0.01]}><boxGeometry args={[0.72, 0.06, 0.02]} /><meshStandardMaterial color="#5a4128" /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.55, 1.31]}><planeGeometry args={[0.6, 1.1]} /><meshStandardMaterial color="#5a3a22" roughness={0.6} /></mesh>
      <pointLight position={[0, 1.4, 2.2]} color="#ffb347" intensity={6 * flicker} distance={6} />
    </group>
  );
};

/** Pila de monedas que cae una a una (muelle) a partir de `start`. */
const CoinStack: React.FC<{ t: number; x: number; z: number; n: number; start: number; red?: boolean }> = ({ t, x, z, n, start, red }) => {
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: red ? "#ff4d4f" : "#f2b84b", metalness: 1, roughness: red ? 0.3 : 0.22, clearcoat: 0.6, clearcoatRoughness: 0.15 }), [red]);
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: n }, (_, i) => {
        const s = spring({ frame: t - start - i * 2.2, fps, config: { damping: 14, stiffness: 170 } });
        if (s <= 0.001) return null;
        const y = i * 0.118 + (1 - s) * 3;
        return <mesh key={i} castShadow receiveShadow geometry={coinGeo} material={mat} position={[Math.sin(i * 1.7) * 0.025, y, Math.cos(i * 2.3) * 0.025]} rotation={[0, i * 0.7, 0]} />;
      })}
    </group>
  );
};

const Floor: React.FC = () => {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.2, map: canvasTex(256, 256, (c) => {
    c.fillStyle = "#121418"; c.fillRect(0, 0, 256, 256);
    c.strokeStyle = "rgba(255,255,255,0.06)"; c.lineWidth = 2; for (let i = 0; i <= 256; i += 64) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.moveTo(0, i); c.lineTo(256, i); c.stroke(); }
    noise(c, 256, 256, 0.2);
  }, [16, 16]) }), []);
  return <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={mat}><planeGeometry args={[60, 60]} /></mesh>;
};

export const Hipoteca3D: React.FC = () => {
  const t = useFrame();
  const { width, height } = useVideoConfig();
  const owe = interpolate(t, [70, 115], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const amount = 200000 + 103555 * owe;
  const red = owe > 0.02;
  const pop = spring({ frame: t - 6, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ background: "#0b0c0f" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 40, near: 0.1, far: 80 }}>
        <Studio />
        <CraneCamera t={t} />
        <directionalLight castShadow position={[5, 9, 6]} intensity={2.2} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}
          shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
        <Floor />
        <directionalLight position={[-6, 5, -8]} intensity={1.4} color="#7fa8ff" />
        <House t={t} />
        <CoinStack t={t} x={1.25} z={1.0} n={20} start={10} />
        <CoinStack t={t} x={2.3} z={0.7} n={10} start={78} red />
      </ThreeCanvas>
      {/* marcador 2D encima (texto nítido) */}
      <div style={{ position: "absolute", top: 470, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${0.85 + 0.15 * pop})`, opacity: pop }}>
        <div style={{ padding: "22px 46px", borderRadius: 30, background: "rgba(20,22,27,0.85)", border: `4px solid ${red ? "#ff4d4f" : "#f2b84b"}`, textAlign: "center",
          boxShadow: red ? "0 0 80px rgba(255,77,79,0.45)" : "0 0 40px rgba(242,184,75,0.25)" }}>
          <div style={{ fontFamily: display, fontWeight: 900, fontSize: 34, letterSpacing: 4, color: red ? "#ff4d4f" : "#ffe2a3" }}>{red ? "DEVUELVES" : "PIDES"}</div>
          <div style={{ fontFamily: display, fontWeight: 900, fontSize: 100, color: red ? "#ff4d4f" : "#e9ecf1" }}>
            {Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} €
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
