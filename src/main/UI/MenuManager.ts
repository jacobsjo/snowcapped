import { read } from "deepslate"
import { IS_EXPERIMENTAL } from "../../SharedConstants"
import { Exporter } from "../BuilderData/Exporter"
import { UI } from "./UI"

import Swal from 'sweetalert2'
import { DataFixer } from "../BuilderData/DataFixer"


export class MenuManager {
    private static loadVanilla118Button: HTMLElement
    private static loadVanilla119Button: HTMLElement
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

    static async loadVanilla(filename: string){
        if (! await this.confirmUnsavedChanges())
            return

        UI.getInstance().builder.hasChanges = false

        fetch(filename).then( r => r.text()).then(jsonString => {
            this.fileHandle = undefined
            this.fileName = "New Snowcapped File.snowcapped.json"
            UI.getInstance().builder.loadJSON(JSON.parse(jsonString))
            UI.getInstance().sidebarManager.openElement({type: "dimension", key: "dimension"})
            UI.getInstance().refresh({biome: {}, spline: true, grids: true, noises: true })
        })
    }

    static maybeLoadJson(json: any){
        json = DataFixer.fixJSON(json)

        console.log(json)
        if (json.warn_upgrade){
            Swal.fire({
                title: 'Upgrading Data',
                text: "You are loading data from an old version of Snowcapped. Upgraded data can not be downgraded again. Please make a backup before continuing.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'I made a backup, Continue'
            }).then((result) => {
                if (result.isConfirmed) {
                    UI.getInstance().builder.loadJSON(json)
                    UI.getInstance().sidebarManager.openElement({type: "dimension", key: "dimension"})
                    UI.getInstance().refresh({biome: {}, spline: true, grids: true, noises: true })
                }
            })
        } else {
            UI.getInstance().builder.loadJSON(json)
            UI.getInstance().sidebarManager.openElement({type: "dimension", key: "dimension"})
            UI.getInstance().refresh({biome: {}, spline: true, grids: true, noises: true })
        }
    }

    static createClickHandlers() {
        this.loadVanilla118Button = document.getElementById('loadVanilla118Button')
        this.loadVanilla119Button = document.getElementById('loadVanilla119Button')
        this.loadEmptyButton = document.getElementById('loadEmptyButton')
        this.openButton = document.getElementById('openButton')
        this.saveButton = document.getElementById('saveButton')
        this.saveAsButton = document.getElementById('saveAsButton')
        this.exportZipButton = document.getElementById('exportZipButton')
        this.exportInsertButton = document.getElementById('exportInsertButton')
        this.settingsButton = document.getElementById('settingsButton')
        this.toggleDarkmodeButton = document.getElementById('toggleDarkmodeButton')

        this.loadVanilla118Button.onclick = (evt: Event) => {
            this.loadVanilla('minecraft_overworld_1_18.snowcapped.json')
        }

        this.loadVanilla119Button.onclick = (evt: Event) => {
            this.loadVanilla('minecraft_overworld_1_19.snowcapped.json')
        }

        this.loadEmptyButton.onclick = async (evt: Event) => {
            if (!await this.confirmUnsavedChanges())
                return

            UI.getInstance().builder.hasChanges = false

            fetch('empty.snowcapped.json').then( r => r.text()).then(jsonString => {
                this.fileHandle = undefined
                this.fileName = "New Snowcapped File.snowcapped.json"
                MenuManager.maybeLoadJson(JSON.parse(jsonString))
            })
        }


        this.openButton.onclick = async (evt: Event) => {
            if (!await this.confirmUnsavedChanges())
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
                MenuManager.maybeLoadJson(JSON.parse(jsonString))
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
                        MenuManager.maybeLoadJson(JSON.parse(jsonString))
                    }

                    console.log(file)
                }

                input.click()
            }

            this.updateTitle()

        }


        const saveAs = async () => {
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
            if (this.fileHandle){
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
                Swal.fire({
                    text: "Inserting into Datapack is not supported in your browser",
                    icon: 'error',
                    confirmButtonColor: '#d33',
                    confirmButtonText: 'Ok'
                })
                return
            }

            const dirHandle = await window.showDirectoryPicker()
            const exporter = new Exporter(UI.getInstance().builder)
            try {
                await exporter.insertIntoDirectory(dirHandle)
            } catch (e){
                Swal.fire({
                    text: "Could not insert into datapack: " + e,
                    icon: 'error',
                    confirmButtonColor: '#d33',
                    confirmButtonText: 'Ok'
                })
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

    private static async confirmUnsavedChanges(): Promise<boolean>{
        if (UI.getInstance().builder.hasChanges){
            const result = await Swal.fire({
                text: "You have unsaved changes that will be lost.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Continue'
            })
            return result.isConfirmed
        } else {
            return true
        }
    }

    public static updateTitle(){
        document.title = (UI.getInstance().builder.hasChanges ? "*" : "") + this.fileName.replace(".snowcapped.json", "").replace(".json", "") + " - Snowcapped"
    }

    static toggleAction(name: string, force?: boolean){
        document.getElementById(name).classList.toggle("hidden", !force)
    }
}