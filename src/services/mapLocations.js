const labels = {
  fr: {
    ville4: 'Rochebrume', ville4_arene: 'Arène de Rochebrume · Wanda', ville4_shop: 'Boutique de Rochebrume',
    ville4_maison1: 'Maison de Rochebrume', ville4_maison2: 'Maison de Rochebrume',
    ville3: 'Clairfontaine', ville3_arene: 'Arène de Clairfontaine · Ana', ville3_shop: 'Boutique de Clairfontaine',
    ville3_maison1: 'Maison de Clairfontaine', ville3_maison2: 'Maison de Clairfontaine',
    gen_route7: 'Route 9', gen_route6: 'Route 10', gen_shop_route10: 'Boutique de la Route 10',
    ville_safe1: 'Valpierre', ville_safe1_arene: 'Arène de Valpierre · Hoze', ville_safe1_shop: 'Boutique de Valpierre',
    start: 'Village de départ', maison: 'Maison', maison2: 'Maison', etage: 'Étage', etage2: 'Étage',
    ville1: 'Ville du Lac', ville1_arene: 'Arène de la Ville du Lac', ville1_shop: 'Boutique de la Ville du Lac',
    cave_rochebrume1: 'Grottes de Rochebrume · Entrée', cave_rochebrume2: 'Grottes de Rochebrume · Profondeurs', cave_rochebrume3: 'Grottes de Rochebrume · Galerie gelée',
    centre: 'Centre Pokémon', cave1: 'Grotte', cave2: 'Profondeurs de la grotte',
    pk1: 'Zone sauvage', pk2: 'Zone sauvage',
    gen_arene1: 'Archives de Clairbois', gen_arene2: 'Arène Marée · Wanda',
    gen_arene3: 'Arène Minerai · Ana', gen_arene4: 'Ancienne arène de Floraville',
    gen_arene5: 'Arène d’Ocreville · Raphael'
  },
  en: {
    ville4: 'Miststone', ville4_arene: 'Miststone Gym · Wanda', ville4_shop: 'Miststone Shop',
    ville4_maison1: 'Miststone House', ville4_maison2: 'Miststone House',
    ville3: 'Clearfountain', ville3_arene: 'Clearfountain Gym · Ana', ville3_shop: 'Clearfountain Shop',
    ville3_maison1: 'Clearfountain House', ville3_maison2: 'Clearfountain House',
    gen_route7: 'Route 9', gen_route6: 'Route 10', gen_shop_route10: 'Route 10 Shop',
    ville_safe1: 'Valpierre', ville_safe1_arene: 'Valpierre Gym · Hoze', ville_safe1_shop: 'Valpierre Shop',
    start: 'Starting Village', maison: 'Home', maison2: 'Home', etage: 'Upstairs', etage2: 'Upstairs',
    ville1: 'Lake Town', ville1_arene: 'Lake Town Gym', ville1_shop: 'Lake Town Shop',
    cave_rochebrume1: 'Miststone Caves · Entrance', cave_rochebrume2: 'Miststone Caves · Depths', cave_rochebrume3: 'Miststone Caves · Frozen Gallery',
    centre: 'Pokémon Center', cave1: 'Cave', cave2: 'Cave Depths',
    pk1: 'Wild Area', pk2: 'Wild Area',
    gen_arene1: 'Clairwood Archives', gen_arene2: 'Tide Gym · Wanda',
    gen_arene3: 'Ore Gym · Ana', gen_arene4: 'Old Bloomtown Gym',
    gen_arene5: 'Ochre Gym · Raphael'
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

  if (String(mapName || '').startsWith('ville_safe1_maison')) return locale === 'fr' ? 'Maison de Valpierre' : 'Valpierre House';

  const homeMatch = String(mapName || '').match(/^gen_maison/);
  if (homeMatch) return locale === 'fr' ? 'Maison' : 'House';

  return String(mapName || '').replaceAll('_', ' ') || (locale === 'fr' ? 'Lieu inconnu' : 'Unknown location');
}
