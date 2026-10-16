const labels = { Normal:'Normal', Fire:'Feu', Water:'Eau', Electric:'Électrik', Grass:'Plante', Ice:'Glace', Fighting:'Combat', Poison:'Poison', Ground:'Sol', Flying:'Vol', Psychic:'Psy', Bug:'Insecte', Rock:'Roche', Ghost:'Spectre', Dragon:'Dragon', Dark:'Ténèbres', Steel:'Acier', Fairy:'Fée' };
export function localizeTypeName(type) { return labels[type] || type; }
