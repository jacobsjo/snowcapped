import { BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { Layout } from "../BuilderData/Layout"
import { LayoutElement } from "../BuilderData/LayoutElement"
import { Slice } from "../BuilderData/Slice"
import { LayoutEditor } from "./LayoutEditor"
import { UI } from "./UI"



export class SidebarManager {
    private sidebar: HTMLElement
    private builder: BiomeBuilder

    private layout_divs: HTMLElement[]
    private biome_divs: HTMLElement[]

    constructor(builder: BiomeBuilder) {
        this.sidebar = document.getElementById("sidebar")
        this.builder = builder
    }

    refresh() {
        const lastSearch = (this.sidebar.getElementsByClassName("search_bar")?.[0] as HTMLInputElement)?.value ?? ""

        this.sidebar.innerHTML = ""
        this.layout_divs = []
        this.biome_divs = []

        // Add Add Button
        const assignSplicesButton = document.createElement("div")
        assignSplicesButton.classList.add("sidebar_entry")
        assignSplicesButton.classList.add("assign_slices_button")
        if (UI.getInstance().openElement === "assign_slices"){
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

        // Add Slices
        this.builder.slices.forEach(slice => {
            this.layout_divs.push(this.createElementDiv(slice, "slice"))
        });

        // Add Add Button
        const addSlicesButton = document.createElement("div")
        addSlicesButton.classList.add("sidebar_entry")
        addSlicesButton.classList.add("add_layout_button")
        addSlicesButton.innerHTML = "+ Add Slice"
        addSlicesButton.onclick = (evt: Event) => {
            const slice = Slice.create(this.builder, "New Slice", "unassigned")
            UI.getInstance().openElement = slice.getKey()
            UI.getInstance().refresh()
        }
        this.sidebar.appendChild(addSlicesButton)

        // Add spacer
        const spacer1 = document.createElement("div")
        spacer1.classList.add("spacer")
        this.sidebar.appendChild(spacer1)

        // Layouts
        this.builder.layouts.forEach(element => {
            this.layout_divs.push(this.createElementDiv(element, "layout"))
        });

        // Add Add Button
        const addLayoutButton = document.createElement("div")
        addLayoutButton.classList.add("sidebar_entry")
        addLayoutButton.classList.add("add_layout_button")
        addLayoutButton.innerHTML = "+ Add Layout"
        addLayoutButton.onclick = (evt: Event) => {
            const layout = Layout.create(this.builder, "New Layout")
            UI.getInstance().openElement = layout.getKey()
            UI.getInstance().refresh()
        }
        this.sidebar.appendChild(addLayoutButton)

        // Add spacer
        const spacer2 = document.createElement("div")
        spacer2.classList.add("spacer")
        this.sidebar.appendChild(spacer2)


        // Add seachBar
        const searchBar = document.createElement("input") as HTMLInputElement
        searchBar.type = "text"
        searchBar.placeholder = "Seach..."
        searchBar.value = lastSearch
        searchBar.classList.add("search_bar")
        searchBar.oninput = (evt: Event) => {
            this.biome_divs.forEach(div => {
                div.classList.toggle("hidden", !div.getAttribute("key").includes(searchBar.value))
            })
        }
        this.sidebar.appendChild(searchBar)

        // Biomes
        this.builder.biomes.forEach(element => {
            const div = this.createElementDiv(element, "biome")
            div.classList.toggle("hidden", !div.getAttribute("key").includes(searchBar.value))
            this.biome_divs.push(div)
        });
    }

    private createElementDiv(element: LayoutElement | Slice, c: string): HTMLElement {
        const layout_div = document.createElement("div")
        layout_div.classList.add("sidebar_entry")
        layout_div.classList.add(c)

        if (element.getKey() === UI.getInstance()?.selectedElement){
            layout_div.classList.add("selected")
        }

        if (element.getKey() === UI.getInstance()?.openElement){
            layout_div.classList.add("open")
        }


        layout_div.setAttribute("key", element.getKey())

        const layout_canvas = document.createElement("canvas") as HTMLCanvasElement
        layout_canvas.classList.add("grid")
        layout_canvas.width = 100
        layout_canvas.height = 100
        element.getRenderer().draw(layout_canvas.getContext("2d"), 0, 0, 100, 100, -1, -1, false, true)
        layout_div.appendChild(layout_canvas)

        const layout_name = document.createElement("span")
        layout_name.classList.add("name")
        layout_name.innerHTML = element.name
        layout_div.appendChild(layout_name)

        if (element instanceof Layout || element instanceof Slice) {
            layout_div.oncontextmenu = (evt) => {
                if (UI.getInstance().openElement === "assign_slices"){
                    UI.getInstance().selectedElement = ""
                }

                UI.getInstance().openElement = element.getKey()

                if (UI.getInstance().selectedElement === element.getKey()){
                    UI.getInstance().selectedElement = ""
                }

                UI.getInstance().refresh()

                evt.preventDefault()
            }

            layout_div.ondblclick = layout_div.oncontextmenu            
        }

        layout_div.onclick = (evt) => {
            if ((UI.getInstance().openElement === "assign_slices") !== (element instanceof Slice))
                return

            UI.getInstance().selectedElement = element.getKey()

            this.layout_divs.forEach(div => {
                div.classList.toggle("selected", div.getAttribute("key") === UI.getInstance().selectedElement)
            });

            this.biome_divs.forEach(div => {
                div.classList.toggle("selected", div.getAttribute("key") === UI.getInstance().selectedElement)
            });
        }
        this.sidebar.appendChild(layout_div)
        return layout_div
    }

}