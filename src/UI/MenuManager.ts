import { read } from "deepslate"
import { Exporter } from "../BuilderData/Exporter"
import { UI } from "./UI"



export class MenuManager {
    private static loadVanillaButton: HTMLElement
    private static openButton: HTMLElement
    private static saveButton: HTMLElement
    private static exportButton: HTMLElement

    static createClickHandlers() {
        this.loadVanillaButton = document.getElementById('loadVanillaButton')
        this.openButton = document.getElementById('openButton')
        this.saveButton = document.getElementById('saveButton')
        this.exportButton = document.getElementById('exportButton')

        this.loadVanillaButton.onclick = (evt: Event) => {
            fetch('vanilla_overworld_biome_builder.json').then( r => r.text()).then(jsonString => {
                UI.getInstance().builder.loadJSON(JSON.parse(jsonString))
                UI.getInstance().openElement = "assign_slices"
                UI.getInstance().refresh()
            })
        }

        this.openButton.onclick = (evt: Event) => {
            const input = document.createElement('input') as HTMLInputElement
            input.type = 'file'

            input.onchange = (evt) => {
                const file = (evt.target as HTMLInputElement).files[0]

                const reader = new FileReader();
                reader.readAsText(file, 'UTF-8')

                reader.onload = (evt: ProgressEvent<FileReader>) => {
                    const jsonString = evt.target.result as string
                    UI.getInstance().builder.loadJSON(JSON.parse(jsonString))
                    UI.getInstance().openElement = "assign_slices"
                    UI.getInstance().refresh()
                }

                console.log(file)
            }

            input.click()

        }

        this.saveButton.onclick = (evt: Event) => {
            const jsonString = JSON.stringify(UI.getInstance().builder.toJSON())
            const bb = new Blob([jsonString], {type: 'text/plain'})
            const a = document.createElement('a')
            a.download = 'biome_builder.json'
            a.href = window.URL.createObjectURL(bb)
            a.click()
        }

        this.exportButton.onclick = (evt: Event) => {
            const exporter = new Exporter(UI.getInstance().builder)
            const jsonString = exporter.export()
            const bb = new Blob([jsonString], {type: 'text/plain'})
            const a = document.createElement('a')
            a.download = 'dimension.json'
            a.href = window.URL.createObjectURL(bb)
            a.click()
        }

    }
}