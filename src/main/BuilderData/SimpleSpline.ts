import { binarySearch, lerp } from "deepslate"

export class SimpleSpline {
	constructor(
		public points: {
			location: number,
			value: number,
			derivative: number
		}[]
	) {
		this.order()
	}

	public toJSON(){
		return {
			coordinate: "weirdness",
			points: this.points
		}
	}

	public static fromJSON(json: any): SimpleSpline {
		if (json.coordinate !== "ridges" && json.coordinate !== "weirdness") {
			console.warn("Trying to create SimpleSpline from non weirdness parameter")
			return undefined
		}

		const points: {
			location: number,
			value: number,
			derivative: number
		}[] = []

		const isRidge = json.coordinate === "ridges"
		for (const point of json.points) {
			const location = point.location
			const derivative = point.derivative
			const value = (typeof point.value === 'number') ? {apply(_w:number){return point.value}} : SimpleSpline.fromJSON(point.value)

			if (!isRidge){
				points.push({location: location, derivative: derivative, value: value.apply(location)})
			} else {
				const weirdnesses = this.inversPeaksAndValleys(location)
				for (let i = 0 ; i < weirdnesses.weirdnesses.length ; i++){
					points.push({location: weirdnesses.weirdnesses[i], derivative: derivative * weirdnesses.derivative_factors[i], value: value.apply(weirdnesses.weirdnesses[i])})
				}
			}
		}

		return new SimpleSpline(points)
	}

	public static peaksAndValleys(weirdness: number) {
		return -(Math.abs(Math.abs(weirdness) - 0.6666667) - 0.33333334) * 3.0
	}

	private static inversPeaksAndValleys(ridge: number): { weirdnesses: number[], derivative_factors: number[] } {
		if (ridge > 1 || ridge < -1) return { weirdnesses: [], derivative_factors: [] }

		const a = ridge / 3.0 - 0.33333334
		if (a - 0.6666667 < -1) {
			return { weirdnesses: [-a - 0.6666667, a + 0.6666667], derivative_factors: [-3, 3] }
		} else {
			return { weirdnesses: [a - 0.6666667, -a - 0.6666667, a + 0.6666667, -a + 0.6666667], derivative_factors: [3, -3, 3, -3] }
		}
	}

	public order() {
		this.points.sort((a, b) => a.location - b.location)
	}

	public apply(c: number) {
		const coordinate = c
		const i = binarySearch(0, this.points.length, n => coordinate < this.points[n].location) - 1
		const n = this.points.length - 1
		if (i < 0) {
			return this.points[0].value + this.points[0].derivative * (coordinate - this.points[0].location)
		}
		if (i === n) {
			return this.points[n].value + this.points[n].derivative * (coordinate - this.points[n].location)
		}
		const loc0 = this.points[i].location
		const loc1 = this.points[i + 1].location
		const der0 = this.points[i].derivative
		const der1 = this.points[i + 1].derivative
		const f = (coordinate - loc0) / (loc1 - loc0)

		const val0 = this.points[i].value
		const val1 = this.points[i + 1].value

		const f8 = der0 * (loc1 - loc0) - (val1 - val0)
		const f9 = -der1 * (loc1 - loc0) + (val1 - val0)
		const f10 = lerp(f, val0, val1) + f * (1.0 - f) * lerp(f, f8, f9)
		return f10
	}

}