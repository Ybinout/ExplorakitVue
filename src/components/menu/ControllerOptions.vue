<template>
  <fieldset class="controller-options" data-controller-options>
    <legend>{{ english ? 'Controller' : 'Manette' }}</legend>
    <p class="controller-status" role="status" data-controller-status>{{ statusLabel }}</p>
    <label><span>{{ english ? 'Enable controller' : 'Activer les commandes manette' }}</span><input type="checkbox" :checked="preferences.controllerEnabled !== false" @change="update('controllerEnabled', $event.target.checked)"></label>
    <label><span>{{ english ? 'Button layout' : 'Disposition des boutons' }}</span><select :value="preferences.controllerLayout || 'standard'" data-controller-layout @change="update('controllerLayout', $event.target.value)"><option value="standard">Xbox · A / B</option><option value="nintendo">Nintendo · A / B inversés</option></select></label>
    <dl><dt>✚ / Stick</dt><dd>{{ english ? 'Move / navigate' : 'Se déplacer / naviguer' }}</dd><dt>A / B</dt><dd>{{ english ? 'Confirm / back' : 'Agir / retour' }}</dd><dt>X / Y</dt><dd>{{ english ? 'Team / bag' : 'Équipe / sac' }}</dd><dt>Start</dt><dd>Menu</dd><dt>L1 / R1</dt><dd>{{ english ? 'Previous / next tab' : 'Onglet précédent / suivant' }}</dd></dl>
    <p>{{ english ? 'Press a controller button to let Chrome detect it. On AYN Thor, use the Xbox controller profile. Touch controls stay available.' : 'Appuie sur un bouton pour que Chrome détecte la manette. Sur AYN Thor, utilise le profil de commandes Xbox. Les commandes tactiles restent disponibles.' }}</p>
    <p v-if="status.connected && status.mapping !== 'standard'" class="controller-hint">{{ english ? 'This controller has no standard browser mapping. If the buttons do not match, select the Xbox profile in the console settings.' : 'Cette manette ne fournit pas de disposition standard à Chrome. Si les boutons ne correspondent pas, sélectionne le profil Xbox dans les réglages de la console.' }}</p>
  </fieldset>
</template>
<script>
import { GAMEPAD_STATUS_EVENT } from '@/services/gamepad';
export default {
  props: { preferences: { type: Object, required: true } },
  data: () => ({ status: { supported: true, connected: false, id: '', mapping: '' } }),
  computed: {
    english() { return this.preferences.language === 'en'; },
    statusLabel() {
      if (!this.status.supported) return this.english ? 'Gamepads unavailable in this browser.' : 'Manettes indisponibles dans ce navigateur.';
      if (this.preferences.controllerEnabled === false) return this.english ? 'Controller disabled' : 'Commandes manette désactivées';
      return this.status.connected ? `${this.english ? 'Connected' : 'Connectée'} · ${this.status.id}` : (this.english ? 'Waiting for a controller…' : 'En attente d’une manette…');
    }
  },
  mounted() {
    window.addEventListener(GAMEPAD_STATUS_EVENT, this.onStatus);
    try {
      const p = [...(navigator.getGamepads?.() || [])].find(p => p?.connected);
      this.status = { supported: typeof navigator.getGamepads === 'function', connected: !!p, id: p?.id || '', mapping: p?.mapping || '' };
    } catch (_) { this.status.supported = false; }
  },
  beforeDestroy() { window.removeEventListener(GAMEPAD_STATUS_EVENT, this.onStatus); },
  methods: {
    onStatus(event) { this.status = event.detail; },
    update(key, value) { this.$emit('update', { ...this.preferences, [key]: value }); }
  }
};
</script>
<style scoped>
.controller-options{margin:0;padding:16px;border:1px solid var(--journal-border);border-radius:12px;min-width:0;background:var(--journal-card)}
legend{padding:0 6px;font-weight:800;color:var(--journal-ink)}
p{font-size:12px;line-height:1.6;color:var(--journal-muted);overflow-wrap:anywhere;margin:8px 0}
.controller-status{color:var(--journal-ink);font-weight:700}
label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0;font-size:13px;flex-wrap:wrap}
select{max-width:100%;padding:8px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-paper);color:var(--journal-ink)}
dl{display:grid;grid-template-columns:auto 1fr;gap:7px 16px;font-size:12px;line-height:1.5}dt{font-weight:800}dd{margin:0}
.controller-hint{color:var(--journal-ink)}
</style>
