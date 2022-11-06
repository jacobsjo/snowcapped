import { LayerGroup } from "leaflet";

import * as L from "leaflet"
import { last, range, takeWhile } from "lodash";
import { VisualizationManger } from "../UI/VisualizationManager";
import { Climate, DensityFunction, Holder, Identifier, lerp, NoiseGeneratorSettings, NoiseParameters, NoiseSettings, RandomState, WorldgenRegistries } from "deepslate";
import { BiomeBuilder, MultiNoiseIndexes } from "../BuilderData/BiomeBuilder";
import { Change, UI } from "../UI/UI";
import { timer } from "d3";

const WORKER_COUNT = 4


function lerpClimate(a: Climate.TargetPoint, b: Climate.TargetPoint, c: number) {
	return new Climate.TargetPoint(
		lerp(c, a.temperature, b.temperature),
		lerp(c, a.humidity, b.humidity),
		lerp(c, a.continentalness, b.continentalness),
		lerp(c, a.erosion, b.erosion),
		lerp(c, a.depth, b.depth),
		lerp(c, a.weirdness, b.weirdness)
	)
}

function lerp2Climate(a: Climate.TargetPoint, b: Climate.TargetPoint, c: Climate.TargetPoint, d: Climate.TargetPoint, e: number, f: number) {
	return lerpClimate(lerpClimate(a, b, e), lerpClimate(c, d, e), f)
}

export class BiomeLayer extends L.GridLayer {
	private next_worker_num = 0

	private Tiles: { [key: string]: { coords: L.Coords, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, done: L.DoneCallback, values?: Climate.TargetPoint[][] } } = {}
	private tileSize: number
	private resolution: number

	private workers: Worker[]
	private builder: BiomeBuilder

	private datapackLoader: Promise<void>
	noiseSettings: any;
	router: any;
	sampler: Climate.Sampler;
	lastY: string | number;

	constructor(private visualization_manager: VisualizationManger, options?: L.GridLayerOptions) {
		super(options)
	}

	initialize(options: any) {
		this.builder = UI.getInstance().builder

		this.tileSize = options.tileSize
		this.resolution = 1 / 4

		this.workers = []
		this.lastY = this.builder.vis_y_level

		for (var i = 0; i < WORKER_COUNT; i++) {
			const worker = new Worker("multinoiseworker.js")
			worker.onmessage = (ev) => {
				const tile = this.Tiles[ev.data.key]
				if (tile === undefined)
					return

				tile.values = ev.data.values

				this.renderTile(tile)

				//				tile.ctx.fillStyle = "green"
				//				tile.ctx.fillRect(0,0,this.tileSize * this.resolution, this.tileSize * this.resolution)



				tile.done()
				tile.done = () => {}
			}

			this.workers.push(worker)
		}


		this.datapackLoader = this.loadDatapack()

	}

	renderTile(tile: { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, done: L.DoneCallback, values?: Climate.TargetPoint[][] }) {
		tile.ctx.clearRect(0, 0, this.tileSize, this.tileSize)

		for (var x = 0; x < this.tileSize * this.resolution; x++) {
			for (var z = 0; z < this.tileSize * this.resolution; z++) {
				for (var iX = 0; iX < 1; iX += 2 * this.resolution) {
					for (var iZ = 0; iZ < 1; iZ += 2 * this.resolution) {
						//console.log(iX)
						const climate = lerp2Climate(tile.values[x][z], tile.values[x + 1][z], tile.values[x][z + 1], tile.values[x + 1][z + 1], iX, iZ)
						const idx = this.builder.getIndexes(climate)
						const biome = this.builder.lookupRecursive(idx)
						if (biome !== undefined) {
							tile.ctx.fillStyle = biome.color
							tile.ctx.fillRect((x + iX) / this.resolution, (z + iZ) / this.resolution, 2, 2)
						}
					}
				}
			}
		}
	}

