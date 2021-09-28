import { Climate, TerrainShaper } from "deepslate";
import { BiomeBuilder } from "../BuilderData/BiomeBuilder";



export class SplineDisplayManager {
    private builder: BiomeBuilder
    private splineCanvas: HTMLCanvasElement
    private pos?: { c: number, e: number, w?: number }
    private weirdnesses: Climate.Param[]

    constructor(builder: BiomeBuilder) {
        this.builder = builder
        this.splineCanvas = document.getElementById("splineDisplayCanvas") as HTMLCanvasElement
        this.weirdnesses = []
    }


    setPos(pos?: { c: number, e: number, w?: number }) {
        this.pos = pos
    }

    setWeirdnesses(weirdnesses: Climate.Param[]) {
        this.weirdnesses = weirdnesses
    }

    refresh() {
        const spline_ctx = this.splineCanvas.getContext('2d')
        const scw = this.splineCanvas.width
        const sch = this.splineCanvas.height

        spline_ctx.clearRect(0, 0, scw, sch);

        if (this.pos) {
            spline_ctx.fillStyle = "rgb(92, 154, 255)"
            spline_ctx.fillRect(0, 0.8 * sch, scw, 0.2 * sch)

            spline_ctx.fillStyle = "rgb(80,80,80)"
            spline_ctx.beginPath()
            spline_ctx.moveTo(0, sch)
            for (let w = -1; w < 1; w += 0.1) {
                const offset = TerrainShaper.offset(TerrainShaper.point(this.pos.c, this.pos.e, w))
                spline_ctx.lineTo((w + 1) * 0.5 * scw, -offset * 0.75 * sch + 0.8 * sch)
            }
            spline_ctx.lineTo(scw, sch)
            spline_ctx.fill()

            spline_ctx.strokeStyle = "rgb(255,0,0)"
            spline_ctx.setLineDash([5, 5])
            spline_ctx.lineWidth = 3
            spline_ctx.beginPath()
            for (let w = -1; w < 1; w += 0.1) {
                const factor = TerrainShaper.factor(TerrainShaper.point(this.pos.c, this.pos.e, w))
                spline_ctx.lineTo((w + 1) * 0.5 * scw, -(1 / factor) * 50 * sch + sch)
            }
            spline_ctx.stroke()

            spline_ctx.strokeStyle = "rgb(0,0,255)"
            spline_ctx.setLineDash([5, 5])
            spline_ctx.lineWidth = 3
            spline_ctx.beginPath()
            for (let w = -1; w < 1; w += 0.1) {
                const peaks = TerrainShaper.peaks(TerrainShaper.point(this.pos.c, this.pos.e, w))
                spline_ctx.lineTo((w + 1) * 0.5 * scw, -peaks / 100 * sch + sch)
            }
            spline_ctx.stroke()
        }


        spline_ctx.fillStyle = "rgba(255,255,0,0.2)"
        spline_ctx.strokeStyle = "yellow"
        spline_ctx.setLineDash([5, 5])
        spline_ctx.lineWidth = 1

        this.weirdnesses.forEach(weirdness => {
                spline_ctx.beginPath()
                spline_ctx.rect((weirdness.min + 1) * 0.5 * scw, -2, (weirdness.max - weirdness.min) * 0.5 * scw, sch + 4)
                spline_ctx.stroke()
                spline_ctx.fill()
        })

        if (this.pos?.w){
            spline_ctx.strokeStyle = "rgb(255, 100, 255)"
            spline_ctx.lineWidth = 2
            spline_ctx.setLineDash([1,0])
            spline_ctx.beginPath()
            spline_ctx.moveTo((this.pos.w + 1) * 0.5 * scw, -2)
            spline_ctx.lineTo((this.pos.w + 1) * 0.5 * scw, sch + 4)
            spline_ctx.stroke()
        }
    }

}