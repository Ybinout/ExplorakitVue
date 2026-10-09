import frenchGameNames from '@/data/gameNames.fr.json';

export const SUPPORTED_LANGUAGES = Object.freeze(['fr', 'en']);

const messages = {
  fr: {
    close: 'Fermer', loading: 'Chargement…', empty: 'Aucun résultat.',
    menu: 'Menu', pokedex: 'Pokédex', progress: 'Quêtes et badges', pokemon: 'Pokémon', appearance: 'Apparence',
    bag: 'Sac', save: 'Sauvegarder', options: 'Options', openShop: 'Acheter', seen: 'vus', caughtPlural: 'capturés', species: 'espèces',
    searchPokemon: 'Rechercher un Pokémon', all: 'Tous', caught: 'Capturé', spotted: 'Aperçu', unknown: 'Inconnu',
    activeQuests: 'Quêtes actives', completedQuests: 'Quêtes terminées', completed: 'Terminée', noActiveQuest: 'Aucune quête active.',
    noCompletedQuest: 'Aucune quête terminée.', badges: 'Badges', unknownBadge: 'Badge inconnu', earned: 'Obtenu', toConquer: 'À conquérir',
    syncingServer: 'Synchronisation avec le serveur…', autoSave: 'La progression est aussi sauvegardée automatiquement.',
    lastSync: 'Dernière synchronisation : {date}', syncNow: 'Synchroniser maintenant', syncing: 'Synchronisation…',
    syncRunning: 'Synchronisation en cours', syncInterrupted: 'Synchronisation interrompue', gameSynced: 'Partie synchronisée',
    autoSaveActive: 'Sauvegarde automatique active', masterVolume: 'Volume général', volumeHelp: 'Sons de dialogue et de combat',
    textSpeed: 'Vitesse des textes', textSpeedHelp: 'Quantité de texte affichée à chaque validation', slow: 'Lente', normal: 'Normale',
    instant: 'Instantanée', animations: 'Animations', animationsHelp: 'Réduire les mouvements et effets visuels', language: 'Langue',
    languageHelp: "Langue de l'interface, des capacités et des talents", french: 'Français', english: 'English', localOptions: 'Ces options sont enregistrées sur cet appareil.',
    team: 'Équipe Pokémon', noPokemon: "Aucun Pokémon dans l'équipe.", hp: 'PV', ability: 'Talent', noAbility: 'aucun',
    noHeldItem: 'Aucun objet tenu', saveOrder: "Sauvegarder l'ordre", saving: 'Sauvegarde…', emptyBag: 'Sac vide.',
    interaction: 'Interaction', withPlayer: 'Avec {name}', chat: 'Chat', battle: 'Combat', cancel: 'Annuler', accept: 'Accepter', refuse: 'Refuser',
    requestReceived: 'Demande reçue', requestSentence: '{name} veut lancer {kind}.', aBattle: 'un combat', aChat: 'un chat',
    battleUnavailable: "Combat indisponible (un des joueurs n'a pas de Pokémon prêt).", writeMessage: 'Écris un message…', send: 'Envoyer',
    attack: 'Attaque', flee: 'Fuite', chooseAction: 'Choisis une action.', yourTurn: 'À toi de jouer', resolvingTurn: 'Résolution du tour',
    captureRunning: 'Capture en cours', noOtherPokemon: 'Aucun autre Pokémon disponible.', activePokemon: 'actif', loadingBag: 'Chargement du sac…',
    noBall: 'Aucune Ball disponible.', waitTurnBag: 'Attends ton tour pour utiliser le sac.', attackRunning: 'Attaque en cours…',
    switchRunning: 'Changement de Pokémon…', throwBall: 'Tu lances une Ball…', fleeing: 'Tu prends la fuite…',
    soundOff: 'Couper les sons du combat', soundOn: 'Activer les sons du combat', soundsEnabled: 'Sons activés', soundsMuted: 'Sons coupés',
    missed: 'Raté !', immune: 'Immunité', blocked: 'Bloqué !', critical: 'Critique !', superEffective: 'Super efficace !', resisted: 'Peu efficace',
    launched: '{item} lancée !', hitPokemon: '{item} touche {pokemon} !', absorbed: '{pokemon} est aspiré dans la Ball…',
    ballDrops: 'La Ball retombe…', captured: '{pokemon} est capturé !', escaped: "{pokemon} s'est échappé !"
  },
  en: {
    close: 'Close', loading: 'Loading…', empty: 'No results.',
    menu: 'Menu', pokedex: 'Pokédex', progress: 'Quests and badges', pokemon: 'Pokémon', appearance: 'Appearance',
    bag: 'Bag', save: 'Save', options: 'Options', openShop: 'Shop', seen: 'seen', caughtPlural: 'caught', species: 'species',
    searchPokemon: 'Search for a Pokémon', all: 'All', caught: 'Caught', spotted: 'Seen', unknown: 'Unknown',
    activeQuests: 'Active quests', completedQuests: 'Completed quests', completed: 'Completed', noActiveQuest: 'No active quest.',
    noCompletedQuest: 'No completed quest.', badges: 'Badges', unknownBadge: 'Unknown badge', earned: 'Earned', toConquer: 'Not earned',
    syncingServer: 'Synchronizing with the server…', autoSave: 'Progress is also saved automatically.',
    lastSync: 'Last synchronization: {date}', syncNow: 'Synchronize now', syncing: 'Synchronizing…',
    syncRunning: 'Synchronization in progress', syncInterrupted: 'Synchronization interrupted', gameSynced: 'Game synchronized',
    autoSaveActive: 'Automatic save enabled', masterVolume: 'Master volume', volumeHelp: 'Dialogue and battle sounds',
    textSpeed: 'Text speed', textSpeedHelp: 'Amount of text shown on each confirmation', slow: 'Slow', normal: 'Normal', instant: 'Instant',
    animations: 'Animations', animationsHelp: 'Reduce motion and visual effects', language: 'Language',
    languageHelp: 'Interface, move and ability language', french: 'Français', english: 'English', localOptions: 'These options are saved on this device.',
    team: 'Pokémon team', noPokemon: 'No Pokémon in the team.', hp: 'HP', ability: 'Ability', noAbility: 'none', noHeldItem: 'No held item',
    saveOrder: 'Save order', saving: 'Saving…', emptyBag: 'The bag is empty.',
    interaction: 'Interaction', withPlayer: 'With {name}', chat: 'Chat', battle: 'Battle', cancel: 'Cancel', accept: 'Accept', refuse: 'Decline',
    requestReceived: 'Request received', requestSentence: '{name} wants to start {kind}.', aBattle: 'a battle', aChat: 'a chat',
    battleUnavailable: 'Battle unavailable (one player has no ready Pokémon).', writeMessage: 'Write a message…', send: 'Send',
    attack: 'Fight', flee: 'Run', chooseAction: 'Choose an action.', yourTurn: 'Your turn', resolvingTurn: 'Resolving turn',
    captureRunning: 'Capture in progress', noOtherPokemon: 'No other Pokémon available.', activePokemon: 'active', loadingBag: 'Loading bag…',
    noBall: 'No Ball available.', waitTurnBag: 'Wait for your turn to use the bag.', attackRunning: 'Attacking…',
    switchRunning: 'Switching Pokémon…', throwBall: 'You throw a Ball…', fleeing: 'You try to flee…',
    soundOff: 'Mute battle sounds', soundOn: 'Enable battle sounds', soundsEnabled: 'Sounds enabled', soundsMuted: 'Sounds muted',
    missed: 'Miss!', immune: 'Immune', blocked: 'Blocked!', critical: 'Critical hit!', superEffective: 'Super effective!', resisted: 'Not very effective',
    launched: '{item} thrown!', hitPokemon: '{item} hits {pokemon}!', absorbed: '{pokemon} is pulled into the Ball…',
    ballDrops: 'The Ball falls…', captured: '{pokemon} was caught!', escaped: '{pokemon} broke free!'
  }
};

export function normalizeLanguage(value) {
  const language = String(value || '').toLowerCase().split('-')[0];
  return SUPPORTED_LANGUAGES.includes(language) ? language : 'fr';
}

export function translate(language, key, parameters = {}) {
  const locale = normalizeLanguage(language);
  const template = messages[locale]?.[key] || messages.fr[key] || key;
  return Object.entries(parameters).reduce(
    (value, [name, replacement]) => value.replaceAll(`{${name}}`, String(replacement)),
    template
  );
}

export function localizeMoveName(name, language) {
  if (normalizeLanguage(language) !== 'fr') return name || '';
  return frenchGameNames.moves[name] || name || '';
}

export function localizeAbilityName(name, language) {
  if (normalizeLanguage(language) !== 'fr') return name || '';
  return frenchGameNames.abilities[name] || name || '';
}
