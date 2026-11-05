export const FRIEND_COLORS=Object.freeze({blue:'#4b82b4',sage:'#608b72',lavender:'#9176af',sand:'#aa864c',rose:'#b76c89',coral:'#bf745d',teal:'#498f95',slate:'#738396'});
export function friendColorStyle(person){return FRIEND_COLORS[person?.color]?{'--friend-color':FRIEND_COLORS[person.color]}:{};}
