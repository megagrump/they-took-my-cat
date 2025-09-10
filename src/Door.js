import {
	svg,
	render,
	rect,
	rrect,
	ellipse,
	noise,
	sobel,
} from './graphics.js'

import { Sprite } from './Sprite.js'
import { TYPE_DOOR, DOOR_Z } from './world.js'

const DOORCOLORS = {
	N: '#aaa',
	R: '#f53',
	B: '#3af',
	G: '#3f5',
	X: '#fb6'
}

let normalsCache

export const genDoor = async col => {
	col = DOORCOLORS[col]

	const frameColor = rect(0, 0, 102, 166, '#678')

	const frameDepth =
		rect(0, 0, 102, 166, '#111')
		+ rect(1, 1, 100, 166, '#333')
		+ rect(8, 8, 86, 166, '#222')

	const closedColor = svg(102, 166,
		noise(.3, 2)
		+ frameColor
		+ rect(10, 10, 84, 166, col) // door
		+ rect(10, 10, 84, 166, '#0002', `filter="url(#n)"`)

		+ rrect(14, 80, 14, 35, 2, 2, '#fff') // plate
		+ rrect(22, 85, 16, 6, 2, 2, '#fff') // handle
		+ rrect(20, 100, 2, 5, 1, 1, '#000') // keyhole
	)

	const closedDepth = svg(102, 166,
		frameDepth
		+ rrect(15, 81, 12, 33, 2, 2, '#333')  // plate
		+ rrect(22, 86, 15, 4, 2, 2, '#888') // handle
		+ ellipse(22, 89, 3, 3, '#888')

		+ rrect(20, 100, 2, 5, 1, 1, '#000') // keyhole
	)

	const openColor = svg(102, 166,
		frameColor
		+ rect(12, 12, 78, 160, '#000')
		+ rect(83, 9, 10, 166, col)
	)

	const openDepth = svg(102, 166,
		frameDepth
		+ rect(83, 9, 10, 166, '#888')
	)

	const [ cColor, oColor, cBump, oBump ] = await Promise.all([
		render(closedColor),
		render(openColor),
		...(normalsCache ? [] : [ render(closedDepth), render(openDepth) ])
	])

	normalsCache ||= [ sobel(cBump, 2, 6), sobel(oBump, 2, 6) ]

	return [ [ cColor, oColor ], normalsCache ]
}

const span = (t, c) => `<span style="color:${c}">${t}</span>`

const COLORNAMES = {
	N: '',
	R: span('red', DOORCOLORS.R),
	B: span('blue', DOORCOLORS.B),
	G: span('green', DOORCOLORS.G),
	X: span('golden', DOORCOLORS.X)
}

export class Door extends Sprite {
	type = TYPE_DOOR

	constructor(buf, x, y, color, colorIndex, flip) {
		super(buf, x, y, DOOR_Z)
		this.py = 166
		this.flip = flip
		this.color = color
		this._frame = colorIndex * 2
	}

	get name() { return COLORNAMES[this.color] }
	get keyName() { return COLORNAMES[this.key] }
	get keyColor() { return DOORCOLORS[this.key] }

	open() {
		this._frame |= 1
		return true
	}

	close() {
		this._frame &= ~1
		this.o = false
		return true
	}
}
