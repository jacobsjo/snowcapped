import * as d3 from "d3";

import { Biome } from "../BuilderData/Biome"
import { BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { Layout } from "../BuilderData/Layout"
import { LayoutElement } from "../BuilderData/LayoutElement"
import { Slice } from "../BuilderData/Slice"
import { UI } from "./UI"

export class SidebarManager {
    private builder: BiomeBuilder

    private dragType: string;
    private dragKey: string;
    private lastDragedOverDiv: HTMLElement;

    private openedElement: { type: string, key?: string } = { type: "assign_slices" };
    private selectedElement: { type: string, key: string };


    constructor(builder: BiomeBuilder) {
        const sidebar = d3.select("#sidebar_menu")
        this.builder = builder

        sidebar.select("#assign_slices_button")
            .on("click", (evt: Event) => {
                this.openElement({ type: "assign_slices" })
                evt.preventDefault()
            })
            .on("contextmenu", (evt: Event) => {
                this.openElement({ type: "assign_slices" })
                evt.preventDefault()
            })

        sidebar.select("#add_slices_button")
            .on("click", (evt: Event) => {
                const slice = Slice.create(this.builder, "New Slice", "unassigned")
                this.builder.hasChanges = true
                this.openElement({ type: "slice", key: slice.getKey() })
                evt.stopPropagation()
            })

        sidebar.select("#hide_all_slices_button")
            .on("click", (evt: Event) => {
                const h = this.builder.slices.every(s => !s.hidden)
                this.builder.slices.forEach(s => s.hidden = h)
                UI.getInstance().refresh()
                evt.stopPropagation()
            })

        sidebar.select("#add_layout_button")
            .on("click", (evt: Event) => {
                const layout = Layout.create(this.builder, "New Layout")
                this.builder.hasChanges = true
                this.openElement({ type: "layout", key: layout.getKey() })
                evt.stopPropagation()
            })

        sidebar.select("#hide_all_layouts_button")
            .on("click", (evt: Event) => {
                const h = this.builder.layouts.every(s => !s.hidden)
                this.builder.layouts.forEach(s => s.hidden = h)
                this.builder.hasChanges = true
                UI.getInstance().refresh()
                evt.stopPropagation()
            })

        sidebar.select("#edit_layout_grid_button")
            .on("click", (evt: Event) => {
                this.openElement({ type: "modify_layout" })
                this.builder.hasChanges = true
                UI.getInstance().refresh()
                evt.stopPropagation()
            })

        sidebar.select("#add_biome_button")
            .on("click", (evt: Event) => {
                const biome_name = prompt("Input biome name:", "new:biome")
                if (biome_name === null)
                    return
                const biome = Biome.create(this.builder, biome_name, "#888888")
                this.builder.hasChanges = true
                UI.getInstance().refresh()
                this.resizeBottomSpacer(sidebar)
                evt.stopPropagation()
            })

        sidebar.select("#hide_all_biomes_button")
            .on("click", (evt: Event) => {
                const h = this.builder.biomes.every(s => !s.hidden)
                this.builder.biomes.forEach(s => s.hidden = h)
                UI.getInstance().refresh()
                evt.stopPropagation()
            })

        const search_bar = sidebar.select("#biome_search_bar")
        search_bar.on("input", (evt: Event) => {
            sidebar.select("#sidebar_bottom_spacer")
                .style("height", "10000pt");

            (sidebar.select(".sidebar_entry_list#biomes")
                .selectAll(".sidebar_entry") as d3.Selection<d3.BaseType, Slice | LayoutElement, d3.BaseType, unknown>)
                .data(this.builder.biomes, (d: Slice | LayoutElement) => d.getKey())
                .classed("hidden", d => !d.name.includes(search_bar.property("value")));

            (sidebar.select(".sidebar_entry_list#vanilla_biomes")
                .selectAll(".sidebar_entry") as d3.Selection<d3.BaseType, Slice | LayoutElement, d3.BaseType, unknown>)
                .data(Array.from(this.builder.vanillaBiomes.values()).filter(b => !this.builder.layoutElements.has(b.getKey())), (d: Slice | LayoutElement) => d.getKey())
                .classed("hidden", d => !d.name.includes(search_bar.property("value")))

            this.resizeBottomSpacer(sidebar)
        })

        sidebar.on("scroll", (evt) => {
            this.resizeBottomSpacer(sidebar)
        })

    }

    private resizeBottomSpacer(sidebar: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>){
        const bottom_spacer = sidebar.select("#sidebar_bottom_spacer")
        const bottom_spacer_pos = (bottom_spacer.node() as HTMLElement).getBoundingClientRect().top - (sidebar.node() as HTMLElement).getBoundingClientRect().top
        const bottom_spacer_height = Math.max(((sidebar.node() as HTMLElement).clientHeight - bottom_spacer_pos - 20), 0)
        bottom_spacer.style("height", bottom_spacer_height + "px")
    }

    private openElement(openElement?: { type: string, key?: string }) {
        if (openElement.type === "biome" || openElement.type === "vanilla_biome")
            return

        this.openedElement = openElement ?? this.openedElement

        if ((this.openedElement.type === "assign_slices" && this.selectedElement?.type !== "slice") ||
            (this.openedElement.type !== "assign_slices" && this.selectedElement?.type === "slice") ||
            (this.openedElement.type === "modify_layout"))
            this.selectedElement = undefined

        UI.getInstance().openElement = openElement.type === "assign_slices" || openElement.type === "modify_layout" ? openElement.type : openElement.key
        UI.getInstance().selectedElement = this.selectedElement?.key ?? ""

        UI.getInstance().refresh()
    }

    private selectElement(selectElement?: { type: string, key: string }) {
        if ((this.openedElement.type === "assign_slices" && selectElement.type !== "slice") ||
            (this.openedElement.type !== "assign_slices" && selectElement.type === "slice") ||
            (this.openedElement.type === "modify_layout"))
            return

        this.selectedElement = selectElement

        UI.getInstance().selectedElement = this.selectedElement?.key
        UI.getInstance().refresh()

    }


    refresh() {
        const sidebar = d3.select("#sidebar_menu")

        sidebar.select("#assign_slices_button")
            .classed("open", UI.getInstance().openElement === "assign_slices")

        sidebar.select("#hide_all_slices_button")
            .classed("enabled", !this.builder.slices.every(s => !s.hidden))

        sidebar.select("#hide_all_layouts_button")
            .classed("enabled", !this.builder.layouts.every(s => !s.hidden))

        sidebar.select("#edit_layout_grid_button")
            .classed("open", this.openedElement.type === "modify_layout")

        sidebar.select("#hide_all_biomes_button")
            .classed("enabled", !this.builder.biomes.every(s => !s.hidden))


        this.handleElementDivs(this.builder.slices, "slice", sidebar.select(".sidebar_entry_list#slices"), false)
        this.handleElementDivs(this.builder.layouts, "layout", sidebar.select(".sidebar_entry_list#layouts"), false)
        this.handleElementDivs(this.builder.biomes, "biome", sidebar.select(".sidebar_entry_list#biomes"), false)
        this.handleElementDivs(Array.from(this.builder.vanillaBiomes.values()).filter(b => !this.builder.layoutElements.has(b.getKey())), "vanilla_biome", sidebar.select(".sidebar_entry_list#vanilla_biomes"), true)
    }

    handleElementDivs(list: (Slice | LayoutElement)[], c: string, selection: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>, fixed: boolean) {
        const slices_divs = (selection.selectAll(".sidebar_entry") as d3.Selection<d3.BaseType, Slice | LayoutElement, d3.BaseType, unknown>)
            .data(list, (d: Slice | LayoutElement) => d.getKey())
            .join(enter => {
                const div = enter.append("div").classed("sidebar_entry", true).classed(c, true)
                div.append("canvas").classed("grid", true).attr("width", 100).attr("height", 100)
                div.append("span").classed("name", true)

                div.attr("draggable", !fixed)

                div.select("canvas.grid").each((d, i, nodes) => d.getRenderer().draw((nodes[i] as HTMLCanvasElement).getContext('2d'), 0, 0, 100, 100, -1, -1, false, true))

                if (!fixed) {
                    div.filter(d => d.allowEdit).append("img").classed("button", true).classed("edit", true).attr("src", "edit-pen.svg").attr("title", "Rename")
                        .on("click", (evt, d) => {
                            const new_name = prompt("Edit name of " + d.constructor.name, d.name)
                            if (new_name === null) return
                            d.name = new_name;
                            UI.getInstance().refresh()
                            evt.stopPropagation()
                        })

                    div.append("img").classed("button", true).classed("delete", true).attr("src", "trash-bin.svg").attr("title", "Delete")
                        .on("click", (evt, d) => {
                            if (!confirm("Deleting " + d.constructor.name + " \"" + d.name + "\""))
                                return

                            this.builder.hasChanges = true
                            if (d instanceof Slice) {
                                this.builder.removeSlice(d)
                            } else {
                                this.builder.removeLayoutElement(d)
                            }
                            UI.getInstance().refresh()
                            evt.stopPropagation()
                        })

                    div.append("img").classed("button", true).classed("hide", true).attr("src", "eye.svg").attr("title", "Hide/Show")
                        .on("click", (evt, d) => {
                            d.hidden = !d.hidden
                            UI.getInstance().refresh()
                            evt.stopPropagation()
                        })
                }

                div.on("click", (evt, d) => {
                    this.selectElement({ type: c, key: d.getKey() })

                })

                div.on("dblclick", (evt, d) => {
                    this.openElement({ type: c, key: d.getKey() })
                    evt.preventDefault()
                })


                div.on("contextmenu", (evt, d) => {
                    this.openElement({ type: c, key: d.getKey() })
                    evt.preventDefault()
                })

                if (!fixed) {
                    const self = this

                    div.on("dragstart", function (evt, d) {
                        self.dragType = c
                        self.dragKey = d.getKey()
                        this.classList.add("dragged")
                    })

                    div.on("dragend", function (evt, d) {
                        self.dragType = undefined
                        self.dragKey = undefined
                        this.classList.remove("dragged")
                    })

                    div.on("dragover", function (evt, d) {
                        if (self.dragover(this, c, list, d))
                            evt.preventDefault()
                    })

                    div.on("dragleave", function (evt, d) {
                        setTimeout(() => this.classList.remove("dragover_up", "dragover_down"), 20)
                        evt.preventDefault()
                    })

                    div.on("drop", function (evt, d) {
                        if (self.drop(this, c, list, d)) {
                            evt.preventDefault()
                            UI.getInstance().refresh()
                        }
                    })
                }

                return div
            })

        slices_divs.classed("open", d => UI.getInstance().openElement === d.getKey())
        slices_divs.classed("selected", d => UI.getInstance().selectedElement === d.getKey())
        slices_divs.attr("title", d=>d.name)

        slices_divs.select("canvas.grid").filter(d => d.getKey() === this.openedElement.key).each((d, i, nodes) => d.getRenderer().draw((nodes[i] as HTMLCanvasElement).getContext('2d'), 0, 0, 100, 100, -1, -1, false, true))
        slices_divs.select("span.name").text(d => d.name)
        slices_divs.select("img.button.hide").classed("enabled", d => d.hidden)
    }

    dragover<T extends Slice | LayoutElement>(element: HTMLElement, c: string, list: T[], d: T): boolean {
        if (this.dragType === c && this.dragKey !== d.getKey()) {
            const self_id = list.indexOf(d)
            const other_id = list.findIndex(e => e.getKey() === this.dragKey)

            if (self_id < other_id) {
                element.classList.add("dragover_up")
            } else {
                element.classList.add("dragover_down")
            }

            if (this.lastDragedOverDiv != element) {
                this.lastDragedOverDiv?.classList?.remove("dragover_up", "dragover_down")
                this.lastDragedOverDiv = element
            }
            return true
        } else {
            return false
        }
    }

    drop<T extends Slice | LayoutElement>(element: HTMLElement, c: string, list: T[], d: T): boolean {
        element.classList.remove("dragover_up", "dragover_down")

        if (this.dragType === c && this.dragKey !== d.getKey()) {
            const self_id = list.indexOf(d)
            const other_id = list.findIndex(e => e.getKey() === this.dragKey)
            list.splice(self_id, 0, list.splice(other_id, 1)[0])
            return true;
        } else {
            return false;
        }
    }

}