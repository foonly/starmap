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
	factions: {
		type: Array,
		required: true,
	},
	isEditMode: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits([
	"close",
	"select-system",
	"set-origin",
	"set-destination",
	"update-system",
	"delete-system",
	"add-connection",
	"remove-connection",
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

const handleInputChange = (field, value) => {
	emit("update-system", {
		...props.system,
		[field]: value,
	});
};

const handleNestedInputChange = (index, field, value, listName) => {
	const newList = [...props.system[listName]];
	newList[index] = { ...newList[index], [field]: value };
	emit("update-system", {
		...props.system,
		[listName]: newList,
	});
};

const addItem = (listName) => {
	const newItem =
		listName === "planets"
			? { name: "New Planet", type: "Terrestrial", description: "" }
			: { name: "New Base", type: "Orbital Port" };
	emit("update-system", {
		...props.system,
		[listName]: [...(props.system[listName] || []), newItem],
	});
};

const removeItem = (index, listName) => {
	const newList = [...props.system[listName]];
	newList.splice(index, 1);
	emit("update-system", {
		...props.system,
		[listName]: newList,
	});
};
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
				<!-- EDIT MODE FORM -->
				<div v-if="isEditMode" class="space-y-6">
					<div class="space-y-4">
						<h3
							class="text-[10px] tracking-widest font-mono text-amber-500 uppercase font-black border-b border-amber-500/20 pb-2"
						>
							CORE SYSTEM DATA
						</h3>

						<div class="space-y-3">
							<div>
								<label
									class="text-[10px] font-mono text-slate-500 uppercase block mb-1"
									>System Name</label
								>
								<input
									type="text"
									:value="system.name"
									@input="handleInputChange('name', $event.target.value)"
									class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none transition-colors"
								/>
							</div>

							<div class="grid grid-cols-2 gap-3">
								<div>
									<label
										class="text-[10px] font-mono text-slate-500 uppercase block mb-1"
										>Type</label
									>
									<select
										:value="system.type"
										@change="handleInputChange('type', $event.target.value)"
										class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none transition-colors"
									>
										<option value="star">Star</option>
										<option value="black_hole">Black Hole</option>
									</select>
								</div>
								<div>
									<label
										class="text-[10px] font-mono text-slate-500 uppercase block mb-1"
										>Color</label
									>
									<div class="flex gap-2">
										<input
											type="color"
											:value="system.color"
											@input="handleInputChange('color', $event.target.value)"
											class="w-10 h-9 bg-slate-950 border border-slate-700 rounded cursor-pointer"
										/>
										<input
											type="text"
											:value="system.color"
											@input="handleInputChange('color', $event.target.value)"
											class="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-[10px] font-mono focus:border-blue-500 outline-none transition-colors uppercase"
										/>
									</div>
								</div>
							</div>

							<div>
								<label
									class="text-[10px] font-mono text-slate-500 uppercase block mb-1"
									>Controlling Faction</label
								>
								<select
									:value="system.faction"
									@change="handleInputChange('faction', $event.target.value)"
									class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none transition-colors"
								>
									<option value="">None / Independent</option>
									<option v-for="fac in factions" :key="fac.id" :value="fac.id">
										{{ fac.name }}
									</option>
								</select>
							</div>

							<div class="grid grid-cols-2 gap-3">
								<div>
									<label
										class="text-[10px] font-mono text-slate-500 uppercase block mb-1"
										>Coord X</label
									>
									<input
										type="number"
										:value="system.x"
										@input="
											handleInputChange('x', parseInt($event.target.value))
										"
										class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none transition-colors"
									/>
								</div>
								<div>
									<label
										class="text-[10px] font-mono text-slate-500 uppercase block mb-1"
										>Coord Y</label
									>
									<input
										type="number"
										:value="system.y"
										@input="
											handleInputChange('y', parseInt($event.target.value))
										"
										class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none transition-colors"
									/>
								</div>
							</div>

							<div>
								<label
									class="text-[10px] font-mono text-slate-500 uppercase block mb-1"
									>Description / Lore</label
								>
								<textarea
									:value="system.description"
									@input="handleInputChange('description', $event.target.value)"
									rows="4"
									class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm focus:border-blue-500 outline-none transition-colors resize-none"
								></textarea>
							</div>

							<div class="pt-2">
								<button
									@click="emit('delete-system', system.id)"
									class="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded text-[10px] font-mono font-bold transition-colors"
								>
									DELETE SYSTEM FROM DATABASE
								</button>
							</div>
						</div>
					</div>

					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3
								class="text-[10px] tracking-widest font-mono text-amber-500 uppercase font-black"
							>
								HYPERLANE CONNECTIONS
							</h3>
						</div>

						<div class="space-y-2">
							<div
								v-for="lane in adjacentLanes"
								:key="lane.system.id"
								class="flex items-center justify-between p-2 bg-slate-950/50 border border-slate-800 rounded"
							>
								<div class="flex items-center gap-2">
									<span
										class="w-1.5 h-1.5 rounded-full"
										:style="{ backgroundColor: lane.system.color }"
									></span>
									<span class="text-xs font-mono">{{ lane.system.name }}</span>
								</div>
								<div class="flex items-center gap-2">
									<select
										:value="lane.type"
										@change="
											emit('add-connection', {
												from: system.id,
												to: lane.system.id,
												type: $event.target.value,
											})
										"
										class="bg-slate-900 border border-slate-700 text-[9px] font-mono rounded px-1 py-0.5"
									>
										<option value="class 1">Class 1</option>
										<option value="class 2">Class 2</option>
										<option value="class 3">Class 3</option>
										<option value="class 4">Class 4</option>
									</select>
									<button
										@click="
											emit('remove-connection', {
												from: system.id,
												to: lane.system.id,
											})
										"
										class="text-slate-500 hover:text-red-400"
									>
										<X class="w-3.5 h-3.5" />
									</button>
								</div>
							</div>

							<div class="pt-2">
								<select
									@change="
										if ($event.target.value) {
											emit('add-connection', {
												from: system.id,
												to: $event.target.value,
												type: 'class 1',
											});
											$event.target.value = '';
										}
									"
									class="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs focus:border-blue-500 outline-none transition-colors"
								>
									<option value="">+ CONNECT TO SYSTEM...</option>
									<option
										v-for="s in systems.filter(
											(s) =>
												s.id !== system.id &&
												!adjacentLanes.some((l) => l.system.id === s.id),
										)"
										:key="s.id"
										:value="s.id"
									>
										{{ s.name }}
									</option>
								</select>
							</div>
						</div>
					</div>

					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3
								class="text-[10px] tracking-widest font-mono text-amber-500 uppercase font-black"
							>
								PLANETARY SURVEY
							</h3>
							<button
								@click="addItem('planets')"
								class="text-[10px] font-mono bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
							>
								+ ADD PLANET
							</button>
						</div>

						<div class="space-y-3">
							<div
								v-for="(planet, idx) in system.planets"
								:key="idx"
								class="p-3 bg-slate-950/50 border border-slate-800 rounded-lg space-y-2 relative"
							>
								<button
									@click="removeItem(idx, 'planets')"
									class="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors"
								>
									<X class="w-3.5 h-3.5" />
								</button>
								<input
									type="text"
									:value="planet.name"
									@input="
										handleNestedInputChange(
											idx,
											'name',
											$event.target.value,
											'planets',
										)
									"
									placeholder="Planet Name"
									class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs focus:border-blue-500 outline-none"
								/>
								<input
									type="text"
									:value="planet.type"
									@input="
										handleNestedInputChange(
											idx,
											'type',
											$event.target.value,
											'planets',
										)
									"
									placeholder="Planet Type"
									class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs focus:border-blue-500 outline-none"
								/>
								<textarea
									:value="planet.description"
									@input="
										handleNestedInputChange(
											idx,
											'description',
											$event.target.value,
											'planets',
										)
									"
									placeholder="Description"
									rows="2"
									class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs focus:border-blue-500 outline-none resize-none"
								></textarea>

								<div class="grid grid-cols-2 gap-2">
									<input
										type="text"
										:value="planet.gravity"
										@input="
											handleNestedInputChange(
												idx,
												'gravity',
												$event.target.value,
												'planets',
											)
										"
										placeholder="Gravity (e.g. 1.0g)"
										class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-[10px] focus:border-blue-500 outline-none"
									/>
									<input
										type="text"
										:value="planet.population"
										@input="
											handleNestedInputChange(
												idx,
												'population',
												$event.target.value,
												'planets',
											)
										"
										placeholder="Population"
										class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-[10px] focus:border-blue-500 outline-none"
									/>
								</div>
							</div>
						</div>
					</div>

					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3
								class="text-[10px] tracking-widest font-mono text-amber-500 uppercase font-black"
							>
								ORBITAL INFRASTRUCTURE
							</h3>
							<button
								@click="addItem('bases')"
								class="text-[10px] font-mono bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
							>
								+ ADD BASE
							</button>
						</div>

						<div class="space-y-3">
							<div
								v-for="(base, idx) in system.bases"
								:key="idx"
								class="p-3 bg-slate-950/50 border border-slate-800 rounded-lg space-y-2 relative"
							>
								<button
									@click="removeItem(idx, 'bases')"
									class="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors"
								>
									<X class="w-3.5 h-3.5" />
								</button>
								<input
									type="text"
									:value="base.name"
									@input="
										handleNestedInputChange(
											idx,
											'name',
											$event.target.value,
											'bases',
										)
									"
									placeholder="Base Name"
									class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs focus:border-blue-500 outline-none"
								/>
								<input
									type="text"
									:value="base.type"
									@input="
										handleNestedInputChange(
											idx,
											'type',
											$event.target.value,
											'bases',
										)
									"
									placeholder="Base Type"
									class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs focus:border-blue-500 outline-none"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- VIEW MODE DISPLAY -->
				<div v-else class="space-y-6">
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

					<div
						v-else
						class="p-3 rounded-lg border border-slate-800 flex items-center gap-3 bg-slate-950/20"
					>
						<Shield class="w-5 h-5 shrink-0 text-slate-600" />
						<div>
							<div
								class="text-[9px] font-mono tracking-widest text-slate-500 uppercase"
							>
								POLITICAL STATUS
							</div>
							<div class="text-sm font-bold tracking-wide text-slate-400">
								INDEPENDENT / NEUTRAL
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
								<p class="text-xs text-slate-400 leading-normal mb-2">
									{{ planet.description }}
								</p>
								<div
									v-if="planet.gravity || planet.population"
									class="flex gap-3 border-t border-slate-800/50 pt-2"
								>
									<div v-if="planet.gravity">
										<span class="text-[9px] font-mono text-slate-500 block"
											>GRAVITY</span
										>
										<span class="text-[10px] font-bold text-slate-300">{{
											planet.gravity
										}}</span>
									</div>
									<div v-if="planet.population">
										<span class="text-[9px] font-mono text-slate-500 block"
											>POPULATION</span
										>
										<span class="text-[10px] font-bold text-slate-300">{{
											planet.population
										}}</span>
									</div>
								</div>
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
