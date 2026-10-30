const labels = {
  fr: {
    super_tournament_lobby:'Super Tournoi · Accueil',super_tournament_sas:'Super Tournoi · SAS',super_tournament_room:'Super Tournoi · Salle de duel',
    void_arena:'Arène oubliée', professor_lab:'Laboratoire du Professeur',
    ville_commerciale:'Comptoirville',tour_rdc:'Grand Comptoir · 1 · Fournitures',tour_etage1:'Grand Comptoir · 2 · Entraînement',tour_etage2:'Grand Comptoir · 3 · Stratégie',tour_etage3:'Grand Comptoir · 4 · Baies',
    route3_maison_nrv: 'Repaire NRV · Route 3', route2_maison: 'Maison de Lucie', ville5: 'Blanchecime', ville5_arene: 'Arène de Blanchecime', ville5_shop: 'Boutique de Blanchecime',
    ville5_maison1: 'Maison de Blanchecime', ville5_maison2: 'Maison de Blanchecime',
    ville4: 'Rochebrume', ville4_arene: 'Arène de Rochebrume · Wanda', ville4_shop: 'Boutique de Rochebrume',
    ville4_maison1: 'Maison de Rochebrume', ville4_maison2: 'Maison de Rochebrume', route4_maison: 'Maison de Gwenn · Route 4',
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
    super_tournament_lobby:'Super Tournoi · Accueil',super_tournament_sas:'Super Tournoi · SAS',super_tournament_room:'Super Tournoi · Salle de duel',
    void_arena:'Forgotten Arena', professor_lab:'Professor’s Laboratory',
    ville_commerciale:'Market Town',tour_rdc:'Grand Store · 1 · Supplies',tour_etage1:'Grand Store · 2 · Training',tour_etage2:'Grand Store · 3 · Strategy',tour_etage3:'Grand Store · 4 · Berries',
    route3_maison_nrv: 'NRV Hideout · Route 3', route2_maison: 'Lucie’s House', ville5: 'Whitepeak', ville5_arene: 'Whitepeak Gym', ville5_shop: 'Whitepeak Shop',
    ville5_maison1: 'Whitepeak House', ville5_maison2: 'Whitepeak House',
    ville4: 'Miststone', ville4_arene: 'Miststone Gym · Wanda', ville4_shop: 'Miststone Shop',
    ville4_maison1: 'Miststone House', ville4_maison2: 'Miststone House', route4_maison: 'Gwenn’s House · Route 4',
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
