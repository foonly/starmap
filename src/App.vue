<script setup>
import { ref, computed, onMounted } from "vue";
import { Sun, Moon, Database } from "lucide-vue-next";

import Starmap from "./components/Starmap.vue";
import ControlPanel from "./components/ControlPanel.vue";
import SystemInspector from "./components/SystemInspector.vue";

import systemsData from "./data/systems.json";
import connectionsData from "./data/connections.json";
import factionsData from "./data/factions.json";

// Reactive State
const searchQuery = ref("");
const selectedFactionId = ref("");
const selectedSystemId = ref(null);
const hoveredSystemId = ref(null);
const originId = ref(null);
const destinationId = ref(null);
const theme = ref("dark");

// Hyperlane toggles
const activeLanes = ref({
	"class 1": true,
	"class 2": true,
	"class 3": true,
	"class 4": true,
});

// Compute connections based on active lane filters
const activeConnections = computed(() => {
	return connectionsData.filter((conn) => activeLanes.value[conn.type]);
});

// Search & Filter systems
const filteredSystems = computed(() => {
	return systemsData.filter((sys) => {
		// 1. Faction filter
		if (selectedFactionId.value && sys.faction !== selectedFactionId.value) {
			return false;
		}

		// 2. Search query filter
		if (searchQuery.value) {
			const q = searchQuery.value.toLowerCase();
			const matchName = sys.name.toLowerCase().includes(q);
			const matchDesc = sys.description?.toLowerCase().includes(q);
			const matchPlanets = sys.planets?.some(
				(p) =>
					p.name.toLowerCase().includes(q) ||
					p.description.toLowerCase().includes(q),
			);
			const matchBases = sys.bases?.some(
				(b) =>
					b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q),
			);
			return matchName || matchDesc || matchPlanets || matchBases;
		}

		return true;
	});
});

// Get system & faction record for the active inspector selection
const selectedSystem = computed(() => {
	return systemsData.find((s) => s.id === selectedSystemId.value) || null;
});

const selectedSystemFaction = computed(() => {
	if (!selectedSystem.value) return null;
	return (
		factionsData.find((f) => f.id === selectedSystem.value.faction) || null
	);
});

// Shortest Path Dijkstra Solver (custom graph algorithm)
const findShortestPath = (startId, endId) => {
	if (!startId || !endId) return null;
	if (startId === endId) return [startId];

	// Build adjacency list utilizing only ACTIVE hyperlanes
	const adj = {};
	systemsData.forEach((sys) => {
		adj[sys.id] = [];
	});

	activeConnections.value.forEach((conn) => {
		const fromSys = systemsData.find((s) => s.id === conn.from);
		const toSys = systemsData.find((s) => s.id === conn.to);

		if (fromSys && toSys) {
			// Euclidean distance coordinates calculation
			const dx = fromSys.x - toSys.x;
			const dy = fromSys.y - toSys.y;
			const weight = Math.sqrt(dx * dx + dy * dy);

			adj[conn.from].push({ node: conn.to, weight });
			adj[conn.to].push({ node: conn.from, weight });
		}
	});

	// Dijkstra's solver
	const distances = {};
	const previous = {};
	const queue = [];

	systemsData.forEach((sys) => {
		distances[sys.id] = Infinity;
		previous[sys.id] = null;
	});

	distances[startId] = 0;
	queue.push({ id: startId, dist: 0 });

	while (queue.length > 0) {
		// Sort queue by closest distance
		queue.sort((a, b) => a.dist - b.dist);
		const { id: u } = queue.shift();

		if (u === endId) break;

		const neighbors = adj[u] || [];
		for (const edge of neighbors) {
			const v = edge.node;
			const alt = distances[u] + edge.weight;
			if (alt < distances[v]) {
				distances[v] = alt;
				previous[v] = u;
				queue.push({ id: v, dist: alt });
			}
		}
	}

	// Reconstruct shortest pathway array
	if (distances[endId] === Infinity) return null;

	const path = [];
	let curr = endId;
	while (curr !== null) {
		path.unshift(curr);
		curr = previous[curr];
	}
	return path;
};

const shortestPath = computed(() => {
	return findShortestPath(originId.value, destinationId.value);
});

// Event Handlers
const handleSelectSystem = (sysId) => {
	selectedSystemId.value = sysId;
};

