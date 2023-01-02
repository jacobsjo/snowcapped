import { ABElement } from "../BuilderData/ABBiome";
import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder, PartialMultiNoiseIndexes } from "../BuilderData/BiomeBuilder";
import { MenuManager } from "./MenuManager";
import { UI } from "./UI";
import { BiomeGridRenderer } from "./Renderer/BiomeGridRenderer";
import { Grid } from "../BuilderData/Grid";
import { thresholdSturges } from "d3";
import { max } from "lodash";

function lerp(a: number, b: number, l: number) {
    return ((1 - l) * a + l * b)
}
export class BiomeGridEditor {
    private builder: BiomeBuilder
    private title: HTMLInputElement
    private canvas: HTMLCanvasElement
    private backButton: HTMLElement

    private mouse_position: { mouse_x: number, mouse_y: number }
    layout: Grid

    constructor(builder: BiomeBuilder) {
        this.builder = builder

        this.title = document.getElementById("layoutName") as HTMLInputElement
        this.canvas = document.getElementById("layoutEditorCanvas") as HTMLCanvasElement
        this.backButton = document.getElementById("backButton")

        const tooltip = document.getElementById("layoutEditorTooltip")
        const tooltip_name = tooltip.getElementsByClassName("name")[0] as HTMLElement
        const tooltip_noises = tooltip.getElementsByClassName("noises")[0] as HTMLElement
        const tooltip_noise_x = tooltip.getElementsByClassName("noise_x")[0] as HTMLElement
        const tooltip_noise_y = tooltip.getElementsByClassName("noise_y")[0] as HTMLElement

        this.title.onchange = (evt: Event) => {
            this.layout.name = this.title.value
            this.builder.hasChanges = true
            UI.getInstance().refresh({})
        }

        this.canvas.onmousemove = (evt: MouseEvent) => {

            const renderer = this.layout.getRenderer() as BiomeGridRenderer
            this.mouse_position = this.getMousePosition(evt)
            const ids = renderer.getIdsFromPosition(0, 0, this.canvas.width, this.canvas.height, this.mouse_position.mouse_x, this.mouse_position.mouse_y)
            if (ids === undefined || ids.indexes.depth === -1) {
                tooltip.classList.add("hidden")
                MenuManager.toggleAction("paint", false)
                MenuManager.toggleAction("paint-mode", false)
                MenuManager.toggleAction("open", false)
                return
            }


            MenuManager.toggleAction("paint", true)

            this.canvas.focus()

            tooltip.style.left = (Math.min(evt.pageX + 20, document.body.clientWidth - tooltip.clientWidth)) + "px"
            tooltip.style.top = (evt.pageY + 15) + "px"
            tooltip.classList.remove("hidden")
  
            let element = this.layout.lookup(ids.indexes, ids.mode)

            
            if (this.layout instanceof Grid) {
                if (element instanceof ABElement) {
                    MenuManager.toggleAction("paint-mode", false)
                    element = element.getElement(ids.mode)
                } else {
                    MenuManager.toggleAction("paint-mode", true)
                }
            } else {
                MenuManager.toggleAction("paint-mode", false)
            }

            if (element instanceof Grid && element.getType() === "slice") {
                tooltip_name.innerHTML = "&crarr; " + element.name + " (Slice)"
                MenuManager.toggleAction("open", true)
                MenuManager.toggleAction("remove", true)
            } else if (element instanceof Grid  && element.getType() === "layout") {
                tooltip_name.innerHTML = "&crarr; " + element.name + " (Layout)"
                MenuManager.toggleAction("open", true)
                MenuManager.toggleAction("remove", true)
            } else if (element instanceof Biome) {
                tooltip_name.innerHTML = element.name
                MenuManager.toggleAction("open", false)
                MenuManager.toggleAction("remove", true)
            } else {
                tooltip_name.innerHTML = "Unassigned"
                MenuManager.toggleAction("open", false)
                MenuManager.toggleAction("remove", false)
            }

            tooltip_noises.classList.remove("hidden")

            if (this.layout.getType() === "dimension"){
                tooltip_noise_x.innerHTML = "Weirdness: [" + this.builder.gridCells.weirdness[ids.indexes.weirdness].toFixed(3) + ", " + this.builder.gridCells.weirdness[ids.indexes.weirdness + 1].toFixed(3) + "]"
                tooltip_noise_y.innerHTML = "Depth: [" + this.builder.gridCells.depth[ids.indexes.depth].toFixed(3) + ", " + this.builder.gridCells.depth[ids.indexes.depth + 1].toFixed(3) + "]"
            } else if (this.layout.getType() === "slice"){
                tooltip_noise_x.innerHTML = "Erosion: [" + this.builder.gridCells.erosion[ids.indexes.erosion].toFixed(3) + ", " + this.builder.gridCells.erosion[ids.indexes.erosion + 1].toFixed(3) + "]"
                tooltip_noise_y.innerHTML = "Continentalness: [" + this.builder.gridCells.continentalness[ids.indexes.continentalness].toFixed(3) + ", " + this.builder.gridCells.continentalness[ids.indexes.continentalness + 1].toFixed(3) + "]"
            } else if (this.layout.getType() === "layout"){
                tooltip_noise_x.innerHTML = "Humidity: [" + this.builder.gridCells.humidity[ids.indexes.humidity].toFixed(3) + ", " + this.builder.gridCells.humidity[ids.indexes.humidity + 1].toFixed(3) + "]"
                tooltip_noise_y.innerHTML = "Temperature: [" + this.builder.gridCells.temperature[ids.indexes.temperature].toFixed(3) + ", " + this.builder.gridCells.temperature[ids.indexes.temperature + 1].toFixed(3) + "]"
            }

                // Update Spline display in slices
            if (this.layout instanceof Grid && this.layout.getType() === "slice"){
                const c_min = builder.gridCells.continentalness[ids.indexes.continentalness]
                const c_max = builder.gridCells.continentalness[ids.indexes.continentalness + 1]
                const c = lerp(c_min, c_max, ids.local_t)
    
                const e_min = builder.gridCells.erosion[ids.indexes.erosion]
                const e_max = builder.gridCells.erosion[ids.indexes.erosion + 1]
                const e = lerp(e_min, e_max, ids.local_h)

                UI.getInstance().splineDisplayManager.setPos({c: c, e: e})
                UI.getInstance().splineDisplayManager.refresh()
            }
        }

        this.canvas.onmouseleave = (evt: MouseEvent) => {
            tooltip.classList.add("hidden")
            UI.getInstance().splineDisplayManager.setPos(undefined)
            UI.getInstance().splineDisplayManager.refresh()

            MenuManager.toggleAction("paint", false)
            MenuManager.toggleAction("paint-mode", false)
            MenuManager.toggleAction("open", false)
            MenuManager.toggleAction("remove", false)

        }

        this.canvas.onclick = (evt: MouseEvent) => {
            const renderer = this.layout.getRenderer() as BiomeGridRenderer
            const mouse_position = this.getMousePosition(evt)
            const ids = renderer.getIdsFromPosition(0, 0, this.canvas.width, this.canvas.height, mouse_position.mouse_x, mouse_position.mouse_y)
            if (ids === undefined) {
                return
            }

            this.handleInteraction(ids.indexes, ids.mode, evt.ctrlKey || evt.metaKey ? "add_alt" : evt.altKey ? "pick" : "add")
        }

        this.canvas.onauxclick = (evt: MouseEvent) => {
            if (evt.button === 1) {
                const renderer = this.layout.getRenderer() as BiomeGridRenderer
                const mouse_position = this.getMousePosition(evt)
                const ids = renderer.getIdsFromPosition(0, 0, this.canvas.width, this.canvas.height, mouse_position.mouse_x, mouse_position.mouse_y)
                if (ids === undefined) {
                    return
                }

                this.handleInteraction(ids.indexes, ids.mode, "pick")
            }
        }




        this.canvas.oncontextmenu = (evt: MouseEvent) => {
            const renderer = this.layout.getRenderer() as BiomeGridRenderer
            const mouse_position = this.getMousePosition(evt)
            const ids = renderer.getIdsFromPosition(0, 0, this.canvas.width, this.canvas.height, mouse_position.mouse_x, mouse_position.mouse_y)
            if (ids === undefined) {
                return
            }

            this.handleInteraction(ids.indexes, ids.mode, "open")
            evt.preventDefault()
        }

        this.canvas.onkeydown = (evt: KeyboardEvent) => {
            if (evt.key === "z" && (evt.ctrlKey || evt.metaKey)) {
                this.undo()
                UI.getInstance().refresh({
                    biome: {} // TODO define indices
                 })
            }
        }

        this.canvas.onkeyup = (evt: KeyboardEvent) => {
            if (evt.key === "Delete") {
                const renderer = this.layout.getRenderer() as BiomeGridRenderer
                const mouse_position = this.mouse_position
                const ids = renderer.getIdsFromPosition(0, 0, this.canvas.width, this.canvas.height, mouse_position.mouse_x, mouse_position.mouse_y)
                if (ids === undefined) {
                    return
                }

                this.handleInteraction(ids.indexes, ids.mode, "remove")
                evt.preventDefault
            }
        }

        this.backButton.onclick = () => {
            UI.getInstance().sidebarManager.back()
        }
    }

