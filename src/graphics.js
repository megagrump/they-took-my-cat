import {
	sampleArray,
	identity,
} from './helper.js'

export const rect = (x, y, w, h, f = '', add = '') =>
	`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${add} />`

export const rrect = (x, y, w, h, rx, ry, f = '', add = '') =>
	`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${add} rx="${rx}" ry="${ry}" />`

export const line = (x1, y1, x2, y2, c, w = 1, cap = 'square') =>
	`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}" />`

export const text = (text, x, y, cls, f, add = '') =>
	`<text x="${x}" y="${y}" class="${cls}" fill="${f}" ${add}>${text}</text>`

export const ellipse = (x, y, rx, ry, f = '') =>
	`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" />`

export const group = (id, body, f = '', add = '') =>
	`<g id="_${id}" fill="${f}" ${add}>${body}</g>`

export const noise = (baseFrequency, str = 1) =>
`<filter id="n">
<feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="2" stitchTiles="stitch" result="n"/>
<feColorMatrix type="matrix" values="${str} 0 0 0 0 ${str} 0 0 0 0 ${str} 0 0 0 0 0 0 0 0 1" in="n"/>
<feComposite operator="in" in2="SourceGraphic" result="m"/>
<feBlend in="SourceGraphic" in2="m" mode="multiply"/>
</filter>`

export const gradient = (colorA, colorB, a = 90) =>
`<linearGradient id="g" gradientTransform="rotate(${a})">
<stop stop-color="${colorA}" offset="0%" />
<stop stop-color="${colorB}" offset="100%" />
</linearGradient>`

export const depthFilter = [1, .5, .4].reduce((a, d, i) => a +
`<filter id="d${i}">
<feColorMatrix in="SourceAlpha" result="blur" type="matrix" values="-1 0 0 0 ${d} 0 -1 0 0 ${d} 0 0 -1 0 ${d} 0 0 0 1 0" />
<feGaussianBlur in="blur" result="blur" stdDeviation="15" />
<feComposite operator="atop" in="blur" in2="SourceAlpha" />
</filter>`, ''
)

export const svg = (w, h, body) =>
`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
<style>
.s {font:bold 40vh serif;text-anchor:middle;dominant-baseline:middle;line-height:1;text-shadow: 0px 0px 1px #888; }
.e {font:bold 60vh serif;text-anchor:middle;dominant-baseline:middle;line-height:1;text-shadow: 0px 0px 3px #000; }
</style>
${body}
</svg>`

const load = src => new Promise(resolve => {
	const svg = new Image()
	svg.onload = () => resolve(svg)
	svg.src = `data:image/svg+xml;utf8,${encodeURIComponent(src)}`
})

export const render = async (src, filter = identity, scale = 1) => {
	const svg = await load(src)
	const ctx = new OffscreenCanvas(svg.width, svg.height).getContext('2d')
	const w = Math.round(svg.width * scale)
	const h = Math.round(svg.height * scale)
	ctx.drawImage(svg, 0, 0, svg.width, svg.height, 0, 0, w, h)
	return filter(ctx.getImageData(0, 0, w, h))
}

export const ANIMATION_ROTATE = 0
export const ANIMATION_EASE = 1
export const ANIMATION_TRANSLATE = 2
export const ANIMATION_PHASE = 3
export const ANIMATION_POS = 4

export const animate = (src, anim, numFrames, filter, scale) => {
	const svg = new DOMParser().parseFromString(src, 'image/svg+xml')

	return new Array(numFrames).fill(0).map((_, frame) => {
		const time = frame / numFrames

		for(const key in anim) {
			const el = svg.getElementById('_' + key)
			const transforms = []
			const part = anim[key]
			const phase = (time + part[ANIMATION_PHASE]) % 1
			if(part[ANIMATION_TRANSLATE]) {
				const x = sampleArray(part[ANIMATION_TRANSLATE][0], phase, part[ANIMATION_EASE])
				const y = sampleArray(part[ANIMATION_TRANSLATE][1], phase, part[ANIMATION_EASE])
				transforms.push(`translate(${x} ${y})`)
			}

			if(part[ANIMATION_ROTATE]) {
				const [ x, y ] = part[ANIMATION_POS]
				const angle = sampleArray(part[ANIMATION_ROTATE], phase, part[ANIMATION_EASE])
				transforms.push(`rotate(${angle} ${x} ${y})`)
			}

			el.setAttribute('transform', transforms.join(' '))
		}

		return render((new XMLSerializer()).serializeToString(svg), filter, scale)
	})
}

export const clip = (src, x1, y1, x2, y2) => {
	const w = (x2 - x1) + 1
	const h = (y2 - y1) + 1
	const res = new Uint32Array(w * h)
	const s32 = new Uint32Array(src.data.buffer)
	for(let y = y1; y <= y2; ++y) {
		const sy = y * src.width + x1
		res.set(s32.subarray(sy, sy + w), (y - y1) * w)
	}

	return new ImageData(new Uint8ClampedArray(res.buffer), w, h)
}

export const sobel = (src, strength, specExp) => {
	const res = new Uint8ClampedArray(src.data.length)
	const s32 = new Uint32Array(src.data.buffer)
	const w = src.width, h = src.height

	strength /= 255

	let p = 0
	for(let y0 = 0; y0 < w * h; y0 += w) {
		const y1 = Math.max(y0 - w, 0)
		const y2 = Math.min(y0 + w, w * h - w)
		for(let x0 = 0; x0 < w; ++x0) {
			const x1 = Math.max(x0 - 1, 0)
			const x2 = Math.min(x0 + 1, w - 1)
			const s01 = s32[x0 + y1] & 255
			const s02 = s32[x0 + y2] & 255
			const s10 = s32[x1 + y0] & 255
			const s11 = s32[x1 + y1] & 255
			const s12 = s32[x1 + y2] & 255
			const s20 = s32[x2 + y0] & 255
			const s21 = s32[x2 + y1] & 255
			const s22 = s32[x2 + y2] & 255
			const vx = strength * (s12 - s22 + 2 * (s10 - s20) + s11 - s21)
			const vy = strength * (s21 - s22 + 2 * (s01 - s02) + s11 - s12)
			const l = Math.sqrt(vx * vx + vy * vy + 1)

			res[p++] = 127 + (vx / l) * 128
			res[p++] = 127 + (vy / l) * 128
			res[p++] = specExp
			res[p++] = 255
		}
	}

	return new ImageData(res, w, h)
}

export const emoji = new Array(111)
	.fill(0)
	.fill(1344, 64)
	.map((c, i) => String.fromCodePoint(0x1f400 + c + i))
