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


        const seedInput = document.getElementById("seed") as HTMLInputElement;
        seedInput.value = this.builder.seed.toString()
        seedInput.onkeypress = (evt) => {
            if (!evt.key.match(/^[0-9|-]+$/)) {
                evt.preventDefault();
            }
        }

        seedInput.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.seed = BigInt(seedInput.value)
            UI.getInstance().refresh({noises: true})
        }

        seedInput.onkeyup = (evt:KeyboardEvent) => {
            if (evt.key === "Enter"){
                seedInput.blur()
            }
        }        


        const noiseSettingsNameInput = document.getElementById("noise_settings_name") as HTMLInputElement
        noiseSettingsNameInput.value = this.builder.noiseSettingsName
        noiseSettingsNameInput.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.noiseSettingsName = noiseSettingsNameInput.value
        } 


        const exportDimensionCheckbox = document.getElementById("export_dimension") as HTMLInputElement
        exportDimensionCheckbox.checked = this.builder.exportDimension
        exportDimensionCheckbox.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.exportDimension = exportDimensionCheckbox.checked
        }        

        const exportSplinesCheckbox = document.getElementById("export_splines") as HTMLInputElement
        exportSplinesCheckbox.checked = this.builder.exportDimension
        exportSplinesCheckbox.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.exportDimension = exportSplinesCheckbox.checked
        }        

        const exportNoisesCheckbox = document.getElementById("export_noises") as HTMLInputElement
        exportNoisesCheckbox.checked = this.builder.exportDimension
        exportNoisesCheckbox.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.exportDimension = exportNoisesCheckbox.checked
        }        


        const VERSIONS = ['1_18_1', '1_18_2', '1_19']

        const targetVersion = document.getElementById("target_version") as HTMLSelectElement
        targetVersion.selectedIndex = VERSIONS.indexOf(this.builder.targetVersion)
        targetVersion.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.targetVersion = VERSIONS[targetVersion.selectedIndex]
        }                
        

        /* const legacyInput = document.getElementById("useLegacyRandom") as HTMLInputElement;
        legacyInput.checked = this.builder.useLegacyRandom;
        legacyInput.onchange = (evt) => {
            this.builder.hasChanges = true
            this.builder.useLegacyRandom = legacyInput.checked
            console.log("Checked")
        }*/

        this.createNoiseSettingFields(document.getElementById("continentalness_setting"), "Continentalness", this.builder.noiseSettings.continentalness)
        this.createNoiseSettingFields(document.getElementById("erosion_setting"), "Erosion", this.builder.noiseSettings.erosion)
        this.createNoiseSettingFields(document.getElementById("weirdness_setting"), "Weirdness", this.builder.noiseSettings.weirdness)
        this.createNoiseSettingFields(document.getElementById("temperature_setting"), "Temperature", this.builder.noiseSettings.temperature)
        this.createNoiseSettingFields(document.getElementById("humidity_setting"), "Humidity", this.builder.noiseSettings.humidity)
        this.createNoiseSettingFields(document.getElementById("shift_setting"), "Shift", this.builder.noiseSettings.shift)

        const resetButton = document.getElementById("reset_noises")
        resetButton.onclick = (evt) => {
            this.builder.hasChanges = true
            this.builder.noiseSettings = VanillaNoiseSettings.default()
            UI.getInstance().refresh({noises: true})
        }

        /*
        const copyButton = document.getElementById("copy_noise_settings")
        copyButton.onclick = (evt) => {
            navigator.clipboard.writeText("\"octaves\": " + JSON.stringify(this.builder.noiseSettings))
        }
        */
    }

    private createNoiseSettingFields(div: HTMLElement, name: string, noiseSettings: NoiseSetting) {
        div.innerHTML = ""

        const label = document.createElement("span")
        label.classList.add("description")
        label.innerHTML = name + ":"
        div.appendChild(label)

        const firstOctaveLabel = document.createElement("label")

        const firstOctaveDescription = document.createElement("div")
        firstOctaveDescription.classList.add("description", "minor")
        firstOctaveDescription.innerHTML = "FO:"
        firstOctaveDescription.title = "First Octave"
        firstOctaveLabel.appendChild(firstOctaveDescription)

        const firstOctaveInput = document.createElement("input")
        firstOctaveInput.classList.add("small")
        firstOctaveInput.type = "number"
        firstOctaveInput.value = noiseSettings.firstOctave.toString()
        firstOctaveInput.max = "-1"
        firstOctaveInput.step = "1"
        firstOctaveInput.onkeypress = (evt) => {
            if (!evt.key.match(/^[0-9|-]+$/)) {
                evt.preventDefault();
            }
        }

        firstOctaveInput.onchange = (evt) => {
            noiseSettings.firstOctave = parseInt(firstOctaveInput.value)
            firstOctaveInput.value = noiseSettings.firstOctave.toString()
            this.builder.hasChanges = true
            UI.getInstance().refresh({noises: true})
        }

        firstOctaveInput.onkeyup = (evt:KeyboardEvent) => {
            if (evt.key === "Enter"){
                firstOctaveInput.blur()
            }
        }


        firstOctaveLabel.appendChild(firstOctaveInput)

        div.appendChild(firstOctaveLabel)

        const amplitudesLabel = document.createElement("label")
        const amplitudesDescription = document.createElement("div")
        amplitudesDescription.classList.add("description", "minor")
        amplitudesDescription.innerHTML = "A:"
        amplitudesDescription.title = "Amplitudes"
        amplitudesLabel.appendChild(amplitudesDescription)

        for (let aidx = 0; aidx < noiseSettings.amplitudes.length; aidx++) {
            const amplitudeInput = document.createElement("input")
            amplitudeInput.classList.add("small")
            if (aidx === noiseSettings.amplitudes.length - 1 && aidx > 0) {
                amplitudeInput.classList.add("last")
            }
            amplitudeInput.type = "number"
            amplitudeInput.value = noiseSettings.amplitudes[aidx].toString()
            amplitudeInput.min = "0"
            amplitudeInput.step = "0.1"

            amplitudeInput.onkeypress = (evt) => {
                if (!evt.key.match(/^[0-9|.]+$/)) {
                    evt.preventDefault();
                }
            }

            amplitudeInput.onchange = (evt) => {
                noiseSettings.amplitudes[aidx] = parseFloat(amplitudeInput.value)
                this.builder.hasChanges = true
                UI.getInstance().refresh({noises: true})
            }

            amplitudeInput.onkeyup = (evt:KeyboardEvent) => {
                if (evt.key === "Enter"){
                    amplitudeInput.blur()
                }
            }
    
            amplitudesLabel.appendChild(amplitudeInput)
        }

        if (noiseSettings.amplitudes.length > 1) {
            const deleteButton = document.createElement("button")
            deleteButton.classList.add("delete")
            const deleteIcon = document.createElement("img")
            deleteIcon.src = "images/trash-bin.svg"
            deleteButton.appendChild(deleteIcon)
            deleteButton.onclick = (evt) => {
                noiseSettings.amplitudes.splice(noiseSettings.amplitudes.length - 1, 1)
                this.builder.hasChanges = true
                UI.getInstance().refresh({noises: true})
            }
            amplitudesLabel.appendChild(deleteButton)
        }

        const addButton = document.createElement("button")
        addButton.classList.add("add")
        const addIcon = document.createElement("img")
        addIcon.src = "images/add.svg"
        addButton.appendChild(addIcon)

        addButton.onclick = (evt) => {
            noiseSettings.amplitudes[noiseSettings.amplitudes.length] = 0

            noiseSettings.firstOctave = parseInt(firstOctaveInput.value)
            firstOctaveInput.value = noiseSettings.firstOctave.toString()

            this.builder.hasChanges = true
            UI.getInstance().refresh({noises: true})
        }

        amplitudesLabel.appendChild(addButton)


        div.appendChild(amplitudesLabel)
    }
}