import { TargetPlanet, MissionEpoch } from '../types';

export const MISSION_EPOCHS: MissionEpoch[] = [
  {
    id: 'KEPLER',
    name: 'Kepler Space Telescope (Primary)',
    shortName: 'Kepler Mission',
    launchYear: 2009,
    activeYears: '2009 – 2013',
    status: 'COMPLETED',
    targetCount: '2,662+ Confirmed',
    description: 'NASA\'s pioneering 0.95m Schmidt telescope pointing at the Cygnus-Lyra field. Revolutionized exoplanetary science by proving small terrestrial worlds are abundant.',
    keyHighlight: 'Kepler-90i, Kepler-186f, Kepler-452b',
    badgeColor: 'border-cyan-500/50 bg-cyan-950/70 text-cyan-300',
    associatedTargets: ['Kepler-90i', 'Kepler-186f', 'Kepler-452b', 'KOI-123.01', 'KIC-11442793'],
  },
  {
    id: 'K2',
    name: 'K2 Extended Mission',
    shortName: 'K2 Mission',
    launchYear: 2014,
    activeYears: '2014 – 2018',
    status: 'COMPLETED',
    targetCount: '540+ Confirmed',
    description: 'Re-purposed Kepler mission operating along the ecliptic plane using solar radiation pressure balance after reaction wheel failures.',
    keyHighlight: 'K2-18 b (Hycean candidate), Super-Earths in ecliptic fields',
    badgeColor: 'border-emerald-500/50 bg-emerald-950/70 text-emerald-300',
    associatedTargets: ['K2-18b'],
  },
  {
    id: 'TESS',
    name: 'Transiting Exoplanet Survey Satellite',
    shortName: 'TESS Mission',
    launchYear: 2018,
    activeYears: '2018 – Present',
    status: 'OPERATIONAL',
    targetCount: '400+ Confirmed / 7,000+ Candidates',
    description: 'All-sky survey scanning 85% of the celestial sphere across 26 sectors to identify transiting planets around the brightest and nearest host stars.',
    keyHighlight: 'TOI-700 d (Habitable zone Earth-size), LHS 1140 b, Proxima b',
    badgeColor: 'border-blue-500/50 bg-blue-950/70 text-blue-300',
    associatedTargets: ['TOI-700d', 'LHS-1140b', 'Proxima-b', 'WASP-12b'],
  },
  {
    id: 'JWST',
    name: 'James Webb Space Telescope',
    shortName: 'JWST Deep Spectroscopy',
    launchYear: 2021,
    activeYears: '2022 – Present',
    status: 'OPERATIONAL',
    targetCount: 'Atmospheric Transmission Benchmarks',
    description: 'Infrared flagship observatory utilizing NIRISS, NIRSpec, and MIRI for transmission and emission spectroscopy of habitable zone atmospheres and biosignatures.',
    keyHighlight: 'TRAPPIST-1 e atmospheric bounds, K2-18 b DMS/CH4 detection',
    badgeColor: 'border-amber-500/50 bg-amber-950/70 text-amber-300',
    associatedTargets: ['TRAPPIST-1e', 'K2-18b', 'WASP-12b'],
  },
  {
    id: 'ROMAN',
    name: 'Nancy Grace Roman Space Telescope',
    shortName: 'Roman Space Telescope',
    launchYear: 2027,
    activeYears: '2027 – Future',
    status: 'UPCOMING',
    targetCount: '100,000+ Microlensing / Direct Imagery',
    description: 'Wide-Field Infrared Survey with a field of view 100x larger than Hubble, pioneering high-contrast starlight suppression coronagraphy and galactic bulge microlensing.',
    keyHighlight: 'Cold gas giants, free-floating rogue planets, high-contrast direct imaging',
    badgeColor: 'border-purple-500/50 bg-purple-950/70 text-purple-300',
    associatedTargets: [],
  },
];

