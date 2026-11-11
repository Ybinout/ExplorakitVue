import { navigateGamepad, gamepadControls, gamepadScope } from './gamepad';

export function typingIn(event) {
  return !!event.target?.closest?.('textarea,[contenteditable]:not([contenteditable="false"]),input:not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"])');
}
export function consumeGameKey(event) {
  event.preventDefault();event.stopImmediatePropagation();
}
export function handleMenuKeyboard(event, root) {
  if(!root || event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || typingIn(event))return false;
  const direction=({z:'up',q:'left',s:'down',d:'right',arrowup:'up',arrowleft:'left',arrowdown:'down',arrowright:'right'})[String(event.key||'').toLowerCase()];
  if(!direction && !['Enter',' '].includes(event.key))return false;
  if(!gamepadControls(gamepadScope(root)).length)return false;
  consumeGameKey(event);
  if(direction)navigateGamepad(root,{action:'direction',direction});
  else if(!event.repeat)navigateGamepad(root,{action:'confirm'});
  return true;
}
