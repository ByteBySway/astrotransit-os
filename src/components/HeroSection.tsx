import React, { useState, useEffect, useRef, useCallback } from 'react';
import './HeroSection.css';
import { TabType } from '../types';
import { BaselinePlanetKey } from '../data/baselineTargets';
import { AstroTransitLogo } from './AstroTransitLogo';

export type PlanetKey = BaselinePlanetKey;

interface PlanetData {
  eyebrow: string;
  name: string;
  lede: string;
}

const PLANET_METADATA: Record<PlanetKey, PlanetData> = {
  earth: {
    eyebrow: 'HABITABLE BENCHMARK',
    name: 'EARTH',
    lede: 'Primary photometric reference standard (1.00 R_Earth, 1.00 AU). Calibrates Mandel–Agol limb darkening models and circumstellar Habitable Zone boundaries.',
  },
  venus: {
    eyebrow: 'GREENHOUSE LIMIT',
    name: 'VENUS',
    lede: 'Super-critical atmospheric analog (0.95 R_Earth, 0.72 AU). Used to evaluate runaway greenhouse transitions and high-albedo false-positive transit depth anomalies.',
  },
  mars: {
    eyebrow: 'SUB-HABITABLE DESERT',
    name: 'MARS',
    lede: 'Sub-Earth cold boundary benchmark (0.53 R_Earth, 1.52 AU). Sets the maximum greenhouse outer edge of the Habitable Zone and thin-atmosphere retention thresholds.',
  },
};

const CUTOUTS: Record<PlanetKey, string> = {
  earth: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202005_3346cc4d-ec3b-44ab-825c-b18e49f5021a.png',
  venus: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202012_640b239a-d08a-4200-adb2-741bbe129ac8.png',
  mars: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202018_3d559490-f613-4ed7-a3bb-3b7e9fc90fb8.png',
};

const ORDER: PlanetKey[] = ['earth', 'venus', 'mars'];

interface HeroSectionProps {
  selectedBaseline: PlanetKey;
  onSelectBaseline: (planet: PlanetKey) => void;
  onInitializeTerminal: () => void;
  onNavigateToTab?: (tab: TabType) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedBaseline,
  onSelectBaseline,
  onInitializeTerminal,
  onNavigateToTab,
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const isTransitioningRef = useRef(false);

  // Derive left and right rotating slots based on cyclic ORDER
  const featuredIndex = ORDER.indexOf(selectedBaseline);
  const leftSlot = ORDER[(featuredIndex + 1) % 3];
  const rightSlot = ORDER[(featuredIndex + 2) % 3];

  const handleNavTab = useCallback(
    (tab: TabType) => {
      setIsNavOpen(false);
      if (onNavigateToTab) {
        onNavigateToTab(tab);
      }
      onInitializeTerminal();
    },
    [onNavigateToTab, onInitializeTerminal]
  );

