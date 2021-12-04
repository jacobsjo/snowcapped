import * as _ from 'lodash';


import { BiomeBuilder } from './BuilderData/BiomeBuilder';
import { VanillaBiomes } from './Vanilla/VanillaBiomes';
import { UI } from './UI/UI';

export const DATA_VERSION = 2
export const IS_EXPERIMENTAL = true

const close_elements = document.getElementsByClassName("closable")


for (let i = 0; i < close_elements.length; i++) {
    (close_elements[i].getElementsByClassName("button")[0] as HTMLElement).onclick = () => {
        if ((close_elements[i] as any).onopenchange !== undefined)
            (close_elements[i] as any).onopenchange()
        close_elements[i].classList.toggle("closed")
        UI.getInstance().refresh({})
    }
}

const builder = new BiomeBuilder()
UI.create(builder)

fetch('minecraft_overworld.snowcapped.json').then(r => r.text()).then(jsonString => {
    builder.loadJSON(JSON.parse(jsonString));
    UI.getInstance().refresh({
        biome: {},
        spline: true,
        grids: true,
        noises: true
    })
})