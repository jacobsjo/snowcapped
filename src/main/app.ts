import * as _ from 'lodash';


import { BiomeBuilder } from './BuilderData/BiomeBuilder';
import { VanillaBiomes } from './Vanilla/VanillaBiomes';
import { UI } from './UI/UI';


const close_elements = document.getElementsByClassName("closable")

for (let i = 0 ; i < close_elements.length ; i++){
    (close_elements[i].getElementsByClassName("button")[0] as HTMLElement).onclick = () => {
        if ((close_elements[i] as any).onopenchange !== undefined)
            (close_elements[i] as any).onopenchange()
        close_elements[i].classList.toggle("closed")
        UI.getInstance().refresh()
    }
}

fetch('minecraft_overworld.snowcapped.json').then( r => r.text()).then(jsonString => {
    const builder = new BiomeBuilder(JSON.parse(jsonString));
    UI.create(builder)
})