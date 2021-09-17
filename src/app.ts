import * as _ from 'lodash';

import { Climate } from 'deepslate';

import { BiomeBuilder } from './BuilderData/BiomeBuilder';
import { Layout } from './BuilderData/Layout';
import { VanillaBiomes } from './Vanilla/VanillaBiomes';
import { SidebarManager } from './UI/SidebarManager';
import { LayoutEditor } from './UI/LayoutEditor';
import { UI } from './UI/UI';
import { Slice } from './BuilderData/Slice';
import { LayoutElementUnassigned } from './BuilderData/LayoutElementUnassigned';


const continentalnesses: [string, Climate.Param][] = [
    ['Mushroom Field', new Climate.Param(-1.2, -1.05)],
    ['Deep Ocean', new Climate.Param(-1.05, -0.455)],
    ['Ocean', new Climate.Param(-0.455, -0.19)],
    ['Coast', new Climate.Param(-0.19, -0.11)],
    ['Near Inland', new Climate.Param(-0.11, 0.03)],
    ['Mid Inland', new Climate.Param(0.03, 0.3)],
    ['Far Inland', new Climate.Param(0.3, 1.0)]
]

const erosions: [string, Climate.Param][] = [
    ['0', new Climate.Param(-1.0, -0.78)],
    ['1', new Climate.Param(-0.78, -0.375)],
    ['2', new Climate.Param(-0.375, -0.2225)],
    ['3', new Climate.Param(-0.2225, 0.05)],
    ['4', new Climate.Param(0.05, 0.45)],
    ['5', new Climate.Param(0.45, 0.55)],
    ['6', new Climate.Param(0.55, 1.0)],
]

const weirdnesses: [string, Climate.Param][] = [
    ['Mid Slice A2', new Climate.Param(-1.0, -0.93333334)],
    ['High Slice A2', new Climate.Param(-0.93333334, -0.7666667)],
    ['Peaks A', new Climate.Param(-0.7666667, -0.56666666)],
    ['High Slice A', new Climate.Param(-0.56666666, -0.4)],
    ['Mid Slice A', new Climate.Param(-0.4, -0.26666668)],
    ['Low Slice A', new Climate.Param(-0.26666668, -0.05)],
    ['Valley', new Climate.Param(-0.05, 0.05)],
    ['Low Slice B', new Climate.Param(0.05, 0.26666668)],
    ['Mid Slice B', new Climate.Param(0.26666668, 0.4)],
    ['High Slice B', new Climate.Param(0.4, 0.56666666)],
    ['Peaks B', new Climate.Param(0.56666666, 0.7666667)],
    ['High Slice B2', new Climate.Param(0.7666667, 0.93333334)],
    ['Mid Slice B2', new Climate.Param(0.93333334, 1.0)],
]

const temperatures: [string, Climate.Param][] = [
    ['forzen', new Climate.Param(-1.0, -0.45)],
    ['cold', new Climate.Param(-0.45, -0.15)],
    ['normal', new Climate.Param(-0.15, 0.2)],
    ['warm', new Climate.Param(0.2, 0.55)],
    ['hot', new Climate.Param(0.55, 1.0)],
]

const humidities: [string, Climate.Param][] = [
    ['very dry', new Climate.Param(-1.0, -0.3)],
    ['dry', new Climate.Param(-0.3, -0.1)],
    ['normal', new Climate.Param(-0.1, 0.1)],
    ['humid', new Climate.Param(0.1, 0.3)],
    ['very humid', new Climate.Param(0.3, 1.0)],
]

const builder = new BiomeBuilder(continentalnesses, erosions, weirdnesses, temperatures, humidities)

VanillaBiomes.registerVanillaBiomes(builder)
LayoutElementUnassigned.create(builder)

UI.create(builder)

//const valley_slice = Slice.create(builder, "Valley", 6)
//valley_slice.set(3, 2, "River")
//valley_slice.set(3, 3, "Middle")



//const slice_grid = SliceGrid.createSliceGridHTML(builder, valley_slice)
//document.getElementById("sliceEditor").appendChild(slice_grid)

