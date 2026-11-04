const ids = entries => new Set((entries || []).filter(entry => entry?.id != null).map(entry => String(entry.id)));
const remember = (set, id) => {
  if (id == null || set.has(String(id))) return false;
  set.add(String(id));
  if (set.size > 256) set.delete(set.values().next().value);
  return true;
};

// Snapshot diffs for friend requests; private messages have their own
// event. History, presence refreshes and our own messages are always silent.
export class SocialNotifications {
  constructor({ userId, reading = () => null, notify, now = () => Date.now() }) {
    Object.assign(this, { userId, reading, notify, now });
    this.messages = new Set(); this.trades = new Set(); this.lastSound = -Infinity;
    this.disposed = false; this.reset();
  }
  reset() { this.initialized=false;this.requests=new Set(); }
  sound(kind) {
    if (this.disposed || this.now() - this.lastSound < 1200) return;
    this.lastSound = this.now();
    this.notify(kind);
  }
  snapshot(state) {
    if(this.disposed||!state)return;
    const requests=ids(state.incoming);
    if(this.initialized&&[...requests].some(id=>!this.requests.has(id)))this.sound('friend');
    this.requests=requests;this.initialized=true;
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
