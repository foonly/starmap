<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { Minimize2, ZoomIn, ZoomOut } from "lucide-vue-next";

const props = defineProps({
	systems: {
		type: Array,
		required: true,
	},
	filteredSystems: {
		type: Array,
		required: true,
	},
	connections: {
		type: Array,
		required: true,
	},
	factions: {
		type: Array,
		required: true,
	},
	selectedSystemId: {
		type: String,
		default: null,
	},
	hoveredSystemId: {
		type: String,
		default: null,
	},
	shortestPath: {
		type: Array,
		default: null,
	},
	originId: {
		type: String,
		default: null,
	},
	destinationId: {
		type: String,
		default: null,
	},
	isEditMode: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(["select-system", "hover-system", "update-system"]);

// Pan & Zoom State
const svgContainer = ref(null);
const zoom = ref(0.9);
const panX = ref(100);
const panY = ref(60);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

// Edit Mode Drag State
const draggedSystemId = ref(null);
const systemDragOffset = ref({ x: 0, y: 0 });

// Compute direct transform string for the SVG main group
const transformString = computed(() => {
	return `translate(${panX.value}, ${panY.value}) scale(${zoom.value})`;
});

// Mouse Pan and Zoom Handlers
const onMouseDown = (e) => {
	// Only pan on left click
	if (e.button !== 0) return;

	// If clicking a system in edit mode, don't pan the map
	if (props.isEditMode && draggedSystemId.value) {
		return;
	}

	isDragging.value = true;
	dragStart.value = {
		x: e.clientX - panX.value,
		y: e.clientY - panY.value,
	};
};

const onMouseMove = (e) => {
	if (props.isEditMode && draggedSystemId.value) {
		const rect = svgContainer.value.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		const newX = Math.round((mouseX - panX.value) / zoom.value);
		const newY = Math.round((mouseY - panY.value) / zoom.value);

		const star = props.systems.find((s) => s.id === draggedSystemId.value);
		if (star) {
			emit("update-system", {
				...star,
				x: newX,
				y: newY,
			});
		}
		return;
	}

	if (!isDragging.value) return;
	panX.value = e.clientX - dragStart.value.x;
	panY.value = e.clientY - dragStart.value.y;
};

const onMouseUp = () => {
	isDragging.value = false;
	draggedSystemId.value = null;
};

const onSystemMouseDown = (e, sysId) => {
	if (!props.isEditMode) return;
	e.stopPropagation();
	draggedSystemId.value = sysId;
};

const onWheel = (e) => {
	e.preventDefault();
	if (!svgContainer.value) return;

	const rect = svgContainer.value.getBoundingClientRect();

	// Mouse position relative to container
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;

	const zoomFactor = 1.15;
	const oldZoom = zoom.value;
	let newZoom = oldZoom;

	// Zoom In / Out
	if (e.deltaY < 0) {
		newZoom = Math.min(oldZoom * zoomFactor, 6.0); // Max 6x
	} else {
		newZoom = Math.max(oldZoom / zoomFactor, 0.25); // Min 0.25x
	}

	// If zoom didn't change (already at bounds), do nothing
	if (newZoom === oldZoom) return;

	// Calculate new pan using scale ratio (immune to division-by-zero/Infinity drift)
	const scaleRatio = newZoom / oldZoom;
	zoom.value = newZoom;
	panX.value = mouseX - (mouseX - panX.value) * scaleRatio;
	panY.value = mouseY - (mouseY - panY.value) * scaleRatio;
};

// Zoom controls
const zoomIn = () => {
	if (!svgContainer.value) return;
	const rect = svgContainer.value.getBoundingClientRect();
	const cx = rect.width / 2;
	const cy = rect.height / 2;

	const oldZoom = zoom.value;
	const newZoom = Math.min(oldZoom * 1.25, 6.0);
	if (newZoom === oldZoom) return;

	const scaleRatio = newZoom / oldZoom;
	zoom.value = newZoom;
	panX.value = cx - (cx - panX.value) * scaleRatio;
	panY.value = cy - (cy - panY.value) * scaleRatio;
};

const zoomOut = () => {
	if (!svgContainer.value) return;
	const rect = svgContainer.value.getBoundingClientRect();
	const cx = rect.width / 2;
	const cy = rect.height / 2;

	const oldZoom = zoom.value;
	const newZoom = Math.max(oldZoom / 1.25, 0.25);
	if (newZoom === oldZoom) return;

	const scaleRatio = newZoom / oldZoom;
	zoom.value = newZoom;
	panX.value = cx - (cx - panX.value) * scaleRatio;
	panY.value = cy - (cy - panY.value) * scaleRatio;
};

// Reset view to fit the map bounds
const resetView = () => {
	if (!svgContainer.value) return;
	const rect = svgContainer.value.getBoundingClientRect();
	const width = rect.width || 1150;
	const height = rect.height || 900;

	// Core systems center around (500, 420)
	const calculatedZoom = Math.min(width / 1150, height / 900) * 0.95;
	zoom.value = Math.max(calculatedZoom, 0.25); // Guard against zero-width on mount
	panX.value = (width - 1000 * zoom.value) / 2;
	panY.value = (height - 750 * zoom.value) / 2;
};

// Trigger initial centering
onMounted(() => {
	setTimeout(resetView, 100);
});

// Auto center on selected system if requested
const centerOnSystem = (sys) => {
	if (!sys || !svgContainer.value) return;
	const rect = svgContainer.value.getBoundingClientRect();
	const targetX = rect.width / 2;
	const targetY = rect.height / 2;

	// Transition pan and zoom elegantly
	zoom.value = Math.max(zoom.value, 1.2); // Ensure readable zoom
	panX.value = targetX - sys.x * zoom.value;
	panY.value = targetY - sys.y * zoom.value;
};

// Watch selected system to auto-center
watch(
	() => props.selectedSystemId,
	(newId) => {
		if (newId) {
			const star = props.systems.find((s) => s.id === newId);
			if (star) {
				centerOnSystem(star);
			}
		}
	},
);

// Helper to check if a specific connection is part of the pathfinder route
const isConnectionInRoute = (conn) => {
	if (!props.shortestPath || props.shortestPath.length < 2) return false;

	for (let i = 0; i < props.shortestPath.length - 1; i++) {
		const u = props.shortestPath[i];
		const v = props.shortestPath[i + 1];
		if (
			(conn.from === u && conn.to === v) ||
			(conn.from === v && conn.to === u)
		) {
			return true;
		}
	}
	return false;
};

// Helper to check if a system matches active search filters
const isSystemFiltered = (sysId) => {
	return props.filteredSystems.some((s) => s.id === sysId);
};

// Helper to check if a lane is connected to the hovered system
const isLaneConnectedToHover = (conn) => {
	if (!props.hoveredSystemId) return true;
	return (
		conn.from === props.hoveredSystemId || conn.to === props.hoveredSystemId
	);
};

// Helper to map connection class to color
const getLaneColor = (type) => {
	switch (type) {
		case "class 1":
			return "#28a745"; // Green
		case "class 2":
			return "#dc3545"; // Red
		case "class 3":
			return "#000000"; // Handled via CSS class, fallback black
		case "class 4":
			return "#8b5cf6"; // Purple
		default:
			return "#cbd5e1";
	}
};
</script>

<template>
	<div
		ref="svgContainer"
		class="w-full h-full cursor-grab active:cursor-grabbing select-none outline-none relative bg-slate-50 dark:bg-space-950 transition-colors duration-200"
	>
		<!-- Grid Overlay for Sci-Fi styling -->
		<div
			class="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-45 dark:opacity-35"
		></div>

		<!-- Map UI Toolbar -->
		<div
			class="absolute bottom-6 left-6 z-10 flex items-center gap-2 bg-white/85 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 backdrop-blur p-2 rounded-xl shadow-lg transition-all"
		>
			<button
				@click="zoomIn"
				class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
				title="Zoom In"
			>
				<ZoomIn class="w-4 h-4" />
			</button>
			<button
				@click="zoomOut"
				class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
				title="Zoom Out"
			>
				<ZoomOut class="w-4 h-4" />
			</button>
			<div class="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
			<button
				@click="resetView"
				class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-mono font-bold"
				title="Reset Map View"
			>
				<Minimize2 class="w-4 h-4" />
				RE-CENTER
			</button>
		</div>

		<!-- MAIN SVG RENDERER -->
		<svg
			class="w-full h-full select-none outline-none"
			@mousedown="onMouseDown"
			@mousemove="onMouseMove"
			@mouseup="onMouseUp"
			@mouseleave="onMouseUp"
			@wheel="onWheel"
		>
			<!-- Defs for glowing filters, gradients or markers -->
			<defs>
				<!-- Blue pathfinder glow filter -->
				<filter id="glow-route" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="6" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				<!-- Faction Text Linear Gradient for modern sci-fi backgrounds -->
				<linearGradient
					id="factionTextGrad"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="100%"
				>
					<stop offset="0%" stop-color="#3b82f6" stop-opacity="0.08" />
					<stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.08" />
				</linearGradient>
			</defs>

			<!-- Pan & Zoom Active Group -->
			<g :transform="transformString">
				<!-- 1. Background Territory Label Layer -->
				<g class="factions-bg">
					<text
						v-for="fac in factions"
						:key="fac.id"
						:x="fac.x"
						:y="fac.y"
						:font-size="fac.fontSize"
						:transform="`rotate(${fac.rotate || 0}, ${fac.x}, ${fac.y})`"
						text-anchor="middle"
						class="font-display font-black tracking-[0.25em] select-none pointer-events-none fill-slate-300/40 dark:fill-slate-800/35 uppercase"
					>
						{{ fac.name }}
					</text>
				</g>

				<!-- 2. Jump Lanes (Lines) Layer -->
				<g class="jump-lanes">
					<!-- Outer Highlight / Dimming Lines first -->
					<g v-for="(conn, idx) in connections" :key="`lane-${idx}`">
						<!-- Underlay path to capture hover cleanly, or to serve as dim backdrop -->
						<line
							:x1="systems.find((s) => s.id === conn.from)?.x"
							:y1="systems.find((s) => s.id === conn.from)?.y"
							:x2="systems.find((s) => s.id === conn.to)?.x"
							:y2="systems.find((s) => s.id === conn.to)?.y"
							stroke="transparent"
							stroke-width="12"
							class="cursor-pointer"
						/>

						<!-- Standard Visual Hyperlanes -->
						<line
							:x1="systems.find((s) => s.id === conn.from)?.x"
							:y1="systems.find((s) => s.id === conn.from)?.y"
							:x2="systems.find((s) => s.id === conn.to)?.x"
							:y2="systems.find((s) => s.id === conn.to)?.y"
							:stroke="
								conn.type === 'class 3' ? undefined : getLaneColor(conn.type)
							"
							:stroke-width="isConnectionInRoute(conn) ? 3 : 1"
							:class="[
								'transition-all duration-200 pointer-events-none',
								conn.type === 'class 3'
									? 'stroke-slate-950 dark:stroke-slate-200'
									: '',
								// Dim lanes if search is active or hover focus is isolated
								hoveredSystemId && !isLaneConnectedToHover(conn)
									? 'opacity-10 dark:opacity-[0.05]'
									: hoveredSystemId && isLaneConnectedToHover(conn)
										? 'opacity-100 stroke-2'
										: 'opacity-70 dark:opacity-40',
							]"
						/>

						<!-- Super-imposed Animated Pulse on Pathfinder Routes -->
						<line
							v-if="isConnectionInRoute(conn)"
							:x1="systems.find((s) => s.id === conn.from)?.x"
							:y1="systems.find((s) => s.id === conn.from)?.y"
							:x2="systems.find((s) => s.id === conn.to)?.x"
							:y2="systems.find((s) => s.id === conn.to)?.y"
							stroke="#38bdf8"
							stroke-width="3.5"
							stroke-linecap="round"
							stroke-dasharray="8,15"
							filter="url(#glow-route)"
							class="animate-lane-pulse pointer-events-none"
						/>
					</g>
				</g>

				<!-- 3. Stellar System Nodes (Circles) Layer -->
				<g class="stellar-systems">
					<g
						v-for="star in systems"
						:key="star.id"
						:class="[
							'group cursor-pointer',
							isEditMode && draggedSystemId === star.id
								? 'cursor-grabbing'
								: isEditMode
									? 'cursor-grab'
									: 'cursor-pointer',
						]"
						@mouseenter="emit('hover-system', star.id)"
						@mouseleave="emit('hover-system', null)"
						@click="emit('select-system', star.id)"
						@mousedown="onSystemMouseDown($event, star.id)"
					>
						<!-- A. Dynamic Map Indicators (Origin / Dest / Selection Rings) -->
						<!-- Active Origin Pulse (Green) -->
						<circle
							v-if="originId === star.id"
							:cx="star.x"
							:cy="star.y"
							r="22"
							fill="transparent"
							stroke="#22c55e"
							stroke-width="1.5"
							stroke-dasharray="3,3"
							class="animate-spin-slow pointer-events-none"
						/>
						<circle
							v-if="originId === star.id"
							:cx="star.x"
							:cy="star.y"
							r="17"
							fill="rgba(34,197,94,0.06)"
							stroke="#22c55e"
							stroke-width="2"
							class="animate-pulse-ring pointer-events-none"
						/>

						<!-- Active Destination Pulse (Rose) -->
						<circle
							v-if="destinationId === star.id"
							:cx="star.x"
							:cy="star.y"
							r="22"
							fill="transparent"
							stroke="#f43f5e"
							stroke-width="1.5"
							stroke-dasharray="3,3"
							class="animate-spin-slow pointer-events-none"
						/>
						<circle
							v-if="destinationId === star.id"
							:cx="star.x"
							:cy="star.y"
							r="17"
							fill="rgba(244,63,94,0.06)"
							stroke="#f43f5e"
							stroke-width="2"
							class="animate-pulse-ring pointer-events-none"
						/>

						<!-- Active Inspector Selection Tracker (Cyan) -->
						<circle
							v-if="
								selectedSystemId === star.id &&
								originId !== star.id &&
								destinationId !== star.id
							"
							:cx="star.x"
							:cy="star.y"
							r="18"
							fill="rgba(6,182,212,0.05)"
							stroke="#06b6d4"
							stroke-width="1.5"
							class="animate-pulse-ring pointer-events-none"
						/>

						<!-- Hover Rings -->
						<circle
							:cx="star.x"
							:cy="star.y"
							:r="star.type === 'black_hole' ? 24 : 15"
							fill="transparent"
							class="stroke-slate-300/30 dark:stroke-slate-800/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
							stroke-width="1"
						/>

						<!-- B. Central Celestial Node Body -->
						<!-- Black Hole Visual (Large central gravity core with white corona edge) -->
						<circle
							v-if="star.type === 'black_hole'"
							:cx="star.x"
							:cy="star.y"
							r="12"
							fill="#020617"
							stroke="#ffffff"
							stroke-width="2.5"
							:class="[
								'transition-all duration-200 shadow-xl',
								isSystemFiltered(star.id)
									? 'opacity-100 glow-white'
									: 'opacity-15 dark:opacity-10',
							]"
						/>
						<!-- Star Core Visual (Normal colored star) -->
						<circle
							v-else
							:cx="star.x"
							:cy="star.y"
							:r="selectedSystemId === star.id ? 8 : 5.5"
							:fill="star.color"
							:stroke="selectedSystemId === star.id ? '#ffffff' : 'transparent'"
							:stroke-width="selectedSystemId === star.id ? 1.5 : 0"
							:class="[
								'transition-all duration-200',
								isSystemFiltered(star.id)
									? star.color === '#28a745'
										? 'glow-green'
										: star.color === '#dc3545'
											? 'glow-red'
											: star.color === '#0000ff'
												? 'glow-blue'
												: star.color === '#17a2b8'
													? 'glow-cyan'
													: 'glow-yellow'
									: 'opacity-15 dark:opacity-10',
							]"
						/>

						<!-- C. Node Labels -->
						<text
							:x="star.x"
							:y="star.y - (star.type === 'black_hole' ? 18 : 12)"
							text-anchor="middle"
							:class="[
								'font-display tracking-wider select-none pointer-events-none transition-all duration-200',
								star.type === 'black_hole'
									? 'text-[11px] font-black dark:font-extrabold fill-slate-900 dark:fill-slate-100'
									: 'text-[9.5px] font-medium font-mono fill-slate-700 dark:fill-slate-300',
								// Highlight labels belonging to matches, dim others
								isSystemFiltered(star.id)
									? 'opacity-100 scale-100 font-semibold'
									: 'opacity-15 dark:opacity-5',
							]"
						>
							{{ star.name }}
						</text>
					</g>
				</g>
			</g>
		</svg>
	</div>
</template>

<style>
/* Rotational details rings */
@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
.animate-spin-slow {
	transform-box: fill-box;
	transform-origin: center;
	animation: spin 15s linear infinite;
}

/* Pulsing rings for coordinates selection */
@keyframes pulseRing {
	0% {
		r: 10px;
		opacity: 0.8;
	}
	100% {
		r: 25px;
		opacity: 0;
	}
}
.animate-pulse-ring {
	transform-box: fill-box;
	transform-origin: center;
	animation: pulseRing 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

/* Lane pathfinder flow animation */
@keyframes lanePulse {
	to {
		stroke-dashoffset: -40;
	}
}
.animate-lane-pulse {
	animation: lanePulse 1.2s linear infinite;
}
</style>