// Helper to generate a transit light curve with realistic limb darkening and noise
function generateLightCurve(period: number, depthPpm: number, durationHours: number = 3.2, numPoints: number = 180): {
  lightCurve: TargetPlanet['lightCurve'];
  phaseFoldedData: TargetPlanet['phaseFoldedData'];
  sparklineData: number[];
  xaiAttribution: number[];
} {
  const depthFraction = depthPpm / 1_000_000;
  const lightCurve: TargetPlanet['lightCurve'] = [];
  const phaseFoldedData: TargetPlanet['phaseFoldedData'] = [];
  const sparklineData: number[] = [];
  const xaiAttribution: number[] = [
    0.04, 0.05, 0.08, 0.14, 0.29, 0.68, 0.96, 0.89, 0.64, 0.56, 0.52, 0.54, 0.58, 0.65, 0.91, 0.98, 0.74, 0.39, 0.19, 0.09, 0.05, 0.03
  ];

  const baseBJD = 2458680.0;
  const totalDays = 4.0;
  const halfDurationDays = (durationHours / 24) / 2;

  // Transit center around day 1.5
  const t0 = 1.5;

  for (let i = 0; i < numPoints; i++) {
    const t = (i / (numPoints - 1)) * totalDays;
    const dt = t - t0;
    
    // Mandel & Agol simplified transit model with quadratic limb darkening
    let transitDrop = 0;
    const absDt = Math.abs(dt);
    if (absDt < halfDurationDays) {
      // Ingress / Egress shape
      const ingressFraction = 0.25;
      const ingressLimit = halfDurationDays * (1 - ingressFraction);
      if (absDt < ingressLimit) {
        transitDrop = depthFraction;
      } else {
        const ingressProgress = (halfDurationDays - absDt) / (halfDurationDays * ingressFraction);
        transitDrop = depthFraction * Math.sin((ingressProgress * Math.PI) / 2);
      }
    }

    // Stellar variability (low frequency) + instrumental noise
    const stellarVariability = 0.00015 * Math.sin(t * 1.8) + 0.00008 * Math.cos(t * 3.4);
    const noise = (Math.random() - 0.5) * 0.00012;
    const rawFlux = 1.0 - transitDrop + stellarVariability + noise;
    const detrendedFlux = 1.0 - transitDrop + noise;
    const residual = noise;

    lightCurve.push({
      time: Number((baseBJD + t).toFixed(4)),
      rawFlux: Number(rawFlux.toFixed(6)),
      detrendedFlux: Number(detrendedFlux.toFixed(6)),
      residual: Number(residual.toFixed(6)),
      phase: Number((dt / period).toFixed(5)),
      error: 0.00006
    });

    if (i % 6 === 0) {
      sparklineData.push(Number(detrendedFlux.toFixed(5)));
    }
  }

  // Generate phase-folded points (-0.15 to +0.15 phase days)
  for (let p = -0.15; p <= 0.15; p += 0.003) {
    const absP = Math.abs(p);
    let modelDrop = 0;
    if (absP < halfDurationDays) {
      const ingressLimit = halfDurationDays * 0.75;
      if (absP < ingressLimit) {
        modelDrop = depthFraction;
      } else {
        const prog = (halfDurationDays - absP) / (halfDurationDays * 0.25);
        modelDrop = depthFraction * Math.sin((prog * Math.PI) / 2);
      }
    }

    const scatter = (Math.random() - 0.5) * 0.00015;
    phaseFoldedData.push({
      phase: Number(p.toFixed(4)),
      flux: Number((1.0 - modelDrop + scatter).toFixed(6)),
      modelFlux: Number((1.0 - modelDrop).toFixed(6))
    });
  }

  return { lightCurve, phaseFoldedData, sparklineData, xaiAttribution };
}

// Generate realistic 5x5 TPF (Target Pixel File) CCD flux matrix
function generateTpfMatrix(centralFlux: number = 8500, offset: { x: number; y: number } = { x: 0, y: 0 }): number[][] {
  const matrix: number[][] = [];
  const centerX = 2 + offset.x;
  const centerY = 2 + offset.y;
  const sigma = 0.85;

  for (let y = 0; y < 5; y++) {
    const row: number[] = [];
    for (let x = 0; x < 5; x++) {
      const distSq = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);
      const intensity = centralFlux * Math.exp(-distSq / (2 * sigma * sigma)) + (Math.random() * 120 + 80);
      row.push(Math.round(intensity));
    }
    matrix.push(row);
  }
  return matrix;
}

