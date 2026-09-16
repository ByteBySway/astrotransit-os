export type SpectralCategory = 'G_TYPE' | 'M_DWARF' | 'FA_TYPE';

export interface SpectralTheme {
  category: SpectralCategory;
  name: string;
  spectralType: string;
  auraGlow: string;
  borderGlow: string;
  accentHex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export function getSpectralTheme(spectralTypeStr?: string): SpectralTheme {
  const type = (spectralTypeStr || 'G2V').trim().toUpperCase();
  const firstChar = type.charAt(0);

  if (firstChar === 'M') {
    return {
      category: 'M_DWARF',
      name: 'M-Dwarf Cool Convective Atmosphere',
      spectralType: type,
      auraGlow: 'rgba(244, 63, 94, 0.22)',
      borderGlow: 'rgba(244, 63, 94, 0.38)',
      accentHex: '#f43f5e',
      badgeBg: 'rgba(244, 63, 94, 0.12)',
      badgeBorder: 'rgba(244, 63, 94, 0.40)',
      badgeText: 'text-rose-400',
    };
  }

  if (firstChar === 'F' || firstChar === 'A' || firstChar === 'B' || firstChar === 'O') {
    return {
      category: 'FA_TYPE',
      name: 'F/A-Type High Luminosity Ionization',
      spectralType: type,
      auraGlow: 'rgba(56, 189, 248, 0.25)',
      borderGlow: 'rgba(56, 189, 248, 0.45)',
      accentHex: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.12)',
      badgeBorder: 'rgba(56, 189, 248, 0.40)',
      badgeText: 'text-cyan-300',
    };
  }

  // Default: G-type (Sun-like standard) or K-type
  return {
    category: 'G_TYPE',
    name: 'G-Type Solar Equivalence Spectrum',
    spectralType: type,
    auraGlow: 'rgba(251, 191, 36, 0.22)',
    borderGlow: 'rgba(251, 191, 36, 0.38)',
    accentHex: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.12)',
    badgeBorder: 'rgba(251, 191, 36, 0.40)',
    badgeText: 'text-amber-300',
  };
}
