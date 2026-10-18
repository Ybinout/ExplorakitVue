const SESSION_KEY = 'explorakit.user';

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return session && typeof session === 'object' ? session : null;
  } catch (error) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function storeSession(user, token) {
  const session = { ...user, token };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function hasAuthenticatedSession() {
  const session = getSession();
  return Boolean(session?.id && session?.token);
}

export function loginDestination(value) {
  return typeof value === 'string' && (/^\/(?:game|drift|colosseum)$/.test(value) || /^\/profil\/[1-9]\d*$/.test(value) || /^\/dresseurs(?:\?onglet=(?:amis|classement|recherche))?$/.test(value) || /^\/classements(?:\?mode=(?:rift|30|60))?$/.test(value)) ? value : '/';
}