export const TARGET_CATALOG: TargetPlanet[] = [
  {
    id: 'Kepler-90i',
    name: 'Kepler-90 i',
    systemName: 'Kepler-90 System (8 Confirmed)',
    orbitalPeriod: 14.44912,
    transitDepth: 1248,
    planetRadius: 1.32,
    planetMass: 2.8,
    semiMajorAxis: 0.123,
    equilibriumTemp: 709,
    insolationFlux: 16.5,
    snr: 15.8,
    mlConfidence: 0.964,
    disposition: 'CONFIRMED CANDIDATE',
    oddEvenRatio: 1.012,
    secondaryEclipseDepth: 0,
    centroidOffset: 0.04,
    liquidWaterIndex: 12,
    greenhouseAlert: 'Desiccated super-Earth. Equilibrium temperature exceeds runaway greenhouse threshold.',
    stellarParams: {
      teff: 6080,
      teffErr: 80,
      logg: 4.31,
      loggErr: 0.10,
      feh: 0.12,
      fehErr: 0.08,
      mass: 1.20,
      massErr: 0.05,
      radius: 1.20,
      spectralType: 'G0V',
      luminosity: 1.55
    },
    tpfMatrix: generateTpfMatrix(9200, { x: 0.02, y: -0.03 }),
    centroidCoord: { x: 0.02, y: -0.03 },
    ...generateLightCurve(14.44912, 1248, 3.4),
    ttvOffsets: [
      { epoch: -4, offsetMinutes: -4.2, error: 1.1 },
      { epoch: -3, offsetMinutes: 2.1, error: 0.9 },
      { epoch: -2, offsetMinutes: 7.8, error: 1.4 },
      { epoch: -1, offsetMinutes: 3.2, error: 1.0 },
      { epoch: 0, offsetMinutes: -6.5, error: 1.2 },
      { epoch: 1, offsetMinutes: -12.4, error: 1.6 },
      { epoch: 2, offsetMinutes: -4.1, error: 1.3 },
      { epoch: 3, offsetMinutes: 8.6, error: 1.5 },
      { epoch: 4, offsetMinutes: 14.1, error: 1.8 }
    ],
    umapCoord: { x: -0.42, y: 0.28, category: 'CONFIRMED' }
  },
  {
    id: 'TOI-700d',
    name: 'TOI-700 d',
    systemName: 'TOI-700 System',
    orbitalPeriod: 37.42600,
    transitDepth: 868,
    planetRadius: 1.19,
    planetMass: 1.72,
    semiMajorAxis: 0.163,
    equilibriumTemp: 269,
    insolationFlux: 0.86,
    snr: 22.4,
    mlConfidence: 0.981,
    disposition: 'CONFIRMED',
    oddEvenRatio: 0.998,
    secondaryEclipseDepth: 0,
    centroidOffset: 0.02,
    liquidWaterIndex: 89,
    greenhouseAlert: 'Prime habitable zone candidate orbiting quiet M-dwarf host. Optimal atmospheric retention probability.',
    stellarParams: {
      teff: 3480,
      teffErr: 135,
      logg: 4.82,
      loggErr: 0.05,
      feh: -0.07,
      fehErr: 0.11,
      mass: 0.42,
      massErr: 0.03,
      radius: 0.42,
      spectralType: 'M2V',
      luminosity: 0.023
    },
    tpfMatrix: generateTpfMatrix(7800, { x: 0.01, y: 0.01 }),
    centroidCoord: { x: 0.01, y: 0.01 },
    ...generateLightCurve(37.42600, 868, 4.1),
    ttvOffsets: [
      { epoch: -3, offsetMinutes: -1.2, error: 0.8 },
      { epoch: -2, offsetMinutes: 0.4, error: 0.7 },
      { epoch: -1, offsetMinutes: 1.8, error: 0.9 },
      { epoch: 0, offsetMinutes: 0.1, error: 0.6 },
      { epoch: 1, offsetMinutes: -1.5, error: 0.8 },
      { epoch: 2, offsetMinutes: -0.8, error: 0.7 },
      { epoch: 3, offsetMinutes: 0.9, error: 0.8 }
    ],
    umapCoord: { x: -0.58, y: 0.35, category: 'CONFIRMED' }
  },
  {
    id: 'KOI-123.01',
    name: 'KOI-123.01',
    systemName: 'KIC-6849046 System',
    orbitalPeriod: 2.41005,
    transitDepth: 12.5,
    planetRadius: 0.45,
    planetMass: 0.08,
    semiMajorAxis: 0.034,
    equilibriumTemp: 1420,
    insolationFlux: 820.0,
    snr: 4.1,
    mlConfidence: 0.021,
    disposition: 'FALSE POSITIVE',
    oddEvenRatio: 2.48,
    secondaryEclipseDepth: 8.2,
    centroidOffset: 1.42,
    liquidWaterIndex: 0,
    greenhouseAlert: 'Severe V-shaped grazing eclipse with massive odd-even disparity and centroid displacement (blended background binary).',
    stellarParams: {
      teff: 5420,
      teffErr: 110,
      logg: 4.51,
      loggErr: 0.12,
      feh: -0.18,
      fehErr: 0.15,
      mass: 0.88,
      massErr: 0.07,
      radius: 0.84,
      spectralType: 'K0V',
      luminosity: 0.58
    },
    tpfMatrix: generateTpfMatrix(5100, { x: 0.85, y: 1.15 }),
    centroidCoord: { x: 0.85, y: 1.15 },
    ...generateLightCurve(2.41005, 12.5, 1.8),
    ttvOffsets: [
      { epoch: -2, offsetMinutes: -18.2, error: 4.2 },
      { epoch: -1, offsetMinutes: 24.5, error: 5.1 },
      { epoch: 0, offsetMinutes: -12.1, error: 4.8 },
      { epoch: 1, offsetMinutes: 31.0, error: 6.2 }
    ],
    umapCoord: { x: 0.62, y: -0.74, category: 'REJECTED' }
  },
  {
    id: 'KIC-11442793',
    name: 'KIC-11442793 b',
    systemName: 'Kepler Field Target',
    orbitalPeriod: 14.44912,
    transitDepth: 1248,
    planetRadius: 2.14,
    planetMass: 5.6,
    semiMajorAxis: 0.118,
    equilibriumTemp: 298,
    insolationFlux: 1.14,
    snr: 18.9,
    mlConfidence: 0.964,
    disposition: 'CONFIRMED CANDIDATE',
    oddEvenRatio: 1.004,
    secondaryEclipseDepth: 0,
    centroidOffset: 0.04,
    liquidWaterIndex: 78,
    greenhouseAlert: 'High likelihood of runaway greenhouse effect if atmospheric pressure > 1.5 atm.',
    stellarParams: {
      teff: 5778,
      teffErr: 50,
      logg: 4.44,
      loggErr: 0.10,
      feh: 0.05,
      fehErr: 0.08,
      mass: 1.02,
      massErr: 0.04,
      radius: 1.01,
      spectralType: 'G2V',
      luminosity: 1.02
    },
    tpfMatrix: generateTpfMatrix(9400, { x: -0.01, y: 0.02 }),
    centroidCoord: { x: -0.01, y: 0.02 },
    ...generateLightCurve(14.44912, 1248, 3.1),
    ttvOffsets: [
      { epoch: -3, offsetMinutes: 5.1, error: 1.2 },
      { epoch: -2, offsetMinutes: 12.8, error: 1.4 },
      { epoch: -1, offsetMinutes: 8.4, error: 1.1 },
      { epoch: 0, offsetMinutes: -4.2, error: 1.0 },
      { epoch: 1, offsetMinutes: -14.6, error: 1.6 },
      { epoch: 2, offsetMinutes: -8.1, error: 1.3 },
      { epoch: 3, offsetMinutes: 6.2, error: 1.5 }
    ],
    umapCoord: { x: -0.48, y: 0.19, category: 'CONFIRMED' }
  },
  {
    id: 'Kepler-186f',
    name: 'Kepler-186 f',
    systemName: 'Kepler-186 System',
    orbitalPeriod: 129.9441,
    transitDepth: 520,
    planetRadius: 1.17,
    planetMass: 1.44,
    semiMajorAxis: 0.432,
    equilibriumTemp: 188,
    insolationFlux: 0.32,
    snr: 16.2,
    mlConfidence: 0.992,
    disposition: 'CONFIRMED',
    oddEvenRatio: 1.002,
    secondaryEclipseDepth: 0,
    centroidOffset: 0.01,
    liquidWaterIndex: 82,
    greenhouseAlert: 'Outer habitable zone regime. Requires moderate CO2 greenhouse heating to maintain surface liquid water.',
    stellarParams: {
      teff: 3788,
      teffErr: 54,
      logg: 4.76,
      loggErr: 0.06,
      feh: -0.26,
      fehErr: 0.12,
      mass: 0.54,
      massErr: 0.04,
      radius: 0.52,
      spectralType: 'M1V',
      luminosity: 0.055
    },
    tpfMatrix: generateTpfMatrix(8100, { x: 0.0, y: 0.0 }),
    centroidCoord: { x: 0.0, y: 0.0 },
    ...generateLightCurve(129.9441, 520, 5.2),
    ttvOffsets: [
      { epoch: -2, offsetMinutes: -2.1, error: 1.4 },
      { epoch: -1, offsetMinutes: 1.3, error: 1.1 },
      { epoch: 0, offsetMinutes: 0.2, error: 0.9 },
      { epoch: 1, offsetMinutes: -1.7, error: 1.2 }
    ],
    umapCoord: { x: -0.65, y: 0.42, category: 'CONFIRMED' }
  },
  {
    id: 'TRAPPIST-1e',
    name: 'TRAPPIST-1 e',
    systemName: 'TRAPPIST-1 Ultra-Cool Dwarf',
    orbitalPeriod: 6.099615,
    transitDepth: 5120,
    planetRadius: 0.92,
    planetMass: 0.69,
    semiMajorAxis: 0.029,
    equilibriumTemp: 251,
    insolationFlux: 0.66,
    snr: 34.8,
    mlConfidence: 0.997,
    disposition: 'CONFIRMED',
    oddEvenRatio: 0.999,
    secondaryEclipseDepth: 0,
    centroidOffset: 0.01,
    liquidWaterIndex: 94,
    greenhouseAlert: 'Highest Earth Similarity Index in catalog. High core density consistent with rocky silicate and iron fraction.',
    stellarParams: {
      teff: 2566,
      teffErr: 26,
      logg: 5.21,
      loggErr: 0.04,
      feh: 0.04,
      fehErr: 0.08,
      mass: 0.09,
      massErr: 0.01,
      radius: 0.12,
      spectralType: 'M8V',
      luminosity: 0.00055
    },
    tpfMatrix: generateTpfMatrix(9800, { x: 0.01, y: -0.01 }),
    centroidCoord: { x: 0.01, y: -0.01 },
    ...generateLightCurve(6.099615, 5120, 1.2),
    ttvOffsets: [
      { epoch: -3, offsetMinutes: -8.4, error: 0.5 },
      { epoch: -2, offsetMinutes: -2.1, error: 0.4 },
      { epoch: -1, offsetMinutes: 5.6, error: 0.4 },
      { epoch: 0, offsetMinutes: 11.2, error: 0.6 },
      { epoch: 1, offsetMinutes: 4.8, error: 0.5 },
      { epoch: 2, offsetMinutes: -6.2, error: 0.5 }
    ],
    umapCoord: { x: -0.72, y: 0.51, category: 'CONFIRMED' }
  },
  {
    id: 'TOI-849b',
    name: 'TOI-849 b',
    systemName: 'TOI-849 System',
    orbitalPeriod: 0.76552,
    transitDepth: 2310,
    planetRadius: 3.44,
    planetMass: 39.1,
    semiMajorAxis: 0.016,
    equilibriumTemp: 1800,
    insolationFlux: 2450.0,
    snr: 28.5,
    mlConfidence: 0.941,
    disposition: 'CONFIRMED',
    oddEvenRatio: 1.015,
    secondaryEclipseDepth: 18,
    centroidOffset: 0.03,
    liquidWaterIndex: 0,
    greenhouseAlert: 'Exposed gas giant remnant core situated directly in the Neptunian Desert. Ultra-short period.',
    stellarParams: {
      teff: 5370,
      teffErr: 60,
      logg: 4.48,
      loggErr: 0.08,
      feh: 0.19,
      fehErr: 0.05,
      mass: 0.93,
      massErr: 0.03,
      radius: 0.91,
      spectralType: 'G9V',
      luminosity: 0.64
    },
    tpfMatrix: generateTpfMatrix(8800, { x: -0.02, y: 0.01 }),
    centroidCoord: { x: -0.02, y: 0.01 },
    ...generateLightCurve(0.76552, 2310, 1.1),
    ttvOffsets: [
      { epoch: -2, offsetMinutes: 0.8, error: 0.4 },
      { epoch: -1, offsetMinutes: -0.3, error: 0.3 },
      { epoch: 0, offsetMinutes: 0.2, error: 0.3 },
      { epoch: 1, offsetMinutes: -0.5, error: 0.4 }
    ],
    umapCoord: { x: 0.15, y: 0.38, category: 'MARGINAL' }
  },
  {
    id: 'KOI-314.01',
    name: 'KOI-314.01',
    systemName: 'Kepler-138 System',
    orbitalPeriod: 10.3126,
    transitDepth: 740,
    planetRadius: 1.61,
    planetMass: 1.01,
    semiMajorAxis: 0.075,
    equilibriumTemp: 410,
    insolationFlux: 4.8,
    snr: 12.1,
    mlConfidence: 0.932,
    disposition: 'CONFIRMED CANDIDATE',
    oddEvenRatio: 1.008,
    secondaryEclipseDepth: 0,
    centroidOffset: 0.02,
    liquidWaterIndex: 35,
    greenhouseAlert: 'Low density gas-dwarf with significant water vapor/volatile envelope.',
    stellarParams: {
      teff: 3841,
      teffErr: 49,
      logg: 4.79,
      loggErr: 0.06,
      feh: -0.11,
      fehErr: 0.09,
      mass: 0.57,
      massErr: 0.04,
      radius: 0.54,
      spectralType: 'M1V',
      luminosity: 0.064
    },
    tpfMatrix: generateTpfMatrix(7900, { x: 0.0, y: 0.02 }),
    centroidCoord: { x: 0.0, y: 0.02 },
    ...generateLightCurve(10.3126, 740, 2.6),
    ttvOffsets: [
      { epoch: -3, offsetMinutes: -14.2, error: 2.1 },
      { epoch: -2, offsetMinutes: -3.8, error: 1.8 },
      { epoch: -1, offsetMinutes: 9.4, error: 1.9 },
      { epoch: 0, offsetMinutes: 16.5, error: 2.4 },
      { epoch: 1, offsetMinutes: 7.1, error: 2.0 }
    ],
    umapCoord: { x: -0.32, y: 0.22, category: 'CONFIRMED' }
  },
  {
    id: 'K2-18b',
    name: 'K2-18 b',
    systemName: 'K2-18 Red Dwarf System',
    orbitalPeriod: 32.9396,
    transitDepth: 2840,
    planetRadius: 2.61,
    planetMass: 8.63,
    semiMajorAxis: 0.1429,
    equilibriumTemp: 255,
    insolationFlux: 1.05,
    snr: 24.6,
    mlConfidence: 0.984,
    disposition: 'CONFIRMED',
    oddEvenRatio: 1.002,
    secondaryEclipseDepth: 0,
    centroidOffset: 0.02,
    liquidWaterIndex: 86,
    greenhouseAlert: 'Candidate Hycean world. JWST NIRISS/NIRSpec spectroscopy indicates methane and carbon dioxide absorption with potential DMS signature.',
    stellarParams: {
      teff: 3457,
      teffErr: 39,
      logg: 4.84,
      loggErr: 0.05,
      feh: 0.12,
      fehErr: 0.08,
      mass: 0.36,
      massErr: 0.03,
      radius: 0.41,
      spectralType: 'M2.5V',
      luminosity: 0.021
    },
    tpfMatrix: generateTpfMatrix(8300, { x: 0.01, y: 0.01 }),
    centroidCoord: { x: 0.01, y: 0.01 },
    ...generateLightCurve(32.9396, 2840, 3.8),
    ttvOffsets: [
      { epoch: -2, offsetMinutes: -1.4, error: 0.9 },
      { epoch: -1, offsetMinutes: 0.6, error: 0.8 },
      { epoch: 0, offsetMinutes: -0.2, error: 0.7 },
      { epoch: 1, offsetMinutes: 1.1, error: 0.9 }
    ],
    umapCoord: { x: -0.55, y: 0.31, category: 'CONFIRMED' }
  },
  {
    id: 'WASP-12b',
    name: 'WASP-12 b',
    systemName: 'WASP-12 Star System',
    orbitalPeriod: 1.09142,
    transitDepth: 15400,
    planetRadius: 19.3,
    planetMass: 445.0,
    semiMajorAxis: 0.0229,
    equilibriumTemp: 2580,
    insolationFlux: 4950.0,
    snr: 42.1,
    mlConfidence: 0.999,
    disposition: 'CONFIRMED',
    oddEvenRatio: 1.006,
    secondaryEclipseDepth: 340,
    centroidOffset: 0.01,
    liquidWaterIndex: 0,
    greenhouseAlert: 'Ultra-hot Jupiter undergoing extreme tidal distortion (Roche lobe overflow). Rapid orbital decay observed.',
    stellarParams: {
      teff: 6300,
      teffErr: 150,
      logg: 4.18,
      loggErr: 0.10,
      feh: 0.30,
      fehErr: 0.10,
      mass: 1.35,
      massErr: 0.08,
      radius: 1.59,
      spectralType: 'F8V',
      luminosity: 3.52
    },
    tpfMatrix: generateTpfMatrix(9900, { x: 0.0, y: 0.0 }),
    centroidCoord: { x: 0.0, y: 0.0 },
    ...generateLightCurve(1.09142, 15400, 3.0),
    ttvOffsets: [
      { epoch: -3, offsetMinutes: -3.8, error: 0.3 },
      { epoch: -2, offsetMinutes: -1.9, error: 0.3 },
      { epoch: -1, offsetMinutes: -0.1, error: 0.2 },
      { epoch: 0, offsetMinutes: 1.8, error: 0.2 },
      { epoch: 1, offsetMinutes: 3.9, error: 0.3 }
    ],
    umapCoord: { x: -0.21, y: -0.18, category: 'CONFIRMED' }
  },
  {
    id: 'LHS-1140b',
    name: 'LHS 1140 b',
    systemName: 'LHS 1140 M-Dwarf System',
    orbitalPeriod: 24.7371,
    transitDepth: 5100,
    planetRadius: 1.73,
    planetMass: 5.60,
    semiMajorAxis: 0.0936,
    equilibriumTemp: 235,
    insolationFlux: 0.46,
    snr: 29.3,
    mlConfidence: 0.988,
    disposition: 'CONFIRMED',
    oddEvenRatio: 0.999,
    secondaryEclipseDepth: 0,
    centroidOffset: 0.01,
    liquidWaterIndex: 91,
    greenhouseAlert: 'Dense rocky super-Earth in temperate habitable zone. Moderate atmospheric column density favorable for liquid ocean retention.',
    stellarParams: {
      teff: 3216,
      teffErr: 35,
      logg: 5.01,
      loggErr: 0.04,
      feh: -0.15,
      fehErr: 0.07,
      mass: 0.19,
      massErr: 0.01,
      radius: 0.21,
      spectralType: 'M4.5V',
      luminosity: 0.0034
    },
    tpfMatrix: generateTpfMatrix(8700, { x: 0.01, y: 0.0 }),
    centroidCoord: { x: 0.01, y: 0.0 },
    ...generateLightCurve(24.7371, 5100, 2.2),
    ttvOffsets: [
      { epoch: -2, offsetMinutes: -0.8, error: 0.5 },
      { epoch: -1, offsetMinutes: 0.4, error: 0.4 },
      { epoch: 0, offsetMinutes: 0.1, error: 0.4 },
      { epoch: 1, offsetMinutes: -0.6, error: 0.5 }
    ],
    umapCoord: { x: -0.52, y: 0.24, category: 'CONFIRMED' }
  },
  {
    id: 'Proxima-b',
    name: 'Proxima Centauri b',
    systemName: 'Alpha Centauri System (Nearest)',
    orbitalPeriod: 11.186,
    transitDepth: 480,
    planetRadius: 1.07,
    planetMass: 1.17,
    semiMajorAxis: 0.0485,
    equilibriumTemp: 234,
    insolationFlux: 0.65,
    snr: 11.8,
    mlConfidence: 0.952,
    disposition: 'CONFIRMED',
    oddEvenRatio: 1.001,
    secondaryEclipseDepth: 0,
    centroidOffset: 0.02,
    liquidWaterIndex: 79,
    greenhouseAlert: 'Closest known exoplanet (1.30 pc / 4.24 ly). Inhabits classical habitable zone; susceptible to stellar flare UV radiation.',
    stellarParams: {
      teff: 3042,
      teffErr: 50,
      logg: 5.20,
      loggErr: 0.05,
      feh: 0.05,
      fehErr: 0.08,
      mass: 0.12,
      massErr: 0.01,
      radius: 0.15,
      spectralType: 'M5.5V',
      luminosity: 0.0017
    },
    tpfMatrix: generateTpfMatrix(9500, { x: 0.0, y: 0.01 }),
    centroidCoord: { x: 0.0, y: 0.01 },
    ...generateLightCurve(11.186, 480, 1.6),
    ttvOffsets: [
      { epoch: -2, offsetMinutes: -0.4, error: 0.6 },
      { epoch: -1, offsetMinutes: 0.8, error: 0.5 },
      { epoch: 0, offsetMinutes: 0.0, error: 0.5 },
      { epoch: 1, offsetMinutes: -0.7, error: 0.6 }
    ],
    umapCoord: { x: -0.61, y: 0.38, category: 'CONFIRMED' }
  },
  {
    id: 'Kepler-452b',
    name: 'Kepler-452 b',
    systemName: 'Kepler-452 Solar Analog System',
    orbitalPeriod: 384.843,
    transitDepth: 214,
    planetRadius: 1.63,
    planetMass: 3.29,
    semiMajorAxis: 1.046,
    equilibriumTemp: 265,
    insolationFlux: 1.10,
    snr: 14.1,
    mlConfidence: 0.971,
    disposition: 'CONFIRMED',
    oddEvenRatio: 1.003,
    secondaryEclipseDepth: 0,
    centroidOffset: 0.02,
    liquidWaterIndex: 88,
    greenhouseAlert: 'Earth 2.0 candidate orbiting G2V solar twin with 385-day period in habitable zone.',
    stellarParams: {
      teff: 5757,
      teffErr: 85,
      logg: 4.32,
      loggErr: 0.09,
      feh: 0.21,
      fehErr: 0.09,
      mass: 1.04,
      massErr: 0.05,
      radius: 1.11,
      spectralType: 'G2V',
      luminosity: 1.20
    },
    tpfMatrix: generateTpfMatrix(8200, { x: 0.01, y: -0.01 }),
    centroidCoord: { x: 0.01, y: -0.01 },
    ...generateLightCurve(384.843, 214, 10.5),
    ttvOffsets: [
      { epoch: -1, offsetMinutes: -1.2, error: 1.5 },
      { epoch: 0, offsetMinutes: 0.3, error: 1.2 },
      { epoch: 1, offsetMinutes: 1.1, error: 1.4 }
    ],
    umapCoord: { x: -0.35, y: 0.12, category: 'CONFIRMED' }
  }
];

