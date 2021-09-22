import * as L from "leaflet";
import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder, MultiNoiseIndexes } from "../BuilderData/BiomeBuilder";
import { GridMultiNoise } from "./GridMultiNoise";



export class GridMultiNoiseIndicesManager{
    private cache : {key: string, values: MultiNoiseIndexes[][]}[]
    readonly resolution = 6
    private size: L.Point
    private midPoint: L.Point
    private multiNoise: GridMultiNoise
    private builder: BiomeBuilder

    constructor(builder: BiomeBuilder, multiNoise: GridMultiNoise){
        this.cache = []
        this.size = new L.Point(512, 512, false)
        this.midPoint = new L.Point(Math.pow(2, 20), Math.pow(2, 20), false)
        this.builder = builder
        this.multiNoise = multiNoise
    }

    get(coords: L.Coords): Promise<MultiNoiseIndexes[][]> | MultiNoiseIndexes[][]{
        const nwpoint = coords.scaleBy(this.size).divideBy(Math.pow(2, coords.z - 13)).subtract(this.midPoint)
    
        const idx = this.cache.findIndex(c=>c.key === this._tileCoordsToKey(coords))
        let nv
        if (idx === -1){
            const params = this.multiNoise.getNoiseValueArray(nwpoint.x, nwpoint.y, this.size.x / this.resolution, this.size.x / Math.pow(2, coords.z - 5) * this.resolution).then(nv => {
                const indices = nv.map(row => row.map(params => this.builder.getIndexes(params)))
                this.cache.push({key: this._tileCoordsToKey(coords), values: indices})
                if (this.cache.length > 20)
                    this.cache.unshift()
                return indices
            })
            return params
        } else {
            const cacheEntry = this.cache[idx]
            this.cache.splice(idx, 1)
            this.cache.push(cacheEntry)
            nv = cacheEntry.values
            return nv
        }

    }

    private _tileCoordsToKey(coords: L.Coords){
        return coords.x + ":" + coords.y + ":" + coords.z
    }
}