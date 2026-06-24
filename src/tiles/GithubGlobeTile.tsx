import { Canvas, type ThreeEvent, useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { COMMIT_LOCATIONS, latLonToVec3 } from '~/lib/commitLocations';

function Dots({ pulse }: { pulse: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const dots = useMemo(
    () =>
      COMMIT_LOCATIONS.map((d, i) => ({
        position: latLonToVec3(d.lat, d.lon, 1.01),
        weight: d.weight,
        phase: i * 0.7,
      })),
    [],
  );

  useFrame((state) => {
    if (!pulse || !groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const dot = dots[i];
      if (!dot) return;
      const s = 1 + 0.18 * Math.sin(t * 2 + dot.phase);
      child.scale.setScalar(s);
    });
  });

  return (
    <group ref={groupRef}>
      {dots.map((d, i) => (
        <mesh key={`dot-${i}`} position={d.position}>
          <sphereGeometry args={[0.012 + d.weight * 0.018, 8, 8]} />
          <meshBasicMaterial color={0xff7a3a} transparent opacity={0.4 + d.weight * 0.55} />
        </mesh>
      ))}
    </group>
  );
}

interface SceneProps {
  autoRotate: boolean;
  pulse: boolean;
}

function Scene({ autoRotate, pulse }: SceneProps) {
  const ref = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const targetRotX = useRef(0);
  const targetRotY = useRef(0);
  const idleSince = useRef(0);

  useFrame((state, delta) => {
    if (!ref.current) return;
    // Damp toward target rotation set by pointer drag.
    ref.current.rotation.y += (targetRotY.current - ref.current.rotation.y) * 0.08;
    ref.current.rotation.x += (targetRotX.current - ref.current.rotation.x) * 0.08;
    if (!dragging.current && autoRotate) {
      const idle = state.clock.elapsedTime - idleSince.current;
      if (idle > 0.6) {
        targetRotY.current += delta * 0.18;
      }
    }
  });

  const handlePointerDown = (ev: ThreeEvent<PointerEvent>) => {
    dragging.current = true;
    lastX.current = ev.clientX;
    lastY.current = ev.clientY;
    (ev.target as Element)?.setPointerCapture?.(ev.pointerId);
  };
  const handlePointerMove = (ev: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    const dx = ev.clientX - lastX.current;
    const dy = ev.clientY - lastY.current;
    lastX.current = ev.clientX;
    lastY.current = ev.clientY;
    targetRotY.current += dx * 0.005;
    targetRotX.current = Math.max(-0.8, Math.min(0.8, targetRotX.current + dy * 0.004));
  };
  const handlePointerUp = (ev: ThreeEvent<PointerEvent>) => {
    dragging.current = false;
    idleSince.current = performance.now() / 1000;
    (ev.target as Element)?.releasePointerCapture?.(ev.pointerId);
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 2, 4]} intensity={0.7} />
      <group
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <mesh>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial
            color="#1a1a1a"
            wireframe
            wireframeLinewidth={1}
            emissive="#221710"
            emissiveIntensity={0.25}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.04, 32, 32]} />
          <meshBasicMaterial color="#ff7a3a" transparent opacity={0.04} side={THREE.BackSide} />
        </mesh>
        <Dots pulse={pulse} />
      </group>
    </>
  );
}

export default function GithubGlobeTile() {
  const reduced = useReducedMotion() ?? false;
  const [paused, setPaused] = useState(reduced);
  const total = COMMIT_LOCATIONS.reduce((acc, d) => acc + Math.round(d.weight * 60), 0);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between">
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground">github · live</h3>
          <p className="mt-1 text-xs text-muted">commit density across the year</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {total} commits
        </span>
      </header>

      <div className="mt-4 flex-1 overflow-hidden rounded-lg border border-border/60 bg-background/60">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center font-mono text-[10px] text-muted">
              loading globe…
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 0, 2.6], fov: 38 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, powerPreference: 'low-power' }}
          >
            <Scene autoRotate={!paused} pulse={!reduced} />
          </Canvas>
        </Suspense>
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-muted">
        <span>drag to rotate</span>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="rounded border border-border/60 px-1.5 py-0.5 hover:border-accent/40 hover:text-foreground"
        >
          {paused ? '▶ resume' : '⏸ pause'}
        </button>
      </div>
    </div>
  );
}
