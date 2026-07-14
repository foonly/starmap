<script setup>
import { computed } from "vue";
import {
	X,
	MapPin,
	Orbit,
	Shield,
	Radio,
	ArrowRight,
	Star,
	Disc,
} from "lucide-vue-next";

const props = defineProps({
	system: {
		type: Object,
		default: null,
	},
	faction: {
		type: Object,
		default: null,
	},
	systems: {
		type: Array,
		required: true,
	},
	connections: {
		type: Array,
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
});

const emit = defineEmits([
	"close",
	"select-system",
	"set-origin",
	"set-destination",
]);

// Helper to map connection class to color
const getLaneColor = (type) => {
	switch (type) {
		case "class 1":
			return "#28a745"; // Green
		case "class 2":
			return "#dc3545"; // Red
		case "class 3":
			return "#475569"; // Grey
		case "class 4":
			return "#8b5cf6"; // Purple
		default:
			return "#cbd5e1";
	}
};

// Find all systems directly connected to the active system
const adjacentLanes = computed(() => {
	if (!props.system) return [];
	return props.connections
		.filter((c) => c.from === props.system.id || c.to === props.system.id)
		.map((c) => {
			const neighborId = c.from === props.system.id ? c.to : c.from;
			const neighbor = props.systems.find((s) => s.id === neighborId);
			return {
				system: neighbor,
				type: c.type,
				color: getLaneColor(c.type),
			};
		})
		.filter((item) => item.system !== undefined);
});

const isOrigin = computed(
	() => props.system && props.originId === props.system.id,
);
const isDestination = computed(
	() => props.system && props.destinationId === props.system.id,
);
</script>

<template>
	<Transition
		enter-active-class="transform transition ease-in-out duration-300"
		enter-from-class="translate-x-full opacity-0"
		enter-to-class="translate-x-0 opacity-100"
		leave-active-class="transform transition ease-in-out duration-300"
		leave-from-class="translate-x-0 opacity-100"
		leave-to-class="translate-x-full opacity-0"
	>
		<div
			v-if="system"
			class="fixed right-4 top-20 bottom-4 w-96 z-40 bg-slate-900/95 border border-slate-700/50 backdrop-blur-md rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans"
		>
			<!-- Technical Grid Header Background -->
			<div
				class="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"
			></div>

			<!-- Header -->
			<div
				class="p-5 border-b border-slate-800/80 flex items-start justify-between relative z-10 bg-slate-950/40"
			>
				<div>
					<div class="flex items-center gap-2 mb-1">
						<span
							class="w-3 h-3 rounded-full inline-block animate-pulse shrink-0"
							:style="{ backgroundColor: system.color }"
						></span>
						<span
							class="text-[10px] tracking-widest font-mono text-slate-400 uppercase font-bold"
						>
							{{
								system.type === "black_hole"
									? "GRAVITATIONAL ANOMALY"
									: "STELLAR BODY"
							}}
						</span>
					</div>
					<h2
						class="text-xl font-display font-black text-slate-50 tracking-wide uppercase"
					>
						{{ system.name }}
					</h2>
					<p class="text-xs font-mono text-slate-500 mt-0.5">
						COORD: [X: {{ system.x.toFixed(0) }}, Y: {{ system.y.toFixed(0) }}]
					</p>
				</div>
				<button
					@click="emit('close')"
					class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Content -->
			<div
				class="flex-1 overflow-y-auto p-5 space-y-6 relative z-10 custom-scrollbar"
			>
				<!-- Faction Badge -->
				<div
					v-if="faction"
					class="p-3 rounded-lg border flex items-center gap-3 bg-slate-950/20"
					:style="{ borderColor: `${system.color}30` }"
				>
					<Shield class="w-5 h-5 shrink-0" :style="{ color: system.color }" />
					<div>
						<div
							class="text-[9px] font-mono tracking-widest text-slate-500 uppercase"
						>
							CONTROLLING REGIME
						</div>
						<div
							class="text-sm font-bold tracking-wide"
							:style="{ color: system.color }"
						>
							{{ faction.name }}
						</div>
					</div>
				</div>

				<!-- Navigation Pathfinder Controls -->
				<div class="grid grid-cols-2 gap-2">
					<button
						@click="emit('set-origin', system.id)"
						:class="[
							'py-2 px-3 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all',
							isOrigin
								? 'bg-green-950/50 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.15)]'
								: 'bg-slate-950/40 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700',
						]"
					>
						<MapPin
							class="w-3.5 h-3.5"
							:class="isOrigin ? 'text-green-400' : 'text-slate-400'"
						/>
						{{ isOrigin ? "ORIGIN" : "SET ORIGIN" }}
					</button>

					<button
						@click="emit('set-destination', system.id)"
						:class="[
							'py-2 px-3 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all',
							isDestination
								? 'bg-rose-950/50 text-rose-400 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
								: 'bg-slate-950/40 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700',
						]"
					>
						<MapPin
							class="w-3.5 h-3.5"
							:class="isDestination ? 'text-rose-400' : 'text-slate-400'"
						/>
						{{ isDestination ? "DESTINATION" : "SET DEST" }}
					</button>
				</div>

				<!-- Description / Lore -->
				<div class="space-y-2">
					<h3
						class="text-xs font-mono tracking-widest text-slate-400 uppercase font-bold flex items-center gap-1.5"
					>
						<Radio class="w-3.5 h-3.5 text-blue-400" />
						Galactic Lore Database
					</h3>
					<p
						class="text-sm text-slate-300 leading-relaxed bg-slate-950/30 p-3 rounded-lg border border-slate-800/40"
					>
						{{
							system.description ||
							"Stellar body cataloged. Detailed geological and strategic documentation is restricted to local system administrations."
						}}
					</p>
				</div>

				<!-- Planets List -->
				<div
					class="space-y-3"
					v-if="system.planets && system.planets.length > 0"
				>
					<h3
						class="text-xs font-mono tracking-widest text-slate-400 uppercase font-bold flex items-center gap-1.5"
					>
						<Orbit class="w-3.5 h-3.5 text-indigo-400" />
						Planetary Survey ({{ system.planets.length }})
					</h3>

					<div class="space-y-2.5">
						<div
							v-for="planet in system.planets"
							:key="planet.name"
							class="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50 hover:border-slate-700/50 transition-colors"
						>
							<div class="flex items-center justify-between mb-1">
								<span
									class="font-semibold text-sm text-slate-100 flex items-center gap-1.5"
								>
									<Disc class="w-3 h-3 text-slate-500 shrink-0" />
									{{ planet.name }}
								</span>
								<span
									class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400"
								>
									{{ planet.type }}
								</span>
							</div>
							<p class="text-xs text-slate-400 leading-normal">
								{{ planet.description }}
							</p>
						</div>
					</div>
				</div>

				<!-- Bases / Outposts List -->
				<div class="space-y-3" v-if="system.bases && system.bases.length > 0">
					<h3
						class="text-xs font-mono tracking-widest text-slate-400 uppercase font-bold flex items-center gap-1.5"
					>
						<Shield class="w-3.5 h-3.5 text-emerald-400" />
						Orbital Infrastructure ({{ system.bases.length }})
					</h3>

					<div class="space-y-2.5">
						<div
							v-for="base in system.bases"
							:key="base.name"
							class="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50 flex items-center justify-between"
						>
							<div>
								<div class="font-semibold text-sm text-slate-100">
									{{ base.name }}
								</div>
								<div
									class="text-[10px] font-mono text-slate-500 uppercase mt-0.5"
								>
									{{ base.type }}
								</div>
							</div>
							<Star
								class="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 shrink-0"
							/>
						</div>
					</div>
				</div>

				<!-- Connected Adjacent Jump Lanes -->
				<div class="space-y-3">
					<h3
						class="text-xs font-mono tracking-widest text-slate-400 uppercase font-bold flex items-center gap-1.5"
					>
						<ArrowRight class="w-3.5 h-3.5 text-purple-400" />
						Active Jump Corridors ({{ adjacentLanes.length }})
					</h3>

					<div class="space-y-1.5">
						<button
							v-for="lane in adjacentLanes"
							:key="lane.system.id + '-' + lane.type"
							@click="emit('select-system', lane.system.id)"
							class="w-full text-left bg-slate-950/40 hover:bg-slate-800/80 p-3 rounded-lg border border-slate-800/40 hover:border-slate-700/80 transition-all flex items-center justify-between group"
						>
							<div class="flex items-center gap-2.5">
								<span
									class="w-2 h-2 rounded-full inline-block shrink-0"
									:style="{ backgroundColor: lane.system.color }"
								></span>
								<span
									class="text-sm font-medium text-slate-200 group-hover:text-white transition-colors"
								>
									{{ lane.system.name }}
								</span>
							</div>
							<div class="flex items-center gap-1.5">
								<span
									class="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded tracking-wider text-white"
									:style="{ backgroundColor: `${lane.color}cc` }"
								>
									{{ lane.type }}
								</span>
								<ArrowRight
									class="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all"
								/>
							</div>
						</button>
					</div>
				</div>
			</div>
		</div>
	</Transition>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
	width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
	background: #334155;
	border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background: #475569;
}
</style>
