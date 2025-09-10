import { GeomBuffer } from './GeomBuffer.js'

const SEGMENTS = 30

const ATTRIBUTES = [
	// size, stride, offset, [perinstance]
	[ 2,  8, 0 ], // vp
	[ 4, 48, SEGMENTS * 8 +  0, 1 ], // lpos
	[ 4, 48, SEGMENTS * 8 + 16, 1 ], // col
	[ 4, 48, SEGMENTS * 8 + 32, 1 ], // dir
]

const temp = new Float32Array(12) // instance attributes

const LIGHTATTN = [
	// r, l, d, u
	[ 1, 1, 1, 1 ], // o omni
	[ 1, 1, 1, 4 ], // ^ ceiling
	[ 1.5, 1.5, 4, 1 ], // v floor
]

export class LightBuffer extends GeomBuffer {
	constructor(maxLights = 256) {
		const vertices = [ 0, 0 ]
		for(let i = 0; i < SEGMENTS - 1; ++i) {
			const a = i / (SEGMENTS - 2) * Math.PI * 2
			vertices.push(Math.sin(a))
			vertices.push(Math.cos(a))
		}
		super(ATTRIBUTES, maxLights, 48, new Float32Array(vertices))
	}

	add(type, ...args) { // x, y, z, radius, r, g, b, intensity
		temp.set(args)
		temp.set(LIGHTATTN[type], 8)
		return this._addInstance(temp)
	}
}
