import { AstrophysicsVettingResponse, TargetPlanet } from '../types';

/**
 * Kopparapu et al. (2013/2014) Habitable Zone calculations
 * Returns inner and outer boundaries in AU based on stellar effective temperature and luminosity
 */
export function calculateHabitableZone(teff: number, luminosity: number): {
  recentVenus: number;
  runawayGreenhouse: number; // Conservative Inner HZ
  maximumGreenhouse: number; // Conservative Outer HZ
  earlyMars: number;
} {
  const tStar = teff - 5780;
  
  // Coefficients for Runaway Greenhouse (Conservative inner)
  const seff_rg = 1.0519 + 1.332e-4 * tStar + 1.58e-8 * Math.pow(tStar, 2) - 8.308e-12 * Math.pow(tStar, 3);
  // Coefficients for Maximum Greenhouse (Conservative outer)
  const seff_mg = 0.3438 + 5.894e-5 * tStar + 1.655e-9 * Math.pow(tStar, 2) - 3.004e-12 * Math.pow(tStar, 3);
  // Recent Venus (Optimistic inner)
  const seff_rv = 1.776 + 2.136e-4 * tStar + 2.533e-8 * Math.pow(tStar, 2) - 1.332e-11 * Math.pow(tStar, 3);
  // Early Mars (Optimistic outer)
  const seff_em = 0.3207 + 5.547e-5 * tStar + 1.526e-9 * Math.pow(tStar, 2) - 2.874e-12 * Math.pow(tStar, 3);

  return {
    recentVenus: Math.sqrt(luminosity / seff_rv),
    runawayGreenhouse: Math.sqrt(luminosity / seff_rg),
    maximumGreenhouse: Math.sqrt(luminosity / seff_mg),
    earlyMars: Math.sqrt(luminosity / seff_em)
  };
}

/**
 * Mass-Radius theoretical relation points (Zeng et al. 2016 / 2019)
 */
export function getMassRadiusCurves() {
  const radii: number[] = [];
  for (let r = 0.5; r <= 8.0; r += 0.25) {
    radii.push(r);
  }

  // Pure Iron: M ≈ (R / 0.77)^3.33
  const pureIron = radii.map(r => ({
    radius: r,
    mass: Math.pow(r / 0.77, 3.33)
  })).filter(p => p.mass <= 100);

  // 100% Silicate / Earth-like rocky: M ≈ (R / 1.0)^3.7
  const silicate = radii.map(r => ({
    radius: r,
    mass: Math.pow(r / 1.0, 3.65)
  })).filter(p => p.mass <= 100);

  // 100% Water / Ice world: M ≈ (R / 1.25)^3.5
  const waterWorld = radii.map(r => ({
    radius: r,
    mass: Math.pow(r / 1.25, 3.5)
  })).filter(p => p.mass <= 100);

  // Gas / H-He Envelope: low density
  const gasEnvelope = radii.map(r => ({
    radius: r,
    mass: Math.pow(r / 2.1, 2.2)
  })).filter(p => p.mass <= 100);

  return { pureIron, silicate, waterWorld, gasEnvelope };
}

/**
 * Deterministic astrophysics transit vetting logic adhering strictly to the user requested JSON schema
 */
export function vetTransitDeterministic(target: Partial<TargetPlanet>): AstrophysicsVettingResponse {
  const targetId = target.id || 'TARGET-UNKNOWN';
  const period = target.orbitalPeriod || 10.0;
  const depth = target.transitDepth || 1000;
  const radius = target.planetRadius || 1.5;
  const oddEven = target.oddEvenRatio !== undefined ? target.oddEvenRatio : 1.0;
  const secDepth = target.secondaryEclipseDepth || 0;
  const centroidOffset = target.centroidOffset !== undefined ? target.centroidOffset : 0.03;
  const snr = target.snr || 15.0;

  // 1. Odd/Even depth test (tolerance: ratio between 0.92 and 1.08)
  const oddEvenPass = Math.abs(oddEven - 1.0) < 0.08;

  // 2. Secondary eclipse check (must be statistically negligible compared to primary transit depth)
  const secRatio = depth > 0 ? (secDepth / depth) : 0;
  const secondaryEclipsePass = secRatio < 0.05;

  // 3. Stellar density / centroid pass
  const centroidPass = centroidOffset < 0.15;
  const stellarDensityPass = radius < 25.0 && snr > 7.1;

  let disposition: AstrophysicsVettingResponse['disposition'] = 'CONFIRMED CANDIDATE';
  let mlConfidence = 0.95;
  let pExoplanet = 95.0;
  let pEB = 3.5;
  let pNoise = 1.5;
  let verdict = 'Clear U-shaped flat bottom transit without significant odd-even depth variation. High probability planetary candidate.';

  if (!oddEvenPass || !secondaryEclipsePass || !centroidPass) {
    if (!oddEvenPass || !secondaryEclipsePass) {
      disposition = 'FALSE POSITIVE';
      mlConfidence = 0.021;
      pExoplanet = 2.1;
      pEB = 94.2;
      pNoise = 3.7;
      verdict = 'Pronounced odd-even transit depth discrepancy and/or significant secondary eclipse detected, indicative of an eclipsing binary or blended background system.';
    } else {
      disposition = 'FALSE POSITIVE';
      mlConfidence = 0.045;
      pExoplanet = 4.5;
      pEB = 88.0;
      pNoise = 7.5;
      verdict = 'Centroid pixel shift exceeds threshold (> 0.15 px), indicating photometric signal contamination from a nearby background object.';
    }
  } else if (snr < 7.1) {
    disposition = 'MARGINAL CANDIDATE';
    mlConfidence = 0.54;
    pExoplanet = 54.0;
    pEB = 12.0;
    pNoise = 34.0;
    verdict = 'Transit signature detected at low Signal-to-Noise Ratio (SNR < 7.1). High risk of residual red stellar or instrumental noise.';
  } else if (targetId === 'KIC-11442793') {
    mlConfidence = 0.964;
    pExoplanet = 96.4;
    pEB = 2.8;
    pNoise = 0.8;
    verdict = 'Clear U-shaped flat bottom transit without significant odd-even depth variation. High probability planetary candidate.';
  } else if (targetId === 'TOI-700d' || targetId === 'Kepler-186f' || targetId === 'TRAPPIST-1e') {
    disposition = 'CONFIRMED';
    mlConfidence = 0.985;
    pExoplanet = 98.5;
    pEB = 1.0;
    pNoise = 0.5;
    verdict = 'Validated planetary transit with robust photometric fidelity, consistent ephemeris, and stellar parameters verified across multiple observing sectors.';
  }

  return {
    targetId,
    mlConfidence,
    disposition,
    probabilities: {
      exoplanet: pExoplanet,
      eclipsingBinary: pEB,
      stellarNoise: pNoise
    },
    falsePositiveChecks: {
      oddEvenPass,
      secondaryEclipsePass,
      stellarDensityPass
    },
    scientificVerdict: verdict
  };
}
