<template>
  <dialog v-back="{active:visible,close:dismiss}" ref="dialog" class="patch-notes" data-patch-notes role="dialog" aria-modal="true" aria-labelledby="patch-title" aria-describedby="patch-summary" @cancel.prevent="dismiss" @keydown.stop="onKeydown" @click.stop>
    <template v-if="patch">
      <header><journal-icon name="progress" /><span>{{ english ? 'LATEST UPDATE' : 'DERNIÈRE MISE À JOUR' }}</span><time :datetime="patch.date">{{ date }}</time></header>
      <div class="patch-content">
        <h2 id="patch-title">{{ copy.title }}</h2>
        <ul id="patch-summary"><li v-for="item in copy.items" :key="item">{{ item }}</li></ul>
      </div>
      <p v-if="error" class="patch-error" role="alert">{{ error }}</p>
      <footer>
        <button v-if="error" type="button" :disabled="busy" @click="continueWithoutSaving">{{ english ? 'Continue' : 'Continuer' }}</button>
        <button type="button" data-patch-dismiss data-gamepad-back autofocus :disabled="busy" @click="dismiss">{{ busy ? (english ? 'Saving…' : 'Un instant…') : error ? (english ? 'Retry' : 'Réessayer') : (english ? 'Got it' : 'Compris') }} <span aria-hidden="true">→</span></button>
      </footer>
    </template>
  </dialog>
</template>
<script>
import api from '@/services/api';
import { getSession, SESSION_CHANGE_EVENT } from '@/services/session';
import { loadGamePreferences } from '@/services/gamePreferences';
import JournalIcon from './JournalIcon.vue';