const handleHoverSystem = (sysId) => {
	hoveredSystemId.value = sysId;
};

const toggleLaneType = (type) => {
	activeLanes.value[type] = !activeLanes.value[type];
};

const setRouteOrigin = (sysId) => {
	originId.value = sysId;
};

const setRouteDestination = (sysId) => {
	destinationId.value = sysId;
};

const swapRoutePoints = () => {
	const temp = originId.value;
	originId.value = destinationId.value;
	destinationId.value = temp;
};

const clearRouteSelection = () => {
	originId.value = null;
	destinationId.value = null;
};

// Class-based Theme Toggler
const toggleTheme = () => {
	theme.value = theme.value === "dark" ? "light" : "dark";
	applyTheme();
};

const applyTheme = () => {
	if (theme.value === "dark") {
		document.documentElement.classList.add("dark");
		localStorage.setItem("theme", "dark");
	} else {
		document.documentElement.classList.remove("dark");
		localStorage.setItem("theme", "light");
	}
};

// Run on init
onMounted(() => {
	const savedTheme = localStorage.getItem("theme");
	theme.value = savedTheme ? savedTheme : "dark";
	applyTheme();
});
</script>

<template>
	<div
		class="h-screen w-screen flex flex-col relative overflow-hidden bg-slate-50 dark:bg-space-950 text-slate-800 dark:text-slate-100 transition-colors duration-200"
	>
		<!-- TOP APPLICATION HEADBAR -->
		<header
			class="h-14 w-full px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-space-900/60 backdrop-blur z-20 select-none"
		>
			<!-- Title & Branding -->
			<div class="flex items-center gap-3">
				<div
					class="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center"
				>
					<Database class="w-4.5 h-4.5 text-blue-500" />
				</div>
				<div>
					<h1
						class="text-sm font-display font-black tracking-widest text-slate-900 dark:text-white uppercase flex items-center gap-2"
					>
						🌌 STARNAV
						<span
							class="text-blue-500 text-xs font-bold font-mono px-1.5 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20"
							>V1.0</span
						>
					</h1>
				</div>
			</div>

			<!-- Live Sentry Banner (Decorative) -->
			<div
				class="hidden md:flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-500"
			>
				<span
					class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
				></span>
				TRANSIT ARRAYS OPERATIONAL // GRID LOAD STABLE
			</div>

			<!-- Quick Actions (Theme Switch) -->
			<div>
				<button
					@click="toggleTheme"
					class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 transition-colors flex items-center justify-center"
					title="Toggle Color Theme"
				>
					<Sun v-if="theme === 'dark'" class="w-4.5 h-4.5" />
					<Moon v-else class="w-4.5 h-4.5" />
				</button>
			</div>
		</header>

		<!-- CONTENT WORKSPACE AREA -->
		<main class="flex-1 w-full relative overflow-hidden">
			<!-- Interactive SVG Starmap Backdrop -->
			<Starmap
				:systems="systemsData"
				:filtered-systems="filteredSystems"
				:connections="activeConnections"
				:factions="factionsData"
				:selected-system-id="selectedSystemId"
				:hovered-system-id="hoveredSystemId"
				:shortest-path="shortestPath"
				:origin-id="originId"
				:destination-id="destinationId"
				@select-system="handleSelectSystem"
				@hover-system="handleHoverSystem"
			/>

			<!-- Left Console Control Panel -->
			<ControlPanel
				:systems="systemsData"
				:factions="factionsData"
				v-model:searchQuery="searchQuery"
				v-model:selectedFactionId="selectedFactionId"
				:active-lanes="activeLanes"
				:origin-id="originId"
				:destination-id="destinationId"
				:shortest-path="shortestPath"
				@toggle-lane="toggleLaneType"
				@swap-route="swapRoutePoints"
				@clear-route="clearRouteSelection"
				@select-system="handleSelectSystem"
			/>

			<!-- Right Slideway Inspector Sidebar -->
			<SystemInspector
				:system="selectedSystem"
				:faction="selectedSystemFaction"
				:systems="systemsData"
				:connections="connectionsData"
				:origin-id="originId"
				:destination-id="destinationId"
				@close="handleSelectSystem(null)"
				@select-system="handleSelectSystem"
				@set-origin="setRouteOrigin"
				@set-destination="setRouteDestination"
			/>
		</main>
	</div>
</template>
