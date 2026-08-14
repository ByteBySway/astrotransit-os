export type TabType = 'vetting' | 'orbit' | 'archive' | 'xai';

export type DispositionType = 'CONFIRMED' | 'CANDIDATE' | 'CONFIRMED CANDIDATE' | 'FALSE POSITIVE' | 'MARGINAL CANDIDATE';

export interface Probabilities {
  exoplanet: number;
  eclipsingBinary: number;
  stellarNoise: number;
}

export interface FalsePositiveChecks {
  oddEvenPass: boolean;
  secondaryEclipsePass: boolean;
  stellarDensityPass: boolean;
  centroidShiftPass?: boolean;
  ephemerisMatchPass?: boolean;
}

export interface AstrophysicsVettingResponse {
  targetId: string;
  mlConfidence: number;
  disposition: DispositionType;
  probabilities: Probabilities;
  falsePositiveChecks: FalsePositiveChecks;
  scientificVerdict: string;
}

export interface StellarParameters {
  teff: number;
  teffErr: number;
  logg: number;
  loggErr: number;
  feh: number;
  fehErr: number;
  mass: number;
  massErr: number;
  radius: number;
  spectralType: string;
  luminosity: number;
}

export interface LightCurvePoint {
  time: number;
  rawFlux: number;
  detrendedFlux: number;
  residual: number;
  phase: number;
  error?: number;
}

export interface PhaseFoldedPoint {
  phase: number; // -0.2 to +0.2 days or normalized phase
  flux: number;
  modelFlux: number;
}

export type MissionEpochId = 'KEPLER' | 'K2' | 'TESS' | 'JWST' | 'ROMAN';

export interface MissionEpoch {
  id: MissionEpochId;
  name: string;
  shortName: string;
  launchYear: number;
  activeYears: string;
  status: 'COMPLETED' | 'OPERATIONAL' | 'UPCOMING';
  targetCount: string;
  description: string;
  keyHighlight: string;
  badgeColor: string;
  associatedTargets: string[]; // target IDs
}

export interface TargetPlanet {
  id: string;
  name: string;
  systemName: string;
  ra?: string;
  dec?: string;
  distanceParsecs?: number;
  orbitalPeriod: number; // days
  transitDepth: number; // ppm
  planetRadius: number; // Earth radii R⊕
  planetMass?: number; // Earth masses M⊕
  semiMajorAxis: number; // AU
  equilibriumTemp: number; // Kelvin
  insolationFlux: number; // Solar flux S⊕
  snr: number;
  mlConfidence: number;
  disposition: DispositionType;
  oddEvenRatio: number;
  secondaryEclipseDepth: number; // ppm
  centroidOffset: number; // pixels / arcsec
  liquidWaterIndex: number; // 0-100%
  greenhouseAlert?: string;
  missionEpoch?: MissionEpochId;
  discoveryYear?: number;
  discoveryMethod?: string;
  stellarParams: StellarParameters;
  tpfMatrix: number[][]; // 5x5 CCD pixel flux matrix
  centroidCoord: { x: number; y: number }; // sub-pixel offset
  sparklineData: number[];
  lightCurve: LightCurvePoint[];
  phaseFoldedData: PhaseFoldedPoint[];
  ttvOffsets: { epoch: number; offsetMinutes: number; error: number }[];
  umapCoord: { x: number; y: number; category: 'CONFIRMED' | 'MARGINAL' | 'REJECTED' };
  xaiAttribution?: number[];
}

export interface ADQLQueryResult {
  query: string;
  executionTimeMs: number;
  totalFound: number;
  results: TargetPlanet[];
}

export type PlanetClassificationType = 'ALL' | 'TERRESTRIAL' | 'SUPER_EARTH' | 'NEPTUNIAN' | 'JOVIAN';

export interface PlanetClassificationInfo {
  type: PlanetClassificationType;
  label: string;
  badgeLabel: string;
  description: string;
  rangeText: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
}

export function getPlanetaryClassification(radius: number): PlanetClassificationInfo {
  if (radius < 1.25) {
    return {
      type: 'TERRESTRIAL',
      label: 'Terrestrial / Earth-like',
      badgeLabel: 'CLASS: TERRESTRIAL',
      description: 'Rocky planet with iron-silicate composition',
      rangeText: 'Rp < 1.25 R⊕',
      colorClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/40',
      bgClass: 'bg-emerald-950/60',
    };
  } else if (radius < 2.0) {
    return {
      type: 'SUPER_EARTH',
      label: 'Super-Earth',
      badgeLabel: 'CLASS: SUPER-EARTH',
      description: 'Dense rocky core or volatile-rich world',
      rangeText: '1.25 R⊕ ≤ Rp < 2.0 R⊕',
      colorClass: 'text-cyan-400',
      borderClass: 'border-cyan-500/40',
      bgClass: 'bg-cyan-950/60',
    };
  } else if (radius < 6.0) {
    return {
      type: 'NEPTUNIAN',
      label: 'Neptunian / Sub-Neptune',
      badgeLabel: 'CLASS: SUB-NEPTUNE',
      description: 'Volatile-rich / thick gaseous envelope',
      rangeText: '2.0 R⊕ ≤ Rp < 6.0 R⊕',
      colorClass: 'text-blue-400',
      borderClass: 'border-blue-500/40',
      bgClass: 'bg-blue-950/60',
    };
  } else {
    return {
      type: 'JOVIAN',
      label: 'Gas Giant / Jovian',
      badgeLabel: 'CLASS: GAS GIANT',
      description: 'Massive hydrogen-helium gas giant',
      rangeText: 'Rp ≥ 6.0 R⊕',
      colorClass: 'text-amber-400',
      borderClass: 'border-amber-500/40',
      bgClass: 'bg-amber-950/60',
    };
  }
}
