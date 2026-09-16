import React, { useEffect, useCallback } from 'react';
import { BaselinePlanetKey } from '../data/baselineTargets';
import { ChevronDown } from 'lucide-react';

export type PlanetKey = BaselinePlanetKey;

interface PlanetHeroProps {
  selectedPlanet: PlanetKey;
  onSelectPlanet: (planet: PlanetKey) => void;
  onGetStarted?: () => void;
}

interface PlanetInfo {
  title: string;
  description: string;
  videoSrc: string;
  poster: string;
  cutout: string;
}

const PLANET_DATA: Record<PlanetKey, PlanetInfo> = {
  earth: {
    title: 'EARTH',
    description:
      'Primary photometric reference standard (1.00 R_Earth, 1.00 AU). Optimal circumstellar habitable zone baseline for transit depth, limb darkening, and planetary equilibrium temperature.',
    videoSrc:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_3ffb4889-c520-432d-8458-038009eb40df.mp4',
    poster:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png',
    cutout:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202005_3346cc4d-ec3b-44ab-825c-b18e49f5021a.png',
  },
  venus: {
    title: 'VENUS',
    description:
      'Runaway greenhouse analog (0.95 R_Earth, 0.72 AU). Used to evaluate supercritical atmospheric thresholds, high-albedo false-positive transit depth anomalies, and desiccation limits.',
    videoSrc:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_b211cd74-013b-4dd3-bfd0-64491d8696fa.mp4',
    poster:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_cf55d1d8-7b59-4a64-80da-d72052ae974e.png',
    cutout:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202012_640b239a-d08a-4200-adb2-741bbe129ac8.png',
  },
  mars: {
    title: 'MARS',
    description:
      'Sub-Earth cold boundary benchmark (0.53 R_Earth, 1.52 AU). Sets the maximum greenhouse outer edge of the Habitable Zone and thin-atmosphere retention thresholds.',
    videoSrc:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_51eae59a-2459-4c84-907c-cc5edfe5fea7.mp4',
    poster:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_0ba6de7c-285d-43dc-b7ab-8c54c73707cb.png',
    cutout:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202018_3d559490-f613-4ed7-a3bb-3b7e9fc90fb8.png',
  },
};

const ORDER: PlanetKey[] = ['earth', 'venus', 'mars'];

