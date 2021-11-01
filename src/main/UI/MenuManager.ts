import { read } from "deepslate"
import { Exporter } from "../BuilderData/Exporter"
import { UI } from "./UI"



export class MenuManager {
    private static loadVanillaButton: HTMLElement
    private static loadEmptyButton: HTMLElement
    private static openButton: HTMLElement
    private static saveButton: HTMLElement
    private static exportDimensionButton: HTMLElement
    private static exportSplinesButton: HTMLElement
    private static settingsButton: HTMLElement
    private static toggleDarkmodeButton: HTMLElement

    static createClickHandlers() {
        this.loadVanillaButton = document.getElementById('loadVanillaButton')
        this.loadEmptyButton = document.getElementById('loadEmptyButton')
        this.openButton = document.getElementById('openButton')
        this.saveButton = document.getElementById('saveButton')
        this.exportDimensionButton = document.getElementById('exportDimensionButton')
        this.exportSplinesButton = document.getElementById('exportSplinesButton')
        this.settingsButton = document.getElementById('settingsButton')
        this.toggleDarkmodeButton = document.getElementById('toggleDarkmodeButton')

        this.loadVanillaButton.onclick = (evt: Event) => {
            if (!this.confirmUnsavedChanges())
                return

            UI.getInstance().builder.hasChanges = false

            fetch('minecraft_overworld.snowcapped.json').then( r => r.text()).then(jsonString => {
                UI.getInstance().builder.loadJSON(JSON.parse(jsonString))
                UI.getInstance().visualizationManager.updateNoises()
                UI.getInstance().sidebarManager.openElement({type: "assign_slices"})
                UI.getInstance().refresh()
            })
        }

        this.loadEmptyButton.onclick = (evt: Event) => {
            if (!this.confirmUnsavedChanges())
                return

            UI.getInstance().builder.hasChanges = false

            fetch('empty.snowcapped.json').then( r => r.text()).then(jsonString => {
                UI.getInstance().builder.loadJSON(JSON.parse(jsonString))
                UI.getInstance().visualizationManager.updateNoises()
                UI.getInstance().sidebarManager.openElement({type: "assign_slices"})
                UI.getInstance().refresh()
            })
        }


        this.openButton.onclick = (evt: Event) => {
            if (!this.confirmUnsavedChanges())
                return

            UI.getInstance().builder.hasChanges = false

            const input = document.createElement('input') as HTMLInputElement
            input.type = 'file'
            input.accept = '.snowcapped.json'

            input.onchange = (evt) => {
                const file = (evt.target as HTMLInputElement).files[0]

                const reader = new FileReader();
                reader.readAsText(file, 'UTF-8')

                reader.onload = (evt: ProgressEvent<FileReader>) => {
                    const jsonString = evt.target.result as string
                    UI.getInstance().builder.loadJSON(JSON.parse(jsonString))
                    UI.getInstance().visualizationManager.updateNoises()
                    UI.getInstance().sidebarManager.openElement({type: "assign_slices"})
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
            a.download = UI.getInstance().builder.dimensionName.replace(new RegExp(":|\/"), "_") + ".snowcapped.json"
            a.href = window.URL.createObjectURL(bb)
            a.click()
            UI.getInstance().builder.hasChanges = false
        }

        this.exportDimensionButton.onclick = (evt: Event) => {
            const exporter = new Exporter(UI.getInstance().builder)
            const jsonString = exporter.export()
            const bb = new Blob([jsonString], {type: 'text/plain'})
            const a = document.createElement('a')
            const name = UI.getInstance().builder.dimensionName.split(new RegExp(":|\/")).reverse()[0] + ".json"
            a.download = name
            a.href = window.URL.createObjectURL(bb)
            a.click()
        }

        this.exportSplinesButton.onclick = (evt: Event) => {
            const json = {
                offset: UI.getInstance().builder.splines.offset.export(),
                factor: UI.getInstance().builder.splines.factor.export(),
                jaggedness: UI.getInstance().builder.splines.jaggedness.export()
            }
            const jsonString = "\"terrain_shaper\": " + JSON.stringify(json)

            const bb = new Blob([jsonString], {type: 'text/plain'})
            const a = document.createElement('a')
            const name = UI.getInstance().builder.dimensionName.split(new RegExp(":|\/")).reverse()[0] + "_terrain_shaper.json"
            a.download = name
            a.href = window.URL.createObjectURL(bb)
            a.click()
        }


        this.settingsButton.onclick = (evt: Event) => {
            const settingsOpen = !document.getElementById("settings").classList.toggle("hidden")
            document.getElementById("editor").classList.toggle("hidden", settingsOpen)
            this.settingsButton.classList.toggle("open", settingsOpen)
        }

        this.toggleDarkmodeButton.onclick = (evt: Event) => {
            const isLight = document.body.classList.toggle("light")
            ;(this.toggleDarkmodeButton.children[0] as (HTMLImageElement)).src = isLight ? "moon.svg" : "sun.svg"
            UI.getInstance().refresh()
        }

        window.onbeforeunload = (evt: BeforeUnloadEvent) => {
            if (UI.getInstance().builder.hasChanges){
                return "You have unsaved changes. Continue?"
            }
            return undefined
        }
    }

    private static confirmUnsavedChanges(): boolean{
        return UI.getInstance().builder.hasChanges ? confirm("You have unsaved changes. Continue?") : true
    }

    static toggleAction(name: string, force?: boolean){
        document.getElementById(name).classList.toggle("hidden", !force)
    }
}