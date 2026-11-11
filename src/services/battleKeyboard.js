// Uses the existing buttons so their disabled state and the battle controllers
// remain authoritative. Number keys retain their physical AZERTY positions.
const visible = el => !!el && !el.closest('[hidden],[inert],[aria-hidden="true"]') && el.getClientRects().length > 0;
const enabled = el => visible(el) && !el.disabled && el.getAttribute('aria-disabled') !== 'true';
const collect = (root, selector) => [...root.querySelectorAll(selector)].filter(visible);

function controls(root, tutorial) {
  if (root.matches('.battle')) {
    if (tutorial === 'attack' || tutorial === 'capture') {
      const grid=root.querySelector(tutorial==='attack'?'.battle-grid-attacks':'.battle-grid-bag');
      const choices=grid?collect(grid,tutorial==='attack'?'button':'button[data-tutorial-ball]'):[];
      const button=root.querySelector(tutorial==='attack'?'.action-attack':'.action-bag');
      const slots=[];if(button)slots[tutorial==='attack'?0:1]=button;
      return {numbered:choices.length?choices.filter(b=>!b.hasAttribute('data-move-info')):slots,navigation:choices.length?choices:(button?[button]:[])};
    }
    const grid = root.querySelector('.battle-grid');
    const choices = grid ? collect(grid, 'button') : [];
    const main = collect(root, '.battle-main-actions button');
    const slots=[];for(const button of main)slots[Number(button.dataset.keyboardNumber)-1]=button;
    return { numbered: choices.length ? choices.filter(b=>!b.hasAttribute('data-move-info')) : slots, navigation: [...choices, ...main] };
  }
  if (root.matches('.raid-battle')) {
    if (root.querySelector('.raid-confirm')) return { numbered: [], navigation: [] };
    const area=root.querySelector('.raid-area-review');if(area){const buttons=collect(area,'button');return {numbered:buttons,navigation:buttons};}
    const targeting = root.querySelector('.raid-targeting');
    if (targeting) {
      const targets=[...collect(root,'.raid-boss-choice'),...collect(root,'.raid-card-pick')].filter(enabled);
      return {numbered:targets,navigation:[...targets,...collect(root,'.raid-target-prompt button')]};
    }
    const choices=collect(root, '.raid-moves button, .raid-main-actions button');
    return { numbered: choices.filter(b=>!b.hasAttribute('data-move-info')), navigation: [...choices, ...collect(root, '.raid-back')] };
  }
  if (root.matches('.double-battle')) {
    if (root.querySelector('.double-confirm')) return { numbered: [], navigation: [] };
    const area=root.querySelector('.double-area-review');if(area){const buttons=collect(area,'button');return {numbered:buttons,navigation:buttons};}
    const targeting = root.querySelector('.double-target-hint');
    const choices = targeting ? collect(targeting, 'button:not(:first-of-type)')
      : collect(root, '.double-moves button, .double-reserves button');
    return { numbered: choices.filter(b=>!b.hasAttribute('data-move-info')), navigation: [...choices, ...collect(root, '.double-switch, .double-slots button')] };
  }
  return { numbered: [], navigation: [] };
}

function focus(root, node) {
  root.querySelectorAll('.keyboard-battle-focus').forEach(el => el.classList.remove('keyboard-battle-focus'));
  if (!node) return;
  node.classList.add('keyboard-battle-focus');
  node.focus({preventScroll:true});
  node.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
}

export function battleNumber(event) {
  return /^Digit[1-4]$/.test(event.code) || /^Numpad[1-4]$/.test(event.code) ? Number(event.code.slice(-1)) : /^[1-4]$/.test(event.key) ? Number(event.key) : 0;
}
export function handleBattleKeyboard(event, root, tutorial = null) {
  if (!root || !visible(root) || event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey
    || event.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[data-social-surface]')) return false;
  const { numbered, navigation } = controls(root, tutorial);
  const digit = battleNumber(event);
  if (digit) {
    // AZERTY Digit4 emits an apostrophe: never leak it to Firefox Quick Find,
    // including while resolving, after a KO, or when the fourth action is disabled.
    event.preventDefault();event.stopPropagation();
    const button = numbered[digit - 1];
    if (event.repeat || !enabled(button)) return true;
    focus(root,button);button.click();return true;
  }
  const direction = ({z:'up',q:'left',s:'down',d:'right',arrowup:'up',arrowleft:'left',arrowdown:'down',arrowright:'right'})[String(event.key||'').toLowerCase()];
  if (direction) {
    const options = navigation.filter(enabled);if (!options.length) return false;
    const active=document.activeElement;
    let next=options[0];
    if (options.includes(active)) {
      const r=active.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;let best=Infinity;next=null;
      for(const candidate of options){if(candidate===active)continue;const b=candidate.getBoundingClientRect(),dx=b.left+b.width/2-x,dy=b.top+b.height/2-y;
        const along=direction==='left'?-dx:direction==='right'?dx:direction==='up'?-dy:dy;
        const across=['left','right'].includes(direction)?Math.abs(dy):Math.abs(dx),cost=along+across*3;
        if(along>2&&cost<best){best=cost;next=candidate;}}
    }
    event.preventDefault();event.stopPropagation();if(next)focus(root,next);return true;
  }
  if (!event.repeat && ['Enter',' '].includes(event.key) && navigation.includes(document.activeElement) && enabled(document.activeElement)) {
    event.preventDefault();event.stopPropagation();document.activeElement.click();return true;
  }
  return false;
}
