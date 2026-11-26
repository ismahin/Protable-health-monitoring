import { leafletCss, leafletJs } from "./leafletBundle";
export function mapHtml(lat: number, lon: number, tileUrl: string) {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  )
    throw new Error("Invalid map coordinates");
  if (!tileUrl.startsWith("https://"))
    throw new Error("Map tiles require HTTPS");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>${leafletCss}</style><style>html,body,#map{margin:0;width:100%;height:100%;background:#e9eee6}.leaflet-control-attribution{font:10px sans-serif!important}.leaflet-bar{border:0!important;border-radius:10px!important;overflow:hidden}#notice{position:absolute;z-index:999;top:12px;left:50%;transform:translateX(-50%);background:white;border-radius:8px;padding:10px;font:12px sans-serif;display:none}</style></head><body><div id="map"></div><div id="notice">Map tiles unavailable. Coordinates are still available in the app.</div><script>${leafletJs.replace(/<\/script/gi, "<\\/script")}\n</script><script>
  const map=L.map('map',{zoomControl:true,scrollWheelZoom:false}).setView([${lat},${lon}],16);
  const tiles=L.tileLayer(${JSON.stringify(tileUrl).replace(/</g, "\\u003c")},{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'}).addTo(map);
  tiles.on('tileerror',()=>document.getElementById('notice').style.display='block');tiles.on('tileload',()=>document.getElementById('notice').style.display='none');
  const marker=L.circleMarker([${lat},${lon}],{radius:9,color:'#fff',weight:4,fillColor:'#147d65',fillOpacity:1}).addTo(map).bindTooltip('Monitor GPS · approximate position');
  window.updatePosition=(p)=>{if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon))return;marker.setLatLng([p.lat,p.lon]);};
  window.addEventListener('message',e=>{try{const p=typeof e.data==='string'?JSON.parse(e.data):e.data;if(p.type==='position')window.updatePosition(p);}catch{}});
  window.recenter=()=>map.setView(marker.getLatLng(),16);
  setTimeout(()=>map.invalidateSize(),100);
  </script></body></html>`;
}
