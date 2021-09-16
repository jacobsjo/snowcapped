import { BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { LayoutEditor } from "./LayoutEditor"



export class SidebarManager{
    private sidebar: HTMLElement
    private builder: BiomeBuilder
    private layoutEditor: LayoutEditor

    constructor(builder: BiomeBuilder, layoutEditor: LayoutEditor){
        this.sidebar = document.getElementById("sidebar")
        this.builder = builder
        this.layoutEditor = layoutEditor
    }

    refresh(){
        this.sidebar.innerHTML = ""

        this.builder.layouts.forEach(layout => {
            const layout_div = document.createElement("div")
            layout_div.classList.add("layout")

            const layout_canvas = document.createElement("canvas") as HTMLCanvasElement
            layout_canvas.classList.add("grid")
            layout_canvas.width = 100
            layout_canvas.height = 100
            layout.getRenderer().draw(layout_canvas.getContext("2d"), 0,0, 100, 100, -1, -1, true, true)
            layout_div.appendChild(layout_canvas)
            
            const layout_name = document.createElement("span")
            layout_name.classList.add("name")
            layout_name.innerHTML = layout.name
            layout_div.appendChild(layout_name)
            
            layout_div.onclick = (evt) => {
                this.layoutEditor.setLayout(layout.name)
                this.layoutEditor.refresh()
            }

            this.sidebar.appendChild(layout_div)            
        });
    }

}