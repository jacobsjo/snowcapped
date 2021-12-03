import * as d3 from "d3";

import { Biome } from "../BuilderData/Biome"
import { BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { Grid, LayoutMultiNoiseIndexesAccessor, SliceMultiNoiseIndexesAccessor } from "../BuilderData/Grid";
import { GridElement } from "../BuilderData/GridElement";
import { UI } from "./UI"

export class SidebarManager {
    private builder: BiomeBuilder

    private dragType: string;
    private dragKey: string;
    private lastDragedOverDiv: HTMLElement;

    public parentElements: { type: string, key?: string }[] = []
    public openedElement: { type: string, key?: string } = { type: "dimension", key: "dimension" };
    public selectedElement: { type: string, key: string };

    constructor(builder: BiomeBuilder) {
        const sidebar = d3.select("#sidebar_menu")
        this.builder = builder

        const self=this
        sidebar.selectAll<HTMLElement, unknown>(".sidebar_entry_list#splines .sidebar_entry.spline")
            .on("click", function(evt: Event) {
                if (this.id === "dimension"){
                    self.openElement({ type: "dimension", key: this.id})
                } else {
                    self.openElement({ type: "spline", key: this.id })
                }
                evt.stopPropagation()
            })
            .on("contextmenu", function(evt: Event) {
                if (this.id === "dimension"){
                    self.openElement({ type: "dimension", key: "dimension"})
                } else {
                    self.openElement({ type: "spline", key: this.id })
                }
                evt.stopPropagation()
                evt.preventDefault()
            })
            .selectAll<HTMLElement, unknown>(".edit_grid_button")
            .on("click", function(evt: Event) {
                self.openElement({ type: "grid", key: this.parentElement.id })
                evt.stopPropagation()
            })

        sidebar.select("#splines_grid_view_button")
            .on("click", (evt: Event) => {
                const isCompact = !sidebar.select('#splines').classed("compact")
                sidebar.select('#splines').classed("compact", isCompact)
                sidebar.select("#splines_grid_view_button").attr("src", isCompact ? "list-view.svg" : "grid-view.svg")
            })

        sidebar.select("#slices_grid_view_button")
            .on("click", (evt: Event) => {
                const isCompact = !sidebar.select('#slices').classed("compact")
                sidebar.select('#slices').classed("compact", isCompact)
                sidebar.select("#slices_grid_view_button").attr("src", isCompact ? "list-view.svg" : "grid-view.svg")
            })

        sidebar.select("#layouts_grid_view_button")
            .on("click", (evt: Event) => {
                const isCompact = !sidebar.select('#layouts').classed("compact")
                sidebar.select('#layouts').classed("compact", isCompact)
                sidebar.select("#layouts_grid_view_button").attr("src", isCompact ? "list-view.svg" : "grid-view.svg")
            })

        sidebar.select("#biomes_grid_view_button")
            .on("click", (evt: Event) => {
                const isCompact = !sidebar.select('#biomes').classed("compact")
                sidebar.select('#biomes').classed("compact", isCompact)
                sidebar.select('#vanilla_biomes').classed("compact", isCompact)
                sidebar.select("#biomes_grid_view_button").attr("src", isCompact ? "list-view.svg" : "grid-view.svg")
            })


        sidebar.select("#assign_slices_button")
            .on("click", (evt: Event) => {
                this.openElement({ type: "assign_slices" })
                evt.preventDefault()
            })
            .on("contextmenu", (evt: Event) => {
                this.openElement({ type: "assign_slices" })
                evt.preventDefault()
            })

        sidebar.select("#edit_slices_grid_button")
            .on("click", (evt: Event) => {
                this.openElement({ type: "grid", key: "slice" })
                evt.stopPropagation()
            })
            
        sidebar.select("#add_slices_button")
            .on("click", (evt: Event) => {
                const slice = Grid.create(this.builder, "New Slice", new SliceMultiNoiseIndexesAccessor())
                this.builder.hasChanges = true
                this.openElement({ type: "slice", key: slice.getKey() })
                evt.stopPropagation()
            })

        sidebar.select("#hide_all_slices_button")
            .on("click", (evt: Event) => {
                const h = this.builder.slices.every(s => !s.hidden)
                this.builder.slices.forEach(s => s.hidden = h)
                UI.getInstance().refresh({
                    biome: {}
                })
                evt.stopPropagation()
            })

        sidebar.select("#add_layout_button")
            .on("click", (evt: Event) => {
                const layout = Grid.create(this.builder, "New Layout", new LayoutMultiNoiseIndexesAccessor())
                this.builder.hasChanges = true
                this.openElement({ type: "layout", key: layout.getKey() })
                evt.stopPropagation()
            })

        sidebar.select("#hide_all_layouts_button")
            .on("click", (evt: Event) => {
                const h = this.builder.layouts.every(s => !s.hidden)
                this.builder.layouts.forEach(s => s.hidden = h)
                this.builder.hasChanges = true
                UI.getInstance().refresh({
                    biome: {}
                })
                evt.stopPropagation()
            })

        sidebar.select("#edit_layout_grid_button")
            .on("click", (evt: Event) => {
                this.openElement({ type: "grid", key: "layout" })
                evt.stopPropagation()
            })

        sidebar.select("#add_biome_button")
            .on("click", (evt: Event) => {
                const biome_name = prompt("Input biome name:", "new:biome")
                if (biome_name === null)
                    return
                const biome = Biome.create(this.builder, biome_name, "#888888")
                this.builder.hasChanges = true
                this.refresh()
                this.resizeBottomSpacer(sidebar)
                evt.stopPropagation()
            })

        sidebar.select("#hide_all_biomes_button")
            .on("click", (evt: Event) => {
                const h = this.builder.biomes.every(s => !s.hidden)
                this.builder.biomes.forEach(s => s.hidden = h)
                UI.getInstance().refresh({
                    biome: {}
                })
                evt.stopPropagation()
            })

        const search_bar = sidebar.select("#biome_search_bar")
        search_bar.on("input", (evt: Event) => {
            sidebar.select("#sidebar_bottom_spacer")
                .style("height", "10000pt");

            (sidebar.select(".sidebar_entry_list#biomes")
                .selectAll(".sidebar_entry") as d3.Selection<d3.BaseType, GridElement, d3.BaseType, unknown>)
                .data(this.builder.biomes, (d: GridElement) => d.getKey())
                .classed("hidden", d => !d.name.includes(search_bar.property("value")));

            (sidebar.select(".sidebar_entry_list#vanilla_biomes")
                .selectAll(".sidebar_entry") as d3.Selection<d3.BaseType, GridElement, d3.BaseType, unknown>)
                .data(Array.from(this.builder.vanillaBiomes.values()).filter(b => !this.builder.gridElements.has(b.getKey())), (d: GridElement) => d.getKey())
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

    public openElement(openElement?: { type: string, key?: string }, asChild: boolean = false, __from_back: boolean = false) {
        if (openElement.type === "biome" || openElement.type === "vanilla_biome")
            return

        if (asChild){
            this.parentElements.push(this.openedElement)
        } else if (!__from_back) {
            this.parentElements = []
        }

        this.openedElement = openElement ?? this.openedElement


        if ((this.openedElement.type === "assign_slices" && this.selectedElement?.type !== "slice") ||
            (this.openedElement.type === "layout" && this.selectedElement?.type === "slice") ||
            this.openedElement.type.startsWith("modify_") || this.openedElement.type === "spline" || this.openedElement.type === "spline_grid" )
            this.selectedElement = undefined

        UI.getInstance().splineEditor.zoom = 0.01

//        UI.getInstance().openElement = openElement.type === "assign_slices" || openElement.type.startsWith("modify_") ? openElement.type : openElement.key
//        UI.getInstance().selectedElement = this.selectedElement?.key ?? ""

        UI.getInstance().refresh({})
    }

    public back(){
        if (this.parentElements.length == 0){
            return
        }
        this.openElement(this.parentElements.pop(), false, true)
    }

    public selectElement(selectElement?: { type: string, key: string }) {
        if ((this.openedElement.type === "assign_slices" && selectElement.type !== "slice") ||
            (this.openedElement.type === "layout" && selectElement.type === "slice") ||
            this.openedElement.type.startsWith("modify_"))
            return

        this.selectedElement = selectElement

        this.refresh()
    }


    refresh() {
        const sidebar = d3.select("#sidebar_menu")

        const self=this
        sidebar.selectAll<HTMLElement, unknown>(".sidebar_entry_list#splines .sidebar_entry.spline")
            .classed("open", function(){
                return (self.openedElement.type === "spline" && this.id === self.openedElement.key) ||
                    (self.openedElement.type === "dimension" && this.id === "dimension")
            })
            .selectAll<HTMLElement, unknown>(".edit_grid_button")
            .classed("open", function(){
                return self.openedElement.type === "grid" && this.parentElement.id === self.openedElement.key
            })

        sidebar.select("#assign_slices_button")
            .classed("open", this.openedElement.type === "assign_slices")

        sidebar.select("#hide_all_slices_button")
            .classed("enabled", !this.builder.slices.every(s => !s.hidden))

        sidebar.select("#edit_slices_grid_button")
            .classed("open", this.openedElement.type === "grid" && this.openedElement.key === "slice")

        sidebar.select("#hide_all_layouts_button")
            .classed("enabled", !this.builder.layouts.every(s => !s.hidden))

        sidebar.select("#edit_layout_grid_button")
            .classed("open", this.openedElement.type === "grid" && this.openedElement.key === "layout")

        sidebar.select("#hide_all_biomes_button")
            .classed("enabled", !this.builder.biomes.every(s => !s.hidden))


        this.handleElementDivs(this.builder.slices, "slice", sidebar.select(".sidebar_entry_list#slices"), 60 * 2,  false, false)
        this.handleElementDivs(this.builder.layouts, "layout", sidebar.select(".sidebar_entry_list#layouts"), 40 * 2, false, false)
        this.handleElementDivs(this.builder.biomes, "biome", sidebar.select(".sidebar_entry_list#biomes"), 22 * 2, false, true)
        this.handleElementDivs(Array.from(this.builder.vanillaBiomes.values()).filter(b => !this.builder.gridElements.has(b.getKey())), "vanilla_biome", sidebar.select(".sidebar_entry_list#vanilla_biomes"), 22 * 2, true, true)
    }

    handleElementDivs(list: (GridElement)[], c: string, selection: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>, gridSize: number, fixed: boolean, use_color_picker: boolean) {
        const tooltip = d3.select('#layoutEditorTooltip')

        const slices_divs = (selection.selectAll(".sidebar_entry") as d3.Selection<d3.BaseType, GridElement, d3.BaseType, unknown>)
            .data(list, (d: GridElement) => d.getKey())
            .join(enter => {
                const div = enter.append("div").classed("sidebar_entry", true).classed(c, true)

                if (use_color_picker){
                    div.append("input").attr("type", "color").classed("color_selector", true)
                        .attr("disabled", fixed ? "" : undefined)
                        .property("value", (d : Biome) => d.color)
                        .on("change", function(evt, d ){
                            (d as Biome).setColor(this.value)
                            UI.getInstance().refresh({
                                biome: {}
                            })
                        })
                } else {
                    div.append("canvas")
                        .classed("grid", true)
                        .attr("width", gridSize)
                        .attr("height", gridSize)
                        .each((d, i, nodes) => d.getRenderer().draw((nodes[i] as HTMLCanvasElement).getContext('2d'), 0, 0, gridSize, gridSize, {}, true))
                }
                div.append("span").classed("name", true)

                div.attr("draggable", !fixed)

                if (!fixed) {
                    div.filter(d => d.allowEdit).append("img").classed("button", true).classed("edit", true).attr("src", "edit-pen.svg").attr("title", "Rename")
                        .on("click", (evt, d) => {
                            const new_name = prompt("Edit name of " + d.constructor.name, d.name)
                            if (new_name === null) return
                            d.name = new_name;
                            this.refresh()
                            evt.stopPropagation()
                        })

                    div.append("img").classed("button", true).classed("delete", true).attr("src", "trash-bin.svg").attr("title", "Delete")
                        .on("click", (evt, d) => {
                            if (!confirm("Deleting " + d.constructor.name + " \"" + d.name + "\""))
                                return

                            this.builder.hasChanges = true
                            this.builder.removeGridElement(d)
                            UI.getInstance().refresh({
                                biome: {}
                            })
                            evt.stopPropagation()
                        })

                    div.append("img").classed("button", true).classed("hide", true).attr("src", "eye.svg").attr("title", "Hide/Show")
                        .on("click", (evt, d) => {
                            d.hidden = !d.hidden
                            UI.getInstance().refresh({
                                biome: {}
                            })
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

                div.on("mouseover", function(evt, d) {
                    if (selection.classed("compact")){
                        const bb = this.getBoundingClientRect()
                        tooltip.select(".name").text(d.name)
                        tooltip.style("left", bb.left)
                        tooltip.style("top", bb.bottom)
                        tooltip.classed("hidden", false)
                        tooltip.select(".noises").classed("hidden", true)
                    }
                })

                div.on("mouseleave", function(evt, d) {
                    tooltip.classed("hidden", true)
                })


                if (!fixed) {
                    const self = this

                    div.on("dragstart", function (evt, d) {
                        tooltip.classed("hidden", true)
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
                            self.refresh()
                            //UI.getInstance().refresh()
                        }
                    })
                }

                return div
            })

        slices_divs.classed("open", d => this.openedElement?.key === d.getKey())
        slices_divs.classed("selected", d => this.selectedElement?.key === d.getKey())
        //slices_divs.attr("title", d=>d.name)

        slices_divs.select("canvas.grid").filter(d => d.getKey() === this.openedElement.key).each((d, i, nodes) => {
            const ctx = (nodes[i] as HTMLCanvasElement).getContext('2d')
            ctx.clearRect(0,0, gridSize, gridSize)
            d.getRenderer().draw(ctx, 0, 0, gridSize, gridSize, {}, true)
        })
        slices_divs.select("span.name").text(d => d.name)
        slices_divs.select("input.color_selector").attr("aria-label", d => "Color of Biome " + d.name)
        slices_divs.select("img.button.hide").classed("enabled", d => d.hidden)
    }

    dragover<T extends GridElement>(element: HTMLElement, c: string, list: T[], d: T): boolean {
        if (this.dragType === c && this.dragKey !== d.getKey()) {
            const self_id = list.findIndex(e => e.getKey() === d.getKey())
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

    drop<T extends GridElement>(element: HTMLElement, c: string, list: T[], d: T): boolean {
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