import manifest from '../data/npcDialoguePortraits.json';
import { classicNpcIndex } from './npcFrames';

// Keep the server's legacy dialogue format and every champion portrait intact.
// Resolve identity from the same role rules used by the actual world sprite.
export function illustratedNpcPortrait(sentence, dialogueName = '') {
  if (['town_lina', 'town_lina_after'].includes(dialogueName)) return { ...sentence, imageName: 'maria-v2.png', portraitFrame: null };
  if (['town_bastien', 'town_bastien_after'].includes(dialogueName)) return { ...sentence, imageName: 'clement-v2.png', portraitFrame: null };
  if(dialogueName==='dia0_final')dialogueName='dia0';
  if(['lucie_lab_rescue','lucie_lab_rescue_after','lucie_lab_rescue_locked','lucie_home'].includes(dialogueName))return {...sentence,imageName:'lucie-v1.png',portraitFrame:null,typewriterMs:45};
  // Matthieu retains the legacy Route 8 encounter key in saved progression.
  if (['gwenn_route8', 'gwenn_route8_locked', 'gwenn_route8_after'].includes(dialogueName)) {
    return { ...sentence, imageName: 'matthieu-v2.png', portraitFrame: null };
  }
  // Wayne has a dedicated monochrome illustration, including old a.png payloads.
  if (sentence.imageName === 'a.png') {
    return { ...sentence, imageName: 'wayne-eyepatch-v1.png', portraitFrame: null };
  }
  if (['lucie_route2', 'lucie_route2_after', 'lucie_route2_locked'].includes(dialogueName)) {
    return { ...sentence, imageName: 'lucie-v1.png', portraitFrame: null,
      typewriterMs: dialogueName === 'lucie_route2_locked' ? 0 : 45 };
  }
  // Keep Mathilde's illustration independent from her original world atlas crop.
  if (['mathilde_pikapika', 'mathilde_pikapika_locked', 'mathilde_pikapika_after'].includes(dialogueName)) {
    return { ...sentence, imageName: 'mathilde-v1.png', portraitFrame: null };
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
