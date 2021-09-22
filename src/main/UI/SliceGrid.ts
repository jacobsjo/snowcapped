import { Climate } from "deepslate"
import { BiomeBuilder } from "../BuilderData/BiomeBuilder"
import { Slice } from "../BuilderData/Slice"



export class SliceGrid{
    static createSliceGridHTML(builder: BiomeBuilder, slice: Slice){
        const table = document.createElement('table')
        table.classList.add("sliceTable")
        
        // Create Header
        const header = document.createElement('tr')
        header.appendChild(document.createElement('td'))
        header.classList.add("TopHeader")
        builder.erosions.forEach(erosion => {
            const headerElement = document.createElement('td')
            headerElement.appendChild(document.createTextNode(erosion[0]))
            header.appendChild(headerElement)
        });
        table.appendChild(header)
    
        // Create rows of table
        builder.continentalnesses.forEach((continentalness, c_idx) => {
            const row = document.createElement('tr')
            const d = document.createElement('td')
            d.classList.add("SideHeader")
            d.appendChild(document.createTextNode(continentalness[0]))
            row.appendChild(d)
    
            builder.erosions.forEach((erosion, e_idx) => {
                const selectionElement = document.createElement('td')
                selectionElement.classList.add("selectionElement")
                //selectionElement.style.backgroundColor = slice.get(c_idx, e_idx)?.color() ?? "black"
                selectionElement.setAttribute('c_idx', c_idx.toString());
                selectionElement.setAttribute('e_idx', e_idx.toString());
                row.appendChild(selectionElement)
            });
            table.appendChild(row)
        });
    
        return table;
    }
}