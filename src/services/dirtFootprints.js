import dirt from '../data/dirtGround.js';
import { GroundFootprintsRenderer } from './groundFootprints.js';
// Earth needs more contrast than snow, especially beneath the rain overlay.
const surface={maps:dirt.maps,colors:new Set(dirt.colors),core:[66,45,28],rim:[212,184,141],opacity:1.6};
export function hasDirtGround(map){return Object.prototype.hasOwnProperty.call(dirt.maps,map);}
export class DirtFootprintsRenderer extends GroundFootprintsRenderer {
    constructor(createCanvas){super(surface,createCanvas);}
}
