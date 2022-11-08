import { LayerGroup } from "leaflet";

import * as L from "leaflet"
import { last, range, takeWhile } from "lodash";
import { VisualizationManger } from "../UI/VisualizationManager";
import { Climate, DensityFunction, Holder, Identifier, lerp, NoiseGeneratorSettings, NoiseParameters, NoiseSettings, RandomState, WorldgenRegistries } from "deepslate";
import { BiomeBuilder, MultiNoiseIndexes } from "../BuilderData/BiomeBuilder";
import { Change, UI } from "../UI/UI";
import { timer } from "d3";
import { lerp2Climate } from "../util";
import { Datapack } from "mc-datapack-loader";

const WORKER_COUNT = 4

const zenith = 20.0 * Math.PI / 180.0;
const azimuth = 135.0 * Math.PI / 180.0;

type Tile = { coords: L.Coords, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, done: L.DoneCallback, array?: {climate: Climate.TargetPoint, surface: number}[][], step?: number, isRendering?: boolean } 
export class BiomeLayer extends L.GridLayer {
	private next_worker_id = 0

	private Tiles: { [key: string]: Tile} = {}
	private tileSize: number
	private tileResolution: number
	private calcResolution: number

	private workers: Worker[]
	private builder: BiomeBuilder

	private datapackLoader: Promise<void>
	noiseSettings: any;
	router: any;
	sampler: Climate.Sampler;
	lastY: string | number;

	private depth_scale: number = 0;

	constructor(private visualization_manager: VisualizationManger, options?: L.GridLayerOptions) {
		super(options)
	}

	initialize(options: any) {
		this.builder = UI.getInstance().builder

		this.tileSize = options.tileSize
		this.tileResolution = 1 / 2
		this.calcResolution = 1 / 4

		this.lastY = this.builder.vis_y_level

		this.createWorkers()

		this.datapackLoader = this.loadDatapack(this.builder.datapacks)

	}

	private createWorkers(){
		this.workers = []
		for (var i = 0; i < WORKER_COUNT; i++) {
			const worker = new Worker("multinoiseworker.js")
			const worker_id = i
			worker.onmessage = (ev) => {
				const tile = this.Tiles[ev.data.key]
				if (tile === undefined)
					return

				tile.array = ev.data.array
				tile.step = ev.data.step

				tile.isRendering = true
				this.renderTile(tile)

				//				tile.ctx.fillStyle = "green"
				//				tile.ctx.fillRect(0,0,this.tileSize * this.resolution, this.tileSize * this.resolution)



				tile.done()
				tile.done = () => {}
			}

			this.workers.push(worker)
		}
	}

	private calculateHillshade(slope_x: number, slope_z: number, scale: number): number {
		var slope = Math.atan(Math.sqrt(slope_x * slope_x + slope_z * slope_z) / ( 8 * scale));
		var aspect;
		if (slope_x == 0.0){
		  if (slope_z < 0.0){
			aspect = Math.PI;
		  } else {
			aspect = 0.0;
		  }
		} else {
		  aspect = Math.atan2(slope_z, -slope_x);
		}
	
		var hillshade = ((Math.cos(zenith) * Math.cos(slope)) + (Math.sin(zenith) * Math.sin(slope) * Math.cos(azimuth - aspect)));
		if (hillshade < 0.0)
		  hillshade = 0.0;
	
		hillshade = hillshade * 0.7 + 0.3;
		return hillshade
	  }
	

