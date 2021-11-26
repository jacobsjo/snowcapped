/*
 * Based on Leaflet.TileLayer.GL:
 *
 * "THE BEER-WARE LICENSE":
 * <ivan@sanchezortega.es> wrote [that] file. As long as you retain this notice you
 * can do whatever you want with [that] stuff. If [you] meet some day, and you think
 * this stuff is worth it, you can buy [them] a beer in return.
 *
 */

import { NormalNoise, XoroshiroRandom } from "deepslate"
import * as L from "leaflet"
import { Biome } from "../BuilderData/Biome"
import { BiomeBuilder, NoiseType, PartialMultiNoiseIndexes } from "../BuilderData/BiomeBuilder"
import { Change, UI } from "../UI/UI"

const multinoiseShader = require('./Shader/multinoise.glsl')

var starting_delay = 1
var fail_counter = 5
function clientWaitAsync(gl: WebGL2RenderingContext, sync: WebGLSync, interval_ms: number) {
	return new Promise<void>((resolve, reject) => {
	  var is_first = true
	  function test() {
		const res = gl.clientWaitSync(sync, 0, 0);
		if (res == gl.WAIT_FAILED) {
			fail_counter--;
			if (fail_counter === 0){
				reject("Wait failed");
			} else {
				starting_delay += interval_ms
				setTimeout(test, interval_ms);
			}
			return;
		}
		if (res == gl.TIMEOUT_EXPIRED) {
			fail_counter = 5
			is_first = false
			starting_delay += interval_ms
			setTimeout(test, interval_ms);
			return;
		}
		fail_counter = 5
		if (is_first){
			starting_delay = Math.max(Math.floor(starting_delay * 0.8), 1);
		}
		resolve();
	  }
	  setTimeout(test, starting_delay);
	});
  }

export class BiomeLayerGL extends L.GridLayer{

    private renderer: HTMLCanvasElement
    private glError: string | undefined
    private gl: WebGL2RenderingContext
	private parameterArray: Float32Array
	private parameterTexture: WebGLTexture
	private biomeArray: Uint8Array
	private biomeTextureSize: number
    private biomeTexture: WebGLTexture
    private glProgram: WebGLProgram
    private CRSBuffer: WebGLBuffer
    private Tile2dContexts: {[key: string]: CanvasRenderingContext2D} = {}
    private tileSize: number
    private builder: BiomeBuilder

	private renderingQueue: {
		key: string,
		callback: () => void
	}[] = []
	private isRendering: boolean = false

    constructor(){
        super()

    }



	// On instantiating the layer, it will initialize all the GL context
	//   and upload the shaders to the GPU, along with the vertex buffer
	//   (the vertices will stay the same for all tiles).
	initialize(options: any) {
        if (options === undefined)
            options = {}

        this.builder = UI.getInstance().builder

        options.noWrap = true
		options = L.setOptions(this, options);


		this.renderer = L.DomUtil.create("canvas");
		this.renderer.width = this.renderer.height = options.tileSize;

        this.tileSize = options.tileSize;

		this.gl = this.renderer.getContext("webgl2", {
				premultipliedAlpha: false,
			});
		this.gl.viewport(0,0, options.tileSize, options.tileSize);


		this.loadGLProgram();

		// Init textures
        this.parameterTexture = this.gl.createTexture();
        this.gl.uniform1i(this.gl.getUniformLocation(this.glProgram, "parameterTexture"), 0);

        this.biomeTexture = this.gl.createTexture();
        this.gl.uniform1i(this.gl.getUniformLocation(this.glProgram, "biomeTexture"), 1);

		//this.bindParametersTexture()
		//this.bindBiomeTexture()
	}

	// @method getGlError(): String|undefined
	// If there was any error compiling/linking the shaders, returns a string
	// with information about that error. If there was no error, returns `undefined`.
	getGlError(): String | undefined {
		return this.glError;
	}

