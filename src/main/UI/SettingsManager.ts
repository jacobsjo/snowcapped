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

        const copyButton = document.getElementById("copy_noise_settings")
        copyButton.onclick = (evt) => {
            navigator.clipboard.writeText("\"octaves\": " + JSON.stringify(this.builder.noiseSettings))
        }

        this.handleFixNoiseSetting(document.getElementById("fix_continentalness_setting"), "continentalness")
        this.handleFixNoiseSetting(document.getElementById("fix_erosion_setting"), "erosion")
        this.handleFixNoiseSetting(document.getElementById("fix_weirdness_setting"), "weirdness")
        this.handleFixNoiseSetting(document.getElementById("fix_temperature_setting"), "temperature")
        this.handleFixNoiseSetting(document.getElementById("fix_humidity_setting"), "humidity")
    }

    private handleFixNoiseSetting(div: HTMLElement, name: string){
        const enabledCheckbox = (div.getElementsByClassName("enabled")[0] as HTMLInputElement)
        const rangeElement = (div.getElementsByClassName("range")[0] as HTMLInputElement)
        const displayElement = (div.getElementsByClassName("display")[0] as HTMLInputElement)

        enabledCheckbox.checked = this.builder.fixedNoises[name] !== undefined
        rangeElement.disabled = this.builder.fixedNoises[name] === undefined
        displayElement.value = this.builder.fixedNoises[name]?.toFixed(2) ?? "0.00"
        rangeElement.value = this.builder.fixedNoises[name]?.toString() ?? "0"
        
        enabledCheckbox.oninput = (evt: Event) => {
            rangeElement.disabled = !enabledCheckbox.checked
            if (enabledCheckbox.checked)
                this.builder.fixedNoises[name] = parseFloat(rangeElement.value)
            else 
                this.builder.fixedNoises[name] = undefined

            UI.getInstance().refresh({noises: true, biome: {}, grids: true})

        }

        rangeElement.oninput = (evt:Event) => {
            this.builder.fixedNoises[name] = parseFloat(rangeElement.value)
            displayElement.value = this.builder.fixedNoises[name].toFixed(2)
        }

        rangeElement.onchange = (evt:Event) => {
            UI.getInstance().refresh({noises: true, biome: {}, grids: true})
        }
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
            deleteIcon.src = "trash-bin.svg"
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
        addIcon.src = "add.svg"
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