    highlight(x_idx: number, y_idx: number){
        const element = this.builder.getLayoutElement(UI.getInstance().sidebarManager.openedElement.key)
        if (element instanceof Grid)
            this.layout = element
        this.layout.getRenderer().setHighlight(x_idx, y_idx)
    }

    getMousePosition(evt: MouseEvent): { mouse_x: number, mouse_y: number } {
        const rect = this.canvas.getBoundingClientRect()
        const scaleX = this.canvas.width / rect.width
        const scaleY = this.canvas.height / rect.height

        const canvasMouseX = (evt.clientX - rect.left) * scaleX
        const canvasMouseY = (evt.clientY - rect.top) * scaleY

        return { mouse_x: canvasMouseX, mouse_y: canvasMouseY }
    }

    handleInteraction(indexes: PartialMultiNoiseIndexes, mode: "A" | "B", action: "add" | "add_alt" | "pick" | "open" | "remove") {
       
        if (indexes.depth === -1){
            if (action === "add" || action === "add_alt"){
                this.builder.modes[indexes.weirdness] = (this.builder.modes[indexes.weirdness] === "A") ? "B" : "A"
            }
            
            UI.getInstance().refresh({biome: {weirdness: indexes.weirdness}})
            return
        }

        const element = this.layout.lookup(indexes, mode)

        let exact_element = element
        if (exact_element instanceof ABElement) {
            if (mode === "A") {
                exact_element = this.builder.getLayoutElement(exact_element.elementA)
            } else {
                exact_element = this.builder.getLayoutElement(exact_element.elementB)
            }
        }

        var selectedElement = UI.getInstance().sidebarManager.selectedElement?.key;

        if (action === "remove") {
            selectedElement = "unassigned"
            action = "add"
        }

        if (action === "pick") {
            UI.getInstance().sidebarManager.selectElement({type: exact_element instanceof Grid ? exact_element.getType() : "biome", key: selectedElement = exact_element.getKey()})
        } else if ((action === "add" || action === "add_alt") && selectedElement !== undefined) {
            
            var se = this.builder.gridElements.get(selectedElement)
            
            if (se === undefined){
                const vanillaBiome = this.builder.vanillaBiomes.get(selectedElement)
                if (vanillaBiome !== undefined){
                    this.builder.registerBiome(vanillaBiome)
                }
                se = vanillaBiome
            }
            
            //Cycle Check
            if (se.has(this.layout.getKey(), indexes))
                return

            if (!se && this.builder.vanillaBiomes.has(selectedElement)) {
                this.builder.registerGridElement(this.builder.vanillaBiomes.get(selectedElement))
            }

            if (action === "add_alt" && !(element instanceof ABElement) /*&& this.layout instanceof Layout*/) {
                // add alternate
                if (mode === "A") {
                    this.layout.set(indexes, selectedElement + "/" + element.getKey())
                } else {
                    this.layout.set(indexes, element.getKey() + "/" + selectedElement)
                }
            } else {
                if (element instanceof ABElement) {
                    if (mode === "A") {
                        if (selectedElement === element.elementB) {
                            this.layout.set(indexes, selectedElement)
                        } else {
                            this.layout.set(indexes, selectedElement + "/" + element.elementB)
                        }
                    } else {
                        if (selectedElement === element.elementA) {
                            this.layout.set(indexes, selectedElement)
                        } else {
                            this.layout.set(indexes, element.elementA + "/" + selectedElement)
                        }
                    }
                } else {
                    this.layout.set(indexes, selectedElement)
                }
            }
            UI.getInstance().refresh({biome: indexes})
        } else if (action === "open") {
            // Right mouse button
            // open

            if (exact_element instanceof Grid) {
                UI.getInstance().sidebarManager.openElement({type:exact_element.getType(), key: exact_element.getKey()}, true)
            }
        }
    }

