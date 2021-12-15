import { read } from "deepslate"
import { IS_EXPERIMENTAL } from "../../SharedConstants"
import { Exporter } from "../BuilderData/Exporter"
import { UI } from "./UI"



export class MenuManager {
    private static loadVanillaButton: HTMLElement
    private static loadEmptyButton: HTMLElement
    private static openButton: HTMLElement
    private static saveButton: HTMLElement
    private static saveAsButton: HTMLElement
    private static exportZipButton: HTMLElement
    private static exportInsertButton: HTMLElement
    private static settingsButton: HTMLElement
    private static toggleDarkmodeButton: HTMLElement

    private static fileHandle: FileSystemFileHandle
    public static fileName: string = "New Snowcapped File.snowcapped.json"

    static createClickHandlers() {
        this.loadVanillaButton = document.getElementById('loadVanillaButton')
        this.loadEmptyButton = document.getElementById('loadEmptyButton')
        this.openButton = document.getElementById('openButton')
        this.saveButton = document.getElementById('saveButton')
        this.saveAsButton = document.getElementById('saveAsButton')
        this.exportZipButton = document.getElementById('exportZipButton')
        this.exportInsertButton = document.getElementById('exportInsertButton')
        this.settingsButton = document.getElementById('settingsButton')
        this.toggleDarkmodeButton = document.getElementById('toggleDarkmodeButton')

        this.loadVanillaButton.onclick = (evt: Event) => {
            if (!this.confirmUnsavedChanges())
                return

            UI.getInstance().builder.hasChanges = false

            fetch('minecraft_overworld.snowcapped.json').then( r => r.text()).then(jsonString => {
                this.fileHandle = undefined
                this.fileName = "New Snowcapped File.snowcapped.json"
                UI.getInstance().builder.loadJSON(JSON.parse(jsonString))
                UI.getInstance().sidebarManager.openElement({type: "dimension", key: "dimension"})
                UI.getInstance().refresh({biome: {}, spline: true, grids: true, noises: true })
            })
        }

        this.loadEmptyButton.onclick = (evt: Event) => {
            if (!this.confirmUnsavedChanges())
                return

            UI.getInstance().builder.hasChanges = false

            fetch('empty.snowcapped.json').then( r => r.text()).then(jsonString => {
                this.fileHandle = undefined
                this.fileName = "New Snowcapped File.snowcapped.json"
                UI.getInstance().builder.loadJSON(JSON.parse(jsonString))
                UI.getInstance().sidebarManager.openElement({type: "dimension", key: "dimension"})
                UI.getInstance().refresh({biome: {}, spline: true, grids: true, noises: true })
            })
        }


        this.openButton.onclick = async (evt: Event) => {
            if (!this.confirmUnsavedChanges())
                return

            UI.getInstance().builder.hasChanges = false

            if ("showOpenFilePicker" in window){
                [this.fileHandle] = await window.showOpenFilePicker({types: [
                    {
                        description: "Snowcapped File",
                        accept: {
                            "application/json": [".snowcapped.json"]
                        }
                    },
                    {
                        description: "All JSON files",
                        accept: {
                            "application/json": [".json"]
                        }
                    }
                ]} )
                this.fileName = this.fileHandle.name

                const file = await this.fileHandle.getFile()
                const jsonString = await file.text()
                UI.getInstance().builder.loadJSON(JSON.parse(jsonString))
                UI.getInstance().sidebarManager.openElement({type: "dimension", key: "dimension"})
                UI.getInstance().refresh({biome: {}, spline: true, grids: true, noises: true })
            } else {
                const input = document.createElement('input') as HTMLInputElement
                input.type = 'file'
                input.accept = '.snowcapped.json,.json'

                input.onchange = (evt) => {
                    const file = (evt.target as HTMLInputElement).files[0]

                    const reader = new FileReader();
                    reader.readAsText(file, 'UTF-8')

                    reader.onload = (evt: ProgressEvent<FileReader>) => {
                        this.fileHandle = undefined
                        this.fileName = file.name
                        const jsonString = evt.target.result as string
                        UI.getInstance().builder.loadJSON(JSON.parse(jsonString))
                        UI.getInstance().sidebarManager.openElement({type: "dimension", key: "dimension"})
                        UI.getInstance().refresh({biome: {}, spline: true, grids: true, noises: true })
                    }

                    console.log(file)
                }

                input.click()
            }

            this.updateTitle()

        }


        const saveAs = async () => {
            if (UI.getInstance().builder.is_experimental_upgraded && !confirm("You are currently using an experimental version of Snowcapped. Save files from this version can not be loaded in the stable release. Please don't override your old file!")){
                return 
            }

            const jsonString = JSON.stringify(UI.getInstance().builder.toJSON())
            if ("showSaveFilePicker" in window){
                this.fileHandle = await window.showSaveFilePicker(
                    {types: [
                        {
                            description: "Snowcapped File",
                            accept: {
                                "application/json": [".snowcapped.json"]
                            }
                        },
                        {
                            description: "All JSON files",
                            accept: {
                                "application/json": [".json"]
                            }
                        }
                    ], suggestedName: this.fileName
                } )
                this.fileName = this.fileHandle.name
                const writable = await this.fileHandle.createWritable()
                await writable.write(JSON.stringify(UI.getInstance().builder.toJSON()))
                await writable.close()
                UI.getInstance().builder.is_experimental_upgraded = false
            } else {
                const bb = new Blob([jsonString], {type: 'text/plain'})
                const a = document.createElement('a')
                a.download = this.fileName
                a.href = window.URL.createObjectURL(bb)
                a.click()
            }
            UI.getInstance().builder.hasChanges = false
            this.updateTitle()
        }

        const save = async (evt: Event) => {
            if (this.fileHandle && !UI.getInstance().builder.is_experimental_upgraded){
                const writable = await this.fileHandle.createWritable()
                await writable.write(JSON.stringify(UI.getInstance().builder.toJSON()))
                await writable.close()
                UI.getInstance().builder.hasChanges = false
                this.updateTitle()
            } else {
                saveAs()
            }
        }

        this.saveAsButton.onclick = saveAs
        this.saveButton.onclick = save

        document.addEventListener("keydown", (evt) => {
            if ((evt.metaKey || evt.ctrlKey) && evt.key === "s"){
                evt.preventDefault()
                save(evt)
            }
        })

        this.exportZipButton.onclick = async (evt: Event) => {
            const exporter = new Exporter(UI.getInstance().builder)
            const zip = await exporter.generateZip()
            const blob = await zip.generateAsync({type: "blob"})

            if ("showSaveFilePicker" in window){
                this.fileHandle = await window.showSaveFilePicker(
                    {types: [
                        {
                            description: "Zip Files",
                            accept: {
                                "application/zip": [".zip"]
                            }
                        }
                    ], suggestedName: this.fileName.replace(".snowcapped.json", "").replace(".json", "") + ".zip"
                } )
                const writable = await this.fileHandle.createWritable()
                await writable.write(blob)
                await writable.close()
            } else {
                const a = document.createElement('a')
                a.download = this.fileName.replace(".snowcapped.json", "").replace(".json", "") + ".zip"
                a.href = window.URL.createObjectURL(blob)
                a.click()
            }
        }

        this.exportInsertButton.onclick = async (evt: Event) => {
            if (!("showDirectoryPicker" in window)){
                alert("Inserting into Datapack is not supported in your browser")
                return
            }

            const dirHandle = await window.showDirectoryPicker()
            const exporter = new Exporter(UI.getInstance().builder)
            try {
                await exporter.insertIntoDirectory(dirHandle)
            } catch (e){
                alert("Could not insert into datapack: " + e)
            }
        }

        this.settingsButton.onclick = (evt: Event) => {
            const settingsOpen = !document.getElementById("settings").classList.toggle("hidden")
            document.getElementById("editor").classList.toggle("hidden", settingsOpen)
            this.settingsButton.classList.toggle("open", settingsOpen)
        }

        this.toggleDarkmodeButton.onclick = (evt: Event) => {
            const isLight = document.body.classList.toggle("light")
            ;(this.toggleDarkmodeButton.children[0] as (HTMLImageElement)).src = isLight ? "images/moon.svg" : "images/sun.svg"
            UI.getInstance().refresh({})
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

    public static updateTitle(){
        document.title = (UI.getInstance().builder.hasChanges ? "*" : "") + this.fileName.replace(".snowcapped.json", "").replace(".json", "") + " - Snowcapped"
    }

    static toggleAction(name: string, force?: boolean){
        document.getElementById(name).classList.toggle("hidden", !force)
    }
}