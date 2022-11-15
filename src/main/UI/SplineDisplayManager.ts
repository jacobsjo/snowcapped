import * as d3 from "d3";
import { Climate } from "deepslate";
import { BiomeBuilder } from "../BuilderData/BiomeBuilder";



export class SplineDisplayManager {
    private builder: BiomeBuilder
    private pos?: { c: number, e: number, w?: number }
    private weirdnesses: Climate.Param[]

    constructor(builder: BiomeBuilder) {
        this.builder = builder
        this.weirdnesses = []
    }


    setPos(pos?: { c: number, e: number, w?: number }) {
        this.pos = pos
    }

    setWeirdnesses(weirdnesses: Climate.Param[]) {
        this.weirdnesses = weirdnesses
    }

    refresh() {
        d3.select("#splineDisplay").classed("hidden", !this.builder.exportSplines)

        if (!this.builder.exportSplines)
            return
        
        let waterLevel = 0

        const svg = d3.select("#splineDisplaySvg")
        const width = parseInt(svg.style("width"), 10);
        const height = parseInt(svg.style("height"), 10);

        const xScale = d3.scaleLinear()
            .domain([-1.5, 1.5])
            .range([0, width])

        const offsetScale = d3.scaleLinear()
            .domain([-0.3, 1.2])
            .range([height, 0])

        const factorScale = d3.scaleLinear()
            .domain([8, 0])
            .range([height, 0])

        const roughnessScale = d3.scaleLinear()
            .domain([0, 1])
            .range([height - 10, 0])

        const offsets: [number, number][] = []
        const factors: [number, number][] = []
        const roughnesses: [number, number][] = []
        if (this.pos) {
            for (let w = -1.5; w <= 1.51; w += 0.05) {
                offsets.push([w, this.builder.splines['offset'].apply(this.pos.c, this.pos.e, w)])
                factors.push([w, this.builder.splines['factor'].apply(this.pos.c, this.pos.e, w)])
                roughnesses.push([w, this.builder.splines['jaggedness'].apply(this.pos.c, this.pos.e, w)])
            }
        } else {
            waterLevel = -0.3
        }

        svg.select("rect.water")
            .attr("x", 0)
            .attr("y", offsetScale(waterLevel))
            .attr("width", width)
            .attr("height", height - offsetScale(waterLevel))

        const terrain = d3.area()
            .x(d => xScale(d[0]))
            .y0(d => offsetScale(d[1]))
            .y1(d => offsetScale(-1.5))
            .curve(d3.curveCatmullRom.alpha(.5))

        const factor = d3.line()
            .x(d => xScale(d[0]))
            .y(d => factorScale(d[1]))
            .curve(d3.curveCatmullRom.alpha(.5))

        const roughness = d3.line()
            .x(d => xScale(d[0]))
            .y(d => roughnessScale(d[1]))
            .curve(d3.curveCatmullRom.alpha(.5))


        svg.select("path.terrain")
            .datum(offsets)
            .attr('d', terrain)

        svg.select("path.factor")
            .datum(factors)
            .attr('d', factor)

        svg.select("path.roughness")
            .datum(roughnesses)
            .attr('d', roughness)

        svg.select("g.weirdnesses")
            .selectAll("rect")
            .data(this.weirdnesses)
            .join("rect")
            .attr("x", w => xScale(w.min))
            .attr("y", -5)
            .attr("width", w => xScale(w.max) - xScale(w.min))
            .attr("height", height + 10)

        svg.select("line.weirdness")
            .attr("x1", xScale(this.pos?.w ?? -2))
            .attr("x2", xScale(this.pos?.w ?? -2))
            .attr("y1", -5)
            .attr("y2", height + 5)

        /*
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

        if (this.pos?.w) {
            spline_ctx.strokeStyle = "rgb(255, 100, 255)"
            spline_ctx.lineWidth = 2
            spline_ctx.setLineDash([1, 0])
            spline_ctx.beginPath()
            spline_ctx.moveTo((this.pos.w + 1) * 0.5 * scw, -2)
            spline_ctx.lineTo((this.pos.w + 1) * 0.5 * scw, sch + 4)
            spline_ctx.stroke()
        }*/
    }

}