	renderTile(tile: Tile) {
		tile.isRendering = false
		tile.ctx.clearRect(0, 0, this.tileSize, this.tileSize)

		for (var x = 0; x < this.tileSize * this.calcResolution; x++) {
			for (var z = 0; z < this.tileSize * this.calcResolution; z++) {
				
				var hillshade = 1.0
				if (this.visualization_manager.enable_hillshading && (this.builder.vis_y_level === "surface" || tile.array[x+1][z+1].surface < this.builder.vis_y_level)){
					
					hillshade = this.calculateHillshade(
						tile.array[x+2][z+1].surface - tile.array[x][z+1].surface,
						tile.array[x+1][z+2].surface - tile.array[x+1][z].surface,
						tile.step
					)
				}				
				
				var depth_offset = 0
				if (this.builder.input_is_2d && this.builder.vis_y_level !== "surface"){
					depth_offset = (this.builder.vis_y_level - tile.array[x + 1][z + 1].surface) * this.depth_scale
				}


				for (var iX = 0; iX < 1; iX += this.calcResolution / this.tileResolution) {
					for (var iZ = 0; iZ < 1; iZ += this.calcResolution / this.tileResolution) {
						//console.log(iX)
						var climate = lerp2Climate(tile.array[x + 1][z + 1].climate, tile.array[x + 2][z + 1].climate, tile.array[x + 1][z + 2].climate, tile.array[x + 2][z + 2].climate, iX, iZ)

						climate = new Climate.TargetPoint(climate.temperature, climate.humidity
							, climate.continentalness, climate.erosion, climate.depth + depth_offset, climate.weirdness)
	

						const idx = this.builder.getIndexes(climate)
						const biome = this.builder.lookupRecursive(idx)
						if (biome !== undefined) {
							tile.ctx.fillStyle = `rgb(${biome.raw_color.r * hillshade}, ${biome.raw_color.g * hillshade}, ${biome.raw_color.b * hillshade})`
						} else {
							tile.ctx.fillStyle = `rgba(0, 0, 0, ${1-hillshade})`
						}
						tile.ctx.fillRect((x + iX) / this.calcResolution, (z + iZ) / this.calcResolution, this.tileResolution / this.calcResolution, this.tileResolution / this.calcResolution)

					}
				}

				

			}
		}
	}

	async loadDatapack(datapack: Datapack) {
		for (const id of await datapack.getIds("worldgen/density_function")) {
			const dfJson = await datapack.get("worldgen/density_function", id)
			this.workers.forEach(w => w.postMessage({
				task: "addDensityFunction",
				json: dfJson,
				id: id.toString()
			}))

			const df = new DensityFunction.HolderHolder(Holder.parser(WorldgenRegistries.DENSITY_FUNCTION, DensityFunction.fromJson)(dfJson))
			WorldgenRegistries.DENSITY_FUNCTION.register(id, df)
		}

		for (const id of await datapack.getIds("worldgen/noise")) {
			const noiseJson = await datapack.get("worldgen/noise", id)
			this.workers.forEach(w => w.postMessage({
				task: "addNoise",
				json: noiseJson,
				id: id.toString()
			}))

			const noise = NoiseParameters.fromJson(noiseJson)
			WorldgenRegistries.NOISE.register(id, noise)
		}


		const noiseSettingsJson = await datapack.get("worldgen/noise_settings", Identifier.parse(this.builder.noiseSettingsName))
		if (noiseSettingsJson !== undefined){
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

			this.depth_scale = (this.sampler.sample(0, 64, 0).depth - this.sampler.sample(0, 0, 0).depth) / 256  // don't know why 256 and not 64...
		}

	}

	async refresh(change: Change){
		if (change.noises || change.spline){
			return
		}
		
		if (change.map_display || (change.map_y_level && !this.builder.input_is_2d)){
			console.log("canceling")
			this.workers.forEach(w => w.terminate())
			this.createWorkers()

			this.datapackLoader = this.loadDatapack(this.builder.datapacks)
			await this.datapackLoader

			this.workers.forEach(w => w.postMessage({
				task: "setY",
				y: this.builder.input_is_2d ? "surface" : this.builder.vis_y_level
			}))

			this.redraw()

			this.lastY = this.builder.vis_y_level
		} else {
			for (const key in this.Tiles){
				if (!this.Tiles[key].isRendering){
					this.Tiles[key].isRendering = true
					setTimeout(() => this.renderTile(this.Tiles[key]), 0)
				}
			}
		}
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

		const message = {
			task: "calculate",
			key,
			min,
			max,
			tileSize: this.tileSize * this.calcResolution
		}

		this.workers[this.next_worker_id].postMessage(message)
		this.next_worker_id = (this.next_worker_id + 1) % WORKER_COUNT
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