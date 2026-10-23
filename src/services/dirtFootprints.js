import dirt from '../data/dirtGround.js';
import { GroundFootprintsRenderer } from './groundFootprints.js';
const surface={maps:dirt.maps,colors:new Set(dirt.colors),core:[92,70,48],rim:[212,184,141],opacity:.65};
export function hasDirtGround(map){return Object.prototype.hasOwnProperty.call(dirt.maps,map);}
export class DirtFootprintsRenderer extends GroundFootprintsRenderer {
    constructor(createCanvas){super(surface,createCanvas);}
}
