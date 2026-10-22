<template>
  <aside v-if="!installation.installed" class="install-card" data-pwa-install>
    <div class="install-row"><span class="install-icon" aria-hidden="true">✧</span><div><strong>Ton aventure, à portée de main.</strong><p>Installe le jeu pour l’ouvrir sans la barre d’adresse.</p></div><button :disabled="busy" :aria-expanded="help ? 'true' : 'false'" aria-controls="install-help" @click="install">{{ busy ? 'Installation…' : 'Installer le jeu' }} <span aria-hidden="true">↗</span></button></div>
    <div v-if="help" id="install-help" class="install-help" role="status"><p v-if="ios"><strong>Sur iPhone ou iPad :</strong> ouvre ce site dans Safari, touche Partager puis « Sur l’écran d’accueil ». Active « Ouvrir comme app web » si cette option est proposée.</p><p v-else><strong>Dans le menu de ton navigateur :</strong> choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ». Si l’option manque, ouvre ce site dans Chrome ou Safari.</p><p>Lance ensuite <strong>RiftMon depuis son icône</strong>. Une connexion internet reste nécessaire pour jouer.</p></div>
  </aside>
</template>
<script>
import { installation } from '@/services/pwa';
export default {
  name:'PwaInstall',
  data(){ return { installation,help:false,busy:false,ios:/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) }; },
  methods:{ async install(){
    const prompt=this.installation.prompt;
    if(!prompt){this.help=!this.help;return;}
    this.busy=true;
    try { await prompt.prompt(); const result=await prompt.userChoice;this.help=result.outcome!=='accepted'; }
    catch(e){this.help=true;}
    finally {this.installation.prompt=null;this.busy=false;}
  } }
};
</script>
<style scoped>
.install-card{margin:25px 0;border:1px solid var(--journal-border);border-radius:12px;background:var(--journal-soft);padding:18px 22px;color:var(--journal-ink);text-align:left}.install-row{display:flex;align-items:center;gap:16px}.install-icon{font-size:32px;color:var(--journal-accent)}.install-row>div{flex:1}.install-row strong{font-size:13px}.install-row p,.install-help{font-size:12px;color:var(--journal-muted);line-height:1.7;margin:5px 0 0}.install-row button{display:flex;gap:18px;align-items:center;justify-content:center;min-height:44px;padding:10px 16px;border:1px solid var(--journal-accent);border-radius:8px;background:var(--journal-card);color:var(--journal-accent);font:700 12px Arial;cursor:pointer}.install-row button:focus-visible{outline:3px solid var(--journal-accent);outline-offset:3px}.install-help{padding-top:12px;border-top:1px solid var(--journal-border);margin-top:16px}.install-help p{margin:8px 0}@media(max-width:600px){.install-row{flex-wrap:wrap;gap:10px}.install-row button{width:100%}.install-card{padding:16px}.install-icon{font-size:26px}}
</style>
