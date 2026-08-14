# AstroTransit OS

> **Next-Generation Exoplanetary Photometric Vetting Terminal & 3D Orbital Dynamics Simulator**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Three.js / WebGL](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![NASA TAP API](https://img.shields.io/badge/NASA-Exoplanet_Archive_TAP-E03C31?logo=nasa&logoColor=white)](https://exoplanetarchive.ipac.caltech.edu/)

---

## Executive Overview

**AstroTransit OS** is an astrophysical workstation designed for transit vetting, orbital mechanics modeling, and exoplanetary habitability characterization. It pairs Mandel–Agol analytic limb-darkened transit light-curve models with Keplerian orbital kinematics, explainable vetting algorithms, and live astronomical telemetry from the NASA Exoplanet Archive TAP service and MAST.

Equipped with a procedural Web Audio synthesizer and native touch haptics, AstroTransit OS provides researchers, astronomers, and educators with a mission-control interface to distinguish true planetary transits from astrophysical false positives (such as eclipsing binaries, centroid shifts, and stellar activity).

---

## Key Workspaces & Capabilities

### 1. Photometric Transit Vetting Terminal
- **Analytical Light-Curve Fitting**: Evaluates normalized flux curves across Raw, Detrended, and Residuals modes using quadratic limb darkening and Mandel–Agol transit approximations.
- **Geometric Contact Phase Markers**: Interactive phase markers for $t_1$ (first contact / ingress start), $t_2$ (ingress end), $t_0$ (transit center), $t_3$ (egress start), and $t_4$ (fourth contact / egress end).
- **Triple Concentric Radial Dials**: High-precision SVG dials displaying real-time metrics:
  - **Planetary Radius Score**: Classified against terrestrial, super-Earth, sub-Neptune, and gas giant thresholds.
  - **SNR & Vetting Confidence Index**: Statistical signal-to-noise detection significance.
  - **TCE Transit Consistency**: Metric validation based on ingress/egress symmetry, odd-even epoch consistency, and secondary eclipse depth testing.
- **Interactive Light-Curve Scrubber**: Touch-gesture dragging and scrub bar with micro-vibration ticks and boundary double-tap snapping.
- **Dossier PDF Export**: One-click scientific candidate dossier generation summarizing planetary parameters, stellar diagnostics, and disposition reports.

### 2. 3D Keplerian Orbit & Habitable Zone Simulator
- **True Keplerian Elliptical Mechanics**: Real-time numerical rendering of radial trajectories via:
  $$r(\theta) = \frac{a(1 - e^2)}{1 + e \cos(\theta)}$$
- **Eccentricity & Inclination Controls**: Interactive sliders adjusting orbital eccentricity ($e \in [0.00, 0.85]$) and orbital inclination ($i \in [0^\circ, 90^\circ]$), dynamically modulating true anomaly velocity according to Kepler's Second Law.
- **Habitable Zone Calculation (Kopparapu et al. 2014)**: Photometric calculation and 3D visualization of Conservative (Runaway Greenhouse to Maximum Greenhouse) and Optimistic (Recent Venus to Early Mars) habitable zones based on host star effective temperature ($T_{\text{eff}}$) and stellar luminosity ($L_\odot$).
- **Clickable 3D Planet Meshes & Raycasting**: Raycasting pointer detection with illuminated cyan targeting reticles, hover scaling, and a glassmorphic planet telemetry inspector with a one-click *[Load into Vetting Terminal]* action.
- **Mass–Radius & TTV Analytics**: Side-by-side composition charts (100% water vs. silicate Earth lines) and Transit Timing Variation (TTV) sinusoidal gravitational perturbation modeling.

### 3. MAST & NASA Exoplanet Archive Explorer
- **Astronomical Data Query Language (ADQL)**: Built-in query terminal and pre-filtered catalogs referencing Kepler, K2, and TESS candidate databases.
- **Comprehensive Column Telemetry**: Filtering by period, planetary radius, insolation flux, equilibrium temperature, discovery mission, and disposition.
- **Data Export**: Multi-row selection and instant CSV data export.

### 4. Explainable Vetting Lab (XAI)
- **Multi-Feature Importance Breakdown**: Quantified attribution across transit depth, duration, odd/even symmetry, centroid offsets, and stellar density.
- **Layer Activation Diagnostics**: Neural network convolutional and dense layer feature visualizers tracking spatial transit feature extraction.

### 5. Procedural Web Audio & Haptic Feedback Engine
- **Procedural Web Audio Synthesizer**: Zero-asset audio engine generating mechanical chirp clicks, workstation air wooshes, resonant ascending diagnostic hums, metric ticks, and dual-tone false-positive alerts.
- **Haptic Vibration API Integration**: Multi-tier tactile feedback for light taps, selection ticks, confirmation pulses, and warning buzzes on supported touch devices.
- **Customizable Haptics Settings**: Base pulse duration tuning (5ms to 50ms) with dynamic proportional scaling and global mute synchronization.

---

## Tech Stack

| Domain | Technology / Library | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 (TypeScript) | Reactive user interface and state management |
| **Build Tool** | Vite 6 | Rapid HMR-ready compilation and bundling |
| **Styling & Theme** | Tailwind CSS 4 | Glassmorphic dark space theme and responsive layouts |
| **Icons** | Lucide React | Clean, scalable astronomical and system iconography |
| **Audio Synthesis** | Web Audio API | Client-side procedural audio sound synthesis |
| **Tactile Feedback** | Native Vibration API | Cross-platform haptic tap and buzz modulation |
| **PDF Generation** | jsPDF | Client-side vector export of vetting dossiers |
| **Server Backend** | Node.js & Express | Full-stack API proxy and NASA TAP integration |

---

## Local Setup & Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/ByteBySway/astrotransit-os.git
cd astrotransit-os

# Install dependencies
npm install
```

### 2. Environment Configuration
Create a `.env` file in the project root if server-side environment variables are required:
```env
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## Data Source Acknowledgments

This application utilizes public data, APIs, and astrophysics research provided by:
- **NASA Exoplanet Archive / IPAC / Caltech**: Table Access Protocol (TAP) service and Planetary Systems Composite Parameters (`pscomppars`).
- **Mikulski Archive for Space Telescopes (MAST / STScI)**: Photometric time-series data from Kepler, K2, and TESS missions.
- **Astrophysics Formulations**: Mandel & Agol (2002) transit light-curve models and Kopparapu et al. (2014) circumstellar habitable zone calculations.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete details.

Copyright © 2026 **ByteBySway**. All rights reserved.
