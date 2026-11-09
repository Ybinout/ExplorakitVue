export function darkBattleBackgroundKey(map, finalRift=false) {
  return /^DC2_(?:0[1-9]|[1-3][0-9]|4[0-8])$/.test(String(map||''))
    ? (finalRift?'dark-pyramid':'dark-continent2') : 'dark-jungle';
}
export const darkBattleBackgrounds = {
  'dark-jungle': {wide:require('@/assets/battle/dark-jungle-wide-v1.webp'),mobile:require('@/assets/battle/dark-jungle-mobile-v1.webp')},
  'dark-continent2': {wide:require('@/assets/battle/dark-continent2-wide-v1.webp'),mobile:require('@/assets/battle/dark-continent2-mobile-v1.webp')},
  'dark-pyramid': {wide:require('@/assets/battle/dark-pyramid-wide-v1.webp'),mobile:require('@/assets/battle/dark-pyramid-mobile-v1.webp')}
};
