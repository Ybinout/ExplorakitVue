<template>
  <g>
    <g v-if="kind==='clara_registry'">
      <path d="M12 5h25v38H12a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5Z" fill="var(--item-main)"/>
      <path d="M13 5v38m21-8 6-2v10l-3-2-3 2Z" fill="var(--item-accent)"/>
      <path d="m18 23 7-7 7 7m-12-2v9h10v-9m-7 9v-5h4v5"/>
    </g>
    <g v-else-if="kind==='clara_reunion_letter'">
      <rect x="5" y="10" width="38" height="28" rx="3" fill="var(--item-main)"/>
      <path d="m6 12 18 14 18-14M6 37l12-13m24 13L30 24"/>
      <circle cx="24" cy="26" r="5" fill="var(--item-accent)"/><path d="m22 26 2 2 3-3" stroke="var(--item-light)"/>
    </g>
    <g v-else-if="kind.endsWith('_key')">
      <path d="m22 22 18 18-4 4-5-5-4 1-3-3 1-4-7-7Z" fill="var(--item-main)"/>
      <path v-if="kind==='professor_lab_key'" d="m13 4 12 6v13l-12 6L2 23V10Z" fill="var(--item-accent)"/>
      <path v-else-if="kind==='gwenn_house_key'" d="M13 4C-1 4 0 24 13 28 26 24 27 4 13 4Z" fill="var(--item-accent)"/>
      <circle v-else cx="14" cy="15" r="12" fill="var(--item-accent)"/>
      <circle cx="13" cy="15" r="5" fill="var(--item-light)"/>
    </g>
    <g v-else-if="kind==='fly_module'">
      <rect x="14" y="6" width="23" height="36" rx="5" fill="var(--item-main)"/>
      <rect x="20" y="11" width="12" height="10" rx="2" fill="var(--item-light)"/>
      <path d="m5 16 14 5 9 5-7 7-5-4-8-3 5-1-6-5 7 2Z" fill="var(--item-accent)"/>
      <path d="M23 37h6m-3-9v4"/>
    </g>
    <g v-else-if="kind==='void_teleporter'">
      <path d="m9 33-4 9h38l-4-9" fill="var(--item-main)"/>
      <circle cx="24" cy="21" r="17" fill="var(--item-main)"/>
      <circle cx="24" cy="21" r="11" fill="var(--item-light)"/>
      <path d="M29 15c-9-5-16 8-6 10 7 1 4-7 1-5" stroke="var(--item-main)" stroke-width="3"/>
      <path d="M21 4h6v6h-6ZM7 19h6v5H7Zm28 0h6v5h-6Z" fill="var(--item-accent)"/>
      <path d="M15 39h5m4 0h3m4 0h2"/>
    </g>
    <g v-else-if="kind==='super_tournament_pass'">
      <rect x="5" y="8" width="38" height="32" rx="4" fill="var(--item-main)"/>
      <path d="M5 14h38v6H5Z" fill="var(--item-accent)"/>
      <path d="m17 23 2 4 5-3 5 3 2-4-2 11H19Z" fill="var(--item-light)"/>
      <path d="M10 34h3m22 0h3"/>
    </g>
    <g v-else-if="kind==='leftovers'">
      <path d="M23 13C8 6 3 20 10 34q6 11 14 5c9 6 18-7 16-18-4 2-7 0-8-4-4 2-7 0-6-4Z" fill="var(--item-main)"/>
      <path d="M23 15q-1-8 5-11m-4 8q9 1 11-7-9-3-11 7Z" fill="var(--item-accent)"/>
      <path d="M14 22q-3 7 2 10" stroke="var(--item-light)" stroke-width="3"/>
    </g>
    <g v-else-if="kind==='life_orb'">
      <circle cx="24" cy="24" r="17" fill="var(--item-main)"/>
      <path d="m24 12 9 12-9 12-9-12Z" fill="var(--item-accent)"/>
      <path d="m13 17 3-4m19 17-3 4" stroke="var(--item-light)" stroke-width="3"/>
    </g>
    <g v-else-if="kind==='choice_specs'">
      <path d="m4 25 4-14h6m30 14-4-14h-6"/>
      <path d="M3 24q0-4 4-4h11q4 0 4 4v7q0 5-6 5H9q-6 0-6-5Zm23 0q0-4 4-4h11q4 0 4 4v7q0 5-6 5h-7q-6 0-6-5Z" fill="var(--item-main)"/>
      <path d="M8 25h9v6H8Zm23 0h9v6h-9Z" fill="var(--item-accent)"/>
      <path d="M22 25q2-3 4 0m-16 0-2 5m27-5-2 5"/>
    </g>
    <g v-else-if="kind==='choice_scarf'">
      <path d="m17 10 16-4 8 12-14 9L8 16Zm10 17 8 14-10-2-5-12-4 16-7-5 8-17" fill="var(--item-main)"/>
      <path d="m11 16 12 6 15-6" stroke="var(--item-accent)" stroke-width="4"/>
      <path d="m20 23 3 4m4-6 1 5"/>
    </g>
    <g v-else-if="kind==='choice_band'">
      <path d="M6 16q18-10 36 0v11q-18 9-36 0Zm30 11 7 13-10-2-4-10m7-1-1 16-8-6 2-9" fill="var(--item-main)"/>
      <path d="M10 20q14-6 28 0" stroke="var(--item-accent)" stroke-width="3"/>
      <circle cx="32" cy="26" r="4" fill="var(--item-accent)"/>
    </g>
    <g v-else-if="kind==='focus_sash' || kind==='expert_belt'">
      <path d="M5 13q19 7 38 0v12q-19 7-38 0Zm19 15 9 13 7-6-12-12m-6 4-6 16-8-5 11-15" fill="var(--item-main)"/>
      <path v-if="kind==='expert_belt'" d="M18 15h13v14H18Zm4 4h5v6h-5Z" fill="var(--item-accent)"/>
      <path v-else d="m19 18 9 3-2 9-8-4Zm-6 17 5 3m11-6 5 5" fill="var(--item-accent)"/>
    </g>
    <g v-else-if="kind==='assault_vest'">
      <path d="m16 5-9 5v13l5 1-2 18h28l-2-18 5-1V10l-9-5-8 8Z" fill="var(--item-main)"/>
      <path d="M24 13v29M13 23h8v10h-9Zm14 0h8l1 10h-9Z" fill="var(--item-accent)"/>
      <path d="m16 5 3 11m13-11-3 11m-14 10h4m10 0h4"/>
    </g>
    <g v-else-if="kind==='eviolite'">
      <path d="m24 5 15 11-3 20-12 8-14-9-2-18Z" fill="var(--item-main)"/>
      <path d="m24 11 9 10-9 15-10-13Z" fill="var(--item-accent)"/>
      <path d="m8 17 6 6m22 13-12 0-14-1m25-19-6 5"/>
    </g>
    <g v-else-if="kind==='everstone'">
      <path d="M7 29 10 17q2-5 8-7l11-2q5 0 8 6l5 16q1 5-5 9l-15 3-13-4q-5-2-2-9Z" fill="var(--item-main)"/>
      <path d="m13 23 5-7 10-2m-15 18 6 3 13-2" stroke="var(--item-accent)" stroke-width="3"/>
    </g>
    <g v-else-if="kind==='shell_bell'">
      <path d="M21 9V5h6v4M8 34q6-6 6-15a10 10 0 0 1 20 0q0 9 6 15Z" fill="var(--item-main)"/>
      <path d="M9 34h30v5H9Zm10 5a5 5 0 0 0 10 0" fill="var(--item-accent)"/>
      <path d="M29 20c-1-8-12-4-10 2 2 5 9 1 5-2"/>
    </g>
    <g v-else-if="kind==='rocky_helmet'">
      <path d="M7 30c0-25 34-25 34 0v8H7Z" fill="var(--item-main)"/>
      <path d="m9 18-5-7 11 2m7-4 2-7 6 8m7 7 7-6-2 15M7 31h34v7H7Z" fill="var(--item-accent)"/>
      <path d="M13 35h3m7 0h3m7 0h3"/>
    </g>
    <g v-else-if="kind==='rift_talisman'">
      <path d="M12 5q0 15 12 17Q36 20 36 5"/>
      <path d="m24 17 13 9-4 13-9 6-9-6-4-13Z" fill="var(--item-main)"/>
      <path d="m24 22 7 8-7 10-7-10Z" fill="var(--item-accent)"/>
      <path d="m24 25 2 5-2 6-2-6Z" fill="var(--item-light)"/>
    </g>
    <g v-else-if="kind==='exp_share'">
      <path d="M10 27V21a14 14 0 0 1 28 0v6" stroke-width="5"/>
      <rect x="5" y="22" width="9" height="17" rx="3" fill="var(--item-main)"/>
      <rect x="34" y="22" width="9" height="17" rx="3" fill="var(--item-main)"/>
      <rect x="15" y="12" width="18" height="19" rx="3" fill="var(--item-main)"/>
      <path d="M19 17h10v7H19Z" fill="var(--item-accent)"/>
      <path d="M23 27h2m-11 7h20"/>
    </g>
  </g>
</template>
<script>
export default {name:'BagEquipmentIcon',props:{kind:{type:String,required:true}}};
</script>
