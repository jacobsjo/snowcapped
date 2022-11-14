import { Climate, Identifier } from "deepslate";
import * as JSZip from "jszip";
import { create } from "lodash";
import { Datapack } from "mc-datapack-loader";
import { MenuManager } from "../UI/MenuManager";
import { UI } from "../UI/UI";
import { Biome } from "./Biome";
import { BiomeBuilder } from "./BiomeBuilder";
import { GridElementUnassigned } from "./GridElementUnassigned";



export class Exporter {
    private builder: BiomeBuilder

    constructor(builder: BiomeBuilder) {
        this.builder = builder
    }

    private findIdx(value: number, params: Climate.Param[]) {
        if (value < params[0].min) return 0
        if (value > params[params.length - 1].max) return params.length - 1
        return params.findIndex(r => r.min < value && value < r.max)
    }

    public async generateZip(){
        const versionInfo = this.builder.getVersionInfo()

        const zip = new JSZip()
        const dataFolder = zip.folder("data")

        zip.file("pack.mcmeta", (await (await fetch(`export_presets/${this.builder.targetVersion}/pack.mcmeta`)).text()))

        zip.file("pack.png", (await fetch("icons/icon_128.png")).blob() )

        const [namespace, path] = this.builder.dimensionName.split(":", 2)
        var folder = dataFolder.folder(namespace).folder("dimension")
        
        const folders = path.split("/")
        const filename = folders[folders.length - 1]

        for (var i = 0 ; i < folders.length - 1 ; i++){
            folder = folder.folder(folders[i])
        }
        folder.file(filename + ".json", this.getDimensionJSON())

        if (this.builder.exportSplines){
            const densityFunctionFolder = dataFolder.folder("minecraft").folder("worldgen").folder("density_function").folder("overworld")
            densityFunctionFolder.file("offset.json", fetch(`export_presets/${this.builder.targetVersion}/offset.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.offset.export()))))
            densityFunctionFolder.file("factor.json", fetch(`export_presets/${this.builder.targetVersion}/factor.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.factor.export()))))
            densityFunctionFolder.file("jaggedness.json", fetch(`export_presets/${this.builder.targetVersion}/jaggedness.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.jaggedness.export()))))
        }

        return zip
    }

    async insertIntoDatapack(datapack: Datapack){
        if (datapack.save === undefined)
            throw new Error("Datapack does not support saving")

        datapack.save("dimension", Identifier.parse(this.builder.dimensionName), this.getDimensionJSON())
        if (this.builder.exportSplines){
            datapack.save("worldgen/density_function", new Identifier("minecraft", "offset"), await fetch(`export_presets/${this.builder.targetVersion}/offset.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.offset.export()))))
            datapack.save("worldgen/density_function", new Identifier("minecraft", "factor"), await fetch(`export_presets/${this.builder.targetVersion}/factor.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.factor.export()))))
            datapack.save("worldgen/density_function", new Identifier("minecraft", "jaggedness"), await fetch(`export_presets/${this.builder.targetVersion}/jaggedness.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.jaggedness.export()))))
        }
    }

