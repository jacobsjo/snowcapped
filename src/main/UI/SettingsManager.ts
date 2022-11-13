import * as d3 from "d3";
import { add } from "lodash";
import { Datapack, FileListDatapack, FileSystemDirectoryDatapack, PromiseDatapack, ZipDatapack } from "mc-datapack-loader"
import { NoiseSetting, BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { Exporter } from "../BuilderData/Exporter";
import { LegacyConfigDatapack } from "../BuilderData/LegacyConfigDatapack";
import { VanillaNoiseSettings } from "../Vanilla/VanillaNoiseSettings"
import { MenuManager } from "./MenuManager";
import { UI } from "./UI"



export class SettingsManager {
    private builder: BiomeBuilder

    constructor(builder: BiomeBuilder) {
        this.builder = builder
        this.refresh()
    }

    async refresh() {
        const dimensionNameInput = document.getElementById("dimension_name") as HTMLInputElement;
        dimensionNameInput.value = this.builder.dimensionName
        dimensionNameInput.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.dimensionName = dimensionNameInput.value
        }



        const noiseSettingsNameSelect = d3.select("#noise_settings_name")

        noiseSettingsNameSelect
            .selectAll("option")
            .data((await this.builder.datapacks.getIds("worldgen/noise_settings")).map(id => id.toString()))
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d)

        noiseSettingsNameSelect            
            .on("change", () => {
                this.builder.hasChanges = true
                this.builder.noiseSettingsName = noiseSettingsNameSelect.property("value")
                console.log(this.builder.noiseSettingsName)
                UI.getInstance().refresh({noises: true})
            })
        

        const exportSplinesCheckbox = document.getElementById("export_splines") as HTMLInputElement
        exportSplinesCheckbox.checked = this.builder.exportSplines
        exportSplinesCheckbox.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.exportSplines = exportSplinesCheckbox.checked
            UI.getInstance().refresh({noises: true})
        }        


        /*
         const VERSIONS = ['1_19']

        const targetVersion = document.getElementById("target_version") as HTMLSelectElement
        targetVersion.selectedIndex = VERSIONS.indexOf(this.builder.targetVersion)
        targetVersion.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.targetVersion = VERSIONS[targetVersion.selectedIndex]
        } */             
        
        const datapackList = d3.select("#datapack_list")

        const datapackInfo = await Promise.all(this.builder.datapacks.readers.map(async (d) => {
            return {
                datapack: d,
                name: await d.getName(),
                description: ((await d.getMcmeta()) as any)?.pack?.description as string ?? "",
                image: await d.getImage(),
            }
        }));

        const datapack_entries = (datapackList.selectAll(".datapack"))
            .data(datapackInfo, (d: any) => d.name)

        const datapack_enter = datapack_entries
            .enter().append("div")
            .classed("datapack", true)

        datapack_entries.exit().remove()

        datapack_enter.append("img").attr("src", d => d.image)
        const datapack_text = datapack_enter.append("div").classed("datapack_text", true)
        datapack_text.append("div").classed("datapack_name", true).text(d => d.name)
        datapack_text.append("div").classed("datapack_description", true).text(d => d.description)


        datapack_enter.filter(d=>d.datapack.save !== undefined).append("div").classed("button", true).classed("button", true).on("click", async (evt, d) => {
            const exporter = new Exporter(UI.getInstance().builder)
            exporter.insertIntoDatapack(d.datapack)
        }).attr("title", "Insert into this datapack") .append("img").attr("src", "images/insert.svg")

        datapack_enter.filter(d=>d.datapack !== this.builder.vanillaDatapack && d.datapack !== this.builder.legacyConfigDatapack).append("div").classed("button", true).on("click", async (evt, d) => {
            this.builder.datapacks.readers.splice(this.builder.datapacks.readers.indexOf(d.datapack), 1)
            console.log(this.builder.datapacks.readers)
            UI.getInstance().refresh({noises: true})
        }).attr("title", "Remove datapack") .append("img").attr("src", "images/remove.svg")

        datapack_enter.filter(d=>d.datapack === this.builder.legacyConfigDatapack).append("div").classed("button", true).on("click", async () => {
            const exporter = new Exporter(UI.getInstance().builder)
            const zip = await exporter.generateZip()
            const blob = await zip.generateAsync({type: "blob"})

            if ("showSaveFilePicker" in window){   // TODO move filename handling somewhere else
                MenuManager.fileHandle = await window.showSaveFilePicker(
                    {types: [
                        {
                            description: "Zip Files",
                            accept: {
                                "application/zip": [".zip"]
                            }
                        }
                    ], suggestedName: MenuManager.fileName.replace(".snowcapped.json", "").replace(".json", "") + ".zip"
                } )
                const writable = await MenuManager.fileHandle.createWritable()
                await writable.write(blob)
                await writable.close()
            } else {
                const a = document.createElement('a')
                a.download = MenuManager.fileName.replace(".snowcapped.json", "").replace(".json", "") + ".zip"
                a.href = window.URL.createObjectURL(blob)
                a.click()
            }
        }).attr("title", "Download as zip") .append("img").attr("src", "images/download.svg")



        const addZipDatapackButton = document.getElementById("addZipDatapackButton")
        addZipDatapackButton.onclick = async () => {
            if ("showOpenFilePicker" in window) {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [
                        {
                            description: "Zip files",
                            accept: {
                                "application/zip": [".zip"]
                            }
                        }
                    ]
                })

                const file = await fileHandle.getFile()
                this.addZipDatapack(file)
            } else {
                const input = document.createElement('input') as HTMLInputElement
                input.type = 'file'
                input.accept = '.zip'

                input.onchange = (evt) => {
                    const file = (evt.target as HTMLInputElement).files[0]
                    this.addZipDatapack(file)
                }

                input.click()
            }
        }

        const addDirectoryDatapackButton = document.getElementById("addDirectoryDatapackButton")
        addDirectoryDatapackButton.onclick = async () => {
            var datapack: Datapack

            if ("showDirectoryPicker" in window) {
                datapack = new FileSystemDirectoryDatapack(await window.showDirectoryPicker())
            } else {
                datapack = await new Promise<Datapack>((resolve) => {
                    const input: any = document.createElement('input')
                    input.type = 'file'
                    input.webkitdirectory = true

                    input.onchange = async () => {
                        resolve(new FileListDatapack(Array.from(input.files)))
                    }
                    input.click()
                })
            }

            this.builder.datapacks.readers.splice(this.builder.datapacks.readers.length - 1, 0, datapack)
            UI.getInstance().refresh({noises: true})
    
        }
    }

    private addZipDatapack(file: File){
        const datapack = new PromiseDatapack(ZipDatapack.fromFile(file))
        this.builder.datapacks.readers.splice(this.builder.datapacks.readers.length - 1, 0, datapack)
        UI.getInstance().refresh({noises: true})
    }

}