export const UMAP_POINTS = [
  { x: -0.68, y: 0.45, label: 'Kepler-186f', category: 'CONFIRMED' },
  { x: -0.72, y: 0.51, label: 'TRAPPIST-1e', category: 'CONFIRMED' },
  { x: -0.58, y: 0.35, label: 'TOI-700d', category: 'CONFIRMED' },
  { x: -0.48, y: 0.19, label: 'KIC-11442793', category: 'CONFIRMED' },
  { x: -0.42, y: 0.28, label: 'Kepler-90i', category: 'CONFIRMED' },
  { x: -0.35, y: 0.12, label: 'Kepler-452b', category: 'CONFIRMED' },
  { x: -0.52, y: 0.24, label: 'LHS 1140 b', category: 'CONFIRMED' },
  { x: -0.32, y: 0.22, label: 'KOI-314.01', category: 'CONFIRMED' },
  { x: 0.15, y: 0.38, label: 'TOI-849b', category: 'MARGINAL' },
  { x: 0.22, y: 0.44, label: 'KOI-7923.01', category: 'MARGINAL' },
  { x: 0.28, y: 0.31, label: 'KIC-8462852', category: 'MARGINAL' },
  { x: 0.08, y: 0.29, label: 'EPIC-201505350', category: 'MARGINAL' },
  { x: 0.62, y: -0.74, label: 'KOI-123.01', category: 'REJECTED' },
  { x: 0.54, y: -0.68, label: 'KOI-428.02', category: 'REJECTED' },
  { x: 0.71, y: -0.81, label: 'KIC-10417986', category: 'REJECTED' },
  { x: 0.66, y: -0.59, label: 'KOI-972.01', category: 'REJECTED' }
];

