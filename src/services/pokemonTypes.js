const labels = { Normal:'Normal', Fire:'Feu', Water:'Eau', Electric:'Électrik', Grass:'Plante', Ice:'Glace', Fighting:'Combat', Poison:'Poison', Ground:'Sol', Flying:'Vol', Psychic:'Psy', Bug:'Insecte', Rock:'Roche', Ghost:'Spectre', Dragon:'Dragon', Dark:'Ténèbres', Steel:'Acier', Fairy:'Fée' };
export function localizeTypeName(type) { return labels[type] || type; }

// Same type palette as the battle choices; use readable ink on every badge.
const colors={Bug:'#9fca3b',Dark:'#71605a',Dragon:'#7864e8',Electric:'#f6cf3f',Fairy:'#f39dcc',Fighting:'#dc594d',Fire:'#f27b38',Flying:'#78a7e8',Ghost:'#6f72b8',Grass:'#5fbd58',Ground:'#d5a64a',Ice:'#63c9d3',Normal:'#a4a49a',Poison:'#a85bad',Psychic:'#e95d91',Rock:'#b7a34b',Steel:'#8da4ad',Water:'#4e8ee8'};
export function typeBadgeStyle(type) {
  const color=colors[type]||colors.Normal;
  const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  const luminance=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  return {'--pokemon-type-color':color,'--pokemon-type-ink':luminance>.179?'#000000':'#ffffff'};
}
