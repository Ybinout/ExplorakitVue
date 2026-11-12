<template>
 <g data-atlas-terrain clip-path="url(#atlas-bounds)" pointer-events="none" aria-hidden="true" shape-rendering="geometricPrecision">
  <defs>
   <clipPath id="atlas-bounds"><rect :width="width" :height="height"/></clipPath>
   <linearGradient id="atlas-ocean" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#5ba9b7"/><stop offset=".5" stop-color="#337e98"/><stop offset="1" stop-color="#244e70"/></linearGradient>
   <radialGradient id="atlas-open-water"><stop stop-color="#87c5c1" stop-opacity=".27"/><stop offset="1" stop-color="#87c5c1" stop-opacity="0"/></radialGradient>
   <linearGradient id="atlas-mainland" x1="0" y1="0" x2=".6" y2="1"><stop stop-color="#b9cba6"/><stop offset=".5" stop-color="#abc781"/><stop offset="1" stop-color="#c5cc8c"/></linearGradient>
   <linearGradient id="atlas-safari-land" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a9c884"/><stop offset="1" stop-color="#d0ce91"/></linearGradient>
   <linearGradient id="atlas-dark-land"><stop stop-color="#7f9d69"/><stop offset="1" stop-color="#56876a"/></linearGradient>
   <linearGradient id="atlas-highlands" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#7f9773"/><stop offset=".6" stop-color="#b7bd91"/><stop offset="1" stop-color="#bcc994" stop-opacity="0"/></linearGradient>
   <linearGradient id="atlas-forest"><stop stop-color="#739b65"/><stop offset="1" stop-color="#93b573"/></linearGradient>
   <linearGradient id="atlas-lake" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#84cac2"/><stop offset="1" stop-color="#3c8fa8"/></linearGradient>
   <pattern id="atlas-water-grain" width="47" height="39" patternUnits="userSpaceOnUse"><path d="M4 17q5-2 11 0m16 12q4-2 8-1" fill="none" stroke="#d7ece1" stroke-opacity=".14" stroke-width=".7" stroke-linecap="round"/></pattern>
   <pattern id="atlas-canopy" width="19" height="19" patternUnits="userSpaceOnUse"><path d="M2 10C0 5 4 3 7 5C10 1 16 5 14 9C19 12 13 17 9 14C4 17 1 14 2 10Z" fill="#497d55" fill-opacity=".2"/><path d="M4 8q3-3 6-1" fill="none" stroke="#d3dfab" stroke-opacity=".26" stroke-width="1"/></pattern>
   <clipPath id="atlas-mainland-clip"><path :d="coasts.mainland"/></clipPath>
   <clipPath id="atlas-dark-clip"><path :d="coasts.dark"/></clipPath>
   <clipPath id="atlas-dc2-clip"><path :d="extendedDarkCoast"/></clipPath>
   <clipPath id="atlas-safari-clip"><path :d="coasts.safari"/></clipPath>
  </defs>
  <rect :width="width" :height="height" fill="url(#atlas-ocean)"/>
  <ellipse cx="370" cy="316" rx="450" ry="330" fill="url(#atlas-open-water)"/>
  <rect :width="width" :height="height" fill="url(#atlas-water-grain)"/>
  <g data-sea-currents fill="none" stroke="#b7ded7" stroke-width="1" stroke-linecap="round" opacity=".22"><path v-for="(d,i) in currents" :key="i" :d="d"/></g>
  <g data-mainland-scenery>
   <path :d="coasts.mainland" fill="#68afa9" stroke="#68afa9" stroke-width="35" opacity=".45" stroke-linejoin="round"/>
   <path :d="coasts.mainland" fill="#9ecdb7" stroke="#9ecdb7" stroke-width="15" stroke-linejoin="round"/>
   <path data-mainland-coast :d="coasts.mainland" fill="url(#atlas-mainland)" stroke="#e7d9ae" stroke-width="5" stroke-linejoin="round"/>
   <g clip-path="url(#atlas-mainland-clip)">
    <path d="M24 186C51 174 97 195 109 230C118 261 91 280 101 310C109 339 93 373 80 395L33 404L18 208Z" fill="url(#atlas-highlands)" opacity=".8"/>
    <path d="M28 91C47 82 90 78 105 101C121 116 109 135 120 156C122 175 99 189 82 181C63 190 50 174 31 185L16 139Z" fill="#d5e2d4"/>
    <path d="M28 117C45 109 49 90 67 96C87 91 90 112 107 115L116 156C103 142 89 153 79 138C66 145 48 135 38 144Z" fill="#ebefdd"/>
    <path d="M39 178C59 165 74 184 93 172M35 200C57 189 83 198 99 222M35 276C56 259 79 277 91 291M32 345C53 329 79 349 87 367" stroke="#f0e8be" stroke-width="1.2" opacity=".5" fill="none"/>
    <g v-for="(d,i) in forests" :key="i"><path :d="d" fill="url(#atlas-forest)"/><path :d="d" fill="url(#atlas-canopy)"/></g>
    <g v-for="([x,y,scale],i) in ridges" :key="'ridge-'+i" :transform="`translate(${x},${y}) scale(${scale})`">
     <path d="M-21 12C-12 5-11-9-4-13C0-10 2-3 6-1C11-6 15 4 23 12Z" fill="#7e9274"/>
     <path d="M-21 12C-12 5-11-9-4-13L-2-3L-7 0L-9 7Z" fill="#bfc9a7"/>
     <path d="M-4-13L0-7L-3-6L-6-8L-9-4Z" :fill="y<180?'#f2f3e6':'#d8d6b4'"/>
    </g>
    <path d="M185 250C192 271 218 269 217 290S236 316 249 336S264 369 291 385S315 409 318 440" fill="none" stroke="#e0dab3" stroke-width="7"/>
    <path d="M185 250C192 271 218 269 217 290S236 316 249 336S264 369 291 385S315 409 318 440" fill="none" stroke="#6eb7b5" stroke-width="4"/>
    <path d="M170 216C181 208 188 210 199 209C211 205 217 215 229 218C242 218 243 232 236 238C238 249 218 248 209 252C196 257 187 248 176 248C164 244 159 232 166 227C164 222 167 219 170 216Z" fill="url(#atlas-lake)" stroke="#ded6aa" stroke-width="2.5"/>
    <path d="M178 222C194 217 202 224 216 220M177 238C194 245 210 238 225 240" fill="none" stroke="#d2e9d7" stroke-width="1.2" opacity=".65"/>
    <path d="M299 384C305 376 319 381 319 389C331 391 334 402 325 409C319 421 306 416 303 408C290 405 291 393 299 384Z" fill="url(#atlas-lake)" stroke="#d7d2a7" stroke-width="2"/>
   </g>
  </g>
  <g :transform="`translate(${darkOffset},0)`" data-dark-continent-scenery>
   <path :d="coasts.dark" fill="#70b4aa" stroke="#70b4aa" stroke-width="35" opacity=".45"/>
   <path :d="coasts.dark" fill="#a5c8ae" stroke="#a5c8ae" stroke-width="14"/>
   <path data-dark-coast :d="coasts.dark" fill="url(#atlas-dark-land)" stroke="#ddcf9b" stroke-width="5"/>
   <g clip-path="url(#atlas-dark-clip)">
    <path d="M566 146C598 137 615 155 635 144C663 130 684 154 708 147C733 142 753 163 752 187L760 311C745 341 724 343 699 335C667 347 645 331 615 346C592 351 566 327 548 308L544 189Z" fill="url(#atlas-canopy)"/>
    <path d="M635 152C624 178 645 187 639 210S660 244 650 267S672 303 656 348" stroke="#c4c696" stroke-width="5" fill="none" opacity=".45"/>
    <path d="M635 152C624 178 645 187 639 210S660 244 650 267S672 303 656 348" stroke="#70b6b4" stroke-width="2.5" fill="none"/>
    <path d="M604 205C613 197 630 207 629 215C638 223 622 236 613 230C599 232 596 213 604 205ZM679 282C691 272 704 281 700 291C715 303 699 318 688 314C674 318 668 291 679 282Z" fill="url(#atlas-lake)" stroke="#bfc99f" stroke-width="2"/>
    <path d="M694 185L711 155L735 188L723 184L714 174L707 188Z" fill="#486e5c" opacity=".65"/>
   </g>
   <text x="646" y="399" class="island-label">{{ darkLabel || 'Dark Continent' }}</text>
  </g>
  <g v-if="magic" data-magic-island-scenery :transform="`translate(${magic.x},${magic.y})`"><path d="M8 19 17 8 40 12 61 6 95 14 105 32 101 63 87 74 61 69 39 76 11 64 5 43Z" fill="#b2c58c" stroke="#d5c9b0" stroke-width="7"/><path d="m28 24 25 12 32-8M53 36l-5 22" fill="none" stroke="#b19e7b" stroke-width="4"/><path d="m20 20 7-5 7 5v10H20Zm58 2 7-5 7 5v10H78ZM25 51l7-5 7 5v10H25Zm53-2 7-5 7 5v10H78Z" fill="#e0b8a0" stroke="#7a7f71" stroke-width="2"/></g>
  <g v-if="safari" data-safari-scenery :transform="`translate(${safari.x},${safari.y})`">
   <path :d="coasts.safari" fill="#67b4b2" stroke="#67b4b2" stroke-width="30" opacity=".45"/>
   <path :d="coasts.safari" fill="#a5d2bd" stroke="#a5d2bd" stroke-width="13"/>
   <path data-safari-coast :d="coasts.safari" fill="url(#atlas-safari-land)" stroke="#e8d8a5" stroke-width="4"/>
   <g clip-path="url(#atlas-safari-clip)">
    <path d="M21 28C46 17 52 33 76 23C92 17 108 26 119 37C134 43 147 24 160 30C187 30 176 51 193 61C209 73 189 92 176 91C156 110 139 90 120 102C97 106 76 90 55 99C25 105 11 82 24 68C35 49 9 41 21 28Z" fill="url(#atlas-forest)"/>
    <path d="M21 28C46 17 52 33 76 23C92 17 108 26 119 37C134 43 147 24 160 30C187 30 176 51 193 61C209 73 189 92 176 91C156 110 139 90 120 102C97 106 76 90 55 99C25 105 11 82 24 68C35 49 9 41 21 28Z" fill="url(#atlas-canopy)"/>
    <path d="M212 31C221 22 247 31 246 42C258 53 254 68 241 70C230 82 217 69 222 59C208 51 207 43 212 31Z" fill="url(#atlas-lake)" stroke="#ded4a9" stroke-width="2"/>
    <path d="M230 67C231 84 254 92 249 118M91 8C81 35 105 50 99 68S120 87 118 124" stroke="#76b8ad" stroke-width="3" fill="none"/>
   </g>
   <text x="147" y="163" class="island-label">{{ en?'SAFARI ISLAND':'ÎLE SAFARI' }}</text>
  </g>
  <g v-if="dark2" data-true-dark-continent :transform="`translate(${dark2.x},${dark2.y})`">
   <g :transform="`scale(${dark2.width/168},${dark2.height/160})`">
    <path :d="extendedDarkCoast" fill="#579a9c" stroke="#579a9c" stroke-width="7" stroke-linejoin="round" opacity=".5"/>
    <path :d="extendedDarkCoast" fill="url(#atlas-dark-land)" stroke="#cfbd9d" stroke-width="1.6" stroke-linejoin="round"/>
    <g clip-path="url(#atlas-dc2-clip)"><path :d="extendedDarkCoast" fill="url(#atlas-canopy)"/><path :d="dc2Art.water" fill="url(#atlas-lake)" stroke="#adc5a5" stroke-width=".55"/>
     <path d="m93 18 5-9 5 9-5 3Z" fill="#b6ad91" stroke="#594d76" stroke-width=".7"/><path d="m98 9 0 12 5-3Z" fill="#7b7790"/>
    </g>
   </g>
   <text :x="dark2.width/2" :y="dark2.height+25" class="island-label true-continent-label">DARK CONTINENT</text>
  </g>
  <g data-tournament-island>
   <path :d="coasts.tournament" fill="#8dc4b8" stroke="#8dc4b8" stroke-width="15"/>
   <path :d="coasts.tournament" fill="#95b17c" stroke="#e2d6ac" stroke-width="3"/>
  </g>
  <path d="M8 53C13 45 27 48 29 57C37 63 25 73 17 70C6 73 2 62 8 53ZM145 110C153 105 161 113 158 120C148 126 139 119 145 110Z" fill="#a9c28c" stroke="#c8d8b5" stroke-width="3"/>
 </g>
</template>
<script>
import dc2Art from '@/data/dark2Atlas';
const extendedDarkCoast='M9 -300H500V500H11L11 157'+dc2Art.coast.split('L11 157')[1];
import {atlasCoasts,mainlandForests,mainlandRidges,seaCurrents} from '@/services/regionMapTerrain';
export default{
 name:'RegionMapTerrain',props:{width:Number,height:Number,darkOffset:{type:Number,default:0},magic:Object,safari:Object,dark2:Object,darkLabel:String,en:Boolean},
 data:()=>({dc2Art,extendedDarkCoast,coasts:atlasCoasts,forests:mainlandForests,ridges:mainlandRidges,currents:seaCurrents})
};
</script>
<style scoped>
.island-label{font:600 10px var(--journal-font);text-anchor:middle;letter-spacing:2px;fill:#d8e8da;paint-order:stroke;stroke:#275a70;stroke-width:2px;stroke-linejoin:round}
.true-continent-label{font-size:14px;letter-spacing:4px}
</style>
