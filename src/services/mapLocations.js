const labels = {
  fr: {
    start: 'Village de départ', maison: 'Maison', maison2: 'Maison', etage: 'Étage', etage2: 'Étage',
    ville1: 'Ville du Lac', ville1_arene: 'Arène de la Ville du Lac', ville1_shop: 'Boutique de la Ville du Lac',
    centre: 'Centre Pokémon', cave1: 'Grotte', cave2: 'Profondeurs de la grotte',
    pk1: 'Zone sauvage', pk2: 'Zone sauvage'
  },
  en: {
    start: 'Starting Village', maison: 'Home', maison2: 'Home', etage: 'Upstairs', etage2: 'Upstairs',
    ville1: 'Lake Town', ville1_arene: 'Lake Town Gym', ville1_shop: 'Lake Town Shop',
    centre: 'Pokémon Center', cave1: 'Cave', cave2: 'Cave Depths',
    pk1: 'Wild Area', pk2: 'Wild Area'
  }
};

const generatedCities = {
  gen_ville1: ['Clairbois', 'Clairwood'],
  gen_ville2: ['Rivazur', 'Azuriver'],
  gen_ville3: ['Rochebourg', 'Stoneborough'],
  gen_ville4: ['Floraville', 'Bloomtown'],
  gen_ville5: ['Ocreville', 'Ochre Town']
};

export function getMapLocationLabel(mapName, language = 'fr') {
  const locale = language === 'en' ? 'en' : 'fr';
  if (labels[locale][mapName]) return labels[locale][mapName];
  if (generatedCities[mapName]) return generatedCities[mapName][locale === 'fr' ? 0 : 1];

  const routeMatch = String(mapName || '').match(/^(?:gen_)?route(\d+)$/);
  if (routeMatch) return `Route ${routeMatch[1]}`;

  const gymMatch = String(mapName || '').match(/^gen_arene(\d+)$/);
  if (gymMatch) return `${locale === 'fr' ? 'Arène' : 'Gym'} ${gymMatch[1]}`;

  const shopMatch = String(mapName || '').match(/^gen_shop/);
  if (shopMatch) return locale === 'fr' ? 'Boutique Pokémon' : 'Pokémon Shop';

  const homeMatch = String(mapName || '').match(/^gen_maison/);
  if (homeMatch) return locale === 'fr' ? 'Maison' : 'House';

  return String(mapName || '').replaceAll('_', ' ') || (locale === 'fr' ? 'Lieu inconnu' : 'Unknown location');
}