	private loadGLProgram(): void {
		// Just copy all attributes to predefined variants and set the vertex positions
		var vertexShaderCode =
			"#version 300 es\n" +
			"in vec2 aVertexCoords;  " +
			"in vec2 aCRSCoords;  " +
			"out vec2 vCRSCoords;  " +
			"void main(void) {  " +
			"	gl_Position = vec4(aVertexCoords , 1.0, 1.0);  " +
			"	vCRSCoords = aCRSCoords;  " +
			"}";

		var fragmentShaderHeader =
			"#version 300 es\n" +
			"precision highp float;\n" +
			"in vec2 vCRSCoords;\n"

		this.glProgram = this.gl.createProgram();
		var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
		var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
		this.gl.shaderSource(vertexShader, vertexShaderCode);
		this.gl.shaderSource(fragmentShader, fragmentShaderHeader + multinoiseShader);
		this.gl.compileShader(vertexShader);
		this.gl.compileShader(fragmentShader);

		// @event shaderError
		// Fired when there was an error creating the shaders.
		if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
			this.glError = this.gl.getShaderInfoLog(vertexShader);
			console.error(this.glError);
			return null;
		}
		if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
			this.glError = this.gl.getShaderInfoLog(fragmentShader);
			console.error(this.glError);
			return null;
		}

		this.gl.attachShader(this.glProgram, vertexShader);
		this.gl.attachShader(this.glProgram, fragmentShader);
		this.gl.linkProgram(this.glProgram);
		this.gl.useProgram(this.glProgram);

		// aCRSCoords (both geographical and per-tile).
		const aCRSPosition = this.gl.getAttribLocation(this.glProgram, "aCRSCoords");
        const aVertexPosition = this.gl.getAttribLocation(this.glProgram, "aVertexCoords");


		// Create three data buffer with 8 elements each - the (easting,northing)
		// CRS coords, the (s,t) texture coords and the viewport coords for each
		// of the 4 vertices
		// Data for the texel and viewport coords is totally static, and
		// needs to be declared only once.
		this.CRSBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.CRSBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(8), this.gl.STATIC_DRAW);
		if (aCRSPosition !== -1) {
			this.gl.enableVertexAttribArray(aCRSPosition);
			this.gl.vertexAttribPointer(aCRSPosition, 2, this.gl.FLOAT, false, 8, 0);
		}


		const vertexCoordsBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexCoordsBuffer);

		// prettier-ignore
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
			 1,  1,
			-1,  1,
			 1, -1,
			-1, -1
		]), this.gl.STATIC_DRAW);
		if (aVertexPosition !== -1) {
			this.gl.enableVertexAttribArray(aVertexPosition);
			this.gl.vertexAttribPointer(aVertexPosition, 2, this.gl.FLOAT, false, 8, 0);
		}

	}

	// This is called once per tile - uses the layer's GL context to
	//   render a tile, passing the complex space coordinates to the
	//   GPU, and asking to render the vertexes (as triangles) again.
	// Every pixel will be opaque, so there is no need to clear the scene.
	render(coords: L.Coords) {
		this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
		this.gl.clearColor(0.5, 0.5, 0.5, 0);
		this.gl.enable(this.gl.BLEND);

        //@ts-ignore
		var tileBounds = this._tileCoordsToBounds(coords);
		var west = tileBounds.getWest(),
			east = tileBounds.getEast(),
			north = tileBounds.getNorth(),
			south = tileBounds.getSouth();

            // ...also create data array for CRS buffer...
		// Kinda inefficient, but doesn't look performance-critical
		var crs = this._map.options.crs,
			min = crs.project(L.latLng(south, west)),
			max = crs.project(L.latLng(north, east));

		// prettier-ignore
		var crsData = [
			// Vertex 0
			max.x, max.y,

			// Vertex 1
			min.x, max.y,

			// Vertex 2
			max.x, min.y,

			// Vertex 3
			min.x, min.y,
		];

		// ...and also upload that to the GPU...
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.CRSBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(crsData), this.gl.STATIC_DRAW);

		// ... and then the magic happens.
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
	}

	bindParametersTexture(change: Change){

		if (this.parameterArray === undefined){
			const biomeArrayLenght = this.builder.depths.length * this.builder.humidities.length * this.builder.temperatures.length * this.builder.weirdnesses.length * this.builder.erosions.length * this.builder.continentalnesses.length
			this.biomeTextureSize = Math.ceil(Math.sqrt(biomeArrayLenght))
			this.parameterArray = new Float32Array(256 * 256);
		}

		this.fillParameterArray(change)

		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.parameterTexture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.R32F, 256, 256, 0, this.gl.RED, this.gl.FLOAT, this.parameterArray);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    }

    fillParameterArray(change: Change){

		const OCTAVE_COUNT = 20
		const MAX_PARAMETER_CELLS_BORDERS = 20
		const NOISE_STORAGE_LENGTH = (MAX_PARAMETER_CELLS_BORDERS + OCTAVE_COUNT * 259 * 2 + 2 + OCTAVE_COUNT);

		const noises: NoiseType[] = ["weirdness", "continentalness", "erosion", "temperature", "humidity", "shift"];

		if (change.noises){
			const random = XoroshiroRandom.create(this.builder.seed)

			const noiseRandomForked = random.fork()

			const normalnoises = {
				temperature: new NormalNoise(noiseRandomForked.forkWithHashOf("minecraft:temperature"), this.builder.noiseSettings.temperature),
				humidity: new NormalNoise(noiseRandomForked.forkWithHashOf("minecraft:vegetation"),  this.builder.noiseSettings.humidity),
				continentalness: new NormalNoise(noiseRandomForked.forkWithHashOf("minecraft:continentalness"),  this.builder.noiseSettings.continentalness),
				erosion: new NormalNoise(noiseRandomForked.forkWithHashOf("minecraft:erosion"),  this.builder.noiseSettings.erosion),
				weirdness: new NormalNoise(noiseRandomForked.forkWithHashOf("minecraft:ridge"),  this.builder.noiseSettings.weirdness),
				shift: new NormalNoise(noiseRandomForked.forkWithHashOf("minecraft:offset"),  this.builder.noiseSettings.shift)		
			}

			for (var noise_idx = 0 ; noise_idx < noises.length ; noise_idx ++){
				const noise = noises[noise_idx]

				const noiseSetting = this.builder.noiseSettings[noise]
				this.parameterArray[noise_idx * NOISE_STORAGE_LENGTH] = noiseSetting.firstOctave

				let min = +Infinity
				let max = -Infinity
				for (let i = 0; i < noiseSetting.amplitudes.length; i += 1) {
					if (noiseSetting.amplitudes[i] !== 0) {
						min = Math.min(min, i)
						max = Math.max(max, i)
					}
				}
		
				const expectedDeviation = 0.1 * (1 + 1 / (max - min + 1))
				const valueFactor = (1/6) / expectedDeviation
				const lowestFreqValueFactor = Math.pow(2, (noiseSetting.amplitudes.length - 1)) / (Math.pow(2, noiseSetting.amplitudes.length) - 1)
				this.parameterArray[noise_idx * NOISE_STORAGE_LENGTH + 1] = valueFactor * lowestFreqValueFactor

				for (let i = 0 ; i<20 ; i++){
					this.parameterArray[noise_idx * NOISE_STORAGE_LENGTH + 2 + i] = noiseSetting.amplitudes.length > i ? noiseSetting.amplitudes[i] : 0
				}



				for (var normal_noise_index = 0 ; normal_noise_index <= 1 ; normal_noise_index++){
					const noise_levels = normalnoises[noise][normal_noise_index === 0 ? "first" : "second"].noiseLevels
					for (let octave_index = 0 ; octave_index<20 ; octave_index++){
						const start_pos =  noise_idx * NOISE_STORAGE_LENGTH + 2 + OCTAVE_COUNT + MAX_PARAMETER_CELLS_BORDERS + normal_noise_index * (OCTAVE_COUNT * 259) + 259 * octave_index
						if (octave_index < noise_levels.length && noise_levels[octave_index] !== undefined){
							
							const noise_level = noise_levels[octave_index]

							this.parameterArray[start_pos] = noise_level.xo
							this.parameterArray[start_pos+1] = noise_level.yo
							this.parameterArray[start_pos+2] = noise_level.zo

							for (let i = 0 ; i< 256 ; i++){
								this.parameterArray[start_pos+3+i] = noise_level.p[i]
							}                
						} else {
							for (let i = 0 ; i< 259 ; i++){
								this.parameterArray.fill(0, start_pos, start_pos+258)
							}                
						}
					}
				}
			}
		}

		if (change.grids){
			const noiseCells = {
				"weirdness": this.builder.weirdnesses,
				"continentalness": this.builder.continentalnesses,
				"erosion": this.builder.erosions,
				"temperature": this.builder.temperatures,
				"humidity": this.builder.humidities,
				"shift": this.builder.depths
			}


			for (var noise_idx = 0 ; noise_idx < noises.length ; noise_idx ++){
				const noise = noises[noise_idx]

				for (let i = 0 ; i<20 ; i++){
					if (i < noiseCells[noise].length - 1){
						this.parameterArray[noise_idx * NOISE_STORAGE_LENGTH + 2 + OCTAVE_COUNT + i] = noiseCells[noise][i].max
					} else {
						this.parameterArray[noise_idx * NOISE_STORAGE_LENGTH + 2 + OCTAVE_COUNT + i] = -200
					}
				}
			}
		}
    }

	bindBiomeTexture(change: Change){
		// Helper function. Binds a ImageData (HTMLImageElement, HTMLCanvasElement or
		// ImageBitmap) to a texture, given its index (0 to 7).
		// The image data is assumed to be in RGBA format.

		if (change.grids || this.biomeArray === undefined){
			const biomeArrayLenght = this.builder.depths.length * this.builder.humidities.length * this.builder.temperatures.length * this.builder.weirdnesses.length * this.builder.erosions.length * this.builder.continentalnesses.length
			this.biomeTextureSize = Math.ceil(Math.sqrt(biomeArrayLenght))
			this.biomeArray = new Uint8Array(this.biomeTextureSize * this.biomeTextureSize * 4);
		}

		this.fillBiomeArray(change.biome) // TODO limit based on change.biomes

		this.gl.activeTexture(this.gl.TEXTURE1);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.biomeTexture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.biomeTextureSize, this.biomeTextureSize, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.biomeArray);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    }

	fillBiomeArray(limit: PartialMultiNoiseIndexes){
		for (let d_idx = (limit.d ?? 0); d_idx <= (limit.d ?? this.builder.depths.length - 1); d_idx++) {
			for (let h_idx = (limit.h ?? 0); h_idx <= (limit.h ?? this.builder.humidities.length - 1); h_idx++) {
				for (let t_idx = (limit.t ?? 0); t_idx <= (limit.t ?? this.builder.temperatures.length - 1); t_idx++) {
					for (let w_idx = (limit.w ?? 0); w_idx <= (limit.w ?? this.builder.weirdnesses.length - 1); w_idx++) {
        	            for (let e_idx = (limit.e ?? 0); e_idx <= (limit.e ?? this.builder.erosions.length - 1); e_idx++) {
		    	            for (let c_idx = (limit.c ?? 0); c_idx <= (limit.c ?? this.builder.continentalnesses.length - 1); c_idx++) {
								const biome = this.builder.dimension.lookupRecursive({
                                    d: d_idx,
                                    w: w_idx,
                                    c: c_idx,
                                    e: e_idx,
                                    h: h_idx,
                                    t: t_idx
                                }, "Any")

								const index = 4 * (d_idx * this.builder.humidities.length * this.builder.temperatures.length * this.builder.weirdnesses.length * this.builder.erosions.length * this.builder.continentalnesses.length +
										h_idx * this.builder.temperatures.length * this.builder.weirdnesses.length * this.builder.erosions.length * this.builder.continentalnesses.length +
										t_idx * this.builder.weirdnesses.length * this.builder.erosions.length * this.builder.continentalnesses.length + 
										w_idx * this.builder.erosions.length * this.builder.continentalnesses.length +
										e_idx * this.builder.continentalnesses.length +
										c_idx)

								if (biome !== undefined && biome instanceof Biome){
									const rgb = biome.raw_color
									this.biomeArray[index] = rgb.r
									this.biomeArray[index+1] = rgb.g
									this.biomeArray[index+2] = rgb.b,
									this.biomeArray[index+3] = 255
								} else {
									this.biomeArray[index] = 0
									this.biomeArray[index+1] = 0
									this.biomeArray[index+2] = 0
									this.biomeArray[index+3] = 0
								}
							}
						}
					}
				}
			}
		}
	}



	createTile(coords: L.Coords, done: L.DoneCallback) {
		var tile = L.DomUtil.create("canvas", "leaflet-tile");
		tile.width = tile.height = this.tileSize;

		tile.onselectstart = tile.onmousemove = L.Util.falseFn;

		var ctx = tile.getContext("2d");
		
        if (!this._map) {
            return;
        }

		const key = this._tileCoordsToKey(coords)
		this.Tile2dContexts[key] = ctx;
		this.addRenderingTask(key, () => {
			done()
		});


		return tile;
	}

	_removeTile(key: string) {
        delete this.Tile2dContexts[key];

        // @ts-ignore
        L.TileLayer.prototype._removeTile.call(this, key);
	}


	// Runs the shader (again) on all tiles
	reRender(change: Change) {
		if (change.noises || change.grids){
			this.bindParametersTexture(change)
		}
		
		if (change.biome !== undefined){
			this.bindBiomeTexture(change)
		}

		for (var key in this._tiles) {
			this.addRenderingTask(key, () => {});
		}
	}

	addRenderingTask(key: string, callback: () => void){
		if (this.renderingQueue.findIndex(t => t.key === key) >= 0){
			return
		}

		this.renderingQueue.push({key: key, callback: callback})
		if (!this.isRendering) {
			this.isRendering = true
			this.doNextRenderingTask()
		}
	}

	doNextRenderingTask(){
		var task: {key: string, callback: () => void}
		do {
			if (this.renderingQueue.length === 0){
				this.isRendering = false
				return
			}
			task = this.renderingQueue.shift()
		} while (this.Tile2dContexts[task.key] === undefined)

		//@ts-ignore
		const coords = this._keyToTileCoords(task.key);
		this.render(coords)
		const sync = this.gl.fenceSync(this.gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
		this.gl.flush()

		clientWaitAsync(this.gl, sync, 2).then(() => {
			if (this.Tile2dContexts[task.key] !== undefined){
				this.Tile2dContexts[task.key].clearRect(0, 0, this.tileSize, this.tileSize);
				this.Tile2dContexts[task.key].drawImage(this.renderer, 0, 0);
				task.callback()
			}
		}).catch((e) =>
			console.error(e)
		).finally(() => {
			this.doNextRenderingTask()
		})
	}

};