import { BiomeSource } from "deepslate";
import * as L from "leaflet";
import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder } from "../BuilderData/BiomeBuilder";
import { GridMultiNoise } from "./GridMultiNoise";


export class BiomeLayer extends L.GridLayer{
    private builder: BiomeBuilder
    private biomeSource: GridMultiNoise
    private resolution = 4;
    private midPoint: L.Point

    constructor(builder: BiomeBuilder, biomeSouce: GridMultiNoise){
        super()
        this.builder = builder
        this.biomeSource = biomeSouce
        this.midPoint = new L.Point(Math.pow(2, 20), Math.pow(2, 20), false)
    }

    protected createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement{
        const tile = L.DomUtil.create('canvas', 'leaflet-tile-loaded')

        const render = async () => {
            var ctx = tile.getContext('2d')
            var size = this.getTileSize()
            tile.width = size.x
            tile.height = size.y
    
            const nwpoint = coords.scaleBy(size)
    
            ctx.fillStyle = "red"
            ctx.rect(0,0, size.x, size.y)
            ctx.fill()

            for (let x = 0 ; x<size.x ; x+=this.resolution){
                for (let y = 0 ; y<size.y ; y+=this.resolution){
                    let pos = nwpoint.add(new L.Point(x, y, false))
                    pos = pos.divideBy(Math.pow(2, coords.z - 13)).subtract(this.midPoint)
                    const biome = this.biomeSource.getBiome(pos.x, 64, pos.y)
                    if (biome instanceof Biome){
                        ctx.fillStyle = biome.color
                        ctx.fillRect(x, y, this.resolution, this.resolution)
                    }
                }
            }

            done(null, tile)
            console.log("rendered tile")
 
        }

        render()
        console.log("created tile")
        return tile
    }
}