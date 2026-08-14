import React, { useRef, useEffect, useState } from 'react';
import { TargetPlanet } from '../../types';
import { calculateHabitableZone, getMassRadiusCurves } from '../../utils/astronomy';
import { AudioEngine, HapticEngine } from '../../utils/feedbackEngine';
import { 
  Orbit, 
  Rotate3d, 
  Layers, 
  RotateCcw, 
  Flame, 
  Droplet, 
  Activity, 
  ShieldAlert, 
  Sparkles,
  Play,
  Pause,
  Compass,
  Gauge,
  ZoomIn,
  ZoomOut,
  Sliders,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

interface OrbitSimulatorProps {
  selectedTarget: TargetPlanet;
  onSelectTarget: (target: TargetPlanet) => void;
  allTargets: TargetPlanet[];
}

export interface SystemPlanetInfo {
  name: string;
  fullName: string;
  a: number; // semi-major axis AU
  period: number; // days
  r: number; // radius R_earth
  color: string;
  isTarget: boolean;
  tempK: number;
  eccentricity: number;
  inclinationDeg: number;
  targetRef?: TargetPlanet;
}

export const OrbitSimulator: React.FC<OrbitSimulatorProps> = ({
  selectedTarget,
  onSelectTarget,
  allTargets,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [is3D, setIs3D] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showKeplerSliders, setShowKeplerSliders] = useState(true);

  // Keplerian Orbital Parameters (User adjustable via Sliders)
  const [eccentricity, setEccentricity] = useState<number>(selectedTarget.eccentricity ?? 0.06);
  const [inclinationDeg, setInclinationDeg] = useState<number>(selectedTarget.inclination ?? 89.2);

  // Raycasting & Planet Hit State
  const [hoveredPlanetName, setHoveredPlanetName] = useState<string | null>(null);
  const [activePlanetCard, setActivePlanetCard] = useState<SystemPlanetInfo | null>(null);

  // Mutable refs for smooth 60fps canvas loop without React state update cascades
  const rotationPitchRef = useRef(0.85);
  const rotationYawRef = useRef(0.35);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const is3DRef = useRef(true);
  const isPausedRef = useRef(false);
  const speedMultiplierRef = useRef(1.0);
  const zoomScaleRef = useRef(1.0);
  const autoRotateRef = useRef(false);
  const eccentricityRef = useRef(eccentricity);
  const inclinationRef = useRef(inclinationDeg);
  const planetScreenCoordsRef = useRef<{ name: string; x: number; y: number; z: number; r: number; planet: SystemPlanetInfo }[]>([]);

  // Sync mutable refs directly
  is3DRef.current = is3D;
  isPausedRef.current = isPaused;
  speedMultiplierRef.current = speedMultiplier;
  zoomScaleRef.current = zoomScale;
  autoRotateRef.current = autoRotate;
  eccentricityRef.current = eccentricity;
  inclinationRef.current = inclinationDeg;

  // Reset parameters when selected target changes
  useEffect(() => {
    const e = selectedTarget.eccentricity ?? 0.06;
    const inc = selectedTarget.inclination ?? 89.2;
    setEccentricity(e);
    setInclinationDeg(inc);
    eccentricityRef.current = e;
    inclinationRef.current = inc;
    setActivePlanetCard(null);
  }, [selectedTarget.id, selectedTarget.eccentricity, selectedTarget.inclination]);

  // Solar & Habitable Zone boundaries (Kopparapu et al. 2014) - Memoized
  const hz = React.useMemo(() => {
    return calculateHabitableZone(
      selectedTarget.stellarParams.teff,
      selectedTarget.stellarParams.luminosity
    );
  }, [selectedTarget.stellarParams.teff, selectedTarget.stellarParams.luminosity]);

  // Derive semi-major axis & orbital speed for target
  const targetA = selectedTarget.semiMajorAxis || 0.12;
  const targetPeriod = selectedTarget.orbitalPeriod || 14.4;
  const orbitalVelocityKmS = Math.sqrt((selectedTarget.stellarParams.mass || 1.0) / targetA) * 29.78;

  // Multi-planet system orbits for the host star
  const systemPlanets = React.useMemo<SystemPlanetInfo[]>(() => {
    const baseName = selectedTarget.name.replace(/[a-z]$/i, '').trim();
    return [
      { 
        name: 'b', 
        fullName: `${baseName} b`,
        a: targetA * 0.42, 
        period: Math.max(1.8, targetPeriod * 0.28), 
        r: 1.15, 
        color: '#f87171', 
        isTarget: false,
        tempK: Math.round(selectedTarget.equilibriumTemp * 1.55),
        eccentricity: 0.04,
        inclinationDeg: 89.5,
      },
      { 
        name: 'c', 
        fullName: `${baseName} c`,
        a: targetA * 0.70, 
        period: Math.max(3.5, targetPeriod * 0.58), 
        r: 1.45, 
        color: '#fb923c', 
        isTarget: false,
        tempK: Math.round(selectedTarget.equilibriumTemp * 1.20),
        eccentricity: 0.08,
        inclinationDeg: 88.8,
      },
      { 
        name: selectedTarget.name.slice(-1) || 'd', 
        fullName: selectedTarget.name,
        a: targetA, 
        period: targetPeriod, 
        r: selectedTarget.planetRadius, 
        color: '#00f0ff', 
        isTarget: true, 
        tempK: selectedTarget.equilibriumTemp,
        eccentricity: eccentricity,
        inclinationDeg: inclinationDeg,
        targetRef: selectedTarget
      },
      { 
        name: 'e', 
        fullName: `${baseName} e`,
        a: targetA * 1.55, 
        period: targetPeriod * 1.95, 
        r: 2.1, 
        color: '#34d399', 
        isTarget: false,
        tempK: Math.round(selectedTarget.equilibriumTemp * 0.80),
        eccentricity: 0.05,
        inclinationDeg: 89.1,
      },
      { 
        name: 'f', 
        fullName: `${baseName} f`,
        a: targetA * 2.65, 
        period: targetPeriod * 4.30, 
        r: 2.7, 
        color: '#38bdf8', 
        isTarget: false,
        tempK: Math.round(selectedTarget.equilibriumTemp * 0.62),
        eccentricity: 0.12,
        inclinationDeg: 87.9,
      },
    ];
  }, [targetA, targetPeriod, selectedTarget, eccentricity, inclinationDeg]);

  // Handle Raycasting Planet Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Check hit on projected planet coordinates
    let hitPlanet: SystemPlanetInfo | null = null;
    let minDistance = 24; // 24px tolerance

    for (const item of planetScreenCoordsRef.current) {
      const dist = Math.hypot(clickX - item.x, clickY - item.y);
      if (dist < minDistance) {
        minDistance = dist;
        hitPlanet = item.planet;
      }
    }

    if (hitPlanet) {
      AudioEngine.playClick();
      HapticEngine.selectionTick();
      setActivePlanetCard(hitPlanet);
    }
  };

  // Handle Raycasting Hover on Canvas
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      if (!is3D) return;
      const dx = (e.clientX - dragStartRef.current.x) * 0.006;
      const dy = (e.clientY - dragStartRef.current.y) * 0.006;
      rotationPitchRef.current = Math.min(Math.PI / 2 - 0.05, Math.max(0.05, rotationPitchRef.current + dy));
      rotationYawRef.current += dx;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    let hovered: string | null = null;
    let minDistance = 22;

    for (const item of planetScreenCoordsRef.current) {
      const dist = Math.hypot(mouseX - item.x, mouseY - item.y);
      if (dist < minDistance) {
        minDistance = dist;
        hovered = item.name;
      }
    }

    if (hovered !== hoveredPlanetName) {
      setHoveredPlanetName(hovered);
      if (hovered) {
        HapticEngine.scrubTick();
      }
    }
  };

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      if (!isPausedRef.current) {
        time += 0.015 * speedMultiplierRef.current;
        if (autoRotateRef.current && is3DRef.current) {
          rotationYawRef.current += 0.002;
        }
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Deep Space Canvas Background (glassmorphic interior)
      ctx.fillStyle = '#070c18';
      ctx.fillRect(0, 0, width, height);

      // Starfield background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let i = 0; i < 55; i++) {
        const sx = ((i * 73 + 17) % width);
        const sy = ((i * 97 + 31) % height);
        const sr = (i % 3 === 0) ? 1.2 : 0.8;
        ctx.fillRect(sx, sy, sr, sr);
      }

      // Orbital space coordinate grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.035)';
      ctx.lineWidth = 1;
      const step = 44;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Projection parameters
      const baseScale = Math.min(width, height) * 0.36 * zoomScaleRef.current;
      const pitch = is3DRef.current ? rotationPitchRef.current : 0;
      const yaw = is3DRef.current ? rotationYawRef.current : 0;

      // Project 3D orbit point to 2D screen coordinate with 3D rotation matrix
      const project = (x3d: number, y3d: number, z3d: number) => {
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);

        const x1 = x3d * cosY + z3d * sinY;
        const z1 = -x3d * sinY + z3d * cosY;

        const y2 = y3d * cosP - z1 * sinP;
        const z2 = y3d * sinP + z1 * cosP;

        const screenX = centerX + x1 * baseScale;
        const screenY = centerY + y2 * baseScale;
        return { x: screenX, y: screenY, z: z2 };
      };

      // 1. Draw Habitable Zone Bands (Red Scorching, Green Habitable, Blue Cold)
      const rInnerConservative = hz.runawayGreenhouse;
      const rOuterConservative = hz.maximumGreenhouse;
      const rOuterCold = hz.earlyMars * 1.25;

      // Inner Hot Zone Disc (Red / Amber)
      ctx.beginPath();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.04)';
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        const pt = project(Math.cos(theta) * rInnerConservative * 1.5, 0, Math.sin(theta) * rInnerConservative * 1.5);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.fill();

      // Habitable Zone Annulus (Emerald Green)
      ctx.beginPath();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);

      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        const pt = project(Math.cos(theta) * rOuterConservative * 1.5, 0, Math.sin(theta) * rOuterConservative * 1.5);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.fill();
      ctx.setLineDash([]);

      // Inner & Outer Boundary Rings
      [
        { r: rInnerConservative * 1.5, color: '#f59e0b', label: 'HOT INNER HZ' },
        { r: rOuterConservative * 1.5, color: '#10b981', label: 'HABITABLE BAND' },
        { r: rOuterCold * 1.5, color: '#38bdf8', label: 'CRYOGENIC' },
      ].forEach((band) => {
        ctx.beginPath();
        ctx.strokeStyle = band.color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);

        for (let i = 0; i <= 64; i++) {
          const theta = (i / 64) * Math.PI * 2;
          const pt = project(Math.cos(theta) * band.r, 0, Math.sin(theta) * band.r);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Clear previous planet screen positions for raycasting
      const currentPlanetScreenCoords: { name: string; x: number; y: number; z: number; r: number; planet: SystemPlanetInfo }[] = [];

      // 2. Draw Planetary Orbits & Animated Planets with Keplerian Mechanics
      systemPlanets.forEach((p, idx) => {
        const nominalA = Math.pow(p.a / targetA, 0.65) * 1.15;
        const planetE = p.isTarget ? eccentricityRef.current : p.eccentricity;
        const planetIncDeg = p.isTarget ? inclinationRef.current : p.inclinationDeg;
        // Convert inclination to radians (deviation from 90 degrees edge-on)
        const planetIncRad = ((90 - planetIncDeg) * Math.PI) / 180;

        // Draw Keplerian Orbit Ellipse: r(theta) = [a * (1 - e^2)] / [1 + e * cos(theta)]
        ctx.beginPath();
        ctx.strokeStyle = p.isTarget ? 'rgba(0, 240, 255, 0.85)' : 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = p.isTarget ? 2 : 1;
        if (!p.isTarget) ctx.setLineDash([3, 5]);

        const steps = 96;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const rTheta = (nominalA * (1 - planetE * planetE)) / (1 + planetE * Math.cos(theta));
          
          // Un-tilted orbital coordinates (in orbital plane)
          const orbX = rTheta * Math.cos(theta);
          const orbZ = rTheta * Math.sin(theta);
          
          // Apply inclination tilt around X-axis
          const tiltedY = orbZ * Math.sin(planetIncRad);
          const tiltedZ = orbZ * Math.cos(planetIncRad);

          const pt = project(orbX, tiltedY, tiltedZ);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Kepler's Second Law: Velocity modulation along eccentric orbit
        // Approximate mean anomaly to true anomaly with Keplerian velocity weighting
        const meanAngle = (time / (p.period * 0.08)) + idx * 1.35;
        // Kepler velocity equation approximation: theta_dot ~ (1 + e*cos(theta))^2
        const currentAngle = meanAngle + 2 * planetE * Math.sin(meanAngle);
        const currentR = (nominalA * (1 - planetE * planetE)) / (1 + planetE * Math.cos(currentAngle));

        const orbX = currentR * Math.cos(currentAngle);
        const orbZ = currentR * Math.sin(currentAngle);
        const tiltedY = orbZ * Math.sin(planetIncRad);
        const tiltedZ = orbZ * Math.cos(planetIncRad);

        const pPos = project(orbX, tiltedY, tiltedZ);

        // Store for raycasting hit testing
        currentPlanetScreenCoords.push({
          name: p.name,
          x: pPos.x,
          y: pPos.y,
          z: pPos.z,
          r: p.isTarget ? 9 : 6,
          planet: p
        });

        const isHovered = hoveredPlanetName === p.name;
        const isCardActive = activePlanetCard?.name === p.name;

        // Hover / Active Ring Pulse
        if (isHovered || isCardActive) {
          ctx.beginPath();
          ctx.arc(pPos.x, pPos.y, (p.isTarget ? 12 : 9) + Math.sin(time * 6) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.8;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Planet Mesh / Sphere rendering
        ctx.beginPath();
        const baseRadius = p.isTarget ? 6.5 : 4.5;
        const scaleMult = (isHovered || isCardActive) ? 1.35 : 1.0;
        ctx.arc(pPos.x, pPos.y, baseRadius * scaleMult, 0, Math.PI * 2);
        ctx.fillStyle = p.isTarget ? '#00f0ff' : p.color;
        ctx.shadowColor = p.isTarget ? '#00f0ff' : (isHovered ? p.color : 'transparent');
        ctx.shadowBlur = p.isTarget ? 14 : (isHovered ? 10 : 0);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Target Reticle & HUD overlay for target
        if (p.isTarget) {
          const boxSize = 22;
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(pPos.x - boxSize / 2, pPos.y - boxSize / 2, boxSize, boxSize);

          // Reticle corner ticks
          ctx.beginPath();
          ctx.moveTo(pPos.x - boxSize / 2 - 3, pPos.y);
          ctx.lineTo(pPos.x - boxSize / 2, pPos.y);
          ctx.moveTo(pPos.x + boxSize / 2 + 3, pPos.y);
          ctx.lineTo(pPos.x + boxSize / 2, pPos.y);
          ctx.stroke();

          // Micro pill background for target label
          const labelText = `TARGET: ${selectedTarget.name}`;
          const subText = `e: ${planetE.toFixed(2)} | i: ${planetIncDeg.toFixed(1)}°`;
          ctx.font = '9px "JetBrains Mono", monospace';
          const labelWidth = Math.max(ctx.measureText(labelText).width, ctx.measureText(subText).width) + 8;
          const labelX = pPos.x - labelWidth / 2;
          const labelY = pPos.y + boxSize / 2 + 4;

          ctx.fillStyle = 'rgba(7, 15, 32, 0.88)';
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(labelX, labelY, labelWidth, 24, 4);
          ctx.fill();
          ctx.stroke();

          // Text inside micro pill
          ctx.fillStyle = '#00f0ff';
          ctx.fillText(labelText, labelX + 4, labelY + 10);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(subText, labelX + 4, labelY + 20);
        } else {
          // Label for other planets on hover
          if (isHovered || isCardActive) {
            ctx.font = '9px "JetBrains Mono", monospace';
            const nameWidth = ctx.measureText(p.fullName).width + 8;
            const px = pPos.x - nameWidth / 2;
            const py = pPos.y - 20;
            ctx.fillStyle = 'rgba(7, 15, 32, 0.88)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(px, py, nameWidth, 14, 3);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.fillText(p.fullName, px + 4, py + 10);
          }
        }
      });

      planetScreenCoordsRef.current = currentPlanetScreenCoords;

      // 3. Central Host Star
      const starPt = project(0, 0, 0);
      const starGradient = ctx.createRadialGradient(
        starPt.x,
        starPt.y,
        4,
        starPt.x,
        starPt.y,
        36
      );
      starGradient.addColorStop(0, '#ffffff');
      starGradient.addColorStop(0.2, '#fde047');
      starGradient.addColorStop(0.5, '#eab308');
      starGradient.addColorStop(1, 'rgba(234, 179, 8, 0)');

      ctx.beginPath();
      ctx.arc(starPt.x, starPt.y, 36, 0, Math.PI * 2);
      ctx.fillStyle = starGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(starPt.x, starPt.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedTarget.id, hz, targetA, targetPeriod, systemPlanets, hoveredPlanetName, activePlanetCard]);

  // Mass-radius curves for lower chart
  const mrCurves = getMassRadiusCurves();

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Top Header & Habitability Color Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <span>3D Habitable Zone &amp; Orbit Simulator</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono-code mt-1 text-slate-400">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Flame className="h-3.5 w-3.5" />
              <span>INNER SCORCHING (T &gt; 380K)</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <Droplet className="h-3.5 w-3.5" />
              <span>HABITABLE ZONE (200K - 320K)</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <Droplet className="h-3.5 w-3.5" />
              <span>CRYOGENIC OUTER</span>
            </span>
          </div>
        </div>

        {/* View Controls & Kepler Toggle */}
        <div className="flex flex-wrap items-center gap-2 font-mono-code text-xs">
          {/* Keplerian Sliders Drawer Toggle */}
          <button
            onClick={() => {
              AudioEngine.playClick();
              HapticEngine.lightTap();
              setShowKeplerSliders(!showKeplerSliders);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              showKeplerSliders
                ? 'border-cyan-400 bg-cyan-950/90 text-cyan-300 font-bold shadow-md shadow-cyan-950/60'
                : 'border-white/[0.08] bg-[#090f1d] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>Keplerian Sliders</span>
          </button>

          {/* Pause / Play */}
          <button
            onClick={() => {
              AudioEngine.playClick();
              HapticEngine.lightTap();
              setIsPaused(!isPaused);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              isPaused
                ? 'border-amber-500/50 bg-amber-950/50 text-amber-300'
                : 'border-white/[0.08] bg-[#090f1d] text-slate-300 hover:text-white'
            }`}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>

          {/* 3D / 2D Toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#090f1d] p-1">
            <button
              onClick={() => {
                AudioEngine.playClick();
                HapticEngine.lightTap();
                setIs3D(true);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                is3D ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Rotate3d className="h-3.5 w-3.5" />
              <span>3D</span>
            </button>
            <button
              onClick={() => {
                AudioEngine.playClick();
                HapticEngine.lightTap();
                setIs3D(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                !is3D ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>2D TOP</span>
            </button>
          </div>

          {/* Auto Rotate Drift */}
          <button
            onClick={() => {
              AudioEngine.playClick();
              HapticEngine.lightTap();
              setAutoRotate(!autoRotate);
            }}
            className={`px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              autoRotate
                ? 'border-cyan-500/50 bg-cyan-950/50 text-cyan-300 font-bold'
                : 'border-white/[0.08] bg-[#090f1d] text-slate-400 hover:text-slate-200'
            }`}
            title="Auto-Rotate Camera Drift"
          >
            DRIFT
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#090f1d] p-1 text-slate-300">
            <button
              onClick={() => {
                AudioEngine.playClick();
                HapticEngine.selectionTick();
                setZoomScale((z) => Math.min(z * 1.25, 2.5));
              }}
              className="p-1 hover:text-cyan-300 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] text-slate-400 px-1">{zoomScale.toFixed(1)}x</span>
            <button
              onClick={() => {
                AudioEngine.playClick();
                HapticEngine.selectionTick();
                setZoomScale((z) => Math.max(z / 1.25, 0.6));
              }}
              className="p-1 hover:text-cyan-300 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Reset Angle */}
          <button
            onClick={() => {
              AudioEngine.playClick();
              HapticEngine.lightTap();
              rotationPitchRef.current = 0.85;
              rotationYawRef.current = 0.35;
              setZoomScale(1.0);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/[0.08] bg-[#090f1d] text-slate-400 hover:text-slate-200 cursor-pointer"
            title="Reset 3D Camera"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Speed Presets */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#090f1d] p-1 text-slate-300">
            {[0.5, 1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  AudioEngine.playClick();
                  HapticEngine.selectionTick();
                  setSpeedMultiplier(spd);
                }}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                  speedMultiplier === spd
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Keplerian Orbital Mechanics Sliders Control Panel */}
      {showKeplerSliders && (
        <div className="rounded-2xl border border-cyan-500/30 bg-[#0d121e]/90 p-3 shadow-xl backdrop-blur-xl font-mono-code text-[11px] animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between pb-1.5 mb-2 border-b border-white/[0.08] gap-2">
            <span className="text-cyan-300 font-bold flex items-center gap-1.5 text-xs">
              <Sliders className="h-3.5 w-3.5 text-cyan-400" />
              Keplerian Mechanics: r(θ) = [a·(1 - e²)] / [1 + e·cos(θ)]
            </span>
            <span className="text-[10px] text-slate-400">
              True Anomaly Velocity Modulation via Kepler&apos;s 2nd Law
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Eccentricity Slider (0.00 - 0.85) */}
            <div className="space-y-1 bg-[#060b16] p-2.5 rounded-xl border border-white/[0.04]">
              <div className="flex justify-between items-center text-slate-300 text-[11px]">
                <span>Eccentricity (e):</span>
                <strong className="text-cyan-400 font-bold text-xs">{eccentricity.toFixed(3)}</strong>
              </div>
              <input
                type="range"
                min="0.00"
                max="0.85"
                step="0.01"
                value={eccentricity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setEccentricity(val);
                  HapticEngine.scrubTick();
                }}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>0.00 (Circ)</span>
                <span>0.42 (Mod)</span>
                <span>0.85 (High)</span>
              </div>
            </div>

            {/* Orbital Inclination Slider (0° - 90°) */}
            <div className="space-y-1 bg-[#060b16] p-2.5 rounded-xl border border-white/[0.04]">
              <div className="flex justify-between items-center text-slate-300 text-[11px]">
                <span>Inclination (i):</span>
                <strong className="text-cyan-400 font-bold text-xs">{inclinationDeg.toFixed(1)}°</strong>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="0.5"
                value={inclinationDeg}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setInclinationDeg(val);
                  HapticEngine.scrubTick();
                }}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>0° (Face-on)</span>
                <span>45°</span>
                <span>90° (Transit)</span>
              </div>
            </div>

            {/* Periastron & Apastron Distance Readout */}
            <div className="space-y-0.5 bg-[#060b16] p-2.5 rounded-xl border border-white/[0.04] flex flex-col justify-center text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Periastron q = a·(1-e):</span>
                <strong className="text-emerald-400 text-[11px]">{(targetA * (1 - eccentricity)).toFixed(4)} AU</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Apastron Q = a·(1+e):</span>
                <strong className="text-cyan-300 text-[11px]">{(targetA * (1 + eccentricity)).toFixed(4)} AU</strong>
              </div>
            </div>

            {/* Velocity Extremes */}
            <div className="space-y-0.5 bg-[#060b16] p-2.5 rounded-xl border border-white/[0.04] flex flex-col justify-center text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Periastron (v_max):</span>
                <strong className="text-amber-300 text-[11px]">
                  {(orbitalVelocityKmS * Math.sqrt((1 + eccentricity) / (1 - eccentricity || 0.001))).toFixed(1)} km/s
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Apastron (v_min):</span>
                <strong className="text-slate-300 text-[11px]">
                  {(orbitalVelocityKmS * Math.sqrt((1 - eccentricity) / (1 + eccentricity))).toFixed(1)} km/s
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive 3D Orbit Canvas encasing Glassmorphic Viewport Container */}
      <div
        className="relative h-[420px] sm:h-[480px] w-full rounded-2xl border border-white/10 bg-[#0d121e]/85 backdrop-blur-xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing select-none"
        onMouseDown={(e) => {
          setIsDragging(true);
          dragStartRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => {
          setIsDragging(false);
          setHoveredPlanetName(null);
        }}
      >
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          onClick={handleCanvasClick}
          className="w-full h-full object-cover"
        />

        {/* Orbit Overlay Telemetry (Top-Left Compact Dock) */}
        <div className="absolute top-3 left-3 rounded-xl border border-white/10 bg-[#070f20]/90 p-2.5 font-mono-code text-[11px] text-slate-300 backdrop-blur-xl shadow-xl max-w-[220px]">
          <div className="text-cyan-400 font-bold mb-1 flex items-center gap-1.5 text-xs truncate">
            <Compass className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{selectedTarget.name} Primary</span>
          </div>
          <div className="space-y-0.5 text-[10px] text-slate-400">
            <div>Lum: <strong className="text-slate-200">{selectedTarget.stellarParams.luminosity} L☉</strong></div>
            <div>Cons HZ: <strong className="text-emerald-400">{hz.runawayGreenhouse.toFixed(2)}-{hz.maximumGreenhouse.toFixed(2)} AU</strong></div>
            <div>Opt HZ: <strong className="text-cyan-300">{hz.recentVenus.toFixed(2)}-{hz.earlyMars.toFixed(2)} AU</strong></div>
          </div>
        </div>

        {/* Orbital Mechanics HUD on Top-Right */}
        <div className="absolute top-3 right-3 rounded-xl border border-white/10 bg-[#070f20]/90 p-2.5 font-mono-code text-[11px] text-slate-300 backdrop-blur-xl shadow-xl text-right">
          <div className="text-cyan-400 font-bold mb-0.5 flex items-center justify-end gap-1 text-xs">
            <Gauge className="h-3.5 w-3.5 text-cyan-400" />
            <span>Velocity</span>
          </div>
          <div className="text-xs font-bold text-white glow-cyan mb-0.5">{orbitalVelocityKmS.toFixed(1)} km/s</div>
          <div className="space-y-0.5 text-[10px] text-slate-400">
            <div>Period: <strong className="text-slate-200">{targetPeriod.toFixed(2)} d</strong></div>
            <div>Semi-Axis: <strong className="text-slate-200">{targetA.toFixed(3)} AU</strong></div>
          </div>
        </div>

        {/* Clickable 3D Planet Info Modal / Card (Raycasting Result) */}
        {activePlanetCard && (
          <div className="absolute bottom-10 left-3 sm:left-4 rounded-xl border border-cyan-400/50 bg-[#080e1e]/95 p-3 font-mono-code text-[11px] text-slate-200 backdrop-blur-2xl shadow-2xl z-30 max-w-xs animate-fadeIn">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-1.5 truncate">
                <span 
                  className="h-2.5 w-2.5 rounded-full shadow-sm shrink-0"
                  style={{ backgroundColor: activePlanetCard.color }}
                />
                <span className="text-xs font-bold text-white uppercase truncate">{activePlanetCard.fullName}</span>
                {activePlanetCard.isTarget && (
                  <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                    TARGET
                  </span>
                )}
              </div>
              <button
                onClick={() => setActivePlanetCard(null)}
                className="text-slate-400 hover:text-white cursor-pointer text-xs font-bold pl-2"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px] my-1.5">
              <div className="bg-[#060b16] p-1.5 rounded-lg border border-white/[0.04]">
                <span className="text-slate-400 block text-[9px]">SEMI-MAJOR</span>
                <strong className="text-cyan-300">{activePlanetCard.a.toFixed(3)} AU</strong>
              </div>
              <div className="bg-[#060b16] p-1.5 rounded-lg border border-white/[0.04]">
                <span className="text-slate-400 block text-[9px]">PERIOD</span>
                <strong className="text-slate-200">{activePlanetCard.period.toFixed(2)} d</strong>
              </div>
              <div className="bg-[#060b16] p-1.5 rounded-lg border border-white/[0.04]">
                <span className="text-slate-400 block text-[9px]">RADIUS</span>
                <strong className="text-emerald-400">{activePlanetCard.r.toFixed(2)} R⊕</strong>
              </div>
              <div className="bg-[#060b16] p-1.5 rounded-lg border border-white/[0.04]">
                <span className="text-slate-400 block text-[9px]">TEMP</span>
                <strong className="text-amber-300">{activePlanetCard.tempK} K</strong>
              </div>
            </div>

            {/* Load into Vetting Action */}
            <div className="pt-1.5 border-t border-white/[0.08] flex items-center justify-between gap-2">
              <span className="text-[9px] text-slate-400 truncate">
                {activePlanetCard.tempK >= 200 && activePlanetCard.tempK <= 320 ? '🌿 Habitable' : '🔥 Extreme'}
              </span>
              <button
                onClick={() => {
                  AudioEngine.playClick();
                  HapticEngine.lightTap();
                  if (activePlanetCard.targetRef) {
                    onSelectTarget(activePlanetCard.targetRef);
                  } else {
                    const childTarget: TargetPlanet = {
                      ...selectedTarget,
                      id: `${selectedTarget.id}_${activePlanetCard.name}`,
                      name: activePlanetCard.fullName,
                      orbitalPeriod: activePlanetCard.period,
                      semiMajorAxis: activePlanetCard.a,
                      planetRadius: activePlanetCard.r,
                      equilibriumTemp: activePlanetCard.tempK,
                      eccentricity: activePlanetCard.eccentricity,
                      inclination: activePlanetCard.inclinationDeg,
                    };
                    onSelectTarget(childTarget);
                  }
                  setActivePlanetCard(null);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold hover:brightness-110 shadow-md cursor-pointer text-[10px] shrink-0"
              >
                <span>Load Vetting</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* 3D Drag & Hover Tip */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[#050a14]/85 px-3.5 py-1 font-mono-code text-[11px] text-slate-400 backdrop-blur-md pointer-events-none shadow-lg whitespace-nowrap">
          Click on any planet mesh to inspect telemetry • Drag to rotate 3D orbital plane
        </div>
      </div>

      {/* Lower 3 Cards: Mass-Radius, Insolation & LWI, TTV */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Mass-Radius Composition Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d121e]/85 p-4 shadow-xl flex flex-col justify-between backdrop-blur-xl">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 font-mono-code text-xs">
              <span className="text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Mass-Radius Composition
              </span>
            </div>

            {/* SVG Mass-Radius Plot */}
            <div className="my-2 h-44 w-full">
              <svg viewBox="0 0 280 160" className="w-full h-full select-none">
                <g className="opacity-15 stroke-cyan-500" strokeDasharray="2 2">
                  <line x1="30" y1="20" x2="260" y2="20" />
                  <line x1="30" y1="80" x2="260" y2="80" />
                  <line x1="30" y1="140" x2="260" y2="140" />
                  <line x1="30" y1="20" x2="30" y2="140" />
                  <line x1="145" y1="20" x2="145" y2="140" />
                  <line x1="260" y1="20" x2="260" y2="140" />
                </g>

                {/* Composition Iso-lines */}
                <path
                  d="M 30,130 Q 120,80 260,30"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                  opacity="0.7"
                />
                <path
                  d="M 30,135 Q 140,95 260,45"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                  opacity="0.7"
                />

                {/* Target Planet Scatter Marker */}
                <circle
                  cx={30 + Math.min(220, (selectedTarget.planetRadius / 4) * 220)}
                  cy={140 - Math.min(110, ((selectedTarget.planetMass || 2.5) / 10) * 110)}
                  r="5.5"
                  fill="#00f0ff"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="animate-pulse"
                />

                {/* Target Label */}
                <text
                  x={30 + Math.min(220, (selectedTarget.planetRadius / 4) * 220) + 8}
                  y={140 - Math.min(110, ((selectedTarget.planetMass || 2.5) / 10) * 110) + 3}
                  className="font-mono-code text-[9px] fill-cyan-300 font-bold"
                >
                  {selectedTarget.id}
                </text>

                {/* Labels */}
                <text x="205" y="28" className="font-mono-code text-[8px] fill-cyan-400 font-semibold">100% Water</text>
                <text x="205" y="55" className="font-mono-code text-[8px] fill-slate-400 font-semibold">Silicate Earth</text>
                <text x="35" y="15" className="font-mono-code text-[8px] fill-slate-500">Mass (M⊕)</text>
                <text x="220" y="152" className="font-mono-code text-[8px] fill-slate-500">Radius (R⊕)</text>
              </svg>
            </div>
          </div>

          <div className="text-[11px] font-mono-code text-slate-400 pt-1 border-t border-slate-800/60 flex justify-between">
            <span>Radius: <strong className="text-cyan-400">{selectedTarget.planetRadius} R⊕</strong></span>
            <span>Mass: <strong className="text-slate-200">{selectedTarget.planetMass || 2.8} M⊕</strong></span>
          </div>
        </div>

        {/* 2. Insolation & Liquid Water Index Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d121e]/85 p-4 shadow-xl flex flex-col justify-between backdrop-blur-xl">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 font-mono-code text-xs">
              <span className="text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="h-3.5 w-3.5 text-cyan-400" />
                Insolation &amp; LWI
              </span>
            </div>

            <div className="my-3 grid grid-cols-2 gap-3 font-mono-code">
              <div className="rounded-xl border border-slate-800 bg-[#060b16] p-2.5">
                <div className="text-[10px] text-slate-400 uppercase">Incident Flux</div>
                <div className="text-lg font-bold text-cyan-400 glow-cyan">
                  {selectedTarget.insolationFlux.toFixed(2)} <span className="text-xs text-slate-400">S☉</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#060b16] p-2.5">
                <div className="text-[10px] text-slate-400 uppercase">Eq Temp</div>
                <div className="text-lg font-bold text-cyan-400 glow-cyan">
                  {selectedTarget.equilibriumTemp} <span className="text-xs text-slate-400">K</span>
                </div>
              </div>
            </div>

            {/* Liquid Water Index Bar */}
            <div className="font-mono-code text-xs mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300">LIQUID WATER INDEX</span>
                <span className="text-cyan-400 font-bold">{selectedTarget.liquidWaterIndex}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-700"
                  style={{ width: `${selectedTarget.liquidWaterIndex}%` }}
                />
              </div>
            </div>
          </div>

          {/* Greenhouse Alert notice */}
          <div className="rounded-xl border border-amber-950/60 bg-amber-950/20 p-2 text-[11px] font-mono-code text-amber-200 flex items-start gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>{selectedTarget.greenhouseAlert || 'Moderate atmospheric stability forecast.'}</span>
          </div>
        </div>

        {/* 3. Transit Timing Variation (TTV) Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d121e]/85 p-4 shadow-xl flex flex-col justify-between backdrop-blur-xl">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 font-mono-code text-xs">
              <span className="text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                Transit Timing Variation
              </span>
              <span className="text-[10px] text-cyan-400">P = {selectedTarget.orbitalPeriod.toFixed(1)} d</span>
            </div>

            {/* SVG Sinusoidal TTV Plot */}
            <div className="my-2 h-44 w-full">
              <svg viewBox="0 0 280 160" className="w-full h-full select-none">
                <g className="opacity-15 stroke-cyan-500" strokeDasharray="2 2">
                  <line x1="30" y1="20" x2="260" y2="20" />
                  <line x1="30" y1="80" x2="260" y2="80" />
                  <line x1="30" y1="140" x2="260" y2="140" />
                </g>

                {/* Zero line */}
                <line x1="30" y1="80" x2="260" y2="80" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />

                {/* Sinusoidal Fit Curve */}
                <path
                  d="M 35,80 Q 90,15 145,80 T 255,80"
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* TTV Observed Points with Error Bars */}
                {(selectedTarget?.ttvOffsets || [
                  { epoch: -3, offsetMinutes: -4.2, error: 1.1 },
                  { epoch: -2, offsetMinutes: 2.1, error: 0.9 },
                  { epoch: -1, offsetMinutes: 6.8, error: 1.2 },
                  { epoch: 0, offsetMinutes: -3.2, error: 1.0 },
                  { epoch: 1, offsetMinutes: -11.4, error: 1.5 },
                  { epoch: 2, offsetMinutes: 5.6, error: 1.3 },
                  { epoch: 3, offsetMinutes: 12.1, error: 1.6 }
                ]).map((pt, i) => {
                  const x = 40 + i * 28;
                  const y = 80 - (pt.offsetMinutes / 20) * 55;
                  const errH = pt.error * 12;
                  return (
                    <g key={i}>
                      {/* Error bar */}
                      <line x1={x} y1={y - errH} x2={x} y2={y + errH} stroke="#38bdf8" strokeWidth="1.2" />
                      <line x1={x - 3} y1={y - errH} x2={x + 3} y2={y - errH} stroke="#38bdf8" strokeWidth="1.2" />
                      <line x1={x - 3} y1={y + errH} x2={x + 3} y2={y + errH} stroke="#38bdf8" strokeWidth="1.2" />
                      {/* Point */}
                      <circle cx={x} cy={y} r="3" fill="#ffffff" stroke="#00f0ff" strokeWidth="1.5" />
                    </g>
                  );
                })}

                {/* Y-Axis Labels */}
                <text x="25" y="24" textAnchor="end" className="font-mono-code text-[8px] fill-slate-400">+20m</text>
                <text x="25" y="83" textAnchor="end" className="font-mono-code text-[8px] fill-slate-400">0</text>
                <text x="25" y="143" textAnchor="end" className="font-mono-code text-[8px] fill-slate-400">-20m</text>
              </svg>
            </div>
          </div>

          <div className="text-[11px] font-mono-code text-slate-400 pt-1 border-t border-slate-800/60 flex justify-between">
            <span className="text-cyan-400">Gravitational Coupling: Active</span>
            <span className="text-slate-400">TTV Amplitude: ±16.4 min</span>
          </div>
        </div>
      </div>
    </div>
  );
};
