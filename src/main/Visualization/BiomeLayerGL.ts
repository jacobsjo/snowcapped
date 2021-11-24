/*
 * Based on Leaflet.TileLayer.GL:
 *
 * "THE BEER-WARE LICENSE":
 * <ivan@sanchezortega.es> wrote [that] file. As long as you retain this notice you
 * can do whatever you want with [that] stuff. If [you] meet some day, and you think
 * this stuff is worth it, you can buy [them] a beer in return.
 *
 */

import { NoiseSampler, NormalNoise, XoroshiroRandom } from "deepslate"
import * as L from "leaflet"
import { random } from "lodash"
import { Biome } from "../BuilderData/Biome"
import { BiomeBuilder, NoiseType } from "../BuilderData/BiomeBuilder"
import { GridElementUnassigned } from "../BuilderData/GridElementUnassigned"
import { UI } from "../UI/UI"

const multinoiseShader = require('./Shader/multinoise.glsl')

export class BiomeLayerGL extends L.GridLayer{

    private renderer: HTMLCanvasElement
    private glError: string | undefined
    private gl: WebGL2RenderingContext
    private parameterTexture: WebGLTexture
    private biomeTexture: WebGLTexture
    private glProgram: WebGLProgram
    private unwrappedKey: string
    private CRSBuffer: WebGLBuffer
    private Tile2dContexts: {[key: string]: CanvasRenderingContext2D} = {}
    private tileSize: number
    private builder: BiomeBuilder

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

		this.bindParametersTexture()
		this.bindBiomeTexture()

		console.log("MAX_UNIFORM_BLOCK_SIZE: " + this.gl.getParameter(this.gl.MAX_UNIFORM_BLOCK_SIZE))

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

