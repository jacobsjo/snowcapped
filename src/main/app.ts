import { BiomeBuilder } from './BuilderData/BiomeBuilder';
import { UI } from './UI/UI';

import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

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

fetch('minecraft_overworld_1_21_5.snowcapped.json').then(r => r.text()).then(jsonString => {
    builder.loadJSON(JSON.parse(jsonString));
    UI.getInstance().refresh({
        biome: {},
        spline: true,
        grids: true,
        noises: true,
        map_display: true
    })
})