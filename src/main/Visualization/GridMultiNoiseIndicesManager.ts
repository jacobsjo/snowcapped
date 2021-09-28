import * as L from "leaflet";
import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder, MultiNoiseIndexes, MultiNoiseParameters } from "../BuilderData/BiomeBuilder";
import { GridMultiNoise } from "./GridMultiNoise";



export class GridMultiNoiseIndicesManager {
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
        this.size = new L.Point(512, 512, false)
        this.midPoint = new L.Point(Math.pow(2, 21), Math.pow(2, 21), false)
        this.builder = builder
        this.multiNoise = multiNoise
    }

    get(coords: L.Coords): Promise<MultiNoiseIndexes[][]> | MultiNoiseIndexes[][] {
        const nwpoint = coords.scaleBy(this.size).divideBy(Math.pow(2, coords.z - 13)).subtract(this.midPoint)

        const idx = this.indices_cache.findIndex(c => c.key === this._tileCoordsToKey(coords))
        const nv_idx = this.noisevalues_cache.findIndex(c => c.key === this._tileCoordsToKey(coords))
        let nv
        if (idx === -1) {
            if (nv_idx === -1) {
                return this.multiNoise.getNoiseValueArray(nwpoint.x, nwpoint.y, this.size.x / this.resolution, this.size.x / Math.pow(2, coords.z - 5) * this.resolution).then(nv => {
                    this.noisevalues_cache.push({ key: this._tileCoordsToKey(coords), values: nv })
                    if (this.noisevalues_cache.length > 20)
                        this.noisevalues_cache.unshift()
                    
                    const indices = nv.map(row => row.map(params => this.builder.getIndexes(params)))
                    this.indices_cache.push({ key: this._tileCoordsToKey(coords), values: indices })
                    if (this.indices_cache.length > 20)
                        this.indices_cache.unshift()
                    return indices
                })
            } else {
                const nvcacheEntry = this.noisevalues_cache[nv_idx]
                this.noisevalues_cache.splice(nv_idx, 1)
                this.noisevalues_cache.push(nvcacheEntry)

                const indices = nvcacheEntry.values.map(row => row.map(params => this.builder.getIndexes(params)))
                this.indices_cache.push({ key: this._tileCoordsToKey(coords), values: indices })
                if (this.indices_cache.length > 20)
                    this.indices_cache.unshift()

                return indices
            }
        } else {
            const cacheEntry = this.indices_cache[idx]
            this.indices_cache.splice(idx, 1)
            this.indices_cache.push(cacheEntry)

            const nvcacheEntry = this.noisevalues_cache[nv_idx]
            this.noisevalues_cache.splice(nv_idx, 1)
            this.noisevalues_cache.push(nvcacheEntry)


            nv = cacheEntry.values
            return nv
        }

    }

    invalidateIndices() {
        this.indices_cache = []
    }

    private _tileCoordsToKey(coords: L.Coords) {
        return coords.x + ":" + coords.y + ":" + coords.z
    }
}