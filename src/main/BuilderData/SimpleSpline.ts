import { binarySearch, lerp } from "deepslate"

export class SimpleSpline {
	constructor(
		public points: {
			location: number,
			value: number,
			derivative_left: number
			derivative_right: number
		}[]
	) {
		this.order()
	}

	public toJSON(){
		const points = []

		for (const point of this.points){
			points.push({location: point.location, value: point.value, derivative: point.derivative_left})
			if (point.derivative_left !== point.derivative_right){
				points.push({location: point.location, value: point.value, derivative: point.derivative_right})
			}
		}

		return {
			coordinate: "weirdness",
			points: points
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
			derivative_left: number
			derivative_right: number
		}[] = []

		const isRidge = json.coordinate === "ridges"
		for (const point of json.points) {
			const location = point.location
			const derivative = point.derivative
			const value = (typeof point.value === 'number') ? {apply(_w:number){return point.value}} : SimpleSpline.fromJSON(point.value)

			if (!isRidge){
				if (points.length > 0 && Math.abs(points[points.length-1].location - location) < 1e-5){
					points[points.length-1].derivative_right = derivative
				} else {
					points.push({location: location, derivative_left: derivative, derivative_right: derivative, value: value.apply(location)})
				}
			} else {
				const weirdnesses = this.inversPeaksAndValleys(location)
				for (let i = 0 ; i < weirdnesses.weirdnesses.length ; i++){
					const derivative_factor = weirdnesses.derivative_factors[i]
					if (typeof derivative_factor === "number"){
						points.push({location: weirdnesses.weirdnesses[i], derivative_left: derivative * derivative_factor, derivative_right: derivative * derivative_factor, value: value.apply(weirdnesses.weirdnesses[i])})
					} else {
						points.push({location: weirdnesses.weirdnesses[i], derivative_left: derivative * derivative_factor[0], derivative_right: derivative * derivative_factor[1], value: value.apply(weirdnesses.weirdnesses[i])})
					}
				}
			}
		}

		return new SimpleSpline(points)
	}

	public static peaksAndValleys(weirdness: number) {
		return -(Math.abs(Math.abs(weirdness) - 0.6666667) - 0.33333334) * 3.0
	}

	private static inversPeaksAndValleys(ridge: number): { weirdnesses: number[], derivative_factors: (number|[number, number])[] } {
		if (ridge > 1 || ridge < -1) return { weirdnesses: [], derivative_factors: [] }

		const a = ridge / 3.0 - 0.33333334
		if (a - 0.6666667 < -1.5) {
			return { weirdnesses: [-a - 0.6666667, a + 0.6666667], derivative_factors: [-3, 3] }
		} else if (ridge === 1) {
			return { weirdnesses: [-0.6666667, +0.6666667], derivative_factors: [[3, -3], [3, -3]]}
		} else if (ridge === -1) {
			return { weirdnesses: [-1.33333334, 0, +1.33333334], derivative_factors: [3, [-3, 3], -3]}
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
			return this.points[0].value + this.points[0].derivative_left * (coordinate - this.points[0].location)
		}
		if (i === n) {
			return this.points[n].value + this.points[n].derivative_right * (coordinate - this.points[n].location)
		}

		const loc0 = this.points[i].location
		const loc1 = this.points[i + 1].location
		const der0 = this.points[i].derivative_right
		const der1 = this.points[i + 1].derivative_left
		const f = (coordinate - loc0) / (loc1 - loc0)

		const val0 = this.points[i].value
		const val1 = this.points[i + 1].value

		const f8 = der0 * (loc1 - loc0) - (val1 - val0)
		const f9 = -der1 * (loc1 - loc0) + (val1 - val0)
		const f10 = lerp(f, val0, val1) + f * (1.0 - f) * lerp(f, f8, f9)
		return f10
	}

	public derivative(c: number, direction: "left" | "right" = "left"){
		const coordinate = c

		const exactPoint = this.points.find(p => p.location === coordinate)
		if (exactPoint){
			if (direction === "left")
				return exactPoint.derivative_left
			else 
				return exactPoint.derivative_right
		}

		const i = binarySearch(0, this.points.length, n => coordinate < this.points[n].location) - 1
		const n = this.points.length - 1

		if (i < 0) {
			return this.points[0].derivative_left
		}
		if (i === n) {
			return this.points[n].derivative_right
		}

		const loc0 = this.points[i].location
		const loc1 = this.points[i + 1].location
		const der0 = this.points[i].derivative_right
		const der1 = this.points[i + 1].derivative_left
		const f = (coordinate - loc0) / (loc1 - loc0)

		const val0 = this.points[i].value
		const val1 = this.points[i + 1].value

		const f8 = der0 * (loc1 - loc0) - (val1 - val0)
		const f9 = -der1 * (loc1 - loc0) + (val1 - val0)

		return (-val0 + val1 + f8 + 2 * f * (f9 - 2*f8) + 3 * f * f * (f8 - f9)) / (loc1 - loc0)
	}

}