import manifest from '../data/npcDialoguePortraits.json';
import { classicNpcIndex } from './npcFrames';

// Keep the server's legacy dialogue format and every champion portrait intact.
// Resolve identity from the same role rules used by the actual world sprite.
export function illustratedNpcPortrait(sentence, dialogueName = '') {
  // Wayne has a dedicated monochrome illustration, including old a.png payloads.
  if (sentence.imageName === 'a.png') {
    return { ...sentence, imageName: 'wayne-eyepatch-v1.png', portraitFrame: null };
  }
  if (['lucie_route2', 'lucie_route2_after', 'lucie_route2_locked'].includes(dialogueName)) {
    return { ...sentence, imageName: 'lucie-v1.png', portraitFrame: null,
      typewriterMs: dialogueName === 'lucie_route2_locked' ? 0 : 45 };
  }
  // Mathilde uses the supplied blonde world sprite. Until her dedicated splash
  // is available, keep a blonde civilian illustration, including for old servers.
  if (sentence.imageName === 'townspeople.png' && ['mathilde_pikapika', 'mathilde_pikapika_locked', 'mathilde_pikapika_after'].includes(dialogueName)) {
    const asset = manifest.assets[0];
    return { ...sentence, imageName: asset.imageName, portraitFrame: {
      columns: asset.columns, rows: asset.rows, index: 15, rowBounds: asset.rowBounds
    } };
  }
  const nrv = /^nrv_(noz|tom|cry)(?:_after)?$/.exec(dialogueName);
  if (nrv) return { ...sentence, imageName: `nrv-${nrv[1]}-v1.png`, portraitFrame: null };
  let index;
  if (sentence.imageName === 'townspeople.png') {
    const actor = manifest.actors[dialogueName] || {};
    index = classicNpcIndex(actor.spriteFrame || sentence.portraitFrame, actor);
  } else if (sentence.imageName === 'inf.png') index = 34;
  else return sentence;
  const asset = manifest.assets[Math.floor(index / 18)];
  return { ...sentence, imageName: asset.imageName, portraitFrame: {
    columns: asset.columns, rows: asset.rows, index: index % 18, rowBounds: asset.rowBounds
  } };
}
