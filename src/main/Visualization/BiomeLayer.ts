import { BiomeSource } from "deepslate";
import * as L from "leaflet";
import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder, MultiNoiseIndexes } from "../BuilderData/BiomeBuilder";
import { GridMultiNoise } from "./GridMultiNoise";
import { GridMultiNoiseIndicesManager } from "./GridMultiNoiseIndicesManager";


export class BiomeLayer extends L.GridLayer{
    private builder: BiomeBuilder
    private gridIndicesManager: GridMultiNoiseIndicesManager

    constructor(builder: BiomeBuilder, gridIndicesManager: GridMultiNoiseIndicesManager){
        super()
        this.builder = builder
        this.gridIndicesManager = gridIndicesManager
    }

    protected createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement{
        const tile = L.DomUtil.create('canvas', 'leaflet-tile')

        const render = async () => {
            var ctx = tile.getContext('2d')
            var size = this.getTileSize()
            tile.width = size.x / this.gridIndicesManager.resolution
            tile.height = size.y / this.gridIndicesManager.resolution

            let nv = this.gridIndicesManager.get(coords)
            if (nv instanceof Promise){
                nv = await nv
            } else {
                tile.classList.add('leaflet-tile-loaded')
            }

            const biomes = nv.idx.map(row => row.map(idxs => this.builder.lookup(idxs)))
            for (let x = 0 ; x<size.x/this.gridIndicesManager.resolution ; x++){
                for (let z = 0 ; z<size.y/this.gridIndicesManager.resolution ; z++){
                    const biome = biomes[x][z].biome
                    if (biome){
                        ctx.fillStyle = biome.color
                        ctx.fillRect(x, z, 1, 1)
                    }
                }
            }

            done(null, tile)
 
        }

        render()
        return tile
    }
}