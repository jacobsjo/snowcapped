import * as d3 from "d3";
import { BaseType } from "d3";
import { BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { SimpleSpline } from "../BuilderData/SimpleSpline"
import { UI } from "./UI";


export class SplineEditor {
    private builder: BiomeBuilder
    private title: HTMLInputElement

    private zoom: number;

    constructor(builder: BiomeBuilder) {
        this.builder = builder

        this.title = document.getElementById("layoutName") as HTMLInputElement

        this.hide()

        this.zoom = 1

        const div = d3.select("#splineEditorDiv")
        const width = parseInt(div.style("width"), 10);
        const height = (parseInt(div.style("height"), 10) - 20);
        const zoomDiv = d3.select("#splineEditorDiv").append("div").classed("zoomDiv",true).style("width", width).style("height", height)
    
        zoomDiv.on("wheel", evt => {
            const div = d3.select("#splineEditorDiv")
            const width = parseInt(div.style("width"), 10);
            const height = (parseInt(div.style("height"), 10) - 30);

            const zoom_x = (div.property("scrollTop") + 0.5 * width) / this.zoom
            const zoom_y = (div.property("scrollLeft") + 0.5 * height) / this.zoom

            this.zoom = Math.max(this.zoom + (evt.wheelDelta / 300), 1)

            const t = d3.transition().duration(1000).ease(d3.easeLinear)
            d3.select("#splineEditorDiv .zoomDiv").style("width", width * this.zoom).style("height", height * this.zoom)

            this.refresh()

            div.property("scrollTop", (zoom_x * this.zoom) - 0.5 * width)
            div.property("scrollLeft", (zoom_y * this.zoom) - 0.5 * height)

            evt.preventDefault()
        }).call(d3.drag<HTMLDivElement, any>()
        .filter(evt => evt.button === 2)
        .on("start", function(evt, d) {

        })
        .on("drag", function(evt, d) {
            div.property("scrollTop", div.property("scrollTop") - evt.dy)
            div.property("scrollLeft", div.property("scrollLeft") - evt.dx)
        })
        .on("end", function(evt,d){
        })
        ) 
        .on("contextmenu", (evt => evt.preventDefault()))
    }

    draw(pos?: {row: number, col: number}) {
        const spline_name = UI.getInstance().sidebarManager.openedElement.key
        const e_count = this.builder.splines[spline_name].erosions.length
        const c_count = this.builder.splines[spline_name].continentalnesses.length

        const div = d3.select("#splineEditorDiv .zoomDiv")
        const size = Math.min(parseInt(div.style("width"), 10) / e_count - 10, (parseInt(div.style("height"), 10) - 20) / c_count - 10);

        const xScale = d3.scaleLinear()
            .domain([-1, 1])
            .range([0, size])

        const xFactor = 2 / size

        var yScale: d3.ScaleLinear<number, number, never>;
        var yFactor: number

        if (spline_name === "offset"){
            yScale = d3.scaleLinear()
                .domain([-0.3, 1.6])
                .range([size, 0])

            yFactor = -1.9 / size
        } else if (spline_name === "factor"){
            yScale = d3.scaleLinear()
                .domain([8, 0])
                .range([size, 0])

            yFactor = 8 / size

        } else if (spline_name === "jaggedness"){
            yScale = d3.scaleLinear()
                .domain([0, 2])
                .range([size * 0.9, 0])

            yFactor = -2 / (size * 0.9)
        }


        const xdivy_2 = xFactor * xFactor / yFactor / yFactor

        const splineArea = d3.area()
            .x(d => xScale(d[0]))
            .y0(d => yScale(-0.3))
            .y1(d => yScale(d[1]))
            .curve(d3.curveCatmullRom.alpha(.5))


        const splineCurve = d3.line()
            .x(d => xScale(d[0]))
            .y(d => yScale(d[1]))
            .curve(d3.curveCatmullRom.alpha(.5))

        const waterLevel = 0

        const self = this

        const svgs = div.selectAll("div.row" + (pos ? ("#row_" + pos.row) : ""))
            .data(this.builder.splines[spline_name].splines)
            .join((enter) => {
                const div = enter.append("div").classed("row", true).attr("id", (d, id) => "row_" + id)
                return div
            }).selectAll("svg" + (pos ? ("#col_" + pos.col) : ""))
                .data((d, row) => d.map((d, col)=>{return {spline: d, row: row, col: col}}))
                .join((enter) => {
                    const svg = enter.append("svg").attr("id", (d, id) => "col_" + id)
                    svg.append("rect").classed("water", true)
                    svg.append("image").classed("add", true).attr("href", "add-gray.svg")
                    const splines = svg.append("g").classed("splines", true)
                    splines.append("path").classed("spline", true)
                    splines.append("path").classed("spline_pointer", true)
                    svg.append("g").classed("spline_points", true)
                    return svg
                })
                .attr("width", size)
                .attr("height", size)

        svgs.select("rect.water")
            .attr("x", 0)
            .attr("y", yScale(waterLevel))
            .attr("width", size)
            .attr("height", size - yScale(waterLevel))
            .classed("hide", d => spline_name !== "offset" || d.spline === undefined)

        svgs.select(".add")
            .classed("hide", d => d.spline !== undefined)
            .attr("width", size).attr("height", size)

        var newDrag: {location: number, value: number, derivative: number}

        svgs.on("click", (evt, d) => {
            if (d.spline)
                return

            this.builder.splines[spline_name].createSpline(d.row, d.col)
            this.refresh()
        })

        const splines = svgs.selectAll("g.splines")
            .data(d => {
                const points: [number, number][] = []
                if (d.spline){
                    for (let w = -1.2; w <= 1.2001; w += 0.05) {
                        points.push([w, d.spline.apply(w)])
                    }
                    for (let w of d.spline.points){
                        points.push([w.location, w.value])
                    }
                    points.sort((a,b) => a[0]-b[0])
                } else {
                    points.push([0,0])
                }
                return [points]
            })

        splines.select(".spline")
            .datum(d=>d)
            .classed("area", spline_name === "offset")
            .attr('d', spline_name === "offset" ? splineArea : splineCurve)

        splines.select<SVGPathElement>("path.spline_pointer")
            .datum(d=>d)
            .attr('d', splineCurve)
            .call(d3.drag<SVGPathElement, any>()
                .on("start", function(evt, d) {
                    const spline = (d3.select(this.parentElement.parentElement).datum() as {spline: SimpleSpline, row: number, col: number}).spline
                    newDrag = {
                        location: xScale.invert(evt.x),
                        value: xScale.invert(evt.y),
                        derivative: 0
                    }
                    spline.points.push(newDrag)
                    console.log("DragStart")
                    spline.order()
                })
                .on("drag", function(evt, d) {
                    console.log(evt.test)
                    const spline = (d3.select(this.parentElement.parentElement).datum() as {spline: SimpleSpline, row: number, col: number}).spline
                    newDrag.location = xScale.invert(evt.x)
                    newDrag.value = yScale.invert(evt.y)
                    spline.order()
                    self.refresh()
                })
                .on("end", function(evt,d){
                })
                ) 
        var dragmode: "value" | "derivative"

        const handles = svgs.select("g.spline_points ")
            .selectAll<SVGGElement, SimpleSpline>("g")
            .data(d => {
                return d.spline?.points ?? []
            })
                     
            .join(enter=>{
                const g = enter.append("g").classed("handle", true)
                g.append("circle")
                    .attr("r", 3)

                g.append("line").classed("handle_line", true)
                g.append("line").classed("handle_line_pointer", true)

                return g
            })
            .on("contextmenu", function(evt, d) {
                const spline = (d3.select(this.parentElement).datum() as {spline: SimpleSpline, row: number, col: number})
                if (spline.spline.points.length > 1) {
                    const id = spline.spline.points.findIndex(p => p.location === d.location)
                    spline.spline.points.splice(id, 1)
                } else {
                    self.builder.splines[spline_name].splines[spline.row][spline.col] = undefined
                }
                self.refresh()
                evt.preventDefault()
            })
            .call(d3.drag<SVGGElement, {
                location: number,
                value: number,
                derivative: number
            }>()
                .on("start", function(evt, d) {
                    d3.select(this).classed("dragged", true)
                    const spline = (d3.select(this.parentElement).datum() as {spline: SimpleSpline, row: number, col: number}).spline
                    const point = spline.points.find(p => p.location === d.location)
                    if (Math.pow(xScale(point.location) - evt.x,2) + Math.pow(yScale(point.value) - evt.y,2) < 9) 
                        dragmode = "value"
                    else 
                        dragmode = "derivative"
                })
                .on("drag", function(evt, d) {
                    console.log(evt.test)
                    const spline = (d3.select(this.parentElement).datum() as {spline: SimpleSpline, row: number, col: number}).spline
                    if (dragmode === "value"){
                        d.location = xScale.invert(evt.x)
                        d.value = yScale.invert(evt.y)
                        spline.order()
                    } else {
                        const x = xScale.invert(evt.x) - d.location
                        const y = yScale.invert(evt.y) - d.value
                        if (Math.abs(x) > 1e-3)
                            d.derivative = y/x
    
                        if (Math.abs(d.derivative) < 0.1)
                            d.derivative = 0
                    }
                    self.refresh()
                })
                .on("end", function(evt,d){
                    d3.select(this).classed("dragged", false)
                })
                )               
        
        handles.select<SVGCircleElement> ("circle")
            .attr("cx", d => xScale(d.location))
            .attr("cy", d => yScale(d.value))


        handles.select("line.handle_line")
            .attr("x1", d => xScale(d.location) - 20 / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .attr("y1", d => yScale(d.value) - 20 * d.derivative * xFactor / yFactor / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .attr("x2", d => xScale(d.location) + 20 / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .attr("y2", d => yScale(d.value) + 20 * d.derivative * xFactor / yFactor / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))

            handles.select("line.handle_line_pointer")
            .attr("x1", d => xScale(d.location) - 20 / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .attr("y1", d => yScale(d.value) - 20 * d.derivative * xFactor / yFactor / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .attr("x2", d => xScale(d.location) + 20 / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .attr("y2", d => yScale(d.value) + 20 * d.derivative * xFactor / yFactor / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))


                /*
            svg.select("g.spline_points")
                .selectAll<SVGCircleElement, {
                    location: number,
                    value: number,
                    derivative: number
                }>("circle")
                .call(d3.drag<SVGCircleElement, {
                    location: number,
                    value: number,
                    derivative: number
                }>()
                    .on("drag", (evt, d) => {
                        d.location = xScale.invert(evt.x)
                        d.value = yScale.invert(evt.y)
                        this.spline.order()
                        this.refresh()
                    }))
    
    
            const xdivy_2 = xFactor * xFactor / yFactor / yFactor
    
            svg.select("g.spline_point_lines")
                .selectAll("line")
                .data(this.spline.points)
                .attr("x1", d => xScale(d.location) - 0.1 * width / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
                .attr("y1", d => yScale(d.value) - 0.1 * width * d.derivative * xFactor / yFactor / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
                .attr("x2", d => xScale(d.location) + 0.1 * width / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
                .attr("y2", d => yScale(d.value) + 0.1 * width * d.derivative * xFactor / yFactor / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
                .join("line")
    
            svg.select("g.spline_point_handles")
                .selectAll("line")
                .data(this.spline.points)
                .attr("x1", d => xScale(d.location) - 0.11 * width / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
                .attr("y1", d => yScale(d.value) - 0.11 * width * d.derivative * xFactor / yFactor / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
                .attr("x2", d => xScale(d.location) + 0.11 * width / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
                .attr("y2", d => yScale(d.value) + 0.11 * width * d.derivative * xFactor / yFactor / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
                .join("line")
    
            svg.select("g.spline_point_handles")
                .selectAll<SVGLineElement, {
                    location: number,
                    value: number,
                    derivative: number
                }>("line")
                .call(d3.drag<SVGLineElement, {
                    location: number,
                    value: number,
                    derivative: number
                }>()
                    .on("drag", (evt, d) => {
                        const x = xScale.invert(evt.x) - d.location
                        const y = yScale.invert(evt.y) - d.value
                        if (Math.abs(x) > 1e-3)
                            d.derivative = y/x
    
                        if (Math.abs(d.derivative) < 0.1)
                            d.derivative = 0
                        this.refresh()
                    })
                )

            return svg*/

        /*
        const points: [number, number][] = []
        for (let w = -1.2; w <= 1.2001; w += 0.01) {
            points.push([w, this.spline.apply(w)])
        }

        let waterLevel = 0
        svg.select("rect.water")
            .attr("x", 0)
            .attr("y", yScale(waterLevel))
            .attr("width", width)
            .attr("height", height - yScale(waterLevel))

        const splineCurve = d3.line()
            .x(d => xScale(d[0]))
            .y(d => yScale(d[1]))
            .curve(d3.curveCatmullRom.alpha(.5))

        svg.select("path.spline")
            .datum(points)
            .attr('d', splineCurve)

        svg.select("g.spline_points")
            .selectAll("circle")
            .data(this.spline.points)
            .attr("cx", d => xScale(d.location))
            .attr("cy", d => yScale(d.value))
            .on("contextmenu", (evt, d) => {
                if (this.spline.points.length > 1) {
                    const id = this.spline.points.findIndex(p => p.location === d.location)
                    this.spline.points.splice(id, 1)
                    this.refresh()
                }
                evt.preventDefault()
            })
            .join("circle")
            .attr("r", width / 60)

        svg.select("g.spline_points")
            .selectAll<SVGCircleElement, {
                location: number,
                value: number,
                derivative: number
            }>("circle")
            .call(d3.drag<SVGCircleElement, {
                location: number,
                value: number,
                derivative: number
            }>()
                .on("drag", (evt, d) => {
                    d.location = xScale.invert(evt.x)
                    d.value = yScale.invert(evt.y)
                    this.spline.order()
                    this.refresh()
                }))


        const xdivy_2 = xFactor * xFactor / yFactor / yFactor

        svg.select("g.spline_point_lines")
            .selectAll("line")
            .data(this.spline.points)
            .attr("x1", d => xScale(d.location) - 0.1 * width / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .attr("y1", d => yScale(d.value) - 0.1 * width * d.derivative * xFactor / yFactor / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .attr("x2", d => xScale(d.location) + 0.1 * width / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .attr("y2", d => yScale(d.value) + 0.1 * width * d.derivative * xFactor / yFactor / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .join("line")

        svg.select("g.spline_point_handles")
            .selectAll("line")
            .data(this.spline.points)
            .attr("x1", d => xScale(d.location) - 0.11 * width / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .attr("y1", d => yScale(d.value) - 0.11 * width * d.derivative * xFactor / yFactor / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .attr("x2", d => xScale(d.location) + 0.11 * width / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .attr("y2", d => yScale(d.value) + 0.11 * width * d.derivative * xFactor / yFactor / Math.sqrt(d.derivative * d.derivative * xdivy_2 + 1))
            .join("line")

        svg.select("g.spline_point_handles")
            .selectAll<SVGLineElement, {
                location: number,
                value: number,
                derivative: number
            }>("line")
            .call(d3.drag<SVGLineElement, {
                location: number,
                value: number,
                derivative: number
            }>()
                .on("drag", (evt, d) => {
                    const x = xScale.invert(evt.x) - d.location
                    const y = yScale.invert(evt.y) - d.value
                    if (Math.abs(x) > 1e-3)
                        d.derivative = y/x

                    if (Math.abs(d.derivative) < 0.1)
                        d.derivative = 0
                    this.refresh()
                })
            )

            */
    }

    refresh() {
        this.title.readOnly = true
        this.title.value = UI.getInstance().sidebarManager.openedElement.key === "offset" ? "Offset Spline" : UI.getInstance().sidebarManager.openedElement.key === "factor" ? "Factor Spline" : "Jaggedness Spline"
        d3.select("#splineEditorDiv").attr("hidden", undefined)

        this.draw()
    }

    hide() {
        d3.select("#splineEditorDiv").attr("hidden", true)
    }
}