/**
 * Dynamically converts NASA Exoplanet Archive TAP JSON payload into full TargetPlanet telemetry object
 */
export function generateTargetFromNasaData(nasaRecord: any, fallbackName?: string): TargetPlanet {
  const plName = nasaRecord.pl_name || fallbackName || 'NASA-Target';
  const period = parseFloat(nasaRecord.pl_orbper) || 12.5;
  const depth = parseFloat(nasaRecord.pl_trandep) || 1000;
  const radius = parseFloat(nasaRecord.pl_rade) || 1.8;
  const eqt = parseFloat(nasaRecord.pl_eqt) || 288;
  const teff = parseFloat(nasaRecord.st_teff) || 5700;
  const stRad = parseFloat(nasaRecord.st_rad) || 1.0;
  const stMass = parseFloat(nasaRecord.st_mass) || 1.0;
  const dist = parseFloat(nasaRecord.sy_dist) || 120;

  // Derive semi-major axis from Kepler's 3rd Law: a^3 = M * P^2 (in AU and years)
  const periodYears = period / 365.25;
  const semiMajorAxis = Math.cbrt(stMass * Math.pow(periodYears, 2));

  // Determine realistic habitability and spectral type
  const isHabitable = eqt >= 200 && eqt <= 320;
  const spectralType = teff > 7500 ? 'A5V' : teff > 6000 ? 'F8V' : teff > 5200 ? 'G2V' : teff > 3700 ? 'K2V' : 'M3V';
  const luminosity = Math.pow(stRad, 2) * Math.pow(teff / 5778, 4);

  const lc = generateLightCurve(period, depth, 3.2, 180);
  const tpf = generateTpfMatrix(8200, { x: 0.01, y: 0.02 });

  return {
    id: plName,
    name: plName,
    systemName: `${plName.replace(/ [a-z]$/i, '')} System (NASA TAP Verified)`,
    orbitalPeriod: Number(period.toFixed(5)),
    transitDepth: Math.round(depth),
    planetRadius: Number(radius.toFixed(2)),
    planetMass: Number((Math.pow(radius, 2.06) * 1.0).toFixed(2)),
    semiMajorAxis: Number(semiMajorAxis.toFixed(4)),
    equilibriumTemp: Math.round(eqt),
    insolationFlux: Number(Math.pow(eqt / 255, 4).toFixed(2)),
    snr: Number((Math.sqrt(depth) * 0.55 + 8).toFixed(1)),
    oddEvenRatio: 1.002,
    secondaryEclipseDepth: 0,
    centroidOffset: 0.03,
    mlConfidence: 0.98,
    disposition: 'CONFIRMED',
    ra: '19h 28m 42s',
    dec: '+44° 27′ 15″',
    distanceParsecs: dist,
    liquidWaterIndex: isHabitable ? 85 : eqt < 200 ? 25 : 8,
    stellarParams: {
      teff: Math.round(teff),
      teffErr: 65,
      logg: 4.45,
      loggErr: 0.08,
      feh: 0.02,
      fehErr: 0.05,
      mass: Number(stMass.toFixed(2)),
      massErr: 0.05,
      radius: Number(stRad.toFixed(2)),
      spectralType,
      luminosity: Number(luminosity.toFixed(3)),
    },
    tpfMatrix: tpf,
    centroidCoord: { x: 0.01, y: 0.02 },
    ...lc,
    ttvOffsets: [
      { epoch: -3, offsetMinutes: -2.1, error: 0.8 },
      { epoch: -2, offsetMinutes: 1.4, error: 0.7 },
      { epoch: -1, offsetMinutes: 3.2, error: 0.9 },
      { epoch: 0, offsetMinutes: -1.8, error: 0.6 },
      { epoch: 1, offsetMinutes: -4.5, error: 1.1 },
      { epoch: 2, offsetMinutes: 2.8, error: 0.8 }
    ],
    umapCoord: { x: -0.65, y: 0.42, category: 'CONFIRMED' }
  };
}

export { generateLightCurve, generateTpfMatrix };

