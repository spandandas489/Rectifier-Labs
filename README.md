# Rectifier Virtual Lab - Power Electronics Simulation Workbench

An interactive virtual laboratory for single-phase and three-phase uncontrolled and controlled power electronic rectifiers, inspired by IIT Kharagpur Virtual Labs. Features real-time digital storage oscilloscope (DSO) waveforms with calibrated Y-axis scales, animated circuit schematics, harmonic FFT spectrum analysis, an experimental observation table, theoretical derivations, and an interactive viva-voce quiz.

---

## 🚀 How to Deploy to GitHub Pages

This repository is already configured for zero-config GitHub Pages deployment via **Vite** and **GitHub Actions**.

### Method 1: Automatic Deployment with GitHub Actions (Recommended)

1. **Push this repository to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Rectifier Virtual Lab"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. **Enable GitHub Pages via Actions**:
   - Go to your repository on GitHub.
   - Navigate to **Settings** > **Pages** (under "Code and automation" in the left sidebar).
   - Under **Build and deployment** > **Source**, select **GitHub Actions** from the dropdown menu (instead of "Deploy from a branch").
   - That's it! The workflow in `.github/workflows/deploy.yml` will automatically build the site and deploy it.
   - Within 1–2 minutes, your site will be live at:
     ```
     https://<your-username>.github.io/<your-repo-name>/
     ```

---

### Method 2: Manual / Branch Deployment

If you prefer deploying from the `gh-pages` branch:

1. **Build the production bundle**:
   ```bash
   npm install
   npm run build
   ```
   This generates a static production build inside the `dist/` folder.

2. **Deploy the `dist/` folder**:
   You can use the popular `gh-pages` tool:
   ```bash
   npx gh-pages -d dist
   ```
   Or push the `dist` folder to a `gh-pages` branch in your repository.

3. In GitHub repository **Settings** > **Pages**, ensure the branch is set to `gh-pages` and folder to `/(root)`.

---

## 🛠️ Local Development

To run the virtual lab locally:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the local Vite development server**:
   ```bash
   npm run dev
   ```
   Open your browser to [http://localhost:3000](http://localhost:3000).

3. **Check linting and types**:
   ```bash
   npm run lint
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## ⚡ Features & Rectifier Topologies

- **7 Converter Topologies**:
  1. Single-Phase Half-Wave Uncontrolled Rectifier (Diode)
  2. Single-Phase Half-Wave Controlled Rectifier (SCR)
  3. Single-Phase Full-Wave Bridge Uncontrolled Rectifier (4 Diodes)
  4. Single-Phase Full-Wave Semi-Controlled Rectifier (2 SCRs + 2 Diodes)
  5. Single-Phase Full-Wave Controlled Bridge Rectifier (4 SCRs)
  6. Three-Phase Full-Wave Uncontrolled Bridge Rectifier (6 Diodes)
  7. Three-Phase Full-Wave Controlled Bridge Rectifier (6 SCRs)

- **Calibrated Oscilloscope (DSO)**:
  - Separate Voltage and Current screens (Split Screen Mode), Overlay Mode, Voltage-only, and Current-only views.
  - Numerically labeled Y-axes on both Voltage ($V$) and Current ($A$) channels with zero-reference baseline ground markers (`▶ 0V`, `▶ 0A`).
  - Dual measurement time and voltage cursors (Cursor A & B) with live $\Delta t$, frequency, and voltage/current deltas.
  - Scanhead sweep and timebase controls ($2\,\text{ms/div}$ to $20\,\text{ms/div}$).

- **Load Dynamics**:
  - Resistive ($R$), Inductive ($RL$), Freewheeling Diode ($RL + D_{fw}$), and Capacitive Filter ($RC$) with numerical ripple analysis.

- **Interactive SVG Circuit Schematics**:
  - Exact topological wiring with junction nodes, conducting component glow, animated current flow paths, and device state indicators.

- **Harmonics & FFT Analysis**:
  - Discrete Fourier decomposition with labeled magnitude Y-axis, harmonic orders, and Total Harmonic Distortion (THD).

- **IIT Virtual Lab Workbench**:
  - Digital Multimeter Dashboard comparing measured vs theoretical $V_{dc}$, $V_{rms}$, ripple factor $\gamma$, efficiency $\eta$, and PIV.
  - Observation table with live recording, CSV export, and experimental $V_{dc}$ vs $\alpha$ characteristic curves.
  - Theory tab with mathematical derivations, procedure guide, and an 8-question Viva Quiz with instant feedback.
