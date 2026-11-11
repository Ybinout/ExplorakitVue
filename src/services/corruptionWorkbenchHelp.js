// The workbench supplies its current recipe and balance data so this guide
// displays the same quantities and penalties as the fabrication/preview UI.
export function corruptionWorkbenchHelp({family,typeLabel,recipe,statPenalties,defenseMultiplier,abilityCount,unlocked=true}) {
 const defenseReduction=Math.round((1-defenseMultiplier)*100);
 const introductions={
  move:`La plaque ${typeLabel} choisit le type de la capacité tirée au sort. La CS obtenue peut ensuite être apprise par n’importe quel Pokémon autorisé, même si elle ne fait pas partie de ses capacités habituelles. Le porteur n’a pas besoin d’être de type ${typeLabel}.`,
  ability:`La plaque ${typeLabel} détermine les espèces dont peuvent provenir les talents, talents cachés compris. Le Pokémon qui recevra la pilule peut être d’un autre type. « Résultats possibles » permet de consulter les ${abilityCount} talents proposés pour cette plaque.`,
  type:`La fabrication donne un module du type ${typeLabel}. À l’installation, ce module transforme les types actuels du Pokémon : il modifie ses faiblesses, résistances, immunités et bonus d’attaque liés au type. Il ne change pas les capacités que son espèce peut apprendre normalement.`,
  combat:`La plaque ${typeLabel} permet de tenter un module offensif ou défensif de ce type. L’offensif augmente les dégâts de ses attaques ${typeLabel} de 20 %. Le défensif réduit de ${defenseReduction} % les dégâts des attaques ${typeLabel} reçues. Aucun type ni aucune capacité n’est ajouté.`
 };
 const outcomes={
  move:'Chaque fabrication crée une CS aléatoire du type choisi. Les capacités proposées ont toutes la même chance. Lutte et Gribouille sont exclues.',
  ability:'Chaque fabrication crée une pilule. Chaque talent éligible a la même chance, quel que soit le nombre d’espèces qui le possèdent.',
  type:'La fabrication crée toujours le module du type choisi. Le hasard éventuel concerne son installation, pas le module obtenu.',
  combat:'À chaque tentative : 50 % d’échec, 25 % de module offensif et 25 % de module défensif. Un échec consomme aussi tous les composants et ne donne aucun module.'
 };
 const usage={
  move:'Choisis une place libre parmi les quatre capacités, ou la capacité à oublier si elles sont déjà quatre. Si une CS corrompue est installée, la nouvelle remplace automatiquement celle-ci au même emplacement. Cette capacité reste liée au module : un apprentissage ordinaire ne peut pas l’effacer.',
  ability:'La pilule remplace le talent actuel par le talent indiqué, sans restriction d’espèce parmi les Pokémon autorisés. Les talents propres à une forme exclusive ou sans effet pris en charge sont exclus du tirage. Coloforce, Force Pure et Garde Mystique ne peuvent pas être fabriqués ici.',
  type:`Si ${typeLabel} est absent d’un Pokémon monotype, il devient son second type. S’il est absent d’un Pokémon à deux types, il remplace l’un des deux au hasard, avec une chance sur deux chacun. S’il est déjà présent parmi deux types, il est retiré. Retirer son unique type est impossible : le module reste dans le sac.`,
  combat:'Un seul emplacement Combat est disponible : offense et défense sont deux choix pour ce même emplacement. Installer un autre module Combat remplace le précédent, même si le type ou la direction change. Les deux effets ne se cumulent pas sur le même Pokémon.'
 };
 const labels={move:'CS',ability:'Talent',type:'Type',combat:'Combat'};
 const costs=recipe.map(c=>`${c.name} × ${Number(c.quantity).toLocaleString('fr-FR')}`).join(' · ');
 const penalties=['move','ability','type','combat'].map(key=>`${labels[key]} −${statPenalties[key]||0} %`).join(' ; ');
 const total=Object.values(statPenalties).reduce((sum,value)=>sum+Number(value||0),0);
 return [
  {key:'purpose',title:`Comprendre la station ${labels[family]}`,text:(unlocked?'':'La fabrication reste verrouillée tant que tu n’as pas la Carte de dresseur professionnel. ')+introductions[family]},
  {key:'recipe',title:`Recette pour la plaque ${typeLabel}`,text:`${costs}. Ajoute chaque composant par un clic, un toucher ou un glissement. Seul « Fabriquer le module » consomme la recette. ${outcomes[family]}`},
  {key:'usage',title:'Ce qui se passe à l’installation',text:usage[family]},
  {key:'replacement',title:'Un exemplaire par installation',text:'La fabrication seule ne modifie aucun Pokémon. Le résultat va dans le sac, rubrique Corruption. Hors combat, utilise-le depuis le sac ou la fiche du Pokémon, dans l’équipe ou au PC. Une installation réussie consomme un exemplaire. Il reste au plus un module par famille ; remplacer un module détruit l’ancien.'+(family==='type'?' Chaque nouvelle mutation repart des types actuels, pas des types d’origine.':'')},
  {key:'permanence',title:'Une corruption définitive',text:'Le premier module installé rend le Pokémon définitivement corrompu, même après une évolution. Tu peux remplacer ses modules, pas le rendre sain. Un seul Pokémon corrompu est autorisé dans l’équipe ; tu peux en conserver plusieurs au PC. Les légendaires, fabuleux, Œufs et Pokémon K.O. ne peuvent pas recevoir de module.'},
  {key:'stats',title:`Cette famille coûte −${statPenalties[family]||0} % de statistiques`,text:`Les malus s’additionnent selon les familles installées : ${penalties}, soit −${total} % avec les quatre. Ils touchent les PV, l’Attaque, la Défense, l’Attaque Spéciale, la Défense Spéciale et la Vitesse. Remplacer un module de la même famille n’ajoute pas un nouveau malus. L’aperçu avant confirmation et la fiche incluent ces pénalités.`},
  {key:'held-items',title:'Modules et objets tenus',text:'Un module installé n’occupe pas la place de l’objet tenu. Un Pokémon corrompu peut tenir un objet corrompu, une baie finale du Mutateur ou un Kit de survie. Son ancien objet ordinaire incompatible retourne dans le sac lors de la corruption. Les objets corrompus ne peuvent pas être confiés à un Pokémon non corrompu.'}
 ];
}
