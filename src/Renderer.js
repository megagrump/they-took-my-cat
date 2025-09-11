import { resX, resY, gl } from './display.js'
import * as world from './world.js'
import * as camera from './camera.js'
import { QuadBuffer } from './QuadBuffer.js'
import { LightBuffer } from './LightBuffer.js'
import { MAP_WIDTH, MAP_HEIGHT } from './building.js'
import { FLAG_FLIP } from './Tile.js'
import {
	shaders,
	VERTEX_DEFAULT,
	VERTEX_QUAD,
	FRAGMENT_QUAD,
	FRAGMENT_AO,
	FRAGMENT_DIFFUSE,
	FRAGMENT_BLUR,
	FRAGMENT_AMBIENT,
	VERTEX_LIGHT,
	FRAGMENT_LIGHT,
	FRAGMENT_SCREEN,
} from './shaders.js'

const ONE = 1
const SRC_ALPHA = 0x0302
const ONE_MINUS_SRC_ALPHA = 0x0303
const DEPTH_TEST = 0x0b71
const BLEND = 0x0be2
const TEXTURE_2D = 0x0de1
const UNSIGNED_BYTE = 0x1401
const RGBA = 0x1908
const LINEAR = 0x2601
const TEXTURE_MAG_FILTER = 0x2800
const TEXTURE_MIN_FILTER = 0x2801
const TEXTURE_WRAP_S = 0x2802
const TEXTURE_WRAP_T = 0x2803
const REPEAT = 0x2901
const COLOR_BUFFER_BIT = 0x4000
const RGBA8 = 0x8058
const CLAMP_TO_EDGE = 0x812f
const R8 = 0x8229
const TEXTURE0 = 0x84c0
const FRAGMENT_SHADER = 0x8b30
const VERTEX_SHADER = 0x8b31
const TEXTURE_2D_ARRAY = 0x8c1a
const DRAW_FRAMEBUFFER = 0x8ca9
const COLOR_ATTACHMENT0 = 0x8ce0

gl.disable(DEPTH_TEST)
gl.enable(BLEND)

const createFramebuffer = textures => {
	const attachments = textures.map((t, i) => COLOR_ATTACHMENT0 + i)
	const buffer = gl.createFramebuffer()

	const bind = () => {
		gl.bindFramebuffer(DRAW_FRAMEBUFFER, buffer)
		for(let i = 0; i < textures.length; ++i)
			gl.framebufferTexture2D(DRAW_FRAMEBUFFER, COLOR_ATTACHMENT0 + i, TEXTURE_2D, textures[i], 0)
		gl.drawBuffers(attachments)
	}

	return [ textures, bind ]
}

const createTexture = type => {
	const texture = gl.createTexture()
	gl.bindTexture(type, texture)
	gl.texParameteri(type, TEXTURE_MIN_FILTER, LINEAR)
	//gl.texParameteri(type, TEXTURE_MAG_FILTER, LINEAR)
	//gl.texParameteri(type, TEXTURE_WRAP_S, CLAMP_TO_EDGE)
	//gl.texParameteri(type, TEXTURE_WRAP_T, CLAMP_TO_EDGE)
	return texture
}

const createTexture2D = (width, height, format = RGBA8) => {
	const texture = createTexture(TEXTURE_2D)
	gl.texStorage2D(TEXTURE_2D, 1, format, width, height)
	return texture
}

const createTextureArray = (textures, format = RGBA8) => {
	const texture = createTexture(TEXTURE_2D_ARRAY)
	gl.texStorage3D(TEXTURE_2D_ARRAY, 1, format, textures[0].width, textures[0].height, textures.length)
	textures.forEach((t, i) => gl.texSubImage3D(TEXTURE_2D_ARRAY, 0, 0, 0, i, t.width, t.height, 1, RGBA, UNSIGNED_BYTE, t.data))
	return texture
}

export const SPRBUF_WIDTH = 0
export const SPRBUF_HEIGHT = 1
export const SPRBUF_FRAMES = 2
export const SPRBUF_TEX = 3
export const SPRBUF_GEOM = 4

