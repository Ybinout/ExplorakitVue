// Legacy battleText events remain supported; no new wire protocol is required.
// A real move announcement must survive the following effects and action prompt.
export function isMoveAnnouncement(message) {
  return typeof message === 'string' && /^.+ (?:utilise|uses) .+\s[!！]$/.test(message.trim());
}

export function moveAnnouncementDuration(message) {
  return Math.min(2400, Math.max(1400, String(message).length * 28));
}