export default {
  components: { JournalIcon },
  props: { allowed: Boolean, check: Number },
  data: () => ({ patch: null, token: null, loaded: false, busy: false, error: '', preferences: loadGamePreferences() }),
  computed: {
    english() { return this.preferences.language === 'en'; },
    copy() { return this.patch?.[this.english ? 'en' : 'fr'] || this.patch?.fr || {}; },
    date() { return this.patch ? new Date(this.patch.date + 'T12:00:00Z').toLocaleDateString(this.english ? 'en-GB' : 'fr-FR', { day:'numeric', month:'long' }) : ''; },
    visible() { return Boolean(this.allowed && this.patch && this.token); }
  },
  watch: {
    check() { if (!this.busy) { this.loaded = false; this.syncSession(); } },
    visible() { this.$nextTick(this.syncDialog); },
    '$route'() { this.syncSession(); }
  },
  mounted() {
    this._generation = 0;
    window.addEventListener(SESSION_CHANGE_EVENT, this.syncSession);
    window.addEventListener('storage', this.syncSession);
    window.addEventListener('online', this.syncSession);
    window.addEventListener('focus', this.syncSession);
    window.addEventListener('riftmon:preferences', this.updatePreferences);
    this.syncSession();
  },
  beforeDestroy() {
    ++this._generation;
    this.$refs.dialog.close();
    this.$emit('visibility', false);
    window.removeEventListener(SESSION_CHANGE_EVENT, this.syncSession);
    window.removeEventListener('storage', this.syncSession);
    window.removeEventListener('online', this.syncSession);
    window.removeEventListener('focus', this.syncSession);
    window.removeEventListener('riftmon:preferences', this.updatePreferences);
  },
  methods: {
    onKeydown(event) {
      if (event.key !== 'Tab') return;
      const buttons = [...this.$refs.dialog.querySelectorAll('button:not(:disabled)')];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    },
    updatePreferences() { this.preferences = loadGamePreferences(); },
    syncDialog() {
      const dialog = this.$refs.dialog;
      if (this.visible && !dialog.open) dialog.showModal();
      else if (!this.visible && dialog.open) dialog.close();
      this.$emit('visibility', this.visible);
    },
    async syncSession() {
      const session = getSession(), token = session?.id && session?.token || null;
      if (token !== this.token) {
        ++this._generation;
        this.token = token; this.patch = null; this.loaded = false; this.busy = false; this.error = '';
        this._nextAttempt = 0; this._loading = false;
      }
      if (!token || this.loaded || this._loading || Date.now() < this._nextAttempt) return;
      const generation = this._generation;
      this._loading = true;
      try {
        const { data } = await api.get('/patch-notes');
        if (generation !== this._generation) return;
        this.patch = data.patch || null; this.loaded = true;
      } catch (_) {
        // A failed announcement request must never block login or gameplay.
        if (generation === this._generation) this._nextAttempt = Date.now() + 15000;
      } finally { if (generation === this._generation) this._loading = false; }
    },
    async dismiss() {
      if (this.busy || !this.patch) return;
      if (getSession()?.token !== this.token) { this.syncSession(); return; }
      // Invalidate any unread GET already in flight before saving the receipt.
      // Its earlier snapshot must not reopen the popup after acknowledgement.
      const generation = ++this._generation;
      this._loading = false; this.loaded = true;
      this.busy = true; this.error = '';
      try {
        await api.post('/patch-notes/seen', { version: this.patch.version });
        if (generation === this._generation) this.patch = null;
      } catch (error) {
        if (generation !== this._generation) return;
        if (error.response?.status === 409) {
          this.patch = null; this.loaded = false; this.syncSession();
        } else {
          this.error = this.english ? 'Could not save. You can continue; this update will appear again next time.' : 'Lecture non sauvegardée. Tu peux continuer : l’annonce réapparaîtra à la prochaine connexion.';
        }
      } finally { if (generation === this._generation) this.busy = false; }
    },
    continueWithoutSaving() { ++this._generation; this._loading = false; this.loaded = true; this.patch = null; }
  }
};
</script>
<style scoped>
.patch-notes{position:fixed;z-index:8000;inset:0;margin:auto;width:min(440px,calc(100% - 28px));max-width:none;max-height:calc(100% - 28px);max-height:calc(100dvh - 28px);padding:0;overflow:auto;border:2px solid var(--journal-border,#bfd4e3);border-radius:15px;background:var(--journal-paper,#edf5fc);color:var(--journal-ink,#294453);box-shadow:0 20px 70px #07182566;font:14px/1.6 var(--journal-font,Arial,sans-serif);text-align:left;color-scheme:var(--journal-scheme,light);overscroll-behavior:contain}
.patch-notes::backdrop{background:#071522b3}
header{display:flex;align-items:center;gap:9px;padding:15px 20px;background:var(--journal-soft,#e0eef8);border-bottom:1px solid var(--journal-border,#bfd4e3);font-size:10px;letter-spacing:.08em;font-weight:700;color:var(--journal-muted,#57738a)}
header svg{width:21px;height:21px;color:var(--journal-accent,#397da4);flex:none}header time{margin-left:auto;white-space:nowrap;font-weight:400;letter-spacing:0}
.patch-content{padding:22px 24px 12px}h2{font-size:23px;line-height:1.25;margin:0 0 17px;color:var(--journal-heading,#254760)}ul{margin:0;padding-left:18px}li{margin:9px 0;padding-left:3px}li::marker{color:var(--journal-accent,#397da4)}
footer{display:flex;justify-content:flex-end;gap:10px;padding:12px 22px 20px}button{display:flex;align-items:center;justify-content:center;gap:28px;min-height:44px;min-width:120px;padding:10px 18px;border:1px solid var(--journal-border,#bfd4e3);border-radius:9px;background:var(--journal-card,#f4f9ff);color:var(--journal-ink,#294453);font:600 14px var(--journal-font,Arial,sans-serif);cursor:pointer}button:last-child{background:var(--journal-accent,#397da4);border-color:var(--journal-accent,#397da4);color:var(--journal-on-accent,#fff)}button:disabled{opacity:.6;cursor:wait}button:focus-visible{outline:3px solid var(--journal-heading,#254760);outline-offset:3px}.patch-error{padding:0 24px;margin:0;font-size:12px;color:var(--journal-danger,#a13b52)}
@media(max-width:360px){header{padding:13px 16px;gap:6px;font-size:9px;letter-spacing:.03em}.patch-content{padding:18px 18px 8px}h2{font-size:21px}footer{padding:12px 18px 18px}button{min-width:100px;gap:16px}}
</style>
