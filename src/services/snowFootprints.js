import ground from '../data/snowGround.js';
import { GroundFootprintsRenderer } from './groundFootprints.js';
export { FOOTPRINT_LIFETIME, FOOTPRINT_MAX_DISTANCE, FOOTPRINT_LIMIT, footprintOpacity } from './groundFootprints.js';
const surface={maps:ground,colors:new Set(['217,230,233','214,218,228','209,211,219']),core:[119,148,168],rim:[250,254,255]};
export function hasSnowGround(map){return Object.prototype.hasOwnProperty.call(ground,map);}
export class SnowFootprintsRenderer extends GroundFootprintsRenderer {
    constructor(createCanvas){super(surface,createCanvas);}
    onSnow(x,y){return this.onGround(x,y);}
}
