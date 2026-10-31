const ids = entries => new Set((entries || []).filter(entry => entry?.id != null).map(entry => String(entry.id)));
const remember = (set, id) => {
  if (id == null || set.has(String(id))) return false;
  set.add(String(id));
  if (set.size > 256) set.delete(set.values().next().value);
  return true;
};

// Snapshot diffs for requests/group messages; private messages have their own
// event. History, presence refreshes and our own messages are always silent.
export class SocialNotifications {
  constructor({ userId, reading = () => null, notify, groupUnread = () => {}, now = () => Date.now() }) {
    Object.assign(this, { userId, reading, notify, changed: groupUnread, now });
    this.messages = new Set(); this.trades = new Set(); this.lastSound = -Infinity;
    this.unread = 0; this.disposed = false; this.reset();
  }
  reset() { this.initialized = false; this.requests = new Set(); this.invites = new Set(); this.groupId = null; this.groupMessages = new Set(); }
  sound(kind) {
    if (this.disposed || this.now() - this.lastSound < 1200) return;
    this.lastSound = this.now();
    this.notify(kind);
  }
  setUnread(value) {
    if (this.disposed) return;
    value = Math.max(0, Math.min(9999, value));
    if (value !== this.unread) { this.unread = value; this.changed(value); }
  }
  readGroup() { this.setUnread(0); }
  snapshot(state) {
    if (this.disposed || !state) return;
    const requests = ids(state.incoming), invites = ids(state.groupInvites), groupId = state.group?.id || null;
    let alert = null;
    if (this.initialized) {
      if ([...requests].some(id => !this.requests.has(id))) alert = 'friend';
      if ([...invites].some(id => !this.invites.has(id))) alert = 'group-invite';
    }
    if (groupId !== this.groupId || !this.initialized) this.setUnread(0);
    else {
      const messages = (state.group?.messages || []).filter(m => m.id != null && !this.groupMessages.has(String(m.id)) && Number(m.senderId) !== Number(this.userId()));
      if (this.reading()?.kind === 'group') this.setUnread(0);
      else if (messages.length) { this.setUnread(this.unread + messages.length); alert = 'group-message'; }
    }
    this.requests = requests; this.invites = invites; this.groupId = groupId; this.groupMessages = ids(state.group?.messages); this.initialized = true;
    if (alert) this.sound(alert);
  }
  message(message) {
    if (this.disposed || !message || Number(message.recipientId) !== Number(this.userId()) || Number(message.senderId) === Number(this.userId())) return;
    if (!remember(this.messages, message.id)) return;
    const reading = this.reading();
    if (reading?.kind === 'private' && Number(reading.id) === Number(message.senderId)) return;
    this.sound('message');
  }
  trade(state, silent = false) {
    if (this.disposed || state?.phase !== 'invited' || Number(state.requestedBy) === Number(this.userId())) return;
    if (remember(this.trades, state.id) && !silent) this.sound('trade');
  }
  dispose() { this.disposed = true; this.reset(); this.messages.clear(); this.trades.clear(); }
}
