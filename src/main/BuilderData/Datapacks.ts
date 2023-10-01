import { AnonymousDatapack, Datapack, DatapackList } from "mc-datapack-loader"
import { DEFAULT_DATAPACK_FORMAT, MAX_DATAPACK_FORMAT, MIN_DATAPACK_FORMAT } from "../../SharedConstants"
import { BiomeBuilder } from "./BiomeBuilder"
import { LegacyConfigDatapack } from "./LegacyConfigDatapack"


export class Datapacks {
    vanillaDatapack: Datapack
    datapacks: Datapack[]
    compositeDatapack: AnonymousDatapack
    legacyConfigDatapack: LegacyConfigDatapack

    constructor(
        private builder: BiomeBuilder
    ) {
        this.vanillaDatapack = Datapack.fromZipUrl(`./vanilla_datapacks/vanilla_datapack_1_19.zip`, DEFAULT_DATAPACK_FORMAT)
        this.legacyConfigDatapack = new LegacyConfigDatapack(builder)

        this.datapacks = [this.vanillaDatapack, this.legacyConfigDatapack]

        const self = this
        this.compositeDatapack = Datapack.compose(new class implements DatapackList{
            async getDatapacks(): Promise<AnonymousDatapack[]> {
                return self.datapacks
            }
        })
    }

    public setDatapackFormat(format: number){
        if (isNaN(format)){
            return
        }

        format = Math.max(Math.min(format, MAX_DATAPACK_FORMAT), MIN_DATAPACK_FORMAT)

        this.builder.datapackFormat = format
        this.datapacks.forEach(d => d.setPackVersion(format))
    }

}