	async loadDatapack() {
		for (const id of await this.builder.datapacks.getIds("worldgen/density_function")) {
			const dfJson = await this.builder.datapacks.get("worldgen/density_function", id)
			this.workers.forEach(w => w.postMessage({
				task: "addDensityFunction",
				json: dfJson,
				id: id.toString()
			}))

			const df = new DensityFunction.HolderHolder(Holder.parser(WorldgenRegistries.DENSITY_FUNCTION, DensityFunction.fromJson)(dfJson))
			WorldgenRegistries.DENSITY_FUNCTION.register(id, df)
		}

		for (const id of await this.builder.datapacks.getIds("worldgen/noise")) {
			const noiseJson = await this.builder.datapacks.get("worldgen/noise", id)
			this.workers.forEach(w => w.postMessage({
				task: "addNoise",
				json: noiseJson,
				id: id.toString()
			}))

			const noise = NoiseParameters.fromJson(noiseJson)
			WorldgenRegistries.NOISE.register(id, noise)
		}


		const noiseSettingsJson = await this.builder.datapacks.get("worldgen/noise_settings", Identifier.parse(this.builder.noiseSettingsName))
		this.workers.forEach(w => w.postMessage({
			task: "setNoiseGeneratorSettings",
			json: noiseSettingsJson,
			seed: this.builder.seed
		}))

		const noiseGeneratorSettings = NoiseGeneratorSettings.fromJson(noiseSettingsJson)
		this.noiseSettings = noiseGeneratorSettings.noise
		const randomState = new RandomState(noiseGeneratorSettings, this.builder.seed)
		this.router = randomState.router
		this.sampler = Climate.Sampler.fromRouter(this.router)
	}

	async refresh(change: Change){
		this.workers.forEach(w => w.postMessage({
			task: "setY",
			y: this.builder.vis_y_level
		}))

		for (const key in this.Tiles){
			if (change.noises || change.spline || this.lastY !== this.builder.vis_y_level){
				this.recalculateTile(key, this.Tiles[key].coords)
			} else if (change.biome || change.grids) {
				setTimeout(() => this.renderTile(this.Tiles[key]), 0)
			}
		}
		this.lastY = this.builder.vis_y_level
	}

	recalculateTile(key: string, coords: L.Coords){
		//@ts-ignore
		var tileBounds = this._tileCoordsToBounds(coords);
		var west = tileBounds.getWest(),
			east = tileBounds.getEast(),
			north = tileBounds.getNorth(),
			south = tileBounds.getSouth();

		// ...also create data array for CRS buffer...
		// Kinda inefficient, but doesn't look performance-critical
		var crs = this._map.options.crs,
			min = crs.project(L.latLng(north, west)).multiplyBy(0.25),
			max = crs.project(L.latLng(south, east)).multiplyBy(0.25);

		min.y *= -1
		max.y *= -1

		this.workers[this.next_worker_num].postMessage({
			task: "calculate",
			key,
			min,
			max,
			tileSize: this.tileSize * this.resolution
		})

		this.next_worker_num = (this.next_worker_num + 1) % WORKER_COUNT
	}

	createTile(coords: L.Coords, done: L.DoneCallback) {
		var tile = L.DomUtil.create("canvas", "leaflet-tile")
		tile.width = tile.height = this.tileSize

		tile.onselectstart = tile.onmousemove = L.Util.falseFn

		var ctx = tile.getContext("2d")

		if (!this._map) {
			return;
		}

		this.datapackLoader.then(() => {
			const key = this._tileCoordsToKey(coords)
			this.Tiles[key] = { coords: coords, canvas: tile, ctx: ctx, done: done }

			this.recalculateTile(key, coords)
		})

		return tile
	}

	_removeTile(key: string) {
		delete this.Tiles[key]

		// @ts-ignore
		L.TileLayer.prototype._removeTile.call(this, key)
	}

	// [TODO] refactor into util (and use in worker.ts)
	private getSurface(x: number, z: number): number{
		function invLerp(a: number, b: number, v: number){
			return (v-a) / (b-a)
		}

		const cellHeight = NoiseSettings.cellHeight(this.noiseSettings)    
		var lastDepth = -1
		for (let y = this.noiseSettings.minY + this.noiseSettings.height; y >= this.noiseSettings.minY; y -= cellHeight) {
		  const depth = this.router.depth.compute(DensityFunction.context(x, y, z))
		  if (depth >= 0) {
			return y + invLerp(lastDepth, depth, 0) * cellHeight
		  }
		  lastDepth = depth
		}
		return Number.MAX_SAFE_INTEGER
	  }	

	getIdxs(latlng: L.LatLng): {idx: MultiNoiseIndexes, values: Climate.TargetPoint, position: {x: number, y: number, z: number}} {

		const crs = this._map.options.crs
		const pos = crs.project(latlng)
		pos.y *= -1

		const y: number = this.builder.vis_y_level === "surface" ? this.getSurface(pos.x, pos.y) : this.builder.vis_y_level

		var climate = this.sampler.sample(pos.x * 0.25, y * 0.25, pos.y * 0.25)
		if (this.builder.vis_y_level === "surface") climate = new Climate.TargetPoint(climate.temperature, climate.humidity, climate.continentalness, climate.erosion, 0.0, climate.weirdness)
		const idx = this.builder.getIndexes(climate)
		return { idx: idx, values: climate, position: { x: pos.x, y: y, z: pos.y} }

	}
}