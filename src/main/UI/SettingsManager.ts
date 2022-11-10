import { NoiseSetting, BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { VanillaNoiseSettings } from "../Vanilla/VanillaNoiseSettings"
import { UI } from "./UI"



export class SettingsManager {
    private builder: BiomeBuilder

    constructor(builder: BiomeBuilder) {
        this.builder = builder
        this.refresh()
    }

    refresh() {
        const dimensionNameInput = document.getElementById("dimension_name") as HTMLInputElement;
        dimensionNameInput.value = this.builder.dimensionName
        dimensionNameInput.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.dimensionName = dimensionNameInput.value
        }



        const noiseSettingsNameInput = document.getElementById("noise_settings_name") as HTMLInputElement
        noiseSettingsNameInput.value = this.builder.noiseSettingsName
        noiseSettingsNameInput.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.noiseSettingsName = noiseSettingsNameInput.value
        } 

        const exportSplinesCheckbox = document.getElementById("export_splines") as HTMLInputElement
        exportSplinesCheckbox.checked = this.builder.exportSplines
        exportSplinesCheckbox.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.exportSplines = exportSplinesCheckbox.checked
        }        


        /*
         const VERSIONS = ['1_19']

        const targetVersion = document.getElementById("target_version") as HTMLSelectElement
        targetVersion.selectedIndex = VERSIONS.indexOf(this.builder.targetVersion)
        targetVersion.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.targetVersion = VERSIONS[targetVersion.selectedIndex]
        } */               
    }
}