  const rotateTo = useCallback(
    (newPlanet: PlanetKey) => {
      if (isTransitioningRef.current || newPlanet === selectedBaseline) return;
      isTransitioningRef.current = true;

      // Animate text fade-out
      setTextVisible(false);

      // Inform parent state
      onSelectBaseline(newPlanet);

      // Fade text back in after small tick
      setTimeout(() => {
        setTextVisible(true);
      }, 140);

      // Release lock
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 400);
    },
    [selectedBaseline, onSelectBaseline]
  );

  // Keyboard navigation
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
        rotateTo(leftSlot);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        rotateTo(rightSlot);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leftSlot, rightSlot, rotateTo]);

  const currentPlanet = PLANET_METADATA[selectedBaseline];

  return (
    <div className="hero-stage" id="hero-overview">
      {/* Navigation Header */}
      <header className="hero-navbar">
        <div className="hero-navrow" data-open={isNavOpen ? 'true' : 'false'}>
          <div
            className="hero-logo"
            onClick={onInitializeTerminal}
            role="button"
            tabIndex={0}
            aria-label="AstroTransit OS - Scroll to terminal"
          >
            <AstroTransitLogo className="w-7 h-7 inline-block mr-2" />
            astro<i>transit</i> <span>OS</span>
          </div>

          <nav className="hero-links" id="site-nav">
            <button
              type="button"
              aria-current="page"
              onClick={() => handleNavTab('vetting')}
            >
              Vetting Terminal
            </button>
            <button type="button" onClick={() => handleNavTab('orbit')}>
              Orbit Sim 3D
            </button>
            <button type="button" onClick={() => handleNavTab('archive')}>
              MAST Archive
            </button>
            <button type="button" onClick={() => handleNavTab('xai')}>
              XAI Latent Lab
            </button>
            <button
              type="button"
              className="hero-enroll"
              onClick={onInitializeTerminal}
            >
              Initialize
            </button>
          </nav>

          <button
            className="hero-burger"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={isNavOpen ? 'true' : 'false'}
            aria-controls="site-nav"
            onClick={() => setIsNavOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Central Content Area */}
      <div className="hero-copy">
        <div className="hero-col hero-eyebrow">
          <span className="ent-mask">
            <span
              className="ent-line font-hanken"
              style={{
                opacity: textVisible ? 1 : 0,
                transform: textVisible ? 'none' : 'translateY(8px)',
              }}
            >
              {currentPlanet.eyebrow}
            </span>
          </span>
        </div>

        <h1 className="hero-col hero-title">
          <span className="ent-mask">
            <span
              className="ent-line font-prata"
              style={{
                opacity: textVisible ? 1 : 0,
                transform: textVisible ? 'none' : 'translateY(16px)',
              }}
            >
              {currentPlanet.name}
            </span>
          </span>
        </h1>

        <div className="hero-col hero-rule">
          <span />
        </div>

        <p
          className="hero-col hero-lede font-hanken"
          style={{
            opacity: textVisible ? 0.95 : 0,
            transform: textVisible ? 'none' : 'translateY(8px)',
            transition: 'opacity .4s ease, transform .4s cubic-bezier(.22, 1, .36, 1)',
          }}
        >
          {currentPlanet.lede}
        </p>

        {/* Action Button & Flanking Planet Cutout Switchers */}
        <div className="hero-col hero-cta">
          {/* Left Rotating Slot Button */}
          <button
            className="hero-planet hero-planet-l"
            type="button"
            onClick={() => rotateTo(leftSlot)}
            aria-label={`Select ${PLANET_METADATA[leftSlot].name} baseline`}
            title={`Select ${PLANET_METADATA[leftSlot].name} baseline`}
          >
            {ORDER.map((key) => (
              <img
                key={key}
                src={CUTOUTS[key]}
                alt=""
                className={leftSlot === key ? 'is-shown' : ''}
              />
            ))}
          </button>

          {/* Right Rotating Slot Button */}
          <button
            className="hero-planet hero-planet-r"
            type="button"
            onClick={() => rotateTo(rightSlot)}
            aria-label={`Select ${PLANET_METADATA[rightSlot].name} baseline`}
            title={`Select ${PLANET_METADATA[rightSlot].name} baseline`}
          >
            {ORDER.map((key) => (
              <img
                key={key}
                src={CUTOUTS[key]}
                alt=""
                className={rightSlot === key ? 'is-shown' : ''}
              />
            ))}
          </button>

          {/* Main "INITIALIZE TERMINAL" CTA Button */}
          <button
            type="button"
            className="hero-cta-btn font-poppins"
            onClick={onInitializeTerminal}
            id="hero-initialize-terminal-btn"
          >
            INITIALIZE TERMINAL
          </button>

          {/* Planet Slot Labels */}
          <span className="hero-label hero-label-l font-prata">{PLANET_METADATA[leftSlot].name}</span>
          <span className="hero-label hero-label-r font-prata">{PLANET_METADATA[rightSlot].name}</span>
        </div>
      </div>

      {/* Bottom Scroll Indicator Button */}
      <button
        className="hero-scroll"
        type="button"
        onClick={onInitializeTerminal}
        aria-label="Scroll down to AstroTransit OS vetting terminal"
        id="hero-scroll-down-btn"
      >
        <svg viewBox="0 0 26 33" fill="none" aria-hidden="true">
          <path
            d="M13 1.5 V31.5 M1.9 20.4 L13 31.5 L24.1 20.4"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </button>
    </div>
  );
};

export default HeroSection;
