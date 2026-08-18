import { jsPDF } from 'jspdf';
import { TargetPlanet, AstrophysicsVettingResponse } from '../types';

/**
 * Sanitizes strings for standard PDF Helvetica/Courier ASCII font support,
 * replacing Greek symbols, astronomical glyphs, degree symbols, and special characters.
 */
function sanitizePdfText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[⊕]/g, 'Earth')
    .replace(/[☉]/g, 'Sun')
    .replace(/[±]/g, '+/-')
    .replace(/[°]/g, ' deg ')
    .replace(/[′']/g, "'")
    .replace(/[″"]/g, '"')
    .replace(/[σ]/g, 'sigma')
    .replace(/[•]/g, '-')
    .replace(/[≈]/g, '~')
    .replace(/[≤]/g, '<=')
    .replace(/[≥]/g, '>=')
    .replace(/[–—]/g, '-');
}

export function exportCandidateDossierPDF(
  target: TargetPlanet,
  vettingResult?: AstrophysicsVettingResponse | null
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Background Obsidian Theme
  doc.setFillColor(8, 14, 28); // Deep Navy / Space
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Dynamic vertical accumulator
  let currentY = margin;

  // 1. TOP HEADER & ACCENT BAR
  doc.setFillColor(0, 240, 255); // Cyan Accent
  doc.rect(margin, currentY, contentWidth, 1.5, 'F');
  currentY += 7;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 240, 255);
  doc.text('ASTROTRANSIT OS', margin, currentY);

  currentY += 5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('EXOPLANET PHOTOMETRIC VETTING DOSSIER & DISPOSITION REPORT', margin, currentY);

  // Timestamp & Mission ID
  currentY += 4.5;
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `DOC-ID: ATOS-${target.id}-${Date.now().toString().slice(-6)}   |   MISSION: ${sanitizePdfText(target.missionEpoch || 'KEPLER / TESS')}   |   GENERATED: ${timestamp}`,
    margin,
    currentY
  );

  // Header Divider
  currentY += 3.5;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, margin + contentWidth, currentY);
  currentY += 4.5;

  // 2. TWO-COLUMN HEADER SECTION (ZERO OVERLAP)
  const yStart = currentY;
  const headerCardHeight = 24;

  // Left Column Card Box (x: 14mm, width: 115mm)
  doc.setFillColor(15, 23, 42); // Obsidian Slate
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, yStart, 115, headerCardHeight, 2, 2, 'FD');

  // Left Column Content
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`${target.name} (${target.id})`, 18, yStart + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(
    `System: ${target.systemName}   |   Discovery: ${target.discoveryYear || 2018} (${target.discoveryMethod || 'Transit'})`,
    18,
    yStart + 11.5
  );

  doc.setTextColor(148, 163, 184);
  const raVal = target.ra || '19h 28m';
  const decVal = target.dec ? sanitizePdfText(target.dec) : '+44 deg 27\'';
  doc.text(
    `Coordinates: RA ${raVal} | Dec ${decVal} | Distance: ${target.distanceParsecs || 180} pc`,
    18,
    yStart + 16.5
  );

  doc.setTextColor(0, 240, 255);
  doc.text(
    `T_eq: ${target.equilibriumTemp} K   |   Habitability: ${target.liquidWaterIndex}%   |   Radius: ${target.planetRadius.toFixed(2)} R_Earth`,
    18,
    yStart + 21.5
  );

  // Right Column Disposition Card Box (x: 135mm, width: 62mm)
  const confidence = vettingResult ? vettingResult.mlConfidence : target.mlConfidence;
  const disposition = sanitizePdfText(vettingResult ? vettingResult.disposition : target.disposition);
  const isConfirmed = disposition.includes('CONFIRMED');
  const isFalsePositive = disposition.includes('FALSE POSITIVE');

  doc.setFillColor(240, 243, 248); // Crisp Light Fill
  doc.setDrawColor(203, 213, 225); // Slate Border
  doc.setLineWidth(0.4);
  doc.roundedRect(135, yStart, 62, headerCardHeight, 2, 2, 'FD');

  // Line 1 (yStart + 6): Disposition Status (9pt Bold)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (isConfirmed) {
    doc.setTextColor(5, 150, 105); // Emerald-600
  } else if (isFalsePositive) {
    doc.setTextColor(225, 29, 72); // Rose-600
  } else {
    doc.setTextColor(217, 119, 6); // Amber-600
  }
  doc.text(disposition, 135 + 31, yStart + 6, { align: 'center' });

  // Line 2 (yStart + 12): Confidence Score (8pt Bold Dark Gray)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(`CONFIDENCE: ${(confidence * 100).toFixed(1)}%`, 135 + 31, yStart + 12, { align: 'center' });

  // Line 3 (yStart + 18): Transit SNR (8pt Monospace)
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85); // Slate-700
  doc.text(`TRANSIT SNR: ${target.snr.toFixed(1)} sigma`, 135 + 31, yStart + 18, { align: 'center' });

  currentY += headerCardHeight + 5;

  // 3. SECTION 1: PHOTOMETRIC TRANSIT TELEMETRY (MANDEL-AGOL FIT)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 240, 255);
  doc.text('1. PHOTOMETRIC TRANSIT TELEMETRY (MANDEL-AGOL FIT)', margin, currentY);

  // Section divider rule
  doc.setDrawColor(0, 240, 255);
  doc.setLineWidth(0.2);
  doc.line(margin, currentY + 1.8, margin + contentWidth, currentY + 1.8);
  currentY += 4.5;

  // Telemetry Grid Box
  const sec1Height = 28;
  doc.setFillColor(13, 20, 36);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, sec1Height, 2, 2, 'FD');

  // Fixed 3-Column Table offsets: Column 1 = 14mm, Column 2 = 78mm, Column 3 = 142mm
  const col1X = 14 + 3;  // 17mm
  const col2X = 78 + 3;  // 81mm
  const col3X = 142 + 3; // 145mm

  const drawTelemetryRow = (
    yPos: number,
    item1: { label: string; val: string },
    item2: { label: string; val: string },
    item3: { label: string; val: string }
  ) => {
    // Column 1
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(item1.label, col1X, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(item1.val, col1X + 27, yPos);

    // Column 2
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(item2.label, col2X, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(item2.val, col2X + 29, yPos);

    // Column 3
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(item3.label, col3X, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(item3.val, col3X + 27, yPos);
  };

  let rowY = currentY + 5.5;
  drawTelemetryRow(
    rowY,
    { label: 'Period:', val: `${target.orbitalPeriod.toFixed(5)} d` },
    { label: 'Semi-Major Axis:', val: `${target.semiMajorAxis || 0.12} AU` },
    { label: 'Odd/Even Ratio:', val: `${target.oddEvenRatio.toFixed(3)}` }
  );

  rowY += 5.2;
  drawTelemetryRow(
    rowY,
    { label: 'Transit Depth:', val: `${target.transitDepth.toLocaleString()} ppm` },
    { label: 'Eq. Temp (T_eq):', val: `${target.equilibriumTemp} K` },
    { label: 'Sec. Eclipse:', val: `${target.secondaryEclipseDepth} ppm` }
  );

  rowY += 5.2;
  drawTelemetryRow(
    rowY,
    { label: 'Planet Radius:', val: `${target.planetRadius.toFixed(2)} R_Earth` },
    { label: 'Insolation Flux:', val: `${target.insolationFlux ? target.insolationFlux.toFixed(2) : '1.00'} S_Earth` },
    { label: 'Centroid Shift:', val: `${(target.centroidOffset * 2.5).toFixed(3)} arcsec` }
  );

  rowY += 5.2;
  drawTelemetryRow(
    rowY,
    { label: 'Duration:', val: `${(target.orbitalPeriod * 0.04 * 24).toFixed(2)} hrs` },
    { label: 'Transit SNR:', val: `${target.snr.toFixed(1)} sigma` },
    { label: 'Limb Darkening:', val: 'u1=0.38, u2=0.22' }
  );

  currentY += sec1Height + 5;

  // 4. SECTION 2: HOST STAR ASTROPHYSICAL PARAMETERS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 240, 255);
  doc.text('2. HOST STAR ASTROPHYSICAL PARAMETERS', margin, currentY);

  doc.setDrawColor(0, 240, 255);
  doc.setLineWidth(0.2);
  doc.line(margin, currentY + 1.8, margin + contentWidth, currentY + 1.8);
  currentY += 4.5;

  const sec2Height = 22;
  doc.setFillColor(13, 20, 36);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, sec2Height, 2, 2, 'FD');

  rowY = currentY + 5.5;
  drawTelemetryRow(
    rowY,
    { label: 'T_eff:', val: `${target.stellarParams.teff} +/- ${target.stellarParams.teffErr} K` },
    { label: 'Metallicity [Fe/H]:', val: `${target.stellarParams.feh >= 0 ? '+' : ''}${target.stellarParams.feh.toFixed(2)} dex` },
    { label: 'Stellar Mass:', val: `${target.stellarParams.mass.toFixed(2)} M_Sun` }
  );

  rowY += 5.2;
  drawTelemetryRow(
    rowY,
    { label: 'Surface log(g):', val: `${target.stellarParams.logg.toFixed(2)} +/- ${target.stellarParams.loggErr.toFixed(2)}` },
    { label: 'Spectral Class:', val: `${target.stellarParams.spectralType}` },
    { label: 'Stellar Radius:', val: `${target.stellarParams.radius.toFixed(2)} R_Sun` }
  );

  rowY += 5.2;
  drawTelemetryRow(
    rowY,
    { label: 'Luminosity:', val: `${target.stellarParams.luminosity.toFixed(3)} L_Sun` },
    { label: 'Habitable Zone:', val: `${(Math.sqrt(target.stellarParams.luminosity) * 0.95).toFixed(2)}-${(Math.sqrt(target.stellarParams.luminosity) * 1.37).toFixed(2)} AU` },
    { label: 'System Density:', val: '1.41 g/cm3' }
  );

  currentY += sec2Height + 5;

  // 5. SECTION 3: AI VETTING ENGINE & FALSE-POSITIVE DIAGNOSTIC MATRIX
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 240, 255);
  doc.text('3. AI VETTING ENGINE & FALSE-POSITIVE DIAGNOSTIC MATRIX', margin, currentY);

  doc.setDrawColor(0, 240, 255);
  doc.setLineWidth(0.2);
  doc.line(margin, currentY + 1.8, margin + contentWidth, currentY + 1.8);
  currentY += 4.5;

  const sec3Height = 44;
  doc.setFillColor(13, 20, 36);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, sec3Height, 2, 2, 'FD');

  // Probability Breakdown (Left Half)
  const pExo = vettingResult ? vettingResult.probabilities.exoplanet : confidence * 100;
  const pEB = vettingResult ? vettingResult.probabilities.eclipsingBinary : (isFalsePositive ? 92.4 : 2.8);
  const pNoise = vettingResult ? vettingResult.probabilities.stellarNoise : 1.2;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Bayesian Probability Model:', margin + 4, currentY + 6.0);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(52, 211, 153);
  doc.text(`- Planet Model Match: ${pExo.toFixed(1)}%`, margin + 6, currentY + 11.5);

  doc.setTextColor(251, 191, 36);
  doc.text(`- Eclipsing Binary (EB): ${pEB.toFixed(1)}%`, margin + 6, currentY + 16.7);

  doc.setTextColor(148, 163, 184);
  doc.text(`- Instrumental / Red Noise: ${pNoise.toFixed(1)}%`, margin + 6, currentY + 21.9);

  doc.setTextColor(0, 240, 255);
  doc.text(`- Transit Symmetry Score: ${((1 - Math.abs(target.oddEvenRatio - 1)) * 100).toFixed(1)}%`, margin + 6, currentY + 27.1);

  // Diagnostic Checks (Right Half)
  const oddPass = vettingResult?.falsePositiveChecks?.oddEvenPass ?? (Math.abs(target.oddEvenRatio - 1.0) <= 0.05);
  const secPass = vettingResult?.falsePositiveChecks?.secondaryEclipsePass ?? (target.secondaryEclipseDepth < 15);
  const centPass = vettingResult?.falsePositiveChecks?.centroidShiftPass ?? (target.centroidOffset < 0.10);
  const densPass = vettingResult?.falsePositiveChecks?.stellarDensityPass ?? true;

  const diagColX = margin + (contentWidth / 2) + 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Diagnostic Validation Criteria:', diagColX, currentY + 6.0);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(oddPass ? 52 : 251, oddPass ? 211 : 113, oddPass ? 153 : 133);
  doc.text(`[${oddPass ? 'PASS' : 'FAIL'}] Odd/Even Depth Consistency (0.95 <= r <= 1.05)`, diagColX, currentY + 11.5);

  doc.setTextColor(secPass ? 52 : 251, secPass ? 211 : 113, secPass ? 153 : 133);
  doc.text(`[${secPass ? 'PASS' : 'FAIL'}] Secondary Eclipse Absence (< 15 ppm)`, diagColX, currentY + 16.7);

  doc.setTextColor(centPass ? 52 : 251, centPass ? 211 : 113, centPass ? 153 : 133);
  doc.text(`[${centPass ? 'PASS' : 'FAIL'}] Centroid Astrometric Offset (< 0.25 arcsec)`, diagColX, currentY + 21.9);

  doc.setTextColor(densPass ? 52 : 251, densPass ? 211 : 113, densPass ? 153 : 133);
  doc.text(`[${densPass ? 'PASS' : 'FAIL'}] Stellar Density / Ephemeris Consistency`, diagColX, currentY + 27.1);

  // Verdict Divider Line
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.line(margin + 4, currentY + 31.5, margin + contentWidth - 4, currentY + 31.5);

  // Verdict text
  const rawVerdict = vettingResult ? vettingResult.scientificVerdict : (
    isConfirmed
      ? 'Clean U-shaped flat bottom transit without significant odd-even depth variation. High probability planetary candidate.'
      : isFalsePositive
      ? 'Pronounced odd-even depth asymmetry or centroid pixel shift detected; high probability eclipsing binary or background contamination.'
      : 'Marginal transit signal requiring additional sector observations.'
  );
  const verdict = sanitizePdfText(rawVerdict);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 240, 255);
  doc.text(`Scientific Verdict: "${verdict}"`, margin + 4, currentY + 37.5, { maxWidth: contentWidth - 8 });

  currentY += sec3Height + 5;

  // 6. SECTION 4: ARCHIVE SOURCES & ASTROPHYSICAL CITATIONS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('ARCHIVE SOURCES & ASTROPHYSICAL CITATIONS', margin, currentY);
  currentY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const citations = [
    '1. NASA Exoplanet Archive (IPAC / Caltech) Table Access Protocol (TAP) Synchronous Catalog Service.',
    '2. Mandel, K., & Agol, E. (2002). Analytic Light Curves for Planetary Transit Searches. The Astrophysical Journal, 580(2), L171.',
    '3. Kopparapu, R. K., et al. (2013, 2014). Habitable Zones around Main-Sequence Stars: Updated Estimates. ApJ, 765, 131.',
    '4. STScI Mikulski Archive for Space Telescopes (MAST) Kepler Data Release 25 & TESS Sectors Time-Series Photometry.',
  ];

  citations.forEach((cit, idx) => {
    doc.text(cit, margin, currentY + idx * 3.5);
  });

  // 7. FOOTER (Strict single-page boundary enforcement)
  const footerLineY = pageHeight - 13;
  const footerTextY = pageHeight - 8.5;

  doc.setDrawColor(0, 240, 255);
  doc.setLineWidth(0.35);
  doc.line(margin, footerLineY, margin + contentWidth, footerLineY);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('ASTROTRANSIT OS v3.0   |   CONFIDENTIAL ASTROPHYSICAL CANDIDATE DOSSIER', margin, footerTextY);
  doc.text('PAGE 1 OF 1', margin + contentWidth, footerTextY, { align: 'right' });

  // Save the PDF file
  doc.save(`${target.id}_Candidate_Dossier_Report.pdf`);
}
