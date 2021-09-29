import * as L from "leaflet";
import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder, MultiNoiseIndexes, MultiNoiseParameters } from "../BuilderData/BiomeBuilder";
import { GridMultiNoise } from "./GridMultiNoise";



export class GridMultiNoiseIndicesManager {
    private promises_cache: Map<string, Promise<{idx: MultiNoiseIndexes[][], values: MultiNoiseParameters[][]}>>
    private noisevalues_cache: { key: string, values: MultiNoiseParameters[][] }[]
    private indices_cache: { key: string, values: MultiNoiseIndexes[][] }[]
    readonly resolution = 6
    private size: L.Point
    private midPoint: L.Point
    private multiNoise: GridMultiNoise
    private builder: BiomeBuilder

    constructor(builder: BiomeBuilder, multiNoise: GridMultiNoise) {
        this.indices_cache = []
        this.noisevalues_cache = []
        this.promises_cache = new Map<string, Promise<{idx: MultiNoiseIndexes[][], values: MultiNoiseParameters[][]}>>()
        this.size = new L.Point(512, 512, false)
        this.midPoint = new L.Point(Math.pow(2, 21), Math.pow(2, 21), false)
        this.builder = builder
        this.multiNoise = multiNoise
    }

    get(coords: L.Coords): Promise<{idx: MultiNoiseIndexes[][], values: MultiNoiseParameters[][]}> | {idx: MultiNoiseIndexes[][], values: MultiNoiseParameters[][]} {
        const nwpoint = coords.scaleBy(this.size).divideBy(Math.pow(2, coords.z - 13)).subtract(this.midPoint)

        const idx = this.indices_cache.findIndex(c => c.key === this._tileCoordsToKey(coords))
        const nv_idx = this.noisevalues_cache.findIndex(c => c.key === this._tileCoordsToKey(coords))

        if (idx === -1) {
            if (nv_idx === -1) {
                if (this.promises_cache.has(this._tileCoordsToKey(coords))){
                    return this.promises_cache.get(this._tileCoordsToKey(coords))
                }
                
                const promise = this.multiNoise.getNoiseValueArray(nwpoint.x, nwpoint.y, this.size.x / this.resolution, this.size.x / Math.pow(2, coords.z - 5) * this.resolution).then(nv => {
                    this.noisevalues_cache.push({ key: this._tileCoordsToKey(coords), values: nv })
                    if (this.noisevalues_cache.length > 40)
                        this.noisevalues_cache.shift()
                    
                    const indices = nv.map(row => row.map(params => this.builder.getIndexes(params)))
                    this.indices_cache.push({ key: this._tileCoordsToKey(coords), values: indices })
                    if (this.indices_cache.length > 40)
                        this.indices_cache.shift()

                    console.log("Indices Cache lenght: " + this.indices_cache.length)

                    this.promises_cache.delete(this._tileCoordsToKey(coords))
                    return {idx: indices, values: nv}
                })
                this.promises_cache.set(this._tileCoordsToKey(coords), promise)
                return promise

            } else {
                const nvcacheEntry = this.noisevalues_cache[nv_idx]
                this.noisevalues_cache.splice(nv_idx, 1)
                this.noisevalues_cache.push(nvcacheEntry)

                const indices = nvcacheEntry.values.map(row => row.map(params => this.builder.getIndexes(params)))
                this.indices_cache.push({ key: this._tileCoordsToKey(coords), values: indices })
                if (this.indices_cache.length > 40)
                    this.indices_cache.shift()

                return {idx: indices, values: nvcacheEntry.values}
            }
        } else {
            const cacheEntry = this.indices_cache[idx]
            this.indices_cache.splice(idx, 1)
            this.indices_cache.push(cacheEntry)

            const nvcacheEntry = this.noisevalues_cache[nv_idx]
            this.noisevalues_cache.splice(nv_idx, 1)
            this.noisevalues_cache.push(nvcacheEntry)

            return {idx: cacheEntry.values, values: nvcacheEntry.values}
        }

    }

    invalidateIndices() {
        this.indices_cache = []
    }

    private _tileCoordsToKey(coords: L.Coords) {
        return coords.x + ":" + coords.y + ":" + coords.z
    }
}