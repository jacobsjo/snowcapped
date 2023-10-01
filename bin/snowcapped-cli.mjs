#!/usr/bin/env node

import fs from 'fs';
import { BiomeBuilder, Exporter } from '../dist-api/snowcapped.mjs'
import { program } from 'commander';

program
    .argument('<input>', 'Input snowcapped file')
    .option('-d, --dimension <file>', 'Ouput file for dimension file')
    .option('-c, --biome-colors <file>', 'Output file for biome-colors.json file')
    .usage('<input> [-d <dimension output>] [-c <biome_colors output>]')

program.parse()

const biomeBuilder = new BiomeBuilder()

const inputJson = JSON.parse(fs.readFileSync(program.args[0], 'utf8'))
biomeBuilder.loadJSON(inputJson)

const exporter = new Exporter(biomeBuilder)

const options = program.opts()

console.log(options)

if (options.dimension){
    fs.writeFileSync(options.dimension, JSON.stringify(exporter.getDimensionJSON(), null, 2), {encoding: "utf8"})
}

if (options.biomeColors){
    if (!biomeBuilder.exportBiomeColors){
        console.warn("Warning: Biome Color export is disabled by in Snowcapped settings. Exporing anyways.")
    }
    fs.writeFileSync(options.biomeColors, JSON.stringify(exporter.getBiomeColorJson(), null, 2))
}