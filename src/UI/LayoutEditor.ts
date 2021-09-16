import { ABElement } from "../BuilderData/ABBiome";
import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder } from "../BuilderData/BiomeBuilder";
import { Layout } from "../BuilderData/Layout";
import { LayoutGridRenderer } from "./Renderer/LayoutGridRenderer";


export class LayoutEditor {
    private builder: BiomeBuilder
    private canvas: HTMLCanvasElement

    layout: Layout

    private selectedElement: string = "minecraft:river"

    constructor(builder: BiomeBuilder) {
        this.builder = builder
        this.canvas = document.getElementById("layoutEditor") as HTMLCanvasElement

        const tooltip = document.getElementById("layoutEditorTooltip")
        const tooltip_name = tooltip.getElementsByClassName("name")[0] as HTMLElement
        const tooltip_instructions = tooltip.getElementsByClassName("instructions")[0] as HTMLElement
        const tooltip_instruction_change = tooltip_instructions.getElementsByClassName("change")[0] as HTMLElement
        const tooltip_instruction_add_alt = tooltip_instructions.getElementsByClassName("add_alt")[0] as HTMLElement
        const tooltip_instruction_remove_alt = tooltip_instructions.getElementsByClassName("remove_alt")[0] as HTMLElement
        const tooltip_instruction_open = tooltip_instructions.getElementsByClassName("open")[0] as HTMLElement

        this.canvas.onmousemove = (evt: MouseEvent) => {

            const renderer = this.layout.getRenderer() as LayoutGridRenderer
            const mouse_position = this.getMousePosition(evt)
            const ids = renderer.getIdsFromPosition(0, 0, this.canvas.width, this.canvas.height, mouse_position.mouse_x, mouse_position.mouse_y)
            if (ids === undefined) {
                tooltip.classList.add("hidden")
                return
            }
            tooltip.style.left = (evt.pageX + 20) + "px"
            tooltip.style.top = (evt.pageY + 15) + "px"
            tooltip.classList.remove("hidden")

            let element = this.layout.get(ids.t_idx, ids.h_idx)

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

            if (element instanceof Biome) {
                tooltip_name.innerHTML = element.name
                tooltip_instruction_open.classList.add("hidden")
            } else if (element instanceof Layout) {
                tooltip_name.innerHTML = "&crarr; " + element.name + " (Layout)"
                tooltip_instruction_open.classList.remove("hidden")
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
            const element = this.layout.get(ids.t_idx, ids.h_idx)

            let exact_element = element
            if (exact_element instanceof ABElement) {
                if (ids.mode === "A") {
                    exact_element = exact_element.elementA
                } else {
                    exact_element = exact_element.elementB
                }
            }

            if (evt.button === 0) {
                // Left mouse button
                if (evt.ctrlKey && !(element instanceof ABElement)) {
                    // add alternate
                    if (ids.mode === "A") {
                        this.layout.set(ids.t_idx, ids.h_idx, this.selectedElement + "/" + element.name)
                    } else {
                        this.layout.set(ids.t_idx, ids.h_idx, element.name + "/" + this.selectedElement)
                    }
                    this.refresh()
                } else if (evt.altKey) {
                    this.selectedElement = exact_element.name
                } else {
                    if (element instanceof ABElement) {
                        if (ids.mode === "A") {
                            if (this.selectedElement === element.elementB.name) {
                                this.layout.set(ids.t_idx, ids.h_idx, this.selectedElement)
                            } else {
                                this.layout.set(ids.t_idx, ids.h_idx, this.selectedElement + "/" + element.elementB.name)
                            }
                        } else {
                            if (this.selectedElement === element.elementA.name) {
                                this.layout.set(ids.t_idx, ids.h_idx, this.selectedElement)
                            } else {
                                this.layout.set(ids.t_idx, ids.h_idx, element.elementA.name + "/" + this.selectedElement)
                            }
                        }
                    } else {
                        this.layout.set(ids.t_idx, ids.h_idx, this.selectedElement)
                    }
                    this.refresh()
                }
            } else if (evt.button === 2) {
                // Right mouse button
                // open

                if (exact_element instanceof Layout) {
                    this.setLayout(element.name)
                    this.refresh()
                }

                evt.preventDefault();
            }
        }

        this.canvas.oncontextmenu = this.canvas.onclick
    }

    getMousePosition(evt: MouseEvent): { mouse_x: number, mouse_y: number } {
        const rect = this.canvas.getBoundingClientRect()
        const scaleX = this.canvas.width / rect.width
        const scaleY = this.canvas.height / rect.height

        const canvasMouseX = (evt.clientX - rect.left) * scaleX
        const canvasMouseY = (evt.clientY - rect.top) * scaleY

        return { mouse_x: canvasMouseX, mouse_y: canvasMouseY }
    }

    setLayout(key: string) {
        this.layout = this.builder.getLayoutElement(key) as Layout
    }

    refresh() {
        this.layout.getRenderer().draw(this.canvas.getContext('2d'), 0, 0, this.canvas.width, this.canvas.height, -1, -1, true, false)
    }
}