export const PlanetHero: React.FC<PlanetHeroProps> = ({
  selectedPlanet,
  onSelectPlanet,
  onGetStarted,
}) => {
  // Determine left and right rotating slots based on cyclic ORDER
  const featuredIndex = ORDER.indexOf(selectedPlanet);
  const leftPlanet = ORDER[(featuredIndex + 2) % 3]; // previous in cycle
  const rightPlanet = ORDER[(featuredIndex + 1) % 3]; // next in cycle

  const handleGetStarted = useCallback(() => {
    if (onGetStarted) {
      onGetStarted();
    }
    const el = document.getElementById('vetting-terminal-root');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [onGetStarted]);

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target &&
        ((e.target as HTMLElement).tagName === 'INPUT' ||
          (e.target as HTMLElement).tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSelectPlanet(leftPlanet);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSelectPlanet(rightPlanet);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leftPlanet, rightPlanet, onSelectPlanet]);

  const currentData = PLANET_DATA[selectedPlanet];

  return (
    <section
      id="planet-hero-stage"
      className="relative w-full h-screen min-h-[100vh] flex flex-col justify-between items-center overflow-hidden select-none bg-transparent text-white z-20"
    >
      {/* Subtle bottom vignette fade to blend into the frosted glass workspace below */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-[#04101f]/60 via-transparent to-black/40" />
      </div>

      {/* 2. Top Header Navigation / Brand */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <div
          onClick={handleGetStarted}
          className="flex items-center gap-2 cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label="AstroTransit OS - Scroll to terminal"
        >
          <span className="font-display text-lg sm:text-xl font-black tracking-widest text-white uppercase group-hover:text-cyan-300 transition-colors">
            ASTRO<i className="text-cyan-400 font-serif italic not-italic">TRANSIT</i>{' '}
            <span className="text-xs px-2 py-0.5 rounded-full border border-cyan-400/50 bg-cyan-950/60 text-cyan-300 font-mono-code font-normal">
              OS
            </span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono-code">
          <button
            type="button"
            onClick={handleGetStarted}
            className="hidden sm:inline-flex px-4 py-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 hover:border-cyan-400 text-white font-semibold transition-all backdrop-blur-md cursor-pointer"
          >
            Vetting Terminal &darr;
          </button>
        </div>
      </header>

      {/* 3. Flanking Left & Right Planet Cutouts (cropped off screen edges) */}
      {/* Left Planet Switcher Button */}
      <button
        type="button"
        onClick={() => onSelectPlanet(leftPlanet)}
        id="hero-planet-cutout-left"
        className="group absolute -left-16 sm:-left-28 md:-left-36 lg:-left-44 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none"
        aria-label={`Switch to ${PLANET_DATA[leftPlanet].title}`}
        title={`Switch to ${PLANET_DATA[leftPlanet].title}`}
      >
        <div className="relative w-44 sm:w-64 md:w-80 lg:w-96 h-44 sm:h-64 md:h-80 lg:h-96">
          <img
            src={PLANET_DATA[leftPlanet].cutout}
            alt={PLANET_DATA[leftPlanet].title}
            className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_40px_rgba(34,211,238,0.4)] transition-all duration-300"
          />
        </div>
        <span className="font-prata text-xs sm:text-sm tracking-widest text-slate-300 group-hover:text-cyan-300 uppercase mt-1 drop-shadow-lg pl-14 sm:pl-24">
          &larr; {PLANET_DATA[leftPlanet].title}
        </span>
      </button>

      {/* Right Planet Switcher Button */}
      <button
        type="button"
        onClick={() => onSelectPlanet(rightPlanet)}
        id="hero-planet-cutout-right"
        className="group absolute -right-16 sm:-right-28 md:-right-36 lg:-right-44 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none"
        aria-label={`Switch to ${PLANET_DATA[rightPlanet].title}`}
        title={`Switch to ${PLANET_DATA[rightPlanet].title}`}
      >
        <div className="relative w-44 sm:w-64 md:w-80 lg:w-96 h-44 sm:h-64 md:h-80 lg:h-96">
          <img
            src={PLANET_DATA[rightPlanet].cutout}
            alt={PLANET_DATA[rightPlanet].title}
            className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_40px_rgba(34,211,238,0.4)] transition-all duration-300"
          />
        </div>
        <span className="font-prata text-xs sm:text-sm tracking-widest text-slate-300 group-hover:text-cyan-300 uppercase mt-1 drop-shadow-lg pr-14 sm:pr-24">
          {PLANET_DATA[rightPlanet].title} &rarr;
        </span>
      </button>

      {/* 4. Center UI Overlay: Eyebrow, Huge Title, Cyan Divider, Description, Glossy Button */}
      <div className="relative z-30 flex flex-col items-center text-center px-6 max-w-2xl mx-auto my-auto pt-6">
        {/* Eyebrow: "PLANET" */}
        <div className="tracking-[0.35em] text-cyan-400 font-mono-code text-xs sm:text-sm font-bold uppercase mb-2 drop-shadow">
          PLANET
        </div>

        {/* Huge serif Title */}
        <h1
          key={selectedPlanet}
          className="font-prata text-6xl sm:text-8xl md:text-9xl text-white font-normal tracking-tight drop-shadow-[0_12px_40px_rgba(0,0,0,0.9)] animate-fadeIn"
        >
          {currentData.title}
        </h1>

        {/* Cyan divider line */}
        <div className="w-20 sm:w-28 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent my-4 sm:my-5 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.9)]" />

        {/* Description paragraph explaining the planetary baseline */}
        <p className="max-w-xl text-slate-200 text-sm sm:text-base font-hanken leading-relaxed text-center px-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {currentData.description}
        </p>

        {/* Glossy white pill button: "GET STARTED" */}
        <button
          type="button"
          id="hero-get-started-btn"
          onClick={handleGetStarted}
          className="mt-8 px-8 sm:px-12 py-3.5 sm:py-4 rounded-full bg-white text-slate-950 font-poppins font-bold text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_35px_rgba(255,255,255,0.45)] hover:shadow-[0_0_55px_rgba(34,211,238,0.7)] hover:bg-cyan-50 active:scale-95 transition-all duration-300 cursor-pointer border border-white/80"
        >
          GET STARTED
        </button>
      </div>

      {/* 5. Bottom Scroll Down Indicator */}
      <div className="relative z-30 pb-6 sm:pb-8 flex flex-col items-center">
        <button
          type="button"
          onClick={handleGetStarted}
          className="text-slate-400 hover:text-white flex flex-col items-center gap-1.5 transition-colors cursor-pointer group"
          aria-label="Scroll down to Vetting Terminal"
        >
          <span className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400 group-hover:text-cyan-300 transition-colors">
            Scroll to Vetting Terminal
          </span>
          <ChevronDown className="h-5 w-5 animate-bounce text-cyan-400" />
        </button>
      </div>
    </section>
  );
};

export default PlanetHero;