    undo() {
        this.layout.undo()
    }

    refresh() {
        this.canvas.parentElement.classList.remove("hidden")
        this.title.readOnly = false
        const type = UI.getInstance().sidebarManager.openedElement.type
        const element = type === "dimension" ? this.builder.dimension : this.builder.getLayoutElement(UI.getInstance().sidebarManager.openedElement.key)
        if (element instanceof Grid)
            this.layout = element
        this.title.value = this.layout.name

//        if (this.layout instanceof Grid && this.layout.getType() === "slice"){
//            UI.getInstance().splineDisplayManager.setWeirdnesses(this.builder.weirdnesses.filter(w => (w[2] === this.layout.getKey())))
//        } else {
            UI.getInstance().splineDisplayManager.setWeirdnesses([])
            UI.getInstance().splineDisplayManager.setPos(undefined)            
//        }

        const size = this.layout.getSize()

        // Set labels based on grid type
        if (type === "dimension"){
            UI.getInstance().setLabels("Weirdness", "Depth")
            size[1]++  // extra size for mode selector
        } else if (type === "slice"){
            UI.getInstance().setLabels("Erosion", "Continentalness")
        } else if (type === "layout")
            UI.getInstance().setLabels("Humidity", "Temperature")

        const maxSize = Math.max(size[0], size[1])

        this.canvas.width = 2500 / maxSize * size[0]
        this.canvas.height = 2500 / maxSize * size[1]
        const ctx = this.canvas.getContext('2d')
        ctx.clearRect(0,0, this.canvas.width, this.canvas.height)
        this.layout.getRenderer().setDirty()
        this.layout.getRenderer().draw(ctx, 0, 0, this.canvas.width, this.canvas.height, {}, false)

        this.backButton.classList.toggle("hidden", UI.getInstance().sidebarManager.parentElements.length == 0)
    }

    hide() {
        this.canvas.parentElement.classList.add("hidden")
    }
}