export const createSpriteBuffer = (tex, multiAnims) => {
	tex = multiAnims ? tex : [tex]
	const color = tex.reduce((a, t) => (a.push(...t[0]), a), [])
	const normals = tex.reduce((a, t) => (a.push(...t[1]), a), [])
	return [
		color[0].width,
		color[0].height,
		tex.map(t => t[0].length),
		[ createTextureArray(color), createTextureArray(normals) ],
		new QuadBuffer(color[0].width, color[0].height)
	]
}

const createShader = (vert, frag, uniforms) => {
	const program = gl.createProgram();

	[[ VERTEX_SHADER, vert ], [ FRAGMENT_SHADER, frag ]].forEach(s => {
		const shader = gl.createShader(s[0])
		gl.shaderSource(shader, s[1])
		gl.compileShader(shader)
		gl.attachShader(program, shader)
	})

	gl.linkProgram(program)
	gl.useProgram(program)

	const ul = uniforms.map((u, i) => {
		u[2] == 'x' && gl.uniform1i(gl.getUniformLocation(program, u), i) // textures
		return gl.getUniformLocation(program, u)
	})

	return [
		() => gl.useProgram(program),
		...ul
	]
}

const BLURSCALE = .5
const bufferBG =        createFramebuffer([ createTexture2D(resX, resY), createTexture2D(resX, resY) ])
const bufferFG =        createFramebuffer([ createTexture2D(resX, resY), bufferBG[0][1] ])
const bufferFGDiffuse = createFramebuffer([ bufferFG[0][0] ])
const bufferAOBlur =    createFramebuffer([ createTexture2D(resX * BLURSCALE, resY * BLURSCALE, R8) ])
const bufferAO =        createFramebuffer([ createTexture2D(resX * BLURSCALE, resY * BLURSCALE, R8) ])
const bufferDiffuse =   createFramebuffer([ createTexture2D(resX, resY) ])
const bufferScreen =    createFramebuffer([ createTexture2D(resX, resY) ])

const shaderAO =      createShader(shaders[VERTEX_DEFAULT], shaders[FRAGMENT_AO],      [ 'tex0' ])
const shaderBlur =    createShader(shaders[VERTEX_DEFAULT], shaders[FRAGMENT_BLUR],    [ 'tex0', 'dir' ])
const shaderDiffuse = createShader(shaders[VERTEX_DEFAULT], shaders[FRAGMENT_DIFFUSE], [ 'tex0', 'tex1', 'tex2' ])
const shaderAmbient = createShader(shaders[VERTEX_DEFAULT], shaders[FRAGMENT_AMBIENT], [ 'tex0' ])
const shaderScreen =  createShader(shaders[VERTEX_DEFAULT], shaders[FRAGMENT_SCREEN],  [ 'tex0' ])
const shaderQuad =    createShader(shaders[VERTEX_QUAD],    shaders[FRAGMENT_QUAD],    [ 'tex0', 'tex1', 'alpha', 'xy' ])
const shaderLight =   createShader(shaders[VERTEX_LIGHT],   shaders[FRAGMENT_LIGHT],   [ 'tex0', 'tex1', 'xy' ])

const geomBD       = new QuadBuffer(64, 64, MAP_WIDTH * MAP_HEIGHT)
const geomBG       = new QuadBuffer(64, 64, MAP_WIDTH * MAP_HEIGHT)
const geomFG       = new QuadBuffer(64, 64, MAP_WIDTH * MAP_HEIGHT)
const geomScreen   = new QuadBuffer(resX, resY)
export const geomLight = new LightBuffer()

const tileTextures = []

export const buildMap = (m, t) => {
	tileTextures.push(
		createTextureArray(t[0]),
		createTextureArray(t[1])
	)

	m.forEach(([ x, y, [ layer, tex, flags ] ]) => {
		geomBD.add(x, y, 0)
		if(layer--)
			[geomBG, geomFG][layer].add(x, y, tex, flags & FLAG_FLIP)
	})
}

