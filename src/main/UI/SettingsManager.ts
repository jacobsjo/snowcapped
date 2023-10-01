import * as d3 from "d3";
import { Datapack, ResourceLocation } from "mc-datapack-loader"
import { MAX_DATAPACK_FORMAT, MIN_DATAPACK_FORMAT } from "../../SharedConstants";
import { BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { Exporter } from "../BuilderData/Exporter";
import { MenuManager } from "./MenuManager";
import { UI } from "./UI"

export class SettingsManager {
    private builder: BiomeBuilder

    constructor(builder: BiomeBuilder) {
        this.builder = builder
        this.refresh()
    }

    async refresh() {
        const datapackVersionInput = document.getElementById("target_datapack_version") as HTMLInputElement;
        datapackVersionInput.value = this.builder.datapackFormat.toString()
        datapackVersionInput.min = MIN_DATAPACK_FORMAT.toString()
        datapackVersionInput.max = MAX_DATAPACK_FORMAT.toString()

        datapackVersionInput.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.setDatapackFormat(parseInt(datapackVersionInput.value))
            UI.getInstance().refresh({noises: true})
        }


        const dimensionNameInput = document.getElementById("dimension_name") as HTMLInputElement;
        dimensionNameInput.value = this.builder.dimensionName
        dimensionNameInput.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.dimensionName = dimensionNameInput.value
            UI.getInstance().refresh({noises: true})
        }



        const noiseSettingsNameSelect = d3.select("#noise_settings_name")

        const noiseSettings = (await this.builder.compositeDatapack.getIds(ResourceLocation.WORLDGEN_NOISE_SETTINGS)).map(id => id.toString())

        var missingNoiseSetting = false

        if (!noiseSettings.includes(this.builder.noiseSettingsName) ){
            noiseSettings.push(this.builder.noiseSettingsName)
            missingNoiseSetting = true
        }

        const options = noiseSettingsNameSelect
            .selectAll("option")
            .data(noiseSettings, d => d as string)

        options
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d)

        options
            .exit()
            .remove()


        noiseSettingsNameSelect  
            .property("value", this.builder.noiseSettingsName)
            .on("change", () => {
                this.builder.hasChanges = true
                this.builder.noiseSettingsName = noiseSettingsNameSelect.property("value")
                UI.getInstance().refresh({noises: true})
            })
        
        document.getElementById("missing_noise_setting")!.classList.toggle("hidden", !missingNoiseSetting)

        const exportSplinesCheckbox = document.getElementById("export_splines") as HTMLInputElement
        exportSplinesCheckbox.checked = this.builder.exportSplines
        exportSplinesCheckbox.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.exportSplines = exportSplinesCheckbox.checked
            UI.getInstance().refresh({noises: true})
        }        


        const exportBiomeColorsCheckbox = document.getElementById("export_biome_colors") as HTMLInputElement
        exportBiomeColorsCheckbox.checked = this.builder.exportBiomeColors
        exportBiomeColorsCheckbox.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.exportBiomeColors = exportBiomeColorsCheckbox.checked
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

        const datapackInfo = await Promise.all(this.builder.datapacks.map(async (d) => {
            var description = (await d.getMcmeta())?.pack?.description ?? ""
            if (typeof description !== "string"){
                description = JSON.stringify(description)
            }

            return {
                datapack: d,
                name: await d.getFilename(),
                description: description as string,
                image: await d.getImage(),
                canSave: await d.canSave()
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


        datapack_enter.filter(d=>d.canSave).append("div").classed("button", true).classed("button", true).on("click", async (evt, d) => {
            const exporter = new Exporter(UI.getInstance().builder)
            exporter.insertIntoDatapack(d.datapack)
        }).attr("title", "Insert into this datapack") .append("img").attr("src", "images/insert.svg")

        datapack_enter.filter(d=>d.datapack !== this.builder.vanillaDatapack && d.datapack !== this.builder.legacyConfigDatapack).append("div").classed("button", true).on("click", async (evt, d) => {
            this.builder.datapacks.splice(this.builder.datapacks.indexOf(d.datapack), 1)
            console.log(this.builder.datapacks)
            UI.getInstance().refresh({noises: true})
        }).attr("title", "Remove datapack") .append("img").attr("src", "images/remove.svg")

        datapack_enter.filter(d=>d.datapack === this.builder.legacyConfigDatapack).append("div").classed("button", true).on("click", async () => {
            const exporter = new Exporter(UI.getInstance().builder)
            const zip = await exporter.generateZip()
            const blob = await zip.generateAsync({type: "blob"})

            if ("showSaveFilePicker" in window){   // TODO move filename handling from MenuManger to somewhere else
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



        const addZipDatapackButton = document.getElementById("addZipDatapackButton")!
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
                    const file = (evt.target as HTMLInputElement).files![0]
                    this.addZipDatapack(file)
                }

                input.click()
            }
        }

        const addDirectoryDatapackButton = document.getElementById("addDirectoryDatapackButton")!
        addDirectoryDatapackButton.onclick = async () => {
            var datapack: Datapack

            if ("showDirectoryPicker" in window) {
                datapack = Datapack.fromFileSystemDirectoryHandle(await window.showDirectoryPicker(), this.builder.datapackFormat)
            } else {
                datapack = await new Promise<Datapack>((resolve) => {
                    const input: any = document.createElement('input')
                    input.type = 'file'
                    input.webkitdirectory = true

                    input.onchange = async () => {
                        resolve(Datapack.fromFileList(Array.from(input.files), this.builder.datapackFormat))
                    }
                    input.click()
                })
            }

            this.builder.datapacks.splice(this.builder.datapacks.length - 1, 0, datapack)
            UI.getInstance().refresh({noises: true})
    
        }
    }

    private addZipDatapack(file: File){
        const datapack = Datapack.fromZipFile(file, this.builder.datapackFormat)
        this.builder.datapacks.splice(this.builder.datapacks.length - 1, 0, datapack)
        UI.getInstance().refresh({noises: true})
    }

}