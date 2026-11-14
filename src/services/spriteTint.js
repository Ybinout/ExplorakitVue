const FILTERS=Object.freeze({
 up:'grayscale(1) sepia(1) saturate(3.5) hue-rotate(160deg) brightness(1.13)',
 down:'grayscale(1) sepia(1) saturate(4.5) hue-rotate(315deg) brightness(1.06)',
 poison:'grayscale(1) sepia(1) saturate(3.5) hue-rotate(215deg) brightness(1.1)',
 burn:'grayscale(1) sepia(1) saturate(4) hue-rotate(330deg) brightness(1.14)',
 paralysis:'grayscale(1) sepia(1) saturate(3.5) hue-rotate(5deg) brightness(1.2)',
 freeze:'grayscale(1) sepia(1) saturate(2.5) hue-rotate(145deg) brightness(1.23)',
 confusion:'grayscale(1) sepia(1) saturate(3.5) hue-rotate(265deg) brightness(1.15)'
});
export function spriteTint(status,changes=[],reduced=false,shadow='') {
 if(reduced)return {};
 const stat=changes.find(e=>e.kind==='up'||e.kind==='down'),filter=FILTERS[status?.status]||FILTERS[stat?.kind];
 return filter?{filter:[shadow,filter].filter(Boolean).join(' ')}:{};
}
