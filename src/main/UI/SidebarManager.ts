import { Biome } from "../BuilderData/Biome"
import { BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { Layout } from "../BuilderData/Layout"
import { LayoutElement } from "../BuilderData/LayoutElement"
import { Slice } from "../BuilderData/Slice"
import { LayoutEditor } from "./LayoutEditor"
import { MenuManager } from "./MenuManager"
import { UI } from "./UI"



export class SidebarManager {
    private sidebar: HTMLElement
    private builder: BiomeBuilder

    private layout_divs: HTMLElement[]
    private biome_divs: HTMLElement[]
    private bottom_spacer: HTMLElement
    private search_bar: HTMLInputElement

    private dragType: string;
    private dragKey: string;
    private lastDragedOverDiv: HTMLElement;

    constructor(builder: BiomeBuilder) {
        this.sidebar = document.getElementById("sidebar_menu")
        this.builder = builder
    }

    refresh() {
        const lastSearch = (this.sidebar.getElementsByClassName("search_bar")?.[0] as HTMLInputElement)?.value ?? ""

        this.sidebar.innerHTML = ""
        this.layout_divs = []
        this.biome_divs = []

        // Add Assign splices Button
        const assignSplicesButton = document.createElement("div")
        assignSplicesButton.classList.add("sidebar_entry")
        assignSplicesButton.classList.add("assign_slices_button")
        if (UI.getInstance().openElement === "assign_slices") {
            assignSplicesButton.classList.add("open")
        }
        assignSplicesButton.innerHTML = "Assign Slices"
        assignSplicesButton.onclick = (evt: Event) => {
            UI.getInstance().selectedElement = ""
            UI.getInstance().openElement = "assign_slices"
            UI.getInstance().refresh()
            evt.preventDefault()
        }
        assignSplicesButton.oncontextmenu = assignSplicesButton.onclick
        this.sidebar.appendChild(assignSplicesButton)

        // Add spacer
        const spacer0 = document.createElement("div")
        spacer0.classList.add("spacer")
        this.sidebar.appendChild(spacer0)

        const slicesHeader = document.createElement("div")
        slicesHeader.classList.add("sidebar_header")

        const slicesHeaderName = document.createElement("div")
        slicesHeaderName.classList.add("name")
        slicesHeaderName.innerHTML = "Slices: "
        slicesHeader.appendChild(slicesHeaderName)

        const addSlicesButton = document.createElement("img")
        addSlicesButton.classList.add("button")
        addSlicesButton.src = "add.svg"
        addSlicesButton.onclick = (evt: Event) => {
            const slice = Slice.create(this.builder, "New Slice", "unassigned")
            this.builder.hasChanges = true
            UI.getInstance().openElement = slice.getKey()
            UI.getInstance().refresh()
            this.sidebar.getElementsByClassName("open")[0].scrollIntoView(false)
        }
        slicesHeader.appendChild(addSlicesButton)

        const hide_button = document.createElement("img") as HTMLImageElement
        hide_button.classList.add("button", "hide")
        if (!this.builder.slices.every(s => !s.hidden)) {
            hide_button.classList.add("enabled")
        }
        hide_button.src = "eye.svg"
        hide_button.onclick = (evt) => {
            const h = this.builder.slices.every(s => !s.hidden)
            this.builder.slices.forEach(s => s.hidden = h)
            UI.getInstance().refresh()
            evt.stopPropagation()
        }
        slicesHeader.appendChild(hide_button)

        this.sidebar.appendChild(slicesHeader)

        // Add Slices
        this.builder.slices.forEach(slice => {
            const s = this.createElementDiv(slice, "slice")


            this.layout_divs.push(s)
        });

        // Add spacer
        const spacer1 = document.createElement("div")
        spacer1.classList.add("spacer")
        this.sidebar.appendChild(spacer1)

        // Add Header
        const layoutHeader = document.createElement("div")
        layoutHeader.classList.add("sidebar_header")

        const layoutHeaderName = document.createElement("div")
        layoutHeaderName.classList.add("name")
        layoutHeaderName.innerHTML = "Layouts: "
        layoutHeader.appendChild(layoutHeaderName)

        const addLayoutButton = document.createElement("img")
        addLayoutButton.classList.add("button")
        addLayoutButton.src = "add.svg"
        addLayoutButton.onclick = (evt: Event) => {
            const layout = Layout.create(this.builder, "New Layout")
            this.builder.hasChanges = true
            UI.getInstance().openElement = layout.getKey()
            UI.getInstance().refresh()
            this.sidebar.getElementsByClassName("open")[0].scrollIntoView(false)
        }
        layoutHeader.appendChild(addLayoutButton)


        const modifyLayoutButton = document.createElement("img")
        modifyLayoutButton.classList.add("button")
        if (UI.getInstance().openElement === "modify_layout") {
            modifyLayoutButton.classList.add("open")
        }
        modifyLayoutButton.classList.add("button")
        modifyLayoutButton.src = "grid.svg"
        modifyLayoutButton.onclick = (evt: Event) => {
            UI.getInstance().selectedElement = ""
            UI.getInstance().openElement = "modify_layout"
            UI.getInstance().refresh()
        }
        layoutHeader.appendChild(modifyLayoutButton)

        const hide_layout_button = document.createElement("img") as HTMLImageElement
        hide_layout_button.classList.add("button", "hide")
        if (!this.builder.layouts.every(s => !s.hidden)) {
            hide_layout_button.classList.add("enabled")
        }
        hide_layout_button.src = "eye.svg"
        hide_layout_button.onclick = (evt) => {
            const h = this.builder.layouts.every(s => !s.hidden)
            this.builder.layouts.forEach(s => s.hidden = h)
            UI.getInstance().refresh()
            evt.stopPropagation()
        }
        layoutHeader.appendChild(hide_layout_button)

        this.sidebar.appendChild(layoutHeader)

        // Layouts
        this.builder.layouts.forEach(element => {
            this.layout_divs.push(this.createElementDiv(element, "layout"))
        });

        // Add spacer
        const spacer2 = document.createElement("div")
        spacer2.classList.add("spacer")
        this.sidebar.appendChild(spacer2)

        // Add Header
        const biomeHeader = document.createElement("div")
        biomeHeader.classList.add("sidebar_header")

        const biomeHeaderName = document.createElement("div")
        biomeHeaderName.classList.add("name")
        biomeHeaderName.innerHTML = "Biomes: "
        biomeHeader.appendChild(biomeHeaderName)

        const addBiomeButton = document.createElement("img")
        addBiomeButton.classList.add("button")
        addBiomeButton.src = "add.svg"
        addBiomeButton.onclick = (evt: Event) => {
            const biome_name = prompt("Input biome name:", "new:biome")
            if (biome_name === null)
                return
            const biome = Biome.create(this.builder, biome_name, "#888888")
            if (UI.getInstance().openElement !== "assign_slises")
                UI.getInstance().selectedElement = biome.getKey()
            this.builder.hasChanges = true
            UI.getInstance().refresh()
        }
        biomeHeader.appendChild(addBiomeButton)

        const hide_biome_button = document.createElement("img") as HTMLImageElement
        hide_biome_button.classList.add("button", "hide")
        if (!this.builder.biomes.every(s => !s.hidden)) {
            hide_biome_button.classList.add("enabled")
        }
        hide_biome_button.src = "eye.svg"
        hide_biome_button.onclick = (evt) => {
            const h = this.builder.biomes.every(s => !s.hidden)
            this.builder.biomes.forEach(s => s.hidden = h)
            UI.getInstance().refresh()
            evt.stopPropagation()
        }
        biomeHeader.appendChild(hide_biome_button)

        this.sidebar.appendChild(biomeHeader)

        // Add seachBar
        this.search_bar = document.createElement("input") as HTMLInputElement
        this.search_bar.type = "text"
        this.search_bar.placeholder = "Seach..."
        this.search_bar.value = lastSearch
        this.search_bar.classList.add("search_bar")
        this.search_bar.oninput = (evt: Event) => {
            this.updateBiomeSearch()
        }
        this.sidebar.appendChild(this.search_bar)

        // Biomes
        this.builder.biomes.forEach(element => {
            const div = this.createElementDiv(element, "biome")
            this.biome_divs.push(div)
        });

        const vanilla_label = document.createElement("div") as HTMLElement
        vanilla_label.innerHTML = "Unused Vanilla Biomes"
        vanilla_label.classList.add("label")
        this.sidebar.appendChild(vanilla_label)

        // Vanilla Biomes
        this.builder.vanillaBiomes.forEach(element => {
            if (this.builder.layoutElements.has(element.getKey()))
                return

            const div = this.createElementDiv(element, "vanilla_biome")
            this.biome_divs.push(div)
        });


        // Add bottom spacer
        this.bottom_spacer = document.createElement("div")
        this.bottom_spacer.classList.add("spacer")
        this.sidebar.appendChild(this.bottom_spacer)

        this.sidebar.onscroll = (evt: Event) => {
            const bottom_spacer_pos = this.bottom_spacer.getBoundingClientRect().top - this.sidebar.getBoundingClientRect().top
            const bottom_spacer_height = Math.max((this.sidebar.clientHeight - bottom_spacer_pos - 20), 0)
            this.bottom_spacer.style.height = bottom_spacer_height + "px"
        }

        this.updateBiomeSearch()
    }

    private updateBiomeSearch() {
        this.bottom_spacer.style.height = "10000pt"

        this.biome_divs.forEach(div => {
            if (div.getAttribute("key").includes(this.search_bar.value)) {
                div.classList.remove("hidden")
            } else {
                div.classList.add("hidden")
            }
        })

        const bottom_spacer_pos = this.bottom_spacer.getBoundingClientRect().top - this.sidebar.getBoundingClientRect().top
        const bottom_spacer_height = Math.max((this.sidebar.clientHeight - bottom_spacer_pos - 20), 0)
        this.bottom_spacer.style.height = bottom_spacer_height + "px"

    }

    private createElementDiv(element: LayoutElement | Slice, c: string): HTMLElement {
        const element_div = document.createElement("div")
        element_div.classList.add("sidebar_entry")
        element_div.classList.add(c)
        element_div.draggable = (c !== "vanilla_biome")

        if (element.getKey() === UI.getInstance()?.selectedElement) {
            element_div.classList.add("selected")
        }

        if (element.getKey() === UI.getInstance()?.openElement) {
            element_div.classList.add("open")
        }


        element_div.setAttribute("key", element.name)

        if (element instanceof Biome) {
            const color_input = document.createElement("input") as HTMLInputElement
            color_input.classList.add("color_selector")
            color_input.type = "color"
            color_input.value = element.color
            color_input.disabled = c === "vanilla_biome"
            
            color_input.onchange = (evt: Event) => {
                element.color = color_input.value
                this.builder.hasChanges = true
                UI.getInstance().refresh()
            }
            element_div.appendChild(color_input)
        } else {
            const layout_canvas = document.createElement("canvas") as HTMLCanvasElement
            layout_canvas.classList.add("grid")
            layout_canvas.width = 100
            layout_canvas.height = 100
            element.getRenderer().draw(layout_canvas.getContext("2d"), 0, 0, 100, 100, -1, -1, false, true)
            element_div.appendChild(layout_canvas)
        }

        const layout_name = document.createElement("span")
        layout_name.innerHTML = element.name
        layout_name.classList.add("name")
        element_div.appendChild(layout_name)


        if (element.allowEdit) {

            const edit_name_button = document.createElement("img") as HTMLImageElement
            edit_name_button.classList.add("button", "edit")
            edit_name_button.src = "edit-pen.svg"
            edit_name_button.onclick = (evt) => {

                const new_name = prompt("Edit name of " + element.constructor.name, element.name)
                if (new_name === null) return
                element.name = new_name;
                UI.getInstance().refresh()
                evt.stopPropagation()
            }
            element_div.appendChild(edit_name_button)

        }

        if (c !== "vanilla_biome") {
            const db = document.createElement("img") as HTMLImageElement
            db.classList.add("button", "delete")
            db.src = "trash-bin.svg"
            db.onclick = (evt) => {
                if (!confirm("Deleting " + element.constructor.name + " \"" + element.name + "\""))
                    return

                this.builder.hasChanges = true
                if (element instanceof Slice) {
                    this.builder.removeSlice(element)
                } else {
                    this.builder.removeLayoutElement(element)
                }
                UI.getInstance().refresh()
                evt.stopPropagation()
            }
            element_div.appendChild(db)

            const hide_button = document.createElement("img") as HTMLImageElement
            hide_button.classList.add("button", "hide")
            if (element.hidden) {
                hide_button.classList.add("enabled")
            }
            hide_button.src = "eye.svg"
            hide_button.onclick = (evt) => {
                element.hidden = !element.hidden
                UI.getInstance().refresh()
                evt.stopPropagation()
            }
            element_div.appendChild(hide_button)
        }


        if (element instanceof Layout || element instanceof Slice) {
            element_div.oncontextmenu = (evt) => {
                if (UI.getInstance().openElement === "assign_slices") {
                    UI.getInstance().selectedElement = ""
                }

                UI.getInstance().openElement = element.getKey()

                if (UI.getInstance().selectedElement === element.getKey()) {
                    UI.getInstance().selectedElement = ""
                }

                UI.getInstance().refresh()

                evt.preventDefault()
            }

            element_div.ondblclick = element_div.oncontextmenu
        } else if (element instanceof Biome && element.allowEdit) {

        }

        element_div.onclick = (evt) => {
            if ((UI.getInstance().openElement === "assign_slices") !== (element instanceof Slice))
                return

            UI.getInstance().selectedElement = element.getKey()

            UI.getInstance().refresh()
            /*
            this.layout_divs.forEach(div => {
                div.classList.toggle("selected", div.getAttribute("key") === UI.getInstance().selectedElement)
            });

            this.biome_divs.forEach(div => {
                div.classList.toggle("selected", div.getAttribute("key") === UI.getInstance().selectedElement)
            });*/
        }

        element_div.ondragstart = (evt) => {
            this.dragType = c
            this.dragKey = element.getKey()
            element_div.classList.add("dragged")
        }

        element_div.ondragend = (evt) => {
            element_div.classList.remove("dragged")
        }

        element_div.ondragover = (evt) => {
            if (this.dragType === c && this.dragKey !== element.getKey()) {
                var self_id, other_id

                if (element instanceof Slice) {
                    self_id = this.builder.slices.indexOf(element)
                    other_id = this.builder.slices.findIndex(e => e.getKey() === this.dragKey)
                } else if (element instanceof Layout) {
                    self_id = this.builder.layouts.indexOf(element)
                    other_id = this.builder.layouts.findIndex(e => e.getKey() === this.dragKey)
                } else if (element instanceof Biome) {
                    self_id = this.builder.biomes.indexOf(element)
                    other_id = this.builder.biomes.findIndex(e => e.getKey() === this.dragKey)
                }

                if (self_id < other_id) {
                    element_div.classList.add("dragover_up")
                } else {
                    element_div.classList.add("dragover_down")
                }

                if (this.lastDragedOverDiv != element_div) {
                    this.lastDragedOverDiv?.classList?.remove("dragover_up", "dragover_down")
                    this.lastDragedOverDiv = element_div
                }
                evt.preventDefault()
            }
        }

        element_div.ondragleave = (evt) => {
            setTimeout(() => element_div.classList.remove("dragover_up", "dragover_down"), 20)
            evt.preventDefault()
        }

        element_div.ondrop = (evt) => {
            element_div.classList.remove("dragover_up", "dragover_down")

            if (this.dragType === c && this.dragKey !== element.getKey()) {
                var self_id, other_id

                if (element instanceof Slice) {
                    self_id = this.builder.slices.indexOf(element)
                    other_id = this.builder.slices.findIndex(e => e.getKey() === this.dragKey)
                    this.builder.slices.splice(self_id, 0, this.builder.slices.splice(other_id, 1)[0])
                } else if (element instanceof Layout) {
                    self_id = this.builder.layouts.indexOf(element)
                    other_id = this.builder.layouts.findIndex(e => e.getKey() === this.dragKey)
                    this.builder.layouts.splice(self_id, 0, this.builder.layouts.splice(other_id, 1)[0])
                } else if (element instanceof Biome) {
                    self_id = this.builder.biomes.indexOf(element)
                    other_id = this.builder.biomes.findIndex(e => e.getKey() === this.dragKey)
                    this.builder.biomes.splice(self_id, 0, this.builder.biomes.splice(other_id, 1)[0])
                }
                UI.getInstance().refresh()

                evt.preventDefault()
            }
        }

        element_div.onmousemove = () => {
            MenuManager.toggleAction("open", true)
            MenuManager.toggleAction("reorder", c !== "vanilla_biome")
            MenuManager.toggleAction("select", (UI.getInstance().openElement === "assign_slices") === (c === "slice"))
        }

        element_div.onmouseleave = () => {
            MenuManager.toggleAction("open", false)
            MenuManager.toggleAction("reorder", false)
            MenuManager.toggleAction("select", false)
        }

        this.sidebar.appendChild(element_div)
        return element_div
    }

}