/*    async insertIntoDirectory(dirHandle: FileSystemDirectoryHandle){
        const versionInfo = this.builder.getVersionInfo()

        const writeToFileHandle = async (fileHandle: FileSystemFileHandle, text: string) => {
            const writable = await fileHandle.createWritable()
            writable.write(text)
            writables.push(writable)
        }        

        const writables: FileSystemWritableFileStream[] = []
        try{
            const dataFolder = await dirHandle.getDirectoryHandle("data")

            const [namespace, path] = this.builder.dimensionName.split(":", 2)
            var folder = await (await dataFolder.getDirectoryHandle(namespace, {create: true})).getDirectoryHandle("dimension", {create: true})
            
            const folders = path.split("/")
            const filename = folders[folders.length - 1]

            for (var i = 0 ; i < folders.length - 1 ; i++){
                folder = await folder.getDirectoryHandle(folders[i], {create: true})
            }
            const file = await folder.getFileHandle(filename + ".json", {create: true})
            const writable = await file.createWritable()
            await writable.write(this.getDimensionJSON())
            writables.push(writable)

            if (this.builder.exportSplines){
                const densityFunctionFolder = ( await ( await ( await dataFolder.getDirectoryHandle("minecraft", {create: true})).getDirectoryHandle("worldgen", {create: true})).getDirectoryHandle("density_function", {create: true})).getDirectoryHandle("overworld", {create: true})
                await writeToFileHandle(await (await densityFunctionFolder).getFileHandle("offset.json", {create: true}), await fetch(`export_presets/${this.builder.targetVersion}/offset.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.offset.export()))))
                await writeToFileHandle(await (await densityFunctionFolder).getFileHandle("factor.json", {create: true}), await fetch(`export_presets/${this.builder.targetVersion}/factor.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.factor.export()))))
                await writeToFileHandle(await (await densityFunctionFolder).getFileHandle("jaggedness.json", {create: true}), await fetch(`export_presets/${this.builder.targetVersion}/jaggedness.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.jaggedness.export()))))
            }

            writables.forEach(writable => {
                writable.close()
            });
        } catch (e){
            writables.forEach(writable => {
                writable.abort()
            });
            throw e
        }
    }*/


    public getDimensionJSON(): string {
        const array: { biome: string, done: boolean }[][][][][][] = []

        for (let d_idx = 0; d_idx < this.builder.depths.length; d_idx++) {
            array[d_idx] = []
            for (let w_idx = 0; w_idx < this.builder.weirdnesses.length; w_idx++) {
                array[d_idx][w_idx] = []
                for (let c_idx = 0; c_idx < this.builder.continentalnesses.length; c_idx++) {
                    array[d_idx][w_idx][c_idx] = []
                    for (let e_idx = 0; e_idx < this.builder.erosions.length; e_idx++) {
                        array[d_idx][w_idx][c_idx][e_idx] = []

                        for (let t_idx = 0; t_idx < this.builder.temperatures.length; t_idx++) {
                            array[d_idx][w_idx][c_idx][e_idx][t_idx] = []
                            for (let h_idx = 0; h_idx < this.builder.humidities.length; h_idx++) {
                                const biome = this.builder.dimension.lookupRecursive({
                                    d: d_idx,
                                    w: w_idx,
                                    c: c_idx,
                                    e: e_idx,
                                    h: h_idx,
                                    t: t_idx
                                }, "Any")
                                if (biome === undefined || biome instanceof GridElementUnassigned) {
                                    array[d_idx][w_idx][c_idx][e_idx][t_idx][h_idx] = { biome: "", done: true }
                                } else if (biome instanceof Biome) {
                                    array[d_idx][w_idx][c_idx][e_idx][t_idx][h_idx] = { biome: biome.name, done: false }
                                } else {
                                    console.warn("Data structure corruption at w: " + w_idx, + " c: " + c_idx + " e: " + e_idx + " t: " + t_idx + " h: " + h_idx + " - Found element of type " + biome.constructor.name)
                                }
                            }
                        }
                    }
                }
            }
        }

        const biomes: { parameters: { weirdness: [number, number], continentalness: [number, number], erosion: [number, number], temperature: [number, number], humidity: [number, number], depth: [number, number], offset: number }, biome: string }[] = []

        for (let d_idx = 0; d_idx < this.builder.depths.length; d_idx++) {
            for (let w_idx = 0; w_idx < this.builder.weirdnesses.length; w_idx++) {
                for (let c_idx = 0; c_idx < this.builder.continentalnesses.length; c_idx++) {
                    for (let e_idx = 0; e_idx < this.builder.erosions.length; e_idx++) {
                        for (let t_idx = 0; t_idx < this.builder.temperatures.length; t_idx++) {
                            for (let h_idx = 0; h_idx < this.builder.humidities.length; h_idx++) {
                                if (array[d_idx][w_idx][c_idx][e_idx][t_idx][h_idx].done)
                                    continue

                                let max_e_idx: number
                                for (max_e_idx = e_idx; max_e_idx < this.builder.erosions.length; max_e_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, w_idx, d_idx, c_idx, max_e_idx, t_idx, h_idx))
                                        break
                                }
                                max_e_idx--

                                let max_w_idx: number
                                for (max_w_idx = w_idx; max_w_idx < this.builder.weirdnesses.length; max_w_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, d_idx, c_idx, max_e_idx, t_idx, h_idx))
                                        break
                                }
                                max_w_idx--

                                let max_d_idx: number
                                for (max_d_idx = d_idx; max_d_idx < this.builder.depths.length; max_d_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, c_idx, max_e_idx, t_idx, h_idx))
                                        break
                                }
                                max_d_idx--


                                let max_c_idx: number
                                for (max_c_idx = c_idx; max_c_idx < this.builder.continentalnesses.length; max_c_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, max_c_idx, max_e_idx, t_idx, h_idx))
                                        break
                                }
                                max_c_idx--

                                let max_h_idx: number
                                for (max_h_idx = h_idx; max_h_idx < this.builder.humidities.length; max_h_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, max_c_idx, max_e_idx, t_idx, max_h_idx))
                                        break
                                }
                                max_h_idx--

                                let max_t_idx: number
                                for (max_t_idx = t_idx; max_t_idx < this.builder.temperatures.length; max_t_idx++) {
                                    if (!this.checkRange(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, max_c_idx, max_e_idx, max_t_idx, max_h_idx))
                                        break
                                }
                                max_t_idx--

                                this.setDone(array, w_idx, d_idx, c_idx, e_idx, t_idx, h_idx, max_w_idx, max_d_idx, max_c_idx, max_e_idx, max_t_idx, max_h_idx)
                                biomes.push({
                                    parameters: {
                                        weirdness: [
                                            this.builder.weirdnesses[w_idx],
                                            this.builder.weirdnesses[max_w_idx + 1]
                                        ],
                                        continentalness: [
                                            this.builder.continentalnesses[c_idx],
                                            this.builder.continentalnesses[max_c_idx + 1]
                                        ],
                                        erosion: [
                                            this.builder.erosions[e_idx],
                                            this.builder.erosions[max_e_idx + 1]
                                        ],
                                        temperature: [
                                            this.builder.temperatures[t_idx],
                                            this.builder.temperatures[max_t_idx + 1]
                                        ],
                                        humidity: [
                                            this.builder.humidities[h_idx],
                                            this.builder.humidities[max_h_idx + 1]
                                        ],
                                        depth: [
                                            this.builder.depths[d_idx],
                                            this.builder.depths[max_d_idx + 1]
                                        ],
                                        offset: 0.0
                                    },
                                    biome: array[d_idx][w_idx][c_idx][e_idx][t_idx][h_idx].biome
                                })
                            }
                        }
                    }
                }
            }
        }


        const dimension = {
            type: "minecraft:overworld",
            generator: {
                biome_source: {
                    biomes: biomes,
                    type: "minecraft:multi_noise"
                },
                settings: this.builder.noiseSettingsName,
                type: "minecraft:noise"
            }
        }

        console.log("Emmited " + biomes.length + " Biome settings...")

        return (JSON.stringify(dimension))
    }


    private checkRange(array: { biome: string, done: boolean }[][][][][][], min_w_idx: number, min_d_idx: number, min_c_idx: number, min_e_idx: number, min_t_idx: number, min_h_idx: number, max_w_idx: number, max_d_idx: number, max_c_idx: number, max_e_idx: number, max_t_idx: number, max_h_idx: number): boolean {
        const biome = array[min_d_idx][min_w_idx][min_c_idx][min_e_idx][min_t_idx][min_h_idx].biome
        for (let d_idx = min_d_idx; d_idx <= max_d_idx; d_idx++) {
            for (let w_idx = min_w_idx; w_idx <= max_w_idx; w_idx++) {
                for (let c_idx = min_c_idx; c_idx <= max_c_idx; c_idx++) {
                    for (let e_idx = min_e_idx; e_idx <= max_e_idx; e_idx++) {
                        for (let t_idx = min_t_idx; t_idx <= max_t_idx; t_idx++) {
                            for (let h_idx = min_h_idx; h_idx <= max_h_idx; h_idx++) {
                                const cell_biome = array[d_idx]?.[w_idx]?.[c_idx]?.[e_idx]?.[t_idx]?.[h_idx]?.biome
                                if (cell_biome === undefined) {
                                    console.warn("undefined element at w: " + w_idx + " c: " + c_idx + " e: " + e_idx + " t: " + t_idx + " h: " + h_idx)
                                }
                                if (array[d_idx]?.[w_idx]?.[c_idx]?.[e_idx]?.[t_idx]?.[h_idx]?.biome !== biome)
                                    return false
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    private setDone(array: { biome: string, done: boolean }[][][][][][], min_w_idx: number, min_d_idx: number, min_c_idx: number, min_e_idx: number, min_t_idx: number, min_h_idx: number, max_w_idx: number, max_d_idx: number, max_c_idx: number, max_e_idx: number, max_t_idx: number, max_h_idx: number): void {
        for (let d_idx = min_d_idx; d_idx <= max_d_idx; d_idx++) {
            for (let w_idx = min_w_idx; w_idx <= max_w_idx; w_idx++) {
                for (let c_idx = min_c_idx; c_idx <= max_c_idx; c_idx++) {
                    for (let e_idx = min_e_idx; e_idx <= max_e_idx; e_idx++) {
                        for (let t_idx = min_t_idx; t_idx <= max_t_idx; t_idx++) {
                            for (let h_idx = min_h_idx; h_idx <= max_h_idx; h_idx++) {
                                array[d_idx][w_idx][c_idx][e_idx][t_idx][h_idx].done = true
                            }
                        }
                    }
                }
            }
        }
    }

    public async getNoiseSettingJSON(old_json?: string){
        if (!this.builder.getVersionInfo().hasTerrainShaper){
            throw new Error("trying to export noise settings in unsupporeted version")
        }

        const json = {
            offset: UI.getInstance().builder.splines.offset.exportLegacy(),
            factor: UI.getInstance().builder.splines.factor.exportLegacy(),
            jaggedness: UI.getInstance().builder.splines.jaggedness.exportLegacy()
        }
        const jsonString = JSON.stringify(json)

        if (old_json === undefined || old_json === ""){
            return fetch(`export_presets/${this.builder.targetVersion}/noise_settings.json`).then(s => s.text()).then(s => s.replace("%s", jsonString))
        } else {
            const parsed_old = JSON.parse(old_json)
            const terrain_shaper_id = old_json.indexOf(`"terrain_shaper":`)
            const start_id = old_json.indexOf("{", terrain_shaper_id)
            const next_comma = old_json.indexOf(",", terrain_shaper_id)
            if (next_comma < start_id){
                throw new Error("terrain shaper not of correct format in file")
            }
            const end_id = this.findClosingBracket(old_json, start_id)
            const new_json = old_json.substring(0, start_id) + jsonString + old_json.substring(end_id + 1)

            parsed_old.noise.terrain_shaper = json
            if (JSON.stringify(JSON.parse(new_json)) !== JSON.stringify(parsed_old)){
                throw new Error("inserting terrain shaper failed")
            }
            return new_json
        }
    }


    private findClosingBracket(s: string, start_id: number): number{
        const opening = ['{', '[']
        const closing = ['}', ']']
        const open_brackets = []
        var i = start_id
        while (true){
            if (i >= s.length){
                throw new Error("Unclosed Brackets")
            }
            const char = s[i]
            const open_bracket_id = opening.indexOf(char)
            if (open_bracket_id >= 0){
                open_brackets.push(open_bracket_id)
            } else {
                const closing_bracket_id = closing.indexOf(char)
                if (closing_bracket_id >= 0){
                    if (open_brackets.pop() !== closing_bracket_id){
                        throw new Error("Mismatched Brackets")
                    }
                }
            }
            if (open_brackets.length === 0){
                return i
            }
            i++
        }
    }    
}