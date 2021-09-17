import { ABElement } from "../BuilderData/ABBiome";
import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder } from "../BuilderData/BiomeBuilder";
import { Layout } from "../BuilderData/Layout";
import { LayoutElementUnassigned } from "../BuilderData/LayoutElementUnassigned";
import { LayoutGridRenderer } from "./Renderer/LayoutGridRenderer";
import { UI } from "./UI";


export class LayoutEditor {
    private builder: BiomeBuilder
    private title: HTMLInputElement
    private canvas: HTMLCanvasElement

    private mouse_position: { mouse_x: number, mouse_y: number }

    layout: Layout

    constructor(builder: BiomeBuilder) {
        this.builder = builder

        this.title = document.getElementById("layoutName") as HTMLInputElement
        this.canvas = document.getElementById("layoutEditorCanvas") as HTMLCanvasElement

        const tooltip = document.getElementById("layoutEditorTooltip")
        const tooltip_name = tooltip.getElementsByClassName("name")[0] as HTMLElement
        const tooltip_instructions = tooltip.getElementsByClassName("instructions")[0] as HTMLElement
        const tooltip_instruction_change = tooltip_instructions.getElementsByClassName("change")[0] as HTMLElement
        const tooltip_instruction_remove = tooltip_instructions.getElementsByClassName("remove")[0] as HTMLElement
        const tooltip_instruction_add_alt = tooltip_instructions.getElementsByClassName("add_alt")[0] as HTMLElement
        const tooltip_instruction_open = tooltip_instructions.getElementsByClassName("open")[0] as HTMLElement

        this.title.onchange = (evt: Event) => {
            this.layout.name = this.title.value
            UI.getInstance().refresh()
        }

        this.canvas.onmousemove = (evt: MouseEvent) => {

            const renderer = this.layout.getRenderer() as LayoutGridRenderer
            this.mouse_position = this.getMousePosition(evt)
            const ids = renderer.getIdsFromPosition(0, 0, this.canvas.width, this.canvas.height, this.mouse_position.mouse_x, this.mouse_position.mouse_y)
            if (ids === undefined) {
                tooltip.classList.add("hidden")
                return
            }
            this.canvas.focus()

            tooltip.style.left = (evt.pageX + 20) + "px"
            tooltip.style.top = (evt.pageY + 15) + "px"
            tooltip.classList.remove("hidden")

            let element = this.layout.lookup(ids.t_idx, ids.h_idx)

            if (this.layout instanceof Layout) {
                if (element instanceof ABElement) {
                    if (ids.mode === "A") {
                        element = element.elementA
                    } else {
                        element = element.elementB
                    }
                    tooltip_instruction_add_alt.classList.add("hidden")
                } else {
                    tooltip_instruction_add_alt.classList.remove("hidden")
                }
            } else {
                tooltip_instruction_add_alt.classList.add("hidden")
            }

            if (element instanceof Biome) {
                tooltip_name.innerHTML = element.name
                tooltip_instruction_open.classList.add("hidden")
                tooltip_instruction_remove.classList.remove("hidden")
            } else if (element instanceof Layout) {
                tooltip_name.innerHTML = "&crarr; " + element.name + " (Layout)"
                tooltip_instruction_open.classList.remove("hidden")
                tooltip_instruction_remove.classList.remove("hidden")
            } else if (element instanceof LayoutElementUnassigned) {
                tooltip_name.innerHTML = "Unassigned"
                tooltip_instruction_open.classList.add("hidden")
                tooltip_instruction_remove.classList.add("hidden")
            }
        }
        this.canvas.onmouseleave = (evt: MouseEvent) => {
            tooltip.classList.add("hidden")
        }

        this.canvas.onclick = (evt: MouseEvent) => {
            const renderer = this.layout.getRenderer() as LayoutGridRenderer
            const mouse_position = this.getMousePosition(evt)
            const ids = renderer.getIdsFromPosition(0, 0, this.canvas.width, this.canvas.height, mouse_position.mouse_x, mouse_position.mouse_y)
            if (ids === undefined) {
                return
            }

            this.handleInteraction(ids.t_idx, ids.h_idx, ids.mode, evt.ctrlKey ? "add_alt" : evt.altKey ? "pick" : "add" )
        }

        this.canvas.oncontextmenu = (evt: MouseEvent) => {
            const renderer = this.layout.getRenderer() as LayoutGridRenderer
            const mouse_position = this.getMousePosition(evt)
            const ids = renderer.getIdsFromPosition(0, 0, this.canvas.width, this.canvas.height, mouse_position.mouse_x, mouse_position.mouse_y)
            if (ids === undefined) {
                return
            }

            this.handleInteraction(ids.t_idx, ids.h_idx, ids.mode, "open" )
            evt.preventDefault
        }

        this.canvas.onkeyup = (evt: KeyboardEvent) => {
            if (evt.key === "Delete") {
                const renderer = this.layout.getRenderer() as LayoutGridRenderer
                const mouse_position = this.mouse_position
                const ids = renderer.getIdsFromPosition(0, 0, this.canvas.width, this.canvas.height, mouse_position.mouse_x, mouse_position.mouse_y)
                if (ids === undefined) {
                    return
                }
    
                this.handleInteraction(ids.t_idx, ids.h_idx, ids.mode, "remove" )
                evt.preventDefault
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

    handleInteraction(t_idx: number, h_idx: number, mode: "A" | "B", action: "add" | "add_alt" | "pick" | "open" | "remove") {
        const element = this.layout.lookup(t_idx, h_idx)

        let exact_element = element
        if (exact_element instanceof ABElement) {
            if (mode === "A") {
                exact_element = exact_element.elementA
            } else {
                exact_element = exact_element.elementB
            }
        }

        var selectedElement = UI.getInstance().selectedElement;

        if (action === "remove"){
            selectedElement = "unassigned"
            action = "add"
        }

        if (action === "pick") {
            UI.getInstance().selectedElement = exact_element.getKey()
            UI.getInstance().refresh()
        } else if ((action === "add" || action === "add_alt") && selectedElement !== "") {
            //Cycle Check
            if (this.builder.layouts.has(selectedElement) && this.layout instanceof Layout) {
                const se = this.builder.layouts.get(selectedElement)
                this.layout.set(t_idx, h_idx, this.builder.layoutElementDummy.getKey())
                if (se.lookupRecursive(t_idx, h_idx, "A") === this.builder.layoutElementDummy || se.lookupRecursive(t_idx, h_idx, "B") === this.builder.layoutElementDummy) {
                    //Cycle found
                    this.layout.set(t_idx, h_idx, element.getKey())
                    return
                }
            }

            if (action === "add_alt" && !(element instanceof ABElement) && this.layout instanceof Layout) {
                // add alternate
                if (mode === "A") {
                    this.layout.set(t_idx, h_idx, selectedElement + "/" + element.getKey())
                } else {
                    this.layout.set(t_idx, h_idx, element.getKey() + "/" + selectedElement)
                }
            } else {
                if (element instanceof ABElement) {
                    if (mode === "A") {
                        if (selectedElement === element.elementB.getKey()) {
                            this.layout.set(t_idx, h_idx, selectedElement)
                        } else {
                            this.layout.set(t_idx, h_idx, selectedElement + "/" + element.elementB.getKey())
                        }
                    } else {
                        if (selectedElement === element.elementA.getKey()) {
                            this.layout.set(t_idx, h_idx, selectedElement)
                        } else {
                            this.layout.set(t_idx, h_idx, element.elementA.getKey() + "/" + selectedElement)
                        }
                    }
                } else {
                    this.layout.set(t_idx, h_idx, selectedElement)
                }
            }
            UI.getInstance().refresh()
        } else if (action === "open") {
            // Right mouse button
            // open

            if (exact_element instanceof Layout) {
                UI.getInstance().openElement = exact_element.getKey()
                UI.getInstance().refresh()
            }
        }
    }

    refresh() {
        this.canvas.classList.remove("hidden")
        this.title.readOnly = false
        this.layout = this.builder.getRenderedElement(UI.getInstance().openElement) as Layout
        this.title.value = this.layout.name
        this.layout.getRenderer().draw(this.canvas.getContext('2d'), 0, 0, this.canvas.width, this.canvas.height, -1, -1, true, false)
    }

    hide() {
        this.canvas.classList.add("hidden")
    }
}


