import manifest from '../data/npcDialoguePortraits.json';
import { classicNpcIndex } from './npcFrames';

// Keep the server's legacy dialogue format and every champion portrait intact.
// Resolve identity from the same role rules used by the actual world sprite.
export function illustratedNpcPortrait(sentence, dialogueName = '') {
  let index;
  if (sentence.imageName === 'townspeople.png') {
    const actor = manifest.actors[dialogueName] || {};
    index = classicNpcIndex(actor.spriteFrame || sentence.portraitFrame, actor);
  } else if (sentence.imageName === 'inf.png') index = 34;
  else if (sentence.imageName === 'a.png') index = 33; // Wayne's navy cap/orange outfit, painted in start.png.
  else return sentence;
  const asset = manifest.assets[Math.floor(index / 18)];
  return { ...sentence, imageName: asset.imageName, portraitFrame: {
    columns: asset.columns, rows: asset.rows, index: index % 18, rowBounds: asset.rowBounds
  } };
}
