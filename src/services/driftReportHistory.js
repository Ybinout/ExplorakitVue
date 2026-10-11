export const DRIFT_HISTORY_LIMIT = 10;
const MAX_HISTORY_CHARACTERS = 2000000;

function historyKey(userId) {
  const id = Number(userId);
  return Number.isSafeInteger(id) && id > 0 ? `explorakit:drift-reports:v1:${id}` : null;
}

function belongsTo(report, userId) {
  return report?.version === 1 && typeof report.runId === 'string' && report.runId.length > 0 &&
    Number.isFinite(report.finishedAt) && Array.isArray(report.players) &&
    report.players.some(player => Number(player.id) === Number(userId));
}

// Read-only souvenirs, kept separately from the ephemeral playable inventory.
// All access is best-effort: blocked/full storage must never interrupt the game.
export function readDriftReports(userId, storage) {
  try {
    const key = historyKey(userId);
    if (!key) return [];
    const raw = (storage || window.localStorage).getItem(key);
    if (!raw || raw.length > MAX_HISTORY_CHARACTERS) return [];
    const reports = JSON.parse(raw);
    if (!Array.isArray(reports)) return [];
    const seen = new Set();
    return reports.filter(report => {
      if (!belongsTo(report, userId) || seen.has(report.runId)) return false;
      seen.add(report.runId);
      return true;
    }).sort((a, b) => b.finishedAt - a.finishedAt).slice(0, DRIFT_HISTORY_LIMIT);
  } catch (error) {
    return [];
  }
}

export function saveDriftReport(userId, report, storage) {
  try {
    const key = historyKey(userId);
    if (!key || !belongsTo(report, userId)) return false;
    const target = storage || window.localStorage;
    const reports = [report, ...readDriftReports(userId, target).filter(item => item.runId !== report.runId)]
      .slice(0, DRIFT_HISTORY_LIMIT);
    while (reports.length) {
      const serialized = JSON.stringify(reports);
      if (serialized.length <= MAX_HISTORY_CHARACTERS) {
        try { target.setItem(key, serialized); return true; }
        catch (error) { /* Try keeping fewer older souvenirs if storage is full. */ }
      }
      reports.pop();
    }
    return false;
  } catch (error) {
    return false;
  }
}
