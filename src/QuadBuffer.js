import { GeomBuffer } from './GeomBuffer.js'

const ATTRIBUTES = [
	// size stride offset [divisor]
	[     2,    16,     0    ], // vp
	[     2,    16,     8    ], // uv
	[     4,     0,    64, 1 ], // x, y, tex, flip
]

const temp = new Float32Array(4)

export class QuadBuffer extends GeomBuffer {
	constructor(width, height, maxQuads = 1) {
		super(ATTRIBUTES, maxQuads, 16, new Float32Array([
			0, 0, 0, 0,
			0, height, 0, 1,
			width, height, 1, 1,
			width, 0, 1, 0,
		]))
		maxQuads == 1 && this.add(0, 0, 0, 0)
	}

	add(...args) { // x, y, tex, flip
		temp.set(args)
		this._addInstance(temp)
	}

	set(instance, ...args) {
		temp.set(args)
		this._setInstanceData(instance, temp)
	}
}
