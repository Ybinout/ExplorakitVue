// Built once per notebook payload, not on the crop timer or every frame.
export const recipeText = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
export function indexRecipes(recipes, catalog) {
  return recipes.map((recipe, order) => {
    const words = [recipe.name];
    for (const key of [...recipe.ingredients, ...Object.values(recipe.results)]) {
      const item = catalog.get(key) || {};
      words.push(item.name, item.description);
      for (const effect of [item.mutationBerry?.bonus, item.mutationBerry?.malus]) {
        if (!effect) continue;
        if (effect.kind === 'defense') words.push('défense protection résistance réduction dégâts reçus');
        if (effect.kind === 'offense') words.push('attaque offensif dégâts infligés');
      }
    }
    const text=recipeText(words.join(' '));
    return { recipe, order, text, words:new Set(text.split(/[^a-z0-9]+/)) };
  });
}
export function findRecipes(index, query) {
  const tokens = recipeText(query).trim().split(/\s+/).filter(Boolean);
  return index.filter(row => tokens.every(token => token.length<=3 ? row.words.has(token) : row.text.includes(token)))
    .sort((a,b) => Number(!!b.recipe.favorite)-Number(!!a.recipe.favorite) || a.order-b.order)
    .map(row => row.recipe);
}
