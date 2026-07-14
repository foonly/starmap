<script setup>
import { computed } from "vue";
import {
	Search,
	Compass,
	Shield,
	Route,
	ArrowRight,
	X,
	RefreshCw,
	Layers,
} from "lucide-vue-next";

const props = defineProps({
	systems: {
		type: Array,
		required: true,
	},
	factions: {
		type: Array,
		required: true,
	},
	searchQuery: {
		type: String,
		required: true,
	},
	selectedFactionId: {
		type: String,
		required: true,
	},
	activeLanes: {
		type: Object,
		required: true,
	},
	originId: {
		type: String,
		default: null,
	},
	destinationId: {
		type: String,
		default: null,
	},
	shortestPath: {
		type: Array,
		default: null,
	},
});

const emit = defineEmits([
	"update:searchQuery",
	"update:selectedFactionId",
	"toggle-lane",
	"swap-route",
	"clear-route",
	"select-system",
]);

// Find actual system records for origin/destination
const originSystem = computed(() =>
	props.systems.find((s) => s.id === props.originId),
);
const destinationSystem = computed(() =>
	props.systems.find((s) => s.id === props.destinationId),
);

// Generate path steps list with transit details
const routeSteps = computed(() => {
	if (!props.shortestPath || props.shortestPath.length === 0) return [];
	return props.shortestPath.map((id) => props.systems.find((s) => s.id === id));
});

// Calculate simple statistics for the solved path
const routeStats = computed(() => {
	if (!props.shortestPath || props.shortestPath.length < 2) return null;
	return {
		jumps: props.shortestPath.length - 1,
		hazards: routeSteps.value.filter((s) => s.type === "black_hole").length,
	};
});
</script>

