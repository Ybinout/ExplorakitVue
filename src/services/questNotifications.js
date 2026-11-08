// Reconnect/history snapshots are silent, just like private-message history.
// Unread state is authoritative and durable on the server; this only deduplicates sound.
export class QuestNotifications {
  constructor(){this.known=null;}
  snapshot(journal){
    if(!journal||journal.version!==1)return [];
    const entries=journal.entries||[],fresh=this.known?entries.filter(q=>q.status==='active'&&q.unread&&!this.known.has(q.key)):[];
    this.known ||= new Set();for(const q of entries)this.known.add(q.key);return fresh;
  }
}
