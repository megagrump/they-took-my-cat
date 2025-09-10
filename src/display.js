export const resX = 1280
export const resY = 800

body.innerHTML = `<style>
*{padding:0;margin:0;box-sizing:border-box;}
body{font:20pt sans-serif;background:#123;color:#fff;}
#r{position:relative;display:flex;align-items:center;justify-content:center;margin:auto;text-shadow:1px 1px 4px #000;max-width:${resX}px;max-height:100vh;aspect-ratio:${resX/resY};}
a{color:#fff;font-size:14pt;}
#p_c{display:none;width:100%;height:100%;}
#p_ui{display:flex;align-items:center;justify-content:center;flex-direction:column;position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}
#p_h{display:flex;align-items:flex-end;position:absolute;gap:4px;top:0;left:0;width:100%;height:100%;pointer-events:none;padding:4px;}
#p_h span{border-radius:100%}
@keyframes f{0%{opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{opacity:0;}}
#p_ui>p{opacity:0;animation:3s linear f;}</style>
<div id="r"><canvas id="p_c" width="${resX}" height="${resY}"></canvas><div id="p_h"></div><div id="p_ui"></div><div id="p_t">THEY TOOK MY CAT<p><a href="https://github.com/megagrump/they-took-my-cat" target="_blank" rel="noopener">https://github.com/megagrump/they-took-my-cat</a><br><br></p><p id="p_l">Loading...</p></div></div>`

const hud = []

export const showText = t => p_ui.innerHTML = `<p>${t}</p>`

export const addToHud = (e, prepend) => {
	e && (prepend ? hud.unshift(e) : hud.push(e))
	p_h.innerHTML = `<div>${hud.join('')}</div>`
}

export const removeFromHud = e => {
	hud.splice(hud.indexOf(e), 1)
	addToHud()
}

export const gl = p_c.getContext('webgl2') || alert("No WebGL2!")
