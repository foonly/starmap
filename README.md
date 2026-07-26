# 🌌 Starnav — Interactive Galactic Network

Starnav is a sleek, sci-fi-themed interactive galactic map and route navigation application built with **Vue 3** and **Tailwind CSS**. It visualizes a vast interstellar network consisting of star systems, planetary bodies, orbital bases, and hyperlanes belonging to various galactic factions. 

With a built-in shortest-path solver, customizable hyperlane filtering, and an advanced map creation/edit mode, Starnav serves as both an immersive exploration console and a powerful coordinate planning tool.

---

## 🚀 Live Features

### 1. Interactive Galactic Map (SVG)
- **Fluid Navigation:** Full panning and zooming controls using mouse drag and scroll wheel (with smart focal-point zoom calculations).
- **Rich Visual States:** System icons, names, and faction colors light up on hover, showing connections and detailed layouts on selection.
- **Dynamic Grid Backdrop:** Deep space coordinates render on an active galactic grid.

### 2. Hyperlane Filtering & Custom Routing
- **Class-Based Hyperlanes:** Interstellar connections are categorized from Class 1 to Class 4 hyperlanes. Use the control panel toggles to filter active trade routes, military lines, or deep-space corridors.
- **Dijkstra Shortest Pathway Solver:** Select any system as an **Origin** and another as a **Destination** to compute and render the optimal transit route in real-time. Weighting is determined by Euclidean distance coordinates.
- **Jump Core Level Constraint:** Filter routing options dynamically by matching your ship's Jump Core Rating (Class 1–4) against the hyperlane requirements.

### 3. Star System Inspector
- **Comprehensive Metadata:** View the classification, coordinates, description, and faction alignment of any selected star system.
- **Orbital Bodies:** Displays orbiting planets, detailing their gravity, population, and local descriptions.
- **Bases & Outposts:** Lists orbital space stations, research outposts, and military bases.

### 4. Admin Edit Mode (Map Editor)
- **Interactive Drag & Drop:** Toggle edit mode to physically drag star systems around the grid, updating their Cartesian coordinate coordinates in real-time.
- **System Builder:** Add new systems with default values, customize planets or bases, and delete obsolete systems from the grid.
- **Connection Planner:** Create or remove hyperlane connections between star systems with dedicated selector inputs.
- **Dataset Downloader:** Download the modified datasets as raw formatted JSON files (`systems.json`, `connections.json`, `factions.json`) to persist your changes.
- **Accessing Edit Mode:** Use the keybinding `Alt + Shift + E` or click on the version badge in the application header (`V1.6.0`) to unlock editing.

### 5. Sci-Fi Aesthetics & Theme Controls
- **Immersive Fonts:** Built with custom fonts, including **Orbitron** for digital instrumentation, **JetBrains Mono** for readout telemetry, and **Inter** for clean UI reading.
- **Persistent Light & Dark Themes:** Toggle dark space and light HUD designs instantly, with user preference saved automatically in `localStorage`.

---

## 🛠️ Tech Stack

Starnav is built using modern web development practices:

- **Framework:** [Vue 3](https://vuejs.org/) (Composition API with `<script setup>`)
- **Build System:** [Vite 6](https://vite.dev/)
- **Utility Styling:** [Tailwind CSS v3](https://tailwindcss.com/)
- **Iconography:** [Lucide Vue Next](https://lucide.dev/)
- **Styles Post-processing:** PostCSS & Autoprefixer

---

## 📂 Project Structure

```bash
starmap/
├── .github/               # GitHub workflows and automation
├── src/
│   ├── components/
│   │   ├── Starmap.vue         # Main SVG map rendering, pan & zoom, systems & connection lines
│   │   ├── ControlPanel.vue    # Left HUD: Search, Faction Filters, Lanes, Routing & Jump Core Setup
│   │   └── SystemInspector.vue # Right HUD: Detailed system data, planet rosters, bases, connections
│   ├── data/
│   │   ├── systems.json        # Main database of coordinates, planets, bases, and alignments
│   │   ├── connections.json    # Array of hyperlane paths linking systems (From, To, Lane Class)
│   │   └── factions.json       # Faction names, canvas positions, boundary settings, and colors
│   ├── App.vue                 # Core state engine, routing solver (Dijkstra), and events bridge
│   ├── main.js                 # App entry and initialization
│   └── style.css               # Main CSS setup, Tailwind imports, scrollbar and custom font rules
├── index.html                  # Core HTML layout and font preloads
├── package.json                # Dependencies and project scripts
├── vite.config.js              # Vite bundler configurations
└── tailwind.config.js          # Tailwind theme configurations (custom deep space color palette)
```

---

## 💾 Data Architecture

The application relies on three highly structured JSON files in `src/data/` to generate the galactic layout:

### 1. `systems.json`
Represents stars, their locations on the grid, and orbiting bodies:
```json
{
  "id": "sol",
  "name": "Sol",
  "type": "star",
  "color": "#ffaa00",
  "x": 500,
  "y": 400,
  "faction": "alliance",
  "description": "The cradle of humanity...",
  "planets": [
    {
      "name": "Earth",
      "gravity": "1.0G",
      "population": "8.2B",
      "description": "Densely populated blue planet."
    }
  ],
  "bases": [
    {
      "name": "Luna Station",
      "type": "military"
    }
  ]
}
```

### 2. `connections.json`
Defines hyperlane tunnels between coordinates:
```json
{
  "from": "sol",
  "to": "alpha_centauri",
  "type": "class 1"
}
```

### 3. `factions.json`
Defines localized galactic entities and text positions on the map backdrop:
```json
{
  "id": "alliance",
  "name": "Alliance of Free Worlds",
  "color": "rgba(100, 100, 100, 0.15)",
  "x": 298,
  "y": 259,
  "fontSize": 17,
  "rotate": 0
}
```

---

## 🏃 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your local machine.

### Installation

1. Navigate to the project root directory:
   ```bash
   cd starmap
   ```

2. Install the necessary node packages:
   ```bash
   npm install
   ```

### Running Locally

To launch the local development environment with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

### Building for Production

To compile and optimize the application assets for production deployment:
```bash
npm run build
```
This outputs production-ready files in the `dist/` folder.

### Local Preview

To preview the production-built bundle locally:
```bash
npm run preview
```

---

## 🛡️ License

This project is private and proprietary. Refer to [PLAN.md](./PLAN.md) and [CHANGELOG.md](./CHANGELOG.md) to explore upcoming systems additions and version histories.