	bindParametersTexture(){
		// Helper function. Binds a ImageData (HTMLImageElement, HTMLCanvasElement or
		// ImageBitmap) to a texture, given its index (0 to 7).
		// The image data is assumed to be in RGBA format.

		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.parameterTexture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.R32F, 256, 256, 0, this.gl.RED, this.gl.FLOAT, new Float32Array(this.getParameterArray(XoroshiroRandom.create(this.builder.seed))));
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    }

    getParameterArray(random: XoroshiroRandom){

		const noises: NoiseType[] = ["weirdness", "continentalness", "erosion", "temperature", "humidity", "shift"];
		const firstsecond: ("first" | "second")[] = ["first", "second"]
		const noiseRandomForked = random.fork()

		const normalnoises = {
			temperature: new NormalNoise(noiseRandomForked.forkWithHashOf("minecraft:temperature"), this.builder.noiseSettings.temperature),
			humidity: new NormalNoise(noiseRandomForked.forkWithHashOf("minecraft:vegetation"),  this.builder.noiseSettings.humidity),
			continentalness: new NormalNoise(noiseRandomForked.forkWithHashOf("minecraft:continentalness"),  this.builder.noiseSettings.continentalness),
			erosion: new NormalNoise(noiseRandomForked.forkWithHashOf("minecraft:erosion"),  this.builder.noiseSettings.erosion),
			weirdness: new NormalNoise(noiseRandomForked.forkWithHashOf("minecraft:ridge"),  this.builder.noiseSettings.weirdness),
			shift: new NormalNoise(noiseRandomForked.forkWithHashOf("minecraft:offset"),  this.builder.noiseSettings.shift)		
		}

		const noiseCells = {
			"weirdness": this.builder.weirdnesses,
			"continentalness": this.builder.continentalnesses,
			"erosion": this.builder.erosions,
			"temperature": this.builder.temperatures,
			"humidity": this.builder.humidities,
			"shift": this.builder.depths
		}

        const parameterArray = []
        for (const noise of noises){

			const noiseSetting = this.builder.noiseSettings[noise]
            parameterArray.push(noiseSetting.firstOctave)

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
			parameterArray.push(valueFactor * lowestFreqValueFactor)

			for (let i = 0 ; i<20 ; i++){
                parameterArray.push(noiseSetting.amplitudes.length > i ? noiseSetting.amplitudes[i] : 0)
            }

			for (let i = 0 ; i<20 ; i++){
				if (i < noiseCells[noise].length - 1){
	                parameterArray.push(noiseCells[noise][i].max)
				} else {
	                parameterArray.push(-200)
				}
            }
			
			var normal_noise_index: "first" | "second"
            for (normal_noise_index of firstsecond){
				for (let i = 0 ; i<20 ; i++){
					if (i < normalnoises[noise][normal_noise_index].noiseLevels.length && normalnoises[noise][normal_noise_index].noiseLevels[i] !== undefined){
						parameterArray.push(normalnoises[noise][normal_noise_index].noiseLevels[i].xo)
						parameterArray.push(normalnoises[noise][normal_noise_index].noiseLevels[i].yo)
						parameterArray.push(normalnoises[noise][normal_noise_index].noiseLevels[i].zo)

						const p = normalnoises[noise][normal_noise_index].noiseLevels[i].p
						for (let i = 0 ; i< 256 ; i++){
							parameterArray.push(p[i])
						}                
					} else {
						for (let i = 0 ; i< 259 ; i++){
							parameterArray.push(0)
						}                
					}
				}
            }
        }

        while (parameterArray.length < 256 * 256){
            parameterArray.push(1.0)
        }

		return parameterArray
    }

	bindBiomeTexture(){
		// Helper function. Binds a ImageData (HTMLImageElement, HTMLCanvasElement or
		// ImageBitmap) to a texture, given its index (0 to 7).
		// The image data is assumed to be in RGBA format.

		this.gl.activeTexture(this.gl.TEXTURE1);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.biomeTexture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 512, 512, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array(this.getBiomeArray()));
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    }

	getBiomeArray(){
		const biomeArray = []

		for (let d_idx = 0; d_idx < this.builder.depths.length; d_idx++) {
			for (let h_idx = 0; h_idx < this.builder.humidities.length; h_idx++) {
				for (let t_idx = 0; t_idx < this.builder.temperatures.length; t_idx++) {
					for (let w_idx = 0; w_idx < this.builder.weirdnesses.length; w_idx++) {
        	            for (let e_idx = 0; e_idx < this.builder.erosions.length; e_idx++) {
		    	            for (let c_idx = 0; c_idx < this.builder.continentalnesses.length; c_idx++) {
								const biome = this.builder.dimension.lookupRecursive({
                                    d: d_idx,
                                    w: w_idx,
                                    c: c_idx,
                                    e: e_idx,
                                    h: h_idx,
                                    t: t_idx
                                }, "Any")

								if (biome !== undefined && biome instanceof Biome){
									const rgb = this._hexToRgb(biome.color)
									biomeArray.push(rgb.r, rgb.g, rgb.b, 255)
								} else {
									biomeArray.push(0, 0, 0, 0)
								}

							}
						}
					}
				}
			}
		}

		while (biomeArray.length < 512 * 512 * 4){
            biomeArray.push(255)
        }


		return biomeArray
	}

	private _hexToRgb(hex: string) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
		  r: parseInt(result[1], 16),
		  g: parseInt(result[2], 16),
		  b: parseInt(result[3], 16)
		} : null;
	  }


    _addTile(coords: L.Coords, container: any) {
		// This is quite an ugly hack, but WTF.
		this.unwrappedKey = this._tileCoordsToKey(coords);

        // @ts-ignore
		L.GridLayer.prototype._addTile.call(this, coords, container);
	}

	createTile(coords: L.Coords, done: L.DoneCallback) {
		var tile = L.DomUtil.create("canvas", "leaflet-tile");
		tile.width = tile.height = this.tileSize;

		tile.onselectstart = tile.onmousemove = L.Util.falseFn;

		var ctx = tile.getContext("2d");
		
        if (!this._map) {
            return;
        }

        Promise.all([]).then(
            function() {
                this.render(coords)
                ctx.drawImage(this.renderer, 0, 0)

                this.Tile2dContexts[this.unwrappedKey] = ctx;

                done();
            }.bind(this))

		return tile;
	}

	_removeTile(key: string) {
        delete this.Tile2dContexts[key];

        // @ts-ignore
        L.TileLayer.prototype._removeTile.call(this, key);
	}


	// Runs the shader (again) on all tiles
	reRender() {
		for (var key in this._tiles) {
            //@ts-ignore
			var coords = this._keyToTileCoords(key);
			this.render(coords);
			this.Tile2dContexts[key].drawImage(this.renderer, 0, 0);
		}
	}

};