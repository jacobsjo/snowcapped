import { binarySearch, lerp } from "deepslate";
import { SimpleSpline } from "./SimpleSpline"

export class GridSpline {
    continentalnesses: number[]
    erosions: number[]
    splines: SimpleSpline[][]

    constructor(continentalnesses: number[], erosions: number[], splines?: SimpleSpline[][]) {
        this.continentalnesses = continentalnesses;
        this.erosions = erosions

        if (splines)
            this.splines = splines
        else {
            this.splines = []
            for (let c = 0; c < this.continentalnesses.length; c++) {
                this.splines.push([])
                for (let e = 0; e < this.erosions.length; e++) {
                    this.splines[c].push(undefined)
                }
            }
            this.createSpline(0, 0)
        }
    }

    public apply(c: number, e: number, w: number) {
        var c_last: number
        var c_next: number
        for (var ci = 0; ci < this.continentalnesses.length; ci++) {
            var ok = false;
            for (var ei = 0; ei < this.erosions.length; ei++) {
                if (this.splines[ci][ei] !== undefined){
                    ok = true
                    break
                }
            }
            if (ok) {
                if (this.continentalnesses[ci] < c) {
                    c_last = ci
                } else {
                    c_next = ci
                    break
                }
            }
        }

        if (c_last === undefined && c_next === undefined) {
            return undefined
        } else if (c_last === undefined) {
            return this.applyErosion(c_next, e, w)
        } else if (c_next === undefined) {
            return this.applyErosion(c_last, e, w)
        } else {
            return GridSpline.interpolateZeroGrad((c - this.continentalnesses[c_last]) / (this.continentalnesses[c_next] - this.continentalnesses[c_last]), this.applyErosion(c_last, e, w), this.applyErosion(c_next, e, w))
        }
    }

    private applyErosion(c_id: number, e: number, w: number) {
        var e_last: number
        var e_next: number
        for (var ei = 0; ei < this.erosions.length; ei++) {
            if (this.splines[c_id][ei]) {
                if (this.erosions[ei] < e) {
                    e_last = ei
                } else {
                    e_next = ei
                    break
                }
            }
        }

        if (e_last === undefined && e_next === undefined) {
            return undefined
        } else if (e_last === undefined) {
            return this.splines[c_id][e_next].apply(w)
        } else if (e_next === undefined) {
            return this.splines[c_id][e_last].apply(w)
        } else {
            return GridSpline.interpolateZeroGrad((e - this.erosions[e_last]) / (this.erosions[e_next] - this.erosions[e_last]), this.splines[c_id][e_last].apply(w), this.splines[c_id][e_next].apply(w))
        }
    }

    private static interpolateZeroGrad(alpha: number, a: number, b: number) {
        return lerp(alpha, a, b) + alpha * (1.0 - alpha) * lerp(alpha, a - b, b - a)
    }

    public toJSON() {
        return {
            continentalnesses: this.continentalnesses,
            erosions: this.erosions,
            splines: this.splines.map(row => row.map(spline => {
                if (spline) {
                    return spline.toJSON()
                } else {
                    return undefined
                }
            }))
        }
    }

    public static fromJSON(json: any) {
        return new GridSpline(json.continentalnesses, json.erosions, json.splines.map((row: any) => row.map((spline: any) => {
            if (spline){
                return SimpleSpline.fromJSON(spline)
            } else {
                return undefined
            }
        }
        )))
    }

    public export() {
        const contitent_points = []
        for (let c_id = 0 ; c_id < this.continentalnesses.length ; c_id ++){
            const erosion_points = []
            for (let e_id = 0 ; e_id < this.erosions.length ; e_id ++){
                if (this.splines[c_id][e_id]){
                    erosion_points.push({
                        location: this.erosions[e_id],
                        derivative: 0,
                        value: this.splines[c_id][e_id].toJSON()
                    })
                }
            }

            contitent_points.push({
                location: this.continentalnesses[c_id],
                derivative: 0,
                value: {
                    coordinate: "erosion",
                    points: erosion_points
                }
            })
        }

        return {
            coordinate: "continents",
            points: contitent_points
        }
    }

    public static fromMinecraftJSON(json: any): GridSpline {
        if (json.coordinate !== "continents") {
            console.warn("Spline order not suppored")
            return undefined
        }

        const continentalnesses: number[] = json.points.map((p: { location: any; }) => p.location)
        const erosionSet: Set<number> = new Set<number>()

        json.points.forEach((p: { value: { coordinate: string; points: any[]; }; }) => {
            if (typeof p.value !== "number" && p.value.coordinate === "erosion") {
                p.value.points.forEach((pp: { location: number; }) => {
                    erosionSet.add(pp.location)
                });
            }
        });

        const erosions = Array.from(erosionSet).sort((a, b) => a - b)

        const splines: SimpleSpline[][] = []
        for (let c = 0; c < continentalnesses.length; c++) {
            splines.push([])
            for (let e = 0; e < erosions.length; e++) {
                splines[c].push(undefined)
            }
        }

        json.points.forEach((p: { location: any; value: { coordinate: string; points: any[]; }; }) => {
            const c_id = continentalnesses.findIndex(c => c === p.location)
            if (typeof p.value === "number") {
                splines[c_id][0] = new SimpleSpline([{ location: 0, value: p.value, derivative: 0 }])
            } else if (p.value.coordinate === "erosion") {
                p.value.points.forEach((pp: { location: any; value: any; }) => {
                    const e_id = erosions.findIndex(e => e === pp.location)
                    if (typeof pp.value === "number") {
                        splines[c_id][e_id] = new SimpleSpline([{ location: 0, value: pp.value, derivative: 0 }])
                    } else {
                        splines[c_id][e_id] = SimpleSpline.fromJSON(pp.value)
                    }
                })
            }
        })

        return new GridSpline(continentalnesses, erosions, splines)
    }

    createSpline(c_id: number, e_id: number) {
        this.splines[c_id][e_id] = new SimpleSpline([{ location: 0, value: 0, derivative: 0 }])
        /*
        var e_last: number
        for (var e = e_id - 1; e >= 0; e_id--) {
            if (this.splines[c_id][e]) {
                e_last = e
                break;
            }
        }

        var e_next: number
        for (var e = e_id + 1; e < this.erosions.length; e_id++) {
            if (this.splines[c_id][e]) {
                e_next = e
                break;
            }
        }

        if (!e_last && !e_next){
            console.warn("not implemented")
        } if (!e_next) {
            this.splines[c_id][e_id] = Object.apply(this.splines[c_id][e_last])
        } else if (!e_last) {
            this.splines[c_id][e_id] = Object.apply(this.splines[c_id][e_next])
        } else {
            const locations = new Set<number>()
            this.splines[c_id][e_last].points.map(p => p.location).forEach(locations.add, locations)
            this.splines[c_id][e_next].points.map(p => p.location).forEach(locations.add, locations)
        }*/

    }

}