<template>
	<div
		class="fixed top-20 left-4 bottom-4 w-80 z-30 bg-slate-900/90 dark:bg-space-900/90 border border-slate-200 dark:border-slate-800/80 backdrop-blur rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 font-sans"
	>
		<!-- Title Header -->
		<div
			class="p-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-950/40"
		>
			<div class="flex items-center gap-2">
				<Compass class="w-5 h-5 text-blue-500 animate-pulse" />
				<h2
					class="text-sm font-display font-bold tracking-widest text-slate-700 dark:text-slate-200 uppercase"
				>
					Navigation Console
				</h2>
			</div>
		</div>

		<!-- Scrollable Control Content -->
		<div class="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
			<!-- 1. Search Bar -->
			<div class="space-y-1.5">
				<label
					class="text-[10px] font-mono tracking-widest text-slate-500 dark:text-slate-400 font-bold uppercase block"
				>
					Stellar Search
				</label>
				<div class="relative">
					<input
						:value="searchQuery"
						@input="emit('update:searchQuery', $event.target.value)"
						type="text"
						placeholder="Search system, planets, bases..."
						class="w-full bg-white dark:bg-slate-950/60 text-sm py-2 pl-9 pr-8 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans placeholder-slate-400 dark:placeholder-slate-600 text-slate-900 dark:text-slate-100"
					/>
					<Search
						class="w-4 h-4 text-slate-400 dark:text-slate-600 absolute left-3 top-2.5"
					/>
					<button
						v-if="searchQuery"
						@click="emit('update:searchQuery', '')"
						class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 absolute right-2 top-2 text-slate-400 dark:text-slate-600"
					>
						<X class="w-3 h-3" />
					</button>
				</div>
			</div>

			<!-- 2. Faction Filtering -->
			<div class="space-y-1.5">
				<label
					class="text-[10px] font-mono tracking-widest text-slate-500 dark:text-slate-400 font-bold uppercase block flex items-center gap-1"
				>
					<Shield class="w-3 h-3" /> Territorial Focus
				</label>
				<select
					:value="selectedFactionId"
					@change="emit('update:selectedFactionId', $event.target.value)"
					class="w-full text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950/60 text-sm py-2 px-2.5 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 transition-all font-sans cursor-pointer"
				>
					<option value="">-- ALL SECTORS --</option>
					<option
						v-for="faction in factions"
						:key="faction.id"
						:value="faction.id"
					>
						{{ faction.name.replace("THE ", "") }}
					</option>
				</select>
			</div>

			<!-- 3. Lane Filter Toggles -->
			<div
				class="space-y-2 bg-slate-100/50 dark:bg-slate-950/30 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/40"
			>
				<label
					class="text-[10px] font-mono tracking-widest text-slate-500 dark:text-slate-400 font-bold uppercase block flex items-center gap-1.5"
				>
					<Layers class="w-3 h-3" /> Lane Filters
				</label>
				<div class="space-y-1.5">
					<label
						v-for="(active, type) in activeLanes"
						:key="type"
						class="flex items-center gap-2.5 text-xs font-mono text-slate-600 dark:text-slate-300 cursor-pointer select-none py-0.5"
					>
						<input
							type="checkbox"
							:checked="active"
							@change="emit('toggle-lane', type)"
							class="rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
						/>
						<span class="capitalize flex items-center gap-1.5">
							<span
								class="w-2 h-2 rounded-full inline-block"
								:style="{
									backgroundColor:
										type === 'class 1'
											? '#28a745'
											: type === 'class 2'
												? '#dc3545'
												: type === 'class 3'
													? '#475569'
													: '#8b5cf6',
								}"
							></span>
							{{ type }} Lanes
						</span>
					</label>
				</div>
			</div>

			<!-- 4. Jump Pathfinder Controller -->
			<div class="space-y-3 pt-1">
				<label
					class="text-[10px] font-mono tracking-widest text-slate-500 dark:text-slate-400 font-bold uppercase block flex items-center gap-1.5"
				>
					<Route class="w-3.5 h-3.5" /> Jump Route Planner
				</label>

				<!-- Unsolved Route Selection Blocks -->
				<div class="space-y-2">
					<!-- Origin Selection -->
					<div
						:class="[
							'p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all',
							originSystem
								? 'bg-green-500/10 dark:bg-green-950/30 border-green-500/40 text-slate-800 dark:text-green-300'
								: 'bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500',
						]"
					>
						<div class="flex items-center gap-2 truncate">
							<span class="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
							<div class="truncate">
								<div
									class="text-[8px] font-mono uppercase text-slate-400 dark:text-slate-500"
								>
									ORIGIN
								</div>
								<div
									class="font-bold text-sm truncate"
									:class="{
										'text-slate-800 dark:text-slate-100': originSystem,
									}"
								>
									{{
										originSystem
											? originSystem.name
											: "Select starting system..."
									}}
								</div>
							</div>
						</div>
						<button
							v-if="originId"
							@click="emit('swap-route')"
							class="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
							title="Swap Origin & Destination"
						>
							<RefreshCw class="w-3.5 h-3.5" />
						</button>
					</div>

					<!-- Destination Selection -->
					<div
						:class="[
							'p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all',
							destinationSystem
								? 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/40 text-slate-800 dark:text-rose-300'
								: 'bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500',
						]"
					>
						<div class="flex items-center gap-2 truncate">
							<span class="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
							<div class="truncate">
								<div
									class="text-[8px] font-mono uppercase text-slate-400 dark:text-slate-500"
								>
									DESTINATION
								</div>
								<div
									class="font-bold text-sm truncate"
									:class="{
										'text-slate-800 dark:text-slate-100': destinationSystem,
									}"
								>
									{{
										destinationSystem
											? destinationSystem.name
											: "Select target system..."
									}}
								</div>
							</div>
						</div>
						<button
							v-if="destinationId"
							@click="emit('clear-route')"
							class="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-rose-400"
							title="Clear Pathfinder Selection"
						>
							<X class="w-3.5 h-3.5" />
						</button>
					</div>
				</div>

				<!-- Solved Route Feedback -->
				<div
					v-if="shortestPath && shortestPath.length > 0"
					class="space-y-3 border-t border-slate-200 dark:border-slate-800/80 pt-3"
				>
					<!-- Path Stats -->
					<div v-if="routeStats" class="grid grid-cols-2 gap-2 text-center">
						<div
							class="bg-slate-100 dark:bg-slate-950/40 p-2 rounded border border-slate-200 dark:border-slate-800/50"
						>
							<div class="text-[9px] font-mono text-slate-400">
								TOTAL TRANSITS
							</div>
							<div
								class="text-lg font-display font-bold text-blue-500 dark:text-blue-400"
							>
								{{ routeStats.jumps }}
								{{ routeStats.jumps === 1 ? "Jump" : "Jumps" }}
							</div>
						</div>
						<div
							class="bg-slate-100 dark:bg-slate-950/40 p-2 rounded border border-slate-200 dark:border-slate-800/50"
						>
							<div class="text-[9px] font-mono text-slate-400">
								ANOMALY HAZARDS
							</div>
							<div
								class="text-lg font-display font-bold text-amber-500 dark:text-amber-400"
							>
								{{ routeStats.hazards }}
							</div>
						</div>
					</div>

					<!-- Step-by-Step Pathway Listing -->
					<div
						class="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar bg-slate-100/50 dark:bg-slate-950/30 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/30"
					>
						<div
							v-for="(step, idx) in routeSteps"
							:key="`step-${idx}`"
							class="flex items-center gap-2 group"
						>
							<!-- Index stamp -->
							<span class="text-[9px] font-mono text-slate-400 w-3 shrink-0"
								>{{ idx + 1 }}.</span
							>

							<!-- System Link Button -->
							<button
								@click="emit('select-system', step.id)"
								class="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 truncate flex-1"
							>
								<span
									class="w-1.5 h-1.5 rounded-full inline-block shrink-0"
									:style="{ backgroundColor: step.color }"
								></span>
								<span class="truncate">{{ step.name }}</span>
							</button>

							<ArrowRight
								v-if="idx < routeSteps.length - 1"
								class="w-3 h-3 text-slate-400 shrink-0"
							/>
						</div>
					</div>

					<button
						@click="emit('clear-route')"
						class="w-full text-xs font-mono font-bold tracking-wider py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
					>
						CLEAR ACTIVE ROUTE
					</button>
				</div>

				<div
					v-else-if="originId && destinationId"
					class="p-3 bg-red-500/10 dark:bg-red-950/20 border border-red-500/30 rounded-lg text-center"
				>
					<p class="text-xs text-red-600 dark:text-red-400 font-medium">
						NO JUMP PATH FOUND
					</p>
					<p class="text-[10px] text-slate-400 mt-1">
						The hyperlanes between these coordinates are severed. Try another
						jump combination.
					</p>
				</div>

				<div
					v-else
					class="p-3 bg-slate-100 dark:bg-slate-950/25 border border-slate-200 dark:border-slate-800/30 rounded-lg text-center"
				>
					<p
						class="text-[11px] text-slate-400 dark:text-slate-500 leading-normal"
					>
						Select an origin and a destination system from the map or system
						details panel to plot a route.
					</p>
				</div>
			</div>
		</div>

		<!-- Credit Footer -->
		<div
			class="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-950/40 text-center"
		>
			<div
				class="text-[9px] font-mono tracking-widest text-slate-400 uppercase"
			>
				STARMAP V1.0.0
			</div>
		</div>
	</div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
	width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: 4px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
	background: #1e293b;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: #94a3b8;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: #334155;
}
</style>
