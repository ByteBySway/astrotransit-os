import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TargetPlanet, getPlanetaryClassification } from '../../types';
import { 
  RotateCw, 
  Eye, 
  Layers, 
  Maximize2, 
  Flame, 
  Compass,
  Play,
  Pause,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface HeroPlanetaryGlobeProps {
  target: TargetPlanet;
}

export const HeroPlanetaryGlobe: React.FC<HeroPlanetaryGlobeProps> = ({ target }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction & View Mode State
  const [isRotating, setIsRotating] = useState(true);
  const [renderMode, setRenderMode] = useState<'SPLIT' | 'TEXTURE' | 'WIREFRAME'>('SPLIT');
  const [splitOffset, setSplitOffset] = useState(0.5); // 0.0 to 1.0 (where wireframe begins)

  // Animation Refs to prevent state update loops in requestAnimationFrame
  const yawRef = useRef(0.4);
  const pitchRef = useRef(0.2);
  const isRotatingRef = useRef(true);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const renderModeRef = useRef<'SPLIT' | 'TEXTURE' | 'WIREFRAME'>('SPLIT');
  const splitOffsetRef = useRef(0.5);

  // Sync refs directly
  isRotatingRef.current = isRotating;
  renderModeRef.current = renderMode;
  splitOffsetRef.current = splitOffset;

  const classification = getPlanetaryClassification(target.planetRadius);

  // Surface texture noise generator seed based on target ID
  const seed = target.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Mouse / Touch Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    
    yawRef.current += deltaX * 0.01;
    pitchRef.current = Math.max(-1.2, Math.min(1.2, pitchRef.current + deltaY * 0.01));
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - lastMousePosRef.current.x;
    const deltaY = e.touches[0].clientY - lastMousePosRef.current.y;
    
    yawRef.current += deltaX * 0.01;
    pitchRef.current = Math.max(-1.2, Math.min(1.2, pitchRef.current + deltaY * 0.01));
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Main Render Loop
  useEffect(() => {
    let animationFrameId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (isRotatingRef.current && !isDraggingRef.current) {
        yawRef.current += 0.006;
      }

      const autoAngle = yawRef.current;
      const currentPitch = pitchRef.current;
      const currentRenderMode = renderModeRef.current;
      const currentSplitOffset = splitOffsetRef.current;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.38;

      // 1. Atmospheric Outer Glow (Rayleigh scattering rim)
      const glowGrad = ctx.createRadialGradient(
        centerX, centerY, radius * 0.85,
        centerX, centerY, radius * 1.35
      );
      
      if (classification.type === 'TERRESTRIAL') {
        glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
        glowGrad.addColorStop(0.5, 'rgba(5, 150, 105, 0.12)');
        glowGrad.addColorStop(1, 'rgba(5, 150, 105, 0)');
      } else if (classification.type === 'SUPER_EARTH') {
        glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.32)');
        glowGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.12)');
        glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      } else if (classification.type === 'NEPTUNIAN') {
        glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        glowGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.15)');
        glowGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      } else {
        // JOVIAN
        glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
        glowGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.15)');
        glowGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
      }

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 2. Base Sphere Clipping Path
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      // Background base sphere color
      ctx.fillStyle = '#060b17';
      ctx.fillRect(0, 0, width, height);

      // Procedural Planet Surface Texture Rendering
      const numBands = 64;
      const numSegments = 64;

      const lightDirX = -0.55;
      const lightDirY = -0.45;
      const lightDirZ = 0.70; // normalized light from top-left

      // Render textured terrain patches / bands
      for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += Math.PI / numBands) {
        const sinLat = Math.sin(lat);
        const cosLat = Math.cos(lat);

        for (let lon = 0; lon < Math.PI * 2; lon += (Math.PI * 2) / numSegments) {
          // Rotated 3D spherical coordinates
          const worldLon = lon + autoAngle;
          const worldLat = lat + currentPitch;

          const x3d = Math.cos(worldLat) * Math.sin(worldLon);
          const y3d = Math.sin(worldLat);
          const z3d = Math.cos(worldLat) * Math.cos(worldLon);

          if (z3d < -0.05) continue; // back-face culling

          const screenX = centerX + x3d * radius;
          const screenY = centerY - y3d * radius;

          // Split line check (X-axis position vs splitOffset)
          const normScreenX = (screenX - (centerX - radius)) / (radius * 2);
          const isWireframeZone = currentRenderMode === 'WIREFRAME' || (currentRenderMode === 'SPLIT' && normScreenX > currentSplitOffset);

          // Diffuse lighting calculation (Lambertian)
          const dotLight = Math.max(0, x3d * lightDirX + y3d * lightDirY + z3d * lightDirZ);
          const shadowTerm = Math.pow(dotLight, 1.2);

          if (!isWireframeZone && currentRenderMode !== 'WIREFRAME') {
            // Textured surface pixel
            let r = 20, g = 30, b = 50;
            const noiseVal = Math.sin((lon + seed) * 4) * Math.cos(lat * 5) + Math.sin(lon * 8 + lat * 3) * 0.5;

            if (classification.type === 'TERRESTRIAL') {
              if (noiseVal > 0.2) {
                // Continental terra-cotta / rust
                r = 180; g = 90; b = 60;
              } else if (noiseVal > -0.2) {
                // Lowlands ochre
                r = 120; g = 100; b = 70;
              } else {
                // Dark basaltic plains
                r = 40; g = 50; b = 65;
              }
              // Polar ice caps
              if (Math.abs(lat) > 1.2) {
                r = 210; g = 230; b = 245;
              }
            } else if (classification.type === 'SUPER_EARTH') {
              if (noiseVal > 0.3) {
                // Golden mountainous ridges
                r = 210; g = 155; b = 70;
              } else if (noiseVal > -0.1) {
                // Green-cyan bio/mineral plateaus
                r = 45; g = 145; b = 130;
              } else {
                // Deep saline oceans
                r = 18; g = 65; b = 120;
              }
            } else if (classification.type === 'NEPTUNIAN') {
              // Azure Hycean ocean + turbulent methane clouds
              const cloudStripe = Math.sin(lat * 12 + lon * 2) > 0.4 ? 1 : 0;
              if (cloudStripe) {
                r = 180; g = 230; b = 255;
              } else {
                r = 15; g = 110; b = 215;
              }
            } else {
              // Gas Giant / Jovian atmospheric storm bands
              const bandIdx = Math.floor((lat + Math.PI / 2) / (Math.PI / 8));
              if (bandIdx % 2 === 0) {
                r = 220; g = 135; b = 55; // Amber ammonia cloud zone
              } else {
                r = 175; g = 85; b = 40; // Brownish belting
              }
              // Giant Storm Vortex (Red Spot)
              const spotDist = Math.hypot(lat - 0.2, ((lon + autoAngle) % (Math.PI * 2)) - 2.8);
              if (spotDist < 0.35) {
                r = 240; g = 60; b = 40;
              }
            }

            const intensity = 0.15 + shadowTerm * 0.85;
            ctx.fillStyle = `rgb(${Math.floor(r * intensity)}, ${Math.floor(g * intensity)}, ${Math.floor(b * intensity)})`;
            ctx.fillRect(screenX - 2, screenY - 2, 4.5, 4.5);
          }
        }
      }

      // 3. High-Tech Wireframe Geodesic & Latitude/Longitude Mesh
      if (currentRenderMode !== 'TEXTURE') {
        ctx.lineWidth = 0.85;

        // Latitude lines
        for (let lat = -Math.PI / 2.2; lat <= Math.PI / 2.2; lat += Math.PI / 10) {
          ctx.beginPath();
          let hasPoint = false;

          for (let lon = 0; lon <= Math.PI * 2; lon += 0.08) {
            const worldLon = lon + autoAngle;
            const worldLat = lat + currentPitch;

            const x3d = Math.cos(worldLat) * Math.sin(worldLon);
            const y3d = Math.sin(worldLat);
            const z3d = Math.cos(worldLat) * Math.cos(worldLon);

            if (z3d < 0) {
              hasPoint = false;
              continue;
            }

            const screenX = centerX + x3d * radius;
            const screenY = centerY - y3d * radius;
            const normScreenX = (screenX - (centerX - radius)) / (radius * 2);

            if (currentRenderMode === 'WIREFRAME' || normScreenX >= currentSplitOffset - 0.02) {
              if (!hasPoint) {
                ctx.moveTo(screenX, screenY);
                hasPoint = true;
              } else {
                ctx.lineTo(screenX, screenY);
              }
            } else {
              hasPoint = false;
            }
          }
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
          ctx.stroke();
        }

        // Longitude lines
        for (let lon = 0; lon < Math.PI * 2; lon += Math.PI / 8) {
          ctx.beginPath();
          let hasPoint = false;

          for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += 0.08) {
            const worldLon = lon + autoAngle;
            const worldLat = lat + currentPitch;

            const x3d = Math.cos(worldLat) * Math.sin(worldLon);
            const y3d = Math.sin(worldLat);
            const z3d = Math.cos(worldLat) * Math.cos(worldLon);

            if (z3d < 0) {
              hasPoint = false;
              continue;
            }

            const screenX = centerX + x3d * radius;
            const screenY = centerY - y3d * radius;
            const normScreenX = (screenX - (centerX - radius)) / (radius * 2);

            if (currentRenderMode === 'WIREFRAME' || normScreenX >= currentSplitOffset - 0.02) {
              if (!hasPoint) {
                ctx.moveTo(screenX, screenY);
                hasPoint = true;
              } else {
                ctx.lineTo(screenX, screenY);
              }
            } else {
              hasPoint = false;
            }
          }
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
          ctx.stroke();
        }

        // Geometric Node Vertices
        for (let lat = -Math.PI / 2.5; lat <= Math.PI / 2.5; lat += Math.PI / 5) {
          for (let lon = 0; lon < Math.PI * 2; lon += Math.PI / 4) {
            const worldLon = lon + autoAngle;
            const worldLat = lat + currentPitch;

            const x3d = Math.cos(worldLat) * Math.sin(worldLon);
            const y3d = Math.sin(worldLat);
            const z3d = Math.cos(worldLat) * Math.cos(worldLon);

            if (z3d < 0.1) continue;

            const screenX = centerX + x3d * radius;
            const screenY = centerY - y3d * radius;
            const normScreenX = (screenX - (centerX - radius)) / (radius * 2);

            if (currentRenderMode === 'WIREFRAME' || normScreenX >= currentSplitOffset) {
              ctx.fillStyle = '#00f0ff';
              ctx.beginPath();
              ctx.arc(screenX, screenY, 1.8, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 4. Split Boundary Line (if in SPLIT mode)
      if (currentRenderMode === 'SPLIT') {
        const splitX = centerX - radius + currentSplitOffset * (radius * 2);
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(splitX, centerY - radius);
        ctx.lineTo(splitX, centerY + radius);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Spherical Edge Shading & Terminator Vignette
      const sphereShadow = ctx.createRadialGradient(
        centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2,
        centerX, centerY, radius
      );
      sphereShadow.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      sphereShadow.addColorStop(0.7, 'rgba(5, 10, 20, 0.2)');
      sphereShadow.addColorStop(1, 'rgba(2, 4, 10, 0.88)');

      ctx.fillStyle = sphereShadow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Clean Outer Rim Stroke
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore(); // restore clip
      ctx.restore(); // restore scale

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [target.id, target.planetRadius, classification.type, seed]);

  return (
    <div 
      ref={containerRef}
      className="relative rounded-2xl cosmic-glass p-4 flex flex-col justify-between overflow-hidden group"
    >
      {/* Top Header & Mode Controls */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08] z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Compass className="h-3.5 w-3.5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm font-bold tracking-wide text-white uppercase">
                {target.name}
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${classification.borderClass} ${classification.bgClass} ${classification.colorClass}`}>
                {classification.badgeLabel.replace('CLASS: ', '')}
              </span>
            </div>
            <div className="text-[10px] font-mono-code text-slate-400">
              Interactive 3D Topological Globe (AstroPlus Wireframe Split)
            </div>
          </div>
        </div>

        {/* View mode toggle pills */}
        <div className="flex items-center gap-1 bg-[#060a14] p-1 rounded-xl border border-white/[0.08] text-[10px] font-mono-code">
          <button
            onClick={() => setRenderMode('SPLIT')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              renderMode === 'SPLIT'
                ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Split Photorealistic Terrain & Wireframe"
          >
            Split 50/50
          </button>
          <button
            onClick={() => setRenderMode('TEXTURE')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              renderMode === 'TEXTURE'
                ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Full Photorealistic Atmosphere"
          >
            Texture
          </button>
          <button
            onClick={() => setRenderMode('WIREFRAME')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              renderMode === 'WIREFRAME'
                ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Topological Geodesic Mesh"
          >
            Mesh
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="relative w-full h-64 sm:h-72 my-1 flex items-center justify-center cursor-grab active:cursor-grabbing select-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Ambient Overlay Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none text-[10px] font-mono-code">
          <div className="bg-[#050914]/80 border border-cyan-500/30 px-2 py-0.5 rounded-md text-cyan-300 backdrop-blur-md">
            Rp: <strong className="text-white">{target.planetRadius.toFixed(2)} R⊕</strong>
          </div>
          <div className="bg-[#050914]/80 border border-purple-500/30 px-2 py-0.5 rounded-md text-purple-300 backdrop-blur-md">
            T_eq: <strong className="text-white">{target.equilibriumTemp} K</strong>
          </div>
        </div>

        {/* Rotation State & Control Button Overlay */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="flex items-center gap-1 bg-[#060a14]/90 hover:bg-[#0b1326] text-slate-300 hover:text-cyan-300 px-2 py-1 rounded-lg border border-white/[0.08] text-[10px] font-mono-code backdrop-blur-md transition-all cursor-pointer"
            title="Toggle Slow Axial Auto-Rotation"
          >
            {isRotating ? (
              <>
                <Pause className="h-3 w-3 text-cyan-400" />
                <span>Pause Spin</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 text-emerald-400" />
                <span>Auto Spin</span>
              </>
            )}
          </button>
        </div>

        {/* Floating Instruction Hint on Hover */}
        <div className="absolute bottom-2 left-2 text-[9px] font-mono-code text-slate-400 bg-[#050914]/80 px-2 py-0.5 rounded border border-white/[0.06] backdrop-blur-md pointer-events-none">
          Drag to orbit view • 3D Surface Projection
        </div>
      </div>

      {/* Footer Surface & Habitability Telemetry Strip */}
      <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/[0.08] text-[11px] font-mono-code">
        <div className="rounded-lg bg-[#070c18] border border-white/[0.04] p-2">
          <span className="text-slate-400 text-[10px] block">Atmosphere Type</span>
          <strong className="text-cyan-300 truncate block">
            {target.planetRadius < 1.4 ? 'Secondary (N2/CO2)' : target.planetRadius < 2.5 ? 'Volatile-Rich Hycean' : 'Hydrogen/Helium Envelope'}
          </strong>
        </div>

        <div className="rounded-lg bg-[#070c18] border border-white/[0.04] p-2">
          <span className="text-slate-400 text-[10px] block">Insolation Flux</span>
          <strong className="text-slate-200 block">{target.insolationFlux || 1.0} S⊕</strong>
        </div>

        <div className="rounded-lg bg-[#070c18] border border-white/[0.04] p-2">
          <span className="text-slate-400 text-[10px] block">Hydrosphere Index</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                style={{ width: `${target.liquidWaterIndex || 20}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-emerald-300">{target.liquidWaterIndex || 20}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
