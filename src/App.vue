<script setup>
import { ref, computed, onMounted } from "vue";
import { Sun, Moon, Database } from "lucide-vue-next";

import Starmap from "./components/Starmap.vue";
import ControlPanel from "./components/ControlPanel.vue";
import SystemInspector from "./components/SystemInspector.vue";

import systemsDataRaw from "./data/systems.json";
import connectionsDataRaw from "./data/connections.json";
import factionsDataRaw from "./data/factions.json";

import pkg from "../package.json";

// Reactive State
const version = pkg.version;
const systemsData = ref(JSON.parse(JSON.stringify(systemsDataRaw)));
const connectionsData = ref(JSON.parse(JSON.stringify(connectionsDataRaw)));
const factionsData = ref(JSON.parse(JSON.stringify(factionsDataRaw)));

const searchQuery = ref("");
const selectedFactionId = ref("");
const selectedSystemId = ref(null);
const hoveredSystemId = ref(null);
const originId = ref(null);
const destinationId = ref(null);
const theme = ref("dark");
const isEditMode = ref(false);

// Hyperlane toggles
const activeLanes = ref({
	"class 1": true,
	"class 2": true,
	"class 3": true,
	"class 4": true,
});

// Compute connections based on active lane filters
const activeConnections = computed(() => {
	return connectionsData.value.filter((conn) => activeLanes.value[conn.type]);
});

// Search & Filter systems
const filteredSystems = computed(() => {
	return systemsData.value.filter((sys) => {
		// 1. Faction filter
		if (selectedFactionId.value === "independent") {
			if (sys.faction && sys.faction !== "") return false;
		} else if (
			selectedFactionId.value &&
			sys.faction !== selectedFactionId.value
		) {
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
	return systemsData.value.find((s) => s.id === selectedSystemId.value) || null;
});

const selectedSystemFaction = computed(() => {
	if (!selectedSystem.value) return null;
	return (
		factionsData.value.find((f) => f.id === selectedSystem.value.faction) ||
		null
	);
});

// Shortest Path Dijkstra Solver (custom graph algorithm)
const findShortestPath = (startId, endId) => {
	if (!startId || !endId) return null;
	if (startId === endId) return [startId];

	// Build adjacency list utilizing only ACTIVE hyperlanes
	const adj = {};
	systemsData.value.forEach((sys) => {
		adj[sys.id] = [];
	});

	activeConnections.value.forEach((conn) => {
		const fromSys = systemsData.value.find((s) => s.id === conn.from);
		const toSys = systemsData.value.find((s) => s.id === conn.to);

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

	systemsData.value.forEach((sys) => {
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

const handleUpdateSystem = (updatedSystem) => {
	const index = systemsData.value.findIndex((s) => s.id === updatedSystem.id);
	if (index !== -1) {
		systemsData.value[index] = updatedSystem;
	}
};

const handleDeleteSystem = (sysId) => {
	if (!confirm(`Are you sure you want to delete ${sysId}?`)) return;

	// Remove system
	systemsData.value = systemsData.value.filter((s) => s.id !== sysId);

	// Remove associated connections
	connectionsData.value = connectionsData.value.filter(
		(c) => c.from !== sysId && c.to !== sysId,
	);

	if (selectedSystemId.value === sysId) {
		selectedSystemId.value = null;
	}
	if (originId.value === sysId) originId.value = null;
	if (destinationId.value === sysId) destinationId.value = null;
};

const handleAddSystem = () => {
	const newId = `new_system_${Date.now()}`;
	const newSystem = {
		id: newId,
		name: "New System",
		type: "star",
		color: "#ffffff",
		x: 500,
		y: 400,
		faction: "",
		planets: [],
		bases: [],
		description: "Newly discovered star system.",
	};
	systemsData.value.push(newSystem);
	selectedSystemId.value = newId;
};

const handleAddConnection = ({ from, to, type }) => {
	const existing = connectionsData.value.find(
		(c) => (c.from === from && c.to === to) || (c.from === to && c.to === from),
	);

	if (existing) {
		existing.type = type;
	} else {
		connectionsData.value.push({ from, to, type });
	}
};

const handleUpdateFaction = (updatedFaction) => {
	const index = factionsData.value.findIndex((f) => f.id === updatedFaction.id);
	if (index !== -1) {
		factionsData.value[index] = updatedFaction;
	}
};

const handleRemoveConnection = ({ from, to }) => {
	connectionsData.value = connectionsData.value.filter(
		(c) =>
			!((c.from === from && c.to === to) || (c.from === to && c.to === from)),
	);
};

const downloadData = () => {
	const data = {
		systems: systemsData.value,
		connections: connectionsData.value,
		factions: factionsData.value,
	};

	Object.entries(data).forEach(([key, value]) => {
		const blob = new Blob([JSON.stringify(value, null, "\t")], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${key}.json`;
		a.click();
		URL.revokeObjectURL(url);
	});
};

const toggleEditMode = () => {
	isEditMode.value = !isEditMode.value;
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

	// Hidden shortcut to toggle edit mode: Alt + Shift + E
	window.addEventListener("keydown", (e) => {
		if (e.altKey && e.shiftKey && e.key === "E") {
			toggleEditMode();
		}
	});
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
							@click="toggleEditMode"
							class="cursor-default select-none text-blue-500 text-xs font-bold font-mono px-1.5 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
							title="System Version"
							>V{{ version }}</span
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
			<div class="flex items-center gap-2">
				<button
					v-if="isEditMode"
					@click="downloadData"
					class="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white border border-blue-600 transition-colors flex items-center gap-2 text-xs font-bold font-mono animate-pulse"
					title="Download JSON Data"
				>
					DOWNLOAD DATA
				</button>

				<button
					v-if="isEditMode"
					@click="toggleEditMode"
					class="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/50 text-amber-600 dark:text-amber-400 text-xs font-bold font-mono hover:bg-amber-500/20 transition-colors"
					title="Exit Edit Mode"
				>
					EXIT EDITING
				</button>

				<div class="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>

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
				:is-edit-mode="isEditMode"
				@select-system="handleSelectSystem"
				@hover-system="handleHoverSystem"
				@update-system="handleUpdateSystem"
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
				:is-edit-mode="isEditMode"
				:version="version"
				@toggle-lane="toggleLaneType"
				@swap-route="swapRoutePoints"
				@clear-route="clearRouteSelection"
				@select-system="handleSelectSystem"
				@add-system="handleAddSystem"
				@update-faction="handleUpdateFaction"
			/>

			<!-- Right Slideway Inspector Sidebar -->
			<SystemInspector
				:system="selectedSystem"
				:faction="selectedSystemFaction"
				:systems="systemsData"
				:connections="connectionsData"
				:factions="factionsData"
				:origin-id="originId"
				:destination-id="destinationId"
				:is-edit-mode="isEditMode"
				@close="handleSelectSystem(null)"
				@select-system="handleSelectSystem"
				@set-origin="setRouteOrigin"
				@set-destination="setRouteDestination"
				@update-system="handleUpdateSystem"
				@delete-system="handleDeleteSystem"
				@add-connection="handleAddConnection"
				@remove-connection="handleRemoveConnection"
			/>
		</main>
	</div>
</template>
