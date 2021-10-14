import * as _ from 'lodash';

import { Climate, NormalNoise, Random, LegacyRandom } from 'deepslate';

import { BiomeBuilder } from './BuilderData/BiomeBuilder';
import { Layout } from './BuilderData/Layout';
import { VanillaBiomes } from './Vanilla/VanillaBiomes';
import { SidebarManager } from './UI/SidebarManager';
import { LayoutEditor } from './UI/LayoutEditor';
import { UI } from './UI/UI';
import { Slice } from './BuilderData/Slice';
import { LayoutElementUnassigned } from './BuilderData/LayoutElementUnassigned';


const close_elements = document.getElementsByClassName("closable")

for (let i = 0 ; i < close_elements.length ; i++){
    (close_elements[i].getElementsByClassName("button")[0] as HTMLElement).onclick = (evt: Event) => {
        if ((close_elements[i] as any).onopenchange !== undefined)
            (close_elements[i] as any).onopenchange()
        close_elements[i].classList.toggle("closed")
    }
}

fetch('minecraft_overworld.snowcapped.json').then( r => r.text()).then(jsonString => {
    const builder = new BiomeBuilder(JSON.parse(jsonString));
    VanillaBiomes.registerVanillaBiomes(builder)
    UI.create(builder)
})