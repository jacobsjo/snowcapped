import { Identifier } from "deepslate"
import JSZip from "jszip"
import { PackMcmeta, Datapack, ResourceLocation } from "mc-datapack-loader"
import { MIN_DATAPACK_FORMAT, MAX_DATAPACK_FORMAT } from "../../SharedConstants"
import { BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { Exporter } from "../BuilderData/Exporter"

export class ExportWriter {

    constructor(
        private builder: BiomeBuilder,
        private exporter: Exporter
    ){
        
    }

    public async generateZip(){
        const versionInfo = this.builder.getVersionInfo()

        const zip = new JSZip()
        const dataFolder = zip.folder("data")

        const mcMeta: PackMcmeta = {
            pack: {
                description: "The data modified using Snowcapped (1.19 / 1.20)",
                pack_format: this.builder.datapackFormat,
                supported_formats: [MIN_DATAPACK_FORMAT, MAX_DATAPACK_FORMAT]
            }
        }

        zip.file("pack.mcmeta", JSON.stringify(mcMeta, undefined, 2))

        zip.file("pack.png", (await fetch("icons/icon_128.png")).blob() )

        const dimension = Identifier.parse(this.builder.dimensionName.toLowerCase())
        var folder = dataFolder.folder(dimension.namespace).folder("dimension")
        
        const folders = dimension.path.split("/")
        const filename = folders[folders.length - 1]

        for (var i = 0 ; i < folders.length - 1 ; i++){
            folder = folder.folder(folders[i])
        }
        folder.file(filename + ".json", JSON.stringify(this.exporter.getDimensionJSON(), undefined, 2))

        if (this.builder.exportSplines){
            const densityFunctionFolder = dataFolder.folder("minecraft").folder("worldgen").folder("density_function").folder("overworld")
            densityFunctionFolder.file("offset.json", fetch(`export_presets/${this.builder.targetVersion}/offset.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.offset.export()))))
            densityFunctionFolder.file("factor.json", fetch(`export_presets/${this.builder.targetVersion}/factor.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.factor.export()))))
            densityFunctionFolder.file("jaggedness.json", fetch(`export_presets/${this.builder.targetVersion}/jaggedness.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.jaggedness.export()))))
        }

        if (this.builder.exportBiomeColors){
            dataFolder.folder("c").folder("worldgen").file("biome_colors.json", JSON.stringify(this.exporter.getBiomeColorJson(), null, 2))
        }  

        return zip
    }

    async insertIntoDatapack(datapack: Datapack){
        if (datapack.save === undefined)
            throw new Error("Datapack does not support saving")

        const dimensionIdentifier = Identifier.parse(this.builder.dimensionName)
        datapack.save(ResourceLocation.DIMENSION, dimensionIdentifier, this.exporter.getDimensionJSON())
        if (this.builder.exportSplines){
            datapack.save(ResourceLocation.WORLDGEN_DENSITY_FUNCTION, new Identifier("minecraft", "offset"), JSON.parse(await fetch(`export_presets/${this.builder.targetVersion}/offset.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.offset.export())))))
            datapack.save(ResourceLocation.WORLDGEN_DENSITY_FUNCTION, new Identifier("minecraft", "factor"), JSON.parse(await fetch(`export_presets/${this.builder.targetVersion}/factor.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.factor.export())))))
            datapack.save(ResourceLocation.WORLDGEN_DENSITY_FUNCTION, new Identifier("minecraft", "jaggedness"), JSON.parse(await fetch(`export_presets/${this.builder.targetVersion}/jaggedness.json`).then(s => s.text()).then(s => s.replace("%s", JSON.stringify(this.builder.splines.jaggedness.export())))))
        }

        if (this.builder.exportBiomeColors){
            datapack.save(ResourceLocation.DATA_FILE, new Identifier("c", "worldgen/biome_colors"), this.exporter.getBiomeColorJson())
        }
    }
}