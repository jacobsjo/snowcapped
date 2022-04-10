import { binarySearch, lerp } from "deepslate";
import { SimpleSpline } from "./SimpleSpline"

export class GridSpline {
    continentalnesses: number[]
    erosions: number[]
    splines: SimpleSpline[][]

    private undoSteps : string[] = []

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

    undo(){
        if (this.undoSteps.length > 0){
            this.splines = JSON.parse(this.undoSteps.pop()).map((row: any) => row.map((spline: any) => {
                if (spline){
                    return SimpleSpline.fromJSON(spline)
                } else {
                    return undefined
                }
            }))
        }
    }

    addUndoStep(){
        this.undoSteps.push(JSON.stringify(this.splines.map(row => row.map(spline => {
            if (spline) {
                return spline.toJSON("weirdness")
            } else {
                return undefined
            }
        }))))

        if (this.undoSteps.length > 500)
            this.undoSteps.shift()
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
                    return spline.toJSON("weirdness")
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

    public exportLegacy(fixedNoises: {[key: string] : number}) {

        if (fixedNoises["continentalness"] !== undefined){
            const c_id = binarySearch(0, this.continentalnesses.length, n => fixedNoises["continentalness"] < this.continentalnesses[n]) - 1
            const alpha_c = c_id < this.continentalnesses.length - 1 && c_id >= 0 ? (fixedNoises["continentalness"] - this.continentalnesses[c_id])/(fixedNoises["continentalness"] - this.continentalnesses[c_id]) : undefined
            if (fixedNoises["erosion"] !== undefined){
                const e_id = binarySearch(0, this.erosions.length, n => fixedNoises["erosion"] < this.erosions[n]) - 1
                const alpha_e = e_id < this.erosions.length - 1 && e_id >= 0 ? (fixedNoises["erosion"] - this.continentalnesses[e_id])/(fixedNoises["erosion"] - this.continentalnesses[e_id]) : undefined
                const spline1 = this.interpolateSplinesZeroGrad(alpha_e, this.getErosionInterpolatedSpline(c_id,e_id), this.getErosionInterpolatedSpline(c_id,e_id+1))
                const spline2 = this.interpolateSplinesZeroGrad(alpha_e, this.getErosionInterpolatedSpline(c_id+1,e_id), this.getErosionInterpolatedSpline(c_id+1,e_id+1))
                const spline = this.interpolateSplinesZeroGrad(alpha_c, spline1, spline2)
                return fixedNoises["weirdness"] !== undefined ? spline.apply(fixedNoises["weirdness"]) : spline.toJSON("weirdness")
            } else {
                const erosion_points = []
                for (let e_id = 0 ; e_id < this.erosions.length ; e_id ++){
                    if (this.splines[c_id]?.[e_id] || this.splines[c_id+1]?.[e_id]){
                        const spline = this.interpolateSplinesZeroGrad(alpha_c, this.getErosionInterpolatedSpline(c_id,e_id), this.getErosionInterpolatedSpline(c_id+1,e_id))
                        erosion_points.push({
                            location: this.erosions[e_id],
                            derivative: 0,
                            value: fixedNoises["weirdness"] !== undefined ? spline.apply(fixedNoises["weirdness"]) : spline.toJSON("weirdness")
                        })
                    }
                }
                return {
                    coordinate: "erosion",
                    points: erosion_points
                }
            }
        }

        const contitent_points = []
        for (let c_id = 0 ; c_id < this.continentalnesses.length ; c_id ++){

            if (fixedNoises["erosion"] !== undefined){
                const e_id = binarySearch(0, this.erosions.length, n => fixedNoises["erosion"] < this.erosions[n]) - 1
                const alpha_e = e_id < this.erosions.length - 1 && e_id >= 0 ? (fixedNoises["erosion"] - this.continentalnesses[e_id])/(fixedNoises["erosion"] - this.continentalnesses[e_id]) : undefined

                const spline = this.interpolateSplinesZeroGrad(alpha_e, this.getErosionInterpolatedSpline(c_id,e_id), this.getErosionInterpolatedSpline(c_id,e_id+1))
                contitent_points.push({
                    location: this.continentalnesses[c_id],
                    derivative: 0,
                    value: fixedNoises["weirdness"] !== undefined ? spline.apply(fixedNoises["weirdness"]) : spline.toJSON("weirdness")
                })
            } else {
                const erosion_points = []
                for (let e_id = 0 ; e_id < this.erosions.length ; e_id ++){
                    if (this.splines[c_id][e_id]){
                        erosion_points.push({
                            location: this.erosions[e_id],
                            derivative: 0,
                            value: fixedNoises["weirdness"] !== undefined ? this.splines[c_id][e_id].apply(fixedNoises["weirdness"]) : this.splines[c_id][e_id].toJSON("weirdness")
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
        }

        return {
            coordinate: "continents",
            points: contitent_points
        }
    }

    public export(){
        const contitent_points = []
        for (let c_id = 0 ; c_id < this.continentalnesses.length ; c_id ++){

            const erosion_points = []
            for (let e_id = 0 ; e_id < this.erosions.length ; e_id ++){
                if (this.splines[c_id][e_id]){
                    erosion_points.push({
                        location: this.erosions[e_id],
                        derivative: 0,
                        value: this.splines[c_id][e_id].toJSON("minecraft:overworld/ridges")
                    })
                }
            }

            contitent_points.push({
                location: this.continentalnesses[c_id],
                derivative: 0,
                value: {
                    coordinate: "minecraft:overworld/erosion",
                    points: erosion_points
                }
            })
        }

        return {
            coordinate: "minecraft:overworld/continents",
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
                splines[c_id][0] = new SimpleSpline([{ location: 0, value: p.value, derivative_left: 0, derivative_right: 0 }])
            } else if (p.value.coordinate === "erosion") {
                p.value.points.forEach((pp: { location: any; value: any; }) => {
                    const e_id = erosions.findIndex(e => e === pp.location)
                    if (typeof pp.value === "number") {
                        splines[c_id][e_id] = new SimpleSpline([{ location: 0, value: pp.value, derivative_left: 0, derivative_right: 0 }])
                    } else {
                        splines[c_id][e_id] = SimpleSpline.fromJSON(pp.value)
                    }
                })
            }
        })

        return new GridSpline(continentalnesses, erosions, splines)
    }

    private interpolateSplinesZeroGrad(alpha: number, a: SimpleSpline, b: SimpleSpline){
        if (a === undefined)
            return b
        if (b === undefined)
            return a

        const locationSet = new Set<number>()
        a.points.map(p => p.location).forEach(locationSet.add, locationSet)
        b.points.map(p => p.location).forEach(locationSet.add, locationSet)

        
        const points = Array.from(locationSet).sort((a,b) => a-b).map(l => {
            return {
                location: l, 
                value: GridSpline.interpolateZeroGrad(alpha, a.apply(l), b.apply(l)),
                derivative_left: GridSpline.interpolateZeroGrad(alpha, a.derivative(l, "left"), b.derivative(l, "left")),
                derivative_right: GridSpline.interpolateZeroGrad(alpha, a.derivative(l, "right"), b.derivative(l, "right"))
            }
        })

        return new SimpleSpline(points)
    }

    getErosionInterpolatedSpline(c_id: number, e_id:number) {
        if (c_id < 0 || c_id >= this.continentalnesses.length)
            return undefined

        if (e_id < 0 || e_id >= this.erosions.length)
            return undefined

        if (this.splines[c_id][e_id])
            return this.splines[c_id][e_id]

        var e_last: number
        for (var e = e_id - 1; e >= 0; e--) {
            if (this.splines[c_id][e]) {
                e_last = e
                break;
            }
        }

        var e_next: number
        for (var e = e_id + 1; e < this.erosions.length; e++) {
            if (this.splines[c_id][e]) {
                e_next = e
                break;
            }
        }

        if (e_last === undefined && e_next === undefined){
            return undefined
        } else if (e_next === undefined) { 
            return new SimpleSpline(Array.from(this.splines[c_id][e_last].points.map(p => Object.create(p))))
        } else if (e_last === undefined) {
            return new SimpleSpline(Array.from(this.splines[c_id][e_next].points.map(p => Object.create(p))))
        } else {
            const alpha = (this.erosions[e_id] - this.erosions[e_last])/(this.erosions[e_next] - this.erosions[e_last])

            return this.interpolateSplinesZeroGrad(alpha, this.splines[c_id][e_last], this.splines[c_id][e_next])
        }
    }

    createSpline(c_id: number, e_id: number) {
        this.splines[c_id][e_id] = this.getErosionInterpolatedSpline(c_id, e_id) ?? new SimpleSpline([{ location: 0, value: 0, derivative_left: 0, derivative_right: 0 }])
    }

}

