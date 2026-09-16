import React, { useEffect, useRef } from 'react';
import { BaselinePlanetKey } from '../data/baselineTargets';

interface PersistentBackgroundProps {
  selectedBaseline: BaselinePlanetKey;
  scrollProgress: number; // 0 (at hero) to 1 (in workspace)
}

interface VideoAsset {
  clipSrc: string;
  poster: string;
}

const VIDEO_ASSETS: Record<BaselinePlanetKey, VideoAsset> = {
  earth: {
    clipSrc: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_3ffb4889-c520-432d-8458-038009eb40df.mp4',
    poster: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png',
  },
  venus: {
    clipSrc: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_b211cd74-013b-4dd3-bfd0-64491d8696fa.mp4',
    poster: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_cf55d1d8-7b59-4a64-80da-d72052ae974e.png',
  },
  mars: {
    clipSrc: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_51eae59a-2459-4c84-907c-cc5edfe5fea7.mp4',
    poster: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_0ba6de7c-285d-43dc-b7ab-8c54c73707cb.png',
  },
};

const PLANET_KEYS: BaselinePlanetKey[] = ['earth', 'venus', 'mars'];

export const PersistentBackground: React.FC<PersistentBackgroundProps> = ({
  selectedBaseline,
  scrollProgress,
}) => {
  const videoRefs = {
    earth: useRef<HTMLVideoElement | null>(null),
    venus: useRef<HTMLVideoElement | null>(null),
    mars: useRef<HTMLVideoElement | null>(null),
  };

  // Play active video when selectedBaseline changes
  useEffect(() => {
    const activeVideo = videoRefs[selectedBaseline].current;
    if (activeVideo) {
      if (!activeVideo.src && activeVideo.dataset.src) {
        activeVideo.src = activeVideo.dataset.src;
        activeVideo.load();
      }
      activeVideo.play().catch(() => {});
    }
  }, [selectedBaseline]);

  // Initial play
  useEffect(() => {
    const v = videoRefs.earth.current;
    if (v) {
      v.play().catch(() => {});
    }
  }, []);

  // Compute smooth scrim deepening parameters
  // scrollProgress is clamped between 0 and 1
  const clampedProgress = Math.min(Math.max(scrollProgress, 0), 1);
  const scrimAlpha = 0.20 + clampedProgress * 0.68; // 0.20 -> 0.88
  const blurPx = clampedProgress * 16; // 0px -> 16px

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
      id="persistent-astronomy-background"
      aria-hidden="true"
    >
      {/* 1. Base Poster Fallback */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url(${VIDEO_ASSETS[selectedBaseline].poster})`,
          backgroundColor: '#04101f',
        }}
      />

      {/* 2. Looping 16:9 Planetary Video Layers (Cross-fade opacity) */}
      {PLANET_KEYS.map((key) => {
        const asset = VIDEO_ASSETS[key];
        const isActive = selectedBaseline === key;
        return (
          <video
            key={key}
            ref={videoRefs[key]}
            autoPlay={key === 'earth'}
            muted
            loop
            playsInline
            preload={key === 'earth' ? 'auto' : 'metadata'}
            src={key === 'earth' ? asset.clipSrc : undefined}
            data-src={key !== 'earth' ? asset.clipSrc : undefined}
            poster={asset.poster}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
        );
      })}

      {/* 3. Dynamic Dark Glass Scrim (deepens smoothly as user enters vetting workspace) */}
      <div
        className="absolute inset-0 transition-all duration-300 pointer-events-none"
        style={{
          backgroundColor: `rgba(4, 16, 31, ${scrimAlpha.toFixed(3)})`,
          backdropFilter: blurPx > 0.5 ? `blur(${blurPx.toFixed(1)}px)` : 'none',
          WebkitBackdropFilter: blurPx > 0.5 ? `blur(${blurPx.toFixed(1)}px)` : 'none',
        }}
      />

      {/* 4. Luxury Radial Space Flares */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-cyan-500/10 blur-[140px] transition-opacity duration-500"
          style={{ opacity: 0.4 + clampedProgress * 0.6 }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-blue-600/10 blur-[150px] transition-opacity duration-500"
          style={{ opacity: 0.3 + clampedProgress * 0.7 }}
        />
      </div>
    </div>
  );
};

export default PersistentBackground;
