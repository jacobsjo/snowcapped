import { Climate } from "deepslate"
import { imageOverlay } from "leaflet"
import { min, size } from "lodash"
import { BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { UI } from "./UI"


type Handle = { handle_type: 'x' | 'y' | 'add_x' | 'add_y', id: number }

export class GridEditor {
    private builder: BiomeBuilder
    private title: HTMLInputElement
    private canvas: HTMLCanvasElement

    private splitIcon: Path2D

    private xs: number[]
    private ys: number[]

    constructor(builder: BiomeBuilder) {
        this.builder = builder

        this.title = document.getElementById("layoutName") as HTMLInputElement
        this.canvas = document.getElementById("gridEditorCanvas") as HTMLCanvasElement

        this.splitIcon = new Path2D("M17.995,17.995C29.992,5.999,45.716,0,61.439,0s31.448,5.999,43.445,17.995c11.996,11.997,17.994,27.721,17.994,43.444 c0,15.725-5.998,31.448-17.994,43.445c-11.997,11.996-27.722,17.995-43.445,17.995s-31.448-5.999-43.444-17.995 C5.998,92.888,0,77.164,0,61.439C0,45.716,5.998,29.992,17.995,17.995L17.995,17.995z M57.656,31.182 c0-1.84,1.492-3.332,3.333-3.332s3.333,1.492,3.333,3.332v27.383h27.383c1.84,0,3.332,1.492,3.332,3.332 c0,1.841-1.492,3.333-3.332,3.333H64.321v27.383c0,1.84-1.492,3.332-3.333,3.332s-3.333-1.492-3.333-3.332V65.229H30.273 c-1.84,0-3.333-1.492-3.333-3.333c0-1.84,1.492-3.332,3.333-3.332h27.383V31.182L57.656,31.182z M61.439,6.665 c-14.018,0-28.035,5.348-38.731,16.044C12.013,33.404,6.665,47.422,6.665,61.439c0,14.018,5.348,28.036,16.043,38.731 c10.696,10.696,24.713,16.044,38.731,16.044s28.035-5.348,38.731-16.044c10.695-10.695,16.044-24.714,16.044-38.731 c0-14.017-5.349-28.035-16.044-38.73C89.475,12.013,75.457,6.665,61.439,6.665L61.439,6.665z")

        var draggingHandle: Handle = undefined
        var dragStartPos: number
        var dragStartValue: number

        this.canvas.onmousemove = (evt: MouseEvent) => {
            const mouse_pos = this.getMousePosition(evt)
            if (draggingHandle) {
                const dragDelta = draggingHandle.handle_type === "x" ? mouse_pos.mouse_x - dragStartPos : mouse_pos.mouse_y - dragStartPos
                const width = this.canvas.width
                const height = this.canvas.height
                const size_x = 0.9 * width
                const size_y = 0.9 * height

                if (draggingHandle.handle_type === "x") {
                    const valueDelta = dragDelta / size_x * 2.4

                    const min_value = (draggingHandle.id === 0) ? -1.2 : this.xs[draggingHandle.id - 1]
                    const max_value = (draggingHandle.id === this.xs.length - 1) ? 1.2 : this.xs[draggingHandle.id + 1]

                    this.xs[draggingHandle.id] = this.snap(dragStartValue + valueDelta, min_value, max_value, 0.05)
                } else {
                    const valueDelta = dragDelta / size_y * 2.4

                    const min_value = (draggingHandle.id === 0) ? -1.2 : this.ys[draggingHandle.id - 1]
                    const max_value = (draggingHandle.id === this.ys.length - 1) ? 1.2 : this.ys[draggingHandle.id + 1]

                    this.ys[draggingHandle.id] = this.snap(dragStartValue + valueDelta, min_value, max_value, 0.05)
                }

                this.drawRect()

            } else {
                const handle = this.getHandle(mouse_pos)

                if (handle === undefined) {
                    this.canvas.style.cursor = "default"
                } else if (handle.handle_type === "x") {
                    this.canvas.style.cursor = "ew-resize"
                } else if (handle.handle_type === "y"){
                    this.canvas.style.cursor = "ns-resize"
                } else {
                    this.canvas.style.cursor = "pointer"
                }
            }
        }

        this.canvas.onclick = (evt: MouseEvent) => {
            const mouse_pos = this.getMousePosition(evt)
            const handle = this.getHandle(mouse_pos)

            if (handle === undefined || (handle.handle_type !== "add_x" && handle.handle_type !== "add_y"))
                return

            if (handle.handle_type === "add_x"){
                builder.splitParam("humidity", handle.id)
            } else {
                builder.splitParam("temperature", handle.id)
            }

            this.builder.hasChanges = true
            UI.getInstance().visualizationManager.invalidateIndices()
            UI.getInstance().refresh()
        }

        this.canvas.onmousedown = (evt: MouseEvent) => {
            const mouse_pos = this.getMousePosition(evt)
            const handle = this.getHandle(mouse_pos)

            if (handle === undefined || (handle.handle_type !== "x" && handle.handle_type !== "y"))
                return

            draggingHandle = handle
            dragStartPos = handle.handle_type === "x" ? mouse_pos.mouse_x : mouse_pos.mouse_y
            dragStartValue = handle.handle_type === "x" ? this.xs[handle.id] : this.ys[handle.id]
        }

        this.canvas.onmouseup = (evt: MouseEvent) => {
            if (draggingHandle) {

                if (draggingHandle.handle_type === "x") {
                    const min_value = (draggingHandle.id === 0) ? undefined : this.xs[draggingHandle.id - 1]
                    const max_value = (draggingHandle.id === this.xs.length - 1) ? undefined : this.xs[draggingHandle.id + 1]

                    if (this.xs[draggingHandle.id] === min_value || this.xs[draggingHandle.id] === max_value) {
                        if (this.xs.length <= 2 || !confirm("Deleting Segment of Layout. This will delete this segment from every defined Layout. Continue?")) {
                            this.xs[draggingHandle.id] = dragStartValue
                            this.drawRect()
                            draggingHandle = undefined
                            this.canvas.style.cursor = "default"
                            return
                        }
                    }

                    if (draggingHandle.id === 0) {
                        this.builder.humidities[0][1] = new Climate.Param(this.xs[0], this.builder.humidities[0][1].max)
                    } else if (draggingHandle.id < this.xs.length - 1) {
                        this.builder.humidities[draggingHandle.id - 1][1] = new Climate.Param(this.builder.humidities[draggingHandle.id - 1][1].min, this.xs[draggingHandle.id])
                        this.builder.humidities[draggingHandle.id][1] = new Climate.Param(this.xs[draggingHandle.id], this.builder.humidities[draggingHandle.id][1].max)
                    } else {
                        this.builder.humidities[draggingHandle.id - 1][1] = new Climate.Param(this.builder.humidities[draggingHandle.id - 1][1].min, this.xs[draggingHandle.id])
                    }

                    if (this.xs[draggingHandle.id] === min_value) {
                        this.builder.deleteParam("humidity", draggingHandle.id - 1)
                    } else if (this.xs[draggingHandle.id] === max_value) {
                        this.builder.deleteParam("humidity", draggingHandle.id)
                    }

                    this.builder.hasChanges = true
                } else {
                    const min_value = (draggingHandle.id === 0) ? undefined : this.ys[draggingHandle.id - 1]
                    const max_value = (draggingHandle.id === this.ys.length - 1) ? undefined : this.ys[draggingHandle.id + 1]

                    if (this.ys[draggingHandle.id] === min_value || this.ys[draggingHandle.id] === max_value) {
                        if (this.ys.length <= 2 || !confirm("Deleting Segment of Layout. This will delete this segment from every defined Layout. Continue?")) {
                            this.ys[draggingHandle.id] = dragStartValue
                            this.drawRect()
                            draggingHandle = undefined
                            this.canvas.style.cursor = "default"
                            return
                        }
                    }

                    if (draggingHandle.id === 0) {
                        this.builder.temperatures[0][1] = new Climate.Param(this.ys[0], this.builder.temperatures[0][1].max)
                    } else if (draggingHandle.id < this.ys.length - 1) {
                        this.builder.temperatures[draggingHandle.id - 1][1] = new Climate.Param(this.builder.temperatures[draggingHandle.id - 1][1].min, this.ys[draggingHandle.id])
                        this.builder.temperatures[draggingHandle.id][1] = new Climate.Param(this.ys[draggingHandle.id], this.builder.temperatures[draggingHandle.id][1].max)
                    } else {
                        this.builder.temperatures[draggingHandle.id - 1][1] = new Climate.Param(this.builder.temperatures[draggingHandle.id - 1][1].min, this.ys[draggingHandle.id])
                    }

                    if (this.ys[draggingHandle.id] === min_value) {
                        this.builder.deleteParam("temperature", draggingHandle.id - 1)
                    } else if (this.ys[draggingHandle.id] === max_value) {
                        this.builder.deleteParam("temperature", draggingHandle.id)
                    }

                    this.builder.hasChanges = true
                }

                draggingHandle = undefined
                this.canvas.style.cursor = "default"

                UI.getInstance().visualizationManager.invalidateIndices()
                UI.getInstance().refresh()

            }
        }
    }

    private snap(value: number, min: number, max: number, gap: number) {
        if (value < min + 0.5 * gap) return min
        if (value > max - 0.5 * gap) return max
        if (value < min + gap) return min + gap
        if (value > max - gap) return max - gap
        return value
    }

    private getHandle(mouse_pos: { mouse_x: number, mouse_y: number }): Handle | undefined {
        const width = this.canvas.width
        const height = this.canvas.height
        const cx_min = 0.07 * width
        const cy_min = 0.07 * height
        const size_x = 0.93 * width
        const size_y = 0.93 * height

        for (let ix = 0; ix < this.xs.length - 1; ix++) {
            if (this.xs[ix + 1] - this.xs[ix] >= 0.1) {
                const x = (this.xs[ix] + this.xs[ix + 1]) / 2
                if (mouse_pos.mouse_x > (x / 2.4 + 0.5) * size_x + cx_min - 27.5 && mouse_pos.mouse_y > cy_min - 60 &&
                    mouse_pos.mouse_x < (x / 2.4 + 0.5) * size_x + cx_min + 27.5 && mouse_pos.mouse_y < cy_min - 5) {
                    return {handle_type: "add_x", id: ix}
                }
            }
        }

        for (let iy = 0; iy < this.ys.length - 1; iy++) {
            if (this.ys[iy + 1] - this.ys[iy] >= 0.1) {
                const y = (this.ys[iy] + this.ys[iy + 1]) / 2
                if (mouse_pos.mouse_x > cx_min - 60 && mouse_pos.mouse_y > (y / 2.4 + 0.5) * size_y + cy_min - 27.5 &&
                    mouse_pos.mouse_x < cx_min - 5 && mouse_pos.mouse_y < (y / 2.4 + 0.5) * size_y + cy_min + 27.5) {
                    return {handle_type: "add_y", id: iy}
                }
            }
        }

        var handle: Handle = undefined
        var min_distance: number = 41

        for (let id = 0; id < this.xs.length; id++) {
            const x = this.xs[id]

            const distance = Math.abs(mouse_pos.mouse_x - ((x / 2.4 + 0.5) * size_x + cx_min))
            if (distance < 40 && distance < min_distance) {
                handle = { handle_type: 'x', id: id }
                min_distance = distance
            }
        }

        for (let id = 0; id < this.ys.length; id++) {
            const y = this.ys[id]
            const distance = Math.abs(mouse_pos.mouse_y - ((y / 2.4 + 0.5) * size_y + cy_min))
            if (distance < 40 && distance < min_distance) {
                handle = { handle_type: 'y', id: id }
                min_distance = distance
            }
        }

        return handle
    }

    private drawRect() {
        const width = this.canvas.width
        const height = this.canvas.height
        const cx_min = 0.07 * width
        const cy_min = 0.07 * height
        const size_x = 0.93 * width
        const size_y = 0.93 * height

        const ctx = this.canvas.getContext('2d')
        ctx.clearRect(0, 0, width, height)



        const y_min = this.ys[0]
        const y_max = this.ys[this.ys.length - 1]


        ctx.fillStyle = "#222222"
        ctx.fillRect(cx_min, cy_min, size_x, size_y)

        for (let ix = 0; ix < this.xs.length; ix++) {
            const x = this.xs[ix]

            ctx.strokeStyle = (this.xs[ix - 1] === x) ? "red" : "white"
            ctx.lineWidth = 3

            ctx.setLineDash([1, 0])
            ctx.beginPath()
            ctx.moveTo((x / 2.4 + 0.5) * size_x + cx_min, (y_min / 2.4 + 0.5) * size_y + cy_min)
            ctx.lineTo((x / 2.4 + 0.5) * size_x + cx_min, (y_max / 2.4 + 0.5) * size_y + cy_min)
            ctx.stroke()

            ctx.setLineDash([5, 10])
            ctx.beginPath()
            ctx.moveTo((x / 2.4 + 0.5) * size_x + cx_min, cy_min)
            ctx.lineTo((x / 2.4 + 0.5) * size_x + cx_min, (y_min / 2.4 + 0.5) * size_y + cy_min)
            ctx.stroke()

            ctx.fillStyle = "#222222"
            ctx.fillRect((x / 2.4 + 0.5) * size_x + cx_min - 40, cy_min - 60, 80, 55)

            ctx.fillStyle = (this.xs[ix - 1] === x) ? "red" : "white"
            ctx.font = '25px serif';
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(x.toFixed(2), (x / 2.4 + 0.5) * size_x + cx_min, cy_min - 30)
        }

        for (let ix = 0; ix < this.xs.length - 1; ix++) {
            if (this.xs[ix + 1] - this.xs[ix] >= 0.1) {
                const x = (this.xs[ix] + this.xs[ix + 1]) / 2
                ctx.fillStyle = "#222244"
                ctx.fillRect((x / 2.4 + 0.5) * size_x + cx_min - 27.5, cy_min - 60, 55, 55)
                ctx.translate((x / 2.4 + 0.5) * size_x + cx_min - 14, cy_min - 47.5)
                ctx.scale(0.25, 0.25)
                ctx.fillStyle = "white"
                ctx.fill(this.splitIcon)
                ctx.resetTransform()
            }
        }


        const x_min = this.xs[0]
        const x_max = this.xs[this.xs.length - 1]

        for (let iy = 0; iy < this.ys.length; iy++) {
            const y = this.ys[iy]
            ctx.strokeStyle = (this.ys[iy - 1] === y) ? "red" : "white"
            ctx.lineWidth = 3

            ctx.setLineDash([1, 0])
            ctx.beginPath()
            ctx.moveTo((x_min / 2.4 + 0.5) * size_x + cx_min, (y / 2.4 + 0.5) * size_y + cy_min)
            ctx.lineTo((x_max / 2.4 + 0.5) * size_x + cx_min, (y / 2.4 + 0.5) * size_y + cy_min)
            ctx.stroke()

            ctx.setLineDash([5, 10])
            ctx.beginPath()
            ctx.moveTo(cx_min, (y / 2.4 + 0.5) * size_y + cy_min)
            ctx.lineTo((x_min / 2.4 + 0.5) * size_x + cx_min, (y / 2.4 + 0.5) * size_y + cy_min)
            ctx.stroke()

            ctx.fillStyle = "#222222"
            ctx.fillRect(cx_min - 85, (y / 2.4 + 0.5) * size_y + cy_min - 27.5, 80, 55)

            ctx.fillStyle = (this.ys[iy - 1] === y) ? "red" : "white"
            ctx.font = '25px serif';
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(y.toFixed(2), cx_min - 42.5, (y / 2.4 + 0.5) * size_y + cy_min)
        }

        for (let iy = 0; iy < this.ys.length - 1; iy++) {
            if (this.ys[iy + 1] - this.ys[iy] >= 0.1) {
                const y = (this.ys[iy] + this.ys[iy + 1]) / 2
                ctx.fillStyle = "#222244"
                ctx.fillRect(cx_min - 60, (y / 2.4 + 0.5) * size_y + cy_min - 27.5, 55, 55)
                ctx.fillStyle = "white"
                ctx.translate(cx_min - 47.5, (y / 2.4 + 0.5) * size_y + cy_min - 15)
                ctx.scale(0.25, 0.25)
                ctx.fillStyle = "white"
                ctx.fill(this.splitIcon)
                ctx.resetTransform()
            }
        }


    }

    getMousePosition(evt: MouseEvent): { mouse_x: number, mouse_y: number } {
        const rect = this.canvas.getBoundingClientRect()
        const scaleX = this.canvas.width / rect.width
        const scaleY = this.canvas.height / rect.height

        const canvasMouseX = (evt.clientX - rect.left) * scaleX
        const canvasMouseY = (evt.clientY - rect.top) * scaleY

        return { mouse_x: canvasMouseX, mouse_y: canvasMouseY }
    }

    refresh() {
        this.canvas.parentElement.classList.remove("hidden")
        this.title.readOnly = false
        this.title.value = "Modify Layouts"

        this.xs = this.builder.humidities.map(t => t[1].max)
        this.xs.unshift(this.builder.humidities[0][1].min)

        this.ys = this.builder.temperatures.map(t => t[1].max)
        this.ys.unshift(this.builder.temperatures[0][1].min)

        this.drawRect()
    }

    hide() {
        this.canvas.parentElement.classList.add("hidden")
    }

}