const bindTex = (tex, index = 0, type = TEXTURE_2D) => {
	gl.activeTexture(TEXTURE0 + index)
	gl.bindTexture(type, tex)
}

const renderAO = () => {
	gl.disable(BLEND)
	gl.viewport(0, 0, resX * BLURSCALE, resY * BLURSCALE)

	bufferAO[1]()
	shaderAO[0]()
	bindTex(bufferFG[0][0])
	geomScreen.draw()

	shaderBlur[0]()
	for(let i = 1; i < 3; ++i) {
		bufferAOBlur[1]()
		gl.uniform3f(shaderBlur[2], 0, 1.5 / resY, .11)
		bindTex(bufferAO[0][0])
		geomScreen.draw()

		bufferAO[1]()
		gl.uniform3f(shaderBlur[2], 1.5 / resX, 0, .11)
		bindTex(bufferAOBlur[0][0])
		geomScreen.draw()
	}

	gl.enable(BLEND)
	gl.viewport(0, 0, resX, resY)
}

export const render = () => {
	const sx = camera.getX(), sy = camera.getY()

	gl.blendFunc(ONE, ONE_MINUS_SRC_ALPHA)
	gl.viewport(0, 0, resX, resY)
	gl.clearColor(0, 0, 0, 0)

	bufferFG[1]()
	gl.clear(COLOR_BUFFER_BIT)

	// bg
	bufferBG[1]()

	shaderQuad[0]()
	gl.uniform1f(shaderQuad[3], 1)
	gl.uniform3f(shaderQuad[4], sx, sy, 0)
	bindTex(tileTextures[0], 0, TEXTURE_2D_ARRAY)
	bindTex(tileTextures[1], 1, TEXTURE_2D_ARRAY)
	geomBD.draw()
	geomBG.draw()

	bufferFG[1]()

	// sprites
	let lastBuf
	let lastAlpha = 1
	// TODO: sprite batching
	world.sprites.forEach(sprite => {
		if(sprite.alpha > 0 && camera.isVisible(sprite)) {
			if(sprite.buf != lastBuf) {
				bindTex(sprite.buf[SPRBUF_TEX][0], 0, TEXTURE_2D_ARRAY)
				bindTex(sprite.buf[SPRBUF_TEX][1], 1, TEXTURE_2D_ARRAY)
				lastBuf = sprite.buf
			}
			if(sprite.alpha != lastAlpha) {
				gl.uniform1f(shaderQuad[3], sprite.alpha)
				lastAlpha = sprite.alpha
			}
			sprite.buf[SPRBUF_GEOM].set(0, sprite.l, sprite.t, sprite.f, sprite.flip)
			sprite.buf[SPRBUF_GEOM].draw()
		}
	})
	// fg
	gl.uniform1f(shaderQuad[3], 1)
	bindTex(tileTextures[0], 0, TEXTURE_2D_ARRAY)
	bindTex(tileTextures[1], 1, TEXTURE_2D_ARRAY)
	geomFG.draw()

	bufferFGDiffuse[1]()
	renderAO()

	// diffuse + ao
	bufferDiffuse[1]()
	shaderDiffuse[0]()
	bindTex(bufferFG[0][0])
	bindTex(bufferBG[0][0], 1)
	bindTex(bufferAO[0][0], 2)
	geomScreen.draw()

	// lighting
	bufferScreen[1]()
	shaderAmbient[0]()
	bindTex(bufferDiffuse[0][0])
	geomScreen.draw()

	gl.blendFunc(ONE, ONE)
	shaderLight[0]()
	gl.uniform3f(shaderLight[3], sx, sy, 0)
	bindTex(bufferBG[0][1], 1)
	geomLight.draw()

	// screen
	gl.blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)
	gl.drawBuffers([])
	gl.bindFramebuffer(DRAW_FRAMEBUFFER, null)

	shaderScreen[0]()
	bindTex(bufferScreen[0][0])
	geomScreen.draw()
}
