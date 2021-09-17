import { slice } from "lodash"
import { BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { UI } from "./UI"


export class AssignSlicesManager {
    private builder: BiomeBuilder
    private title: HTMLInputElement
    private div: HTMLElement

    constructor(builder: BiomeBuilder) {
        this.builder = builder

        this.title = document.getElementById("layoutName") as HTMLInputElement
        this.div = document.getElementById("assignSlices")

    }

    refresh() {
        this.title.readOnly = true
        this.title.value = "Assign Slices"
        this.div.classList.remove("hidden")
        this.div.innerHTML = ""
        const table = document.createElement("table")
        this.builder.weirdnesses.forEach((weirdness, w_idx) => {
            const element = this.builder.getRenderedElement(weirdness[2])

            const row = document.createElement("tr")

            const name_col = document.createElement("td")
            name_col.innerHTML = weirdness[0] + ": "
            name_col.classList.add("weirdness_name")
            row.appendChild(name_col)

            const slice_icon_col = document.createElement("td")
            slice_icon_col.classList.add("slice_icon")

            const slice_icon = document.createElement("canvas") as HTMLCanvasElement
            slice_icon.width = 100
            slice_icon.height = 100
            element.getRenderer().draw(slice_icon.getContext('2d'), 0, 0, 100, 100, -1, -1, false, true)

            slice_icon_col.appendChild(slice_icon)

            row.appendChild(slice_icon_col)

            const slice_name_col = document.createElement("td")
            slice_name_col.innerHTML = element.name
            slice_name_col.classList.add("slice_name")
            row.appendChild(slice_name_col)

            const slice_mode_select_col = document.createElement("td")
            slice_mode_select_col.classList.add("slice_mode_select")

            const slice_mode_select_img = document.createElement("img") as HTMLImageElement
            slice_mode_select_img.src = "mode_" + weirdness[3] + ".png"
            slice_mode_select_img.onclick = (evt: MouseEvent) => {
                this.builder.weirdnesses[w_idx][3] = weirdness[3] === "A" ? "B" : "A"
                UI.getInstance().refresh()
                evt.preventDefault()
                evt.stopPropagation()
            }

            slice_mode_select_col.appendChild(slice_mode_select_img)

            row.onclick = (evt) => {
                if (evt.altKey) {
                    UI.getInstance().selectedElement = this.builder.weirdnesses[w_idx][2]
                    UI.getInstance().refresh()
                } else {
                    if (UI.getInstance().selectedElement !== "") {
                        this.builder.weirdnesses[w_idx][2] = UI.getInstance().selectedElement
                        UI.getInstance().refresh()
                    }
                }
            }

            row.oncontextmenu = (evt) => {
                if (this.builder.weirdnesses[w_idx][2] !== "unassigned"){
                    UI.getInstance().openElement = this.builder.weirdnesses[w_idx][2]
                    UI.getInstance().refresh()
                }
                evt.preventDefault()
            }

            row.appendChild(slice_mode_select_col)


            table.appendChild(row)
        })

        this.div.appendChild(table)
    }

    hide() {
        this.div.classList.add("hidden")
    }
}
