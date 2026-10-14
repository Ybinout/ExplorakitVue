const MAP_ASSET_ALIASES = Object.freeze({
    ville1_arene: 'gen_arene1',
    ville1_shop: 'gen_shop1',
});
const mapAssetContext = require.context(
    '@/assets',
    false,
    /^\.\/(?:start|etage2?|maison2?|pk[12]|route[1-6]|ville1|centre|cave[12]|gen_(?:route[1-8]|ville[1-5]|arene[1-5]|maison(?:[1-3]|_ville[1-5]_[12])|shop(?:1|_ville[25]_1)))(?:_f)?\.png$/
);

export function resolveMapAsset(mapName, foreground = false) {
    const suffix = foreground ? '_f' : '';
    const assetMapName = MAP_ASSET_ALIASES[mapName] || mapName;
    return mapAssetContext(`./${assetMapName}${suffix}.png`);
}
