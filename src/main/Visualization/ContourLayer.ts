import { BiomeSource, TerrainShaper } from "deepslate";
import * as L from "leaflet";
import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder, MultiNoiseIndexes } from "../BuilderData/BiomeBuilder";
import { GridMultiNoise } from "./GridMultiNoise";
import { GridMultiNoiseIndicesManager } from "./GridMultiNoiseIndicesManager";
import * as msq from "marchingsquares";


export class ContourLayer extends L.GridLayer {
    private builder: BiomeBuilder
    private gridIndicesManager: GridMultiNoiseIndicesManager

    constructor(builder: BiomeBuilder, gridIndicesManager: GridMultiNoiseIndicesManager) {
        super()
        this.builder = builder
        this.gridIndicesManager = gridIndicesManager
    }

    protected createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
        const tile = L.DomUtil.create('canvas', 'leaflet-tile')

        const render = async () => {
            var ctx = tile.getContext('2d')
            var size = this.getTileSize()
            tile.width = size.x
            tile.height = size.y

            let nv = this.gridIndicesManager.get(coords)
            if (nv instanceof Promise) {
                nv = await nv
            } else {
                tile.classList.add('leaflet-tile-loaded')
            }

            const offsets = nv.values.map(row => row.map(values => TerrainShaper.offset(TerrainShaper.point(values.continentalness, values.erosion, values.weirdness))))
            const isoValueCount = 14
            const isoValueStep = 0.15
            const isoValues = Array(isoValueCount).fill(0).map((_, idx) => (idx - (isoValueCount / 2)) * isoValueStep)
            const isoLines: [number, number][][][] = msq.isoLines(offsets, isoValues, { noFrame: true, polygons: false })
            ctx.strokeStyle = "black"
            ctx.lineWidth = 1
            isoLines.forEach(isoLine => {
                isoLine.forEach(line => {
                    ctx.beginPath()
                    for (let pid = 0 ; pid < line.length ; pid++){
                        const point = line[pid]

                        let draw = true

                        const maxPos = size.x / this.gridIndicesManager.resolution
                        if (pid > 0){
                            const last_point = line[pid-1]
                            if (point[0] === 0 && last_point[0] === 0) draw = false
                            if (point[1] === 0 && last_point[1] === 0) draw = false
                            if (point[0] === maxPos && last_point[0] === maxPos) draw = false
                            if (point[1] === maxPos && last_point[1] === maxPos) draw = false
                        }

                        if (draw){
                            ctx.lineTo(point[1] * this.gridIndicesManager.resolution, point[0] * this.gridIndicesManager.resolution)
                        } else {
                            ctx.moveTo(point[1] * this.gridIndicesManager.resolution, point[0] * this.gridIndicesManager.resolution)
                        }
                    }
                    ctx.stroke()
                });
            });        

            done(null, tile)
        }

        render()
        return tile
    }
}