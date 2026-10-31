<template>
  <div v-if="pokemon && !pokemon.storyActor" class="battle-traits" data-battle-traits>
    <div class="battle-type-list" aria-label="Types">
      <span v-for="type in types" :key="type" class="battle-type" :data-battle-type="type" :style="typeStyle(type)">{{ typeName(type) }}</span>
    </div>
    <span v-if="ability" class="battle-status-ability" data-battle-ability :class="{'ability-suppressed':pokemon.__battle?.abilitySuppressed}" :title="abilityLabel" :aria-label="abilityLabel">
      <span class="battle-ability-caption">{{ language==='en'?'Ability':'Talent' }} : </span>{{ ability }}
    </span>
  </div>
</template>
<script>
import { localizeTypeName, typeBadgeStyle } from '@/services/pokemonTypes';
import { localizeAbilityName } from '@/services/i18n';

export default {
  props: { pokemon:Object, language:{type:String,default:'fr'} },
  computed: {
    types() {
      const p=this.pokemon, state=p?.__battle;
      const active=state?.tempTypes?.length ? state.tempTypes : state?.formTypes?.length ? state.formTypes : [p?.type1,p?.type2].filter(Boolean);
      return [...new Set((active.length ? active : p?.data?.type || []).filter(type=>typeof type==='string'&&type))];
    },
    ability() { return localizeAbilityName(this.pokemon?.passiveAbility,this.language) || ''; },
    abilityLabel() {
      const suppressed=this.pokemon?.__battle?.abilitySuppressed;
      return `${this.language==='en'?'Ability':'Talent'} : ${this.ability}${suppressed ? (this.language==='en'?' (suppressed)':' (neutralisé)') : ''}`;
    }
  },
  methods: {
    typeStyle:typeBadgeStyle,
    typeName(type) {
      if(type==='???')return this.language==='en'?'Typeless':'Sans type';
      return this.language==='en'?type:localizeTypeName(type);
    }
  }
};
</script>
<style scoped>
.battle-traits{display:flex;align-items:center;gap:4px 6px;min-height:16px;min-width:0;margin:-2px 0 5px;font-family:Arial,sans-serif}
.battle-type-list{display:flex;gap:3px;flex-wrap:wrap;flex-shrink:0;max-width:65%}
.battle-type{display:inline-block;padding:0 4px;border:1px solid #0002;border-radius:4px;background:var(--pokemon-type-color);color:var(--pokemon-type-ink);font:700 9px/14px Arial,sans-serif;white-space:nowrap}
.battle-status-ability{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;color:var(--journal-muted,#526873);font:600 10px/16px Arial,sans-serif}
.battle-ability-caption{font-weight:400}
.ability-suppressed{text-decoration:line-through;text-decoration-thickness:1px}
@media(max-width:920px){.battle-ability-caption{display:none}.battle-status-ability{font-size:9px}.battle-type{font-size:8px;line-height:13px;padding-inline:3px}.battle-traits{gap:4px;margin-bottom:4px}}
</style>
