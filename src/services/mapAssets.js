const MAP_ASSET_ALIASES = Object.freeze({
    ville5_shop: 'gen_shop1',
    ville5_maison1: 'gen_maison1', ville5_maison2: 'gen_maison2',
    ville4_shop: 'gen_shop1',
    ville4_maison1: 'gen_maison1', ville4_maison2: 'gen_maison2', route4_maison: 'gwenn_house',
    ville3_shop: 'gen_shop1',
    ville3_maison1: 'gen_maison1', ville3_maison2: 'gen_maison2',
    gen_shop_route10: 'gen_shop1',
    gen_maison_ville5_2: 'gen_maison2',
    gen_maison_ville5_3: 'gen_maison3',
    ville1_shop: 'gen_shop1',
    ville_safe1_shop: 'gen_shop1',
    ville_safe1_maison1: 'gen_maison1',
    ville_safe1_maison2: 'gen_maison2',
    ville_safe1_maison3: 'gen_maison3',
    ville_safe1_maison4: 'gen_maison1',
});
const mapAssetContext = require.context(
    '@/assets',
    false,
    /^\.\/(?:gwenn_house|route2_maison|ville(?:[1345]|_safe1)_arene|ville_commerciale|tour_(?:rdc|etage[123])|start|etage2?|maison2?|pk[12]|route(?:[1-6]|1[1-4])|ville[1345]|ville_safe1|centre|cave(?:[12]|_rochebrume[123])|gen_(?:route[1-8]|ville[1-5]|arene[1-5]|maison(?:[1-3]|_ville[1-5]_[12])|shop(?:1|_ville[25]_1)))(?:_f)?\.png$/
);

export function resolveMapAsset(mapName, foreground = false) {
    const suffix = foreground ? '_f' : '';
    const assetMapName = MAP_ASSET_ALIASES[mapName] || mapName;
    return mapAssetContext(`./${assetMapName}${suffix}.png`);
}
