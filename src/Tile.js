import {
	svg,
	render,
	noise,
	rect,
	rrect,
	line,
	text,
	group,
	gradient,
	sobel,
	clip,
	emoji,
} from './graphics.js'

import {
	randomItem,
} from './helper.js'

const stone = (color, gapColor, emboss, rx, ry, noiseFreq, noiseStrength, width, height, gap, shift, add, spec = 20, depth = 1) => {
	let brickc = '', brickh = ''
	for(let x = gap / 2; x < 64 + width + gap; x += width + gap) {
		brickc += rrect(x, gap / 2, width, height, rx, ry, color)
		brickh += rrect(x, gap / 2, width, height, rx, ry, emboss)
	}

	brickc = group('c', brickc)
	brickh = group('h', brickh)
	let x = -shift + .5
	for(let y = height + gap + .5; y < 64; y += height + gap) {
		brickc += `<use href="#_c" x="${x}" y="${y}" />`
		brickh += `<use href="#_h" x="${x}" y="${y}" />`
		x = -((x + shift) % width)
	}

	return [
		svg(64, 64,
			rect(0, 0, 64, 64, gapColor)
			+ brickc
			+ add[0]
		),
		svg(64, 64,
			noise(noiseFreq, noiseStrength)
			+ rect(0, 0, 64, 64, '#fff', `filter="url(#n)"`)
			+ brickh
			+ add[1]
		),
		depth,
		spec,
	]
}


const stairs = () => [
	svg(66, 66,
		line(0, 0, 66, 66, '#89b', 64)
	),
	svg(66, 66,
		rect(0, 0, 66, 66, '#444')
		+ line(0, 0, 64, 64, '#fff', 60)
		+ line(0, -32, 96, 64, '#7772', 2)
	),
	1,
	10,
]

const stairsTop = () => [
	svg(66, 66,
		line(-64, 0, 64, 128, '#89b', 64)
	),
	svg(66, 66,
		rect(0, 0, 66, 66, '#444')
		+ line(-64, 0, 64, 128, '#fff', 60)
		+ line( 0, 32, 64, 96, '#7772', 2)
	),
	1,
	10,
]

const stairsBottom = () => [
	svg(66, 66,
		line(-2, -66, 132, 66, '#89b', 64)
	),
	svg(66, 66,
		rect(0, 0, 66, 66, '#444')
		+ line(0, -64, 128, 64, '#fff', 60)
	),
	1,
	10,
]

const elevatorRails = () => [
	rect(0, 0, 6, 64, '#89b')
	+ rect(58, 0, 6, 64, '#89b'),

	rect(0, 0, 6, 64, '#000')
	+ rect(1, 0, 4, 64, '#fff')
	+ rect(58, 0, 6, 64, '#000')
	+ rect(59, 0, 4, 64, '#fff'),
]

const floorIndicator = n => [
	svg(64, 64,
		rect(8, 8, 48, 48, '#888')
		+ rect(12, 12, 40, 40, '#0008')
		+ text(n, 32, 34, 's', '#fff')
	),
	svg(64, 64,
		rect(0, 0, 64, 64, '#444')
		+ rect(12, 12, 40, 40, '#0002')
		+ text(n, 32, 34, 's', '#fff1')
	),
	2,
	3,
]

const PIC_COLORS = [ '#fff', '#4af', '#ff4', '#8f4', '#888', '#f4f', '#f44' ]
const PIC_FRAME_COLORS = [ '#c96', '#888', '#8ac' ]

const picture = p => {
	const frameCol = randomItem(PIC_FRAME_COLORS)
	return [
		svg(64, 64,
			gradient(randomItem(PIC_COLORS), randomItem(PIC_COLORS))
			+ rect(0, 0, 64, 64, '#444')
			+ rect(1, 1, 62, 62, frameCol)
			+ line(0, 0, 64, 64, '#000')
			+ line(64, 0, 0, 64, '#000')
			+ rect(6, 6, 52, 52, 'url(#g)')
			+ text(p, 32, 34, 'e', '#fff')
		),
		svg(64, 64,
			rect(0, 0, 64, 64, '#111')
			+ rect(2, 2, 60, 60, '#444')
			+ rect(6, 6, 52, 52, '#111')
			+ text(p, 32, 34, 'e')
			+ rect(8, 8, 48, 48, '#111d')
		),
		.5,
		3,
	]
}

export const genTiles = async () => {
	const textures = [
		stone('#fff', '#fff', '#fffc', 0, 0, .5, .13, 64, 64, 0,  0, ['',''], 30, 1), // back wall
		stone('#d86', '#ccc', '#aaab', 2, 4, .5,  .2, 30, 13, 3, 16, ['',''], 60, 1), // walls
		stairs(),
		stairsTop(),
		stairsBottom(),
		stone('#bbb', '#fff', '#0008', 5, 3, .17, .04, 47, 13, 1, 16, elevatorRails(), 60), // elevator shaft
	]

	for(let i = 0; i < 14; ++i) textures.push(floorIndicator(i))

	emoji.forEach(e => textures.push(picture(e)))

	const filter = (normals, depth, spec) => img => {
		img = normals ? sobel(img, depth, spec) : img
		// stairs have a border around them to ensure proper normals at the edges
		return img.width > 64 ? clip(img, 1, 1, 64, 64) : img
	}

	const tiles = await Promise.all(
		textures.map(t => Promise.all([
			render(t[0], filter()),
			render(t[1], filter(true, t[2], t[3])),
		]))
	)

	return [ tiles.map(t => t[0]), tiles.map(t => t[1]) ]
}

// --------------------------------------------------------------------

export const FLAG_FLIP = 1
export const FLAG_WALL = 2

export const TRAITS_LAYER = 0
export const TRAITS_TEX = 1
export const TRAITS_FLAGS = 2
export const TRAITS_LIGHT = 3

export const LAYER_BD = 0
export const LAYER_BG = 1
export const LAYER_FG = 2

export const TILEID = ' =Ss+Tt-|0123456789abcd?'

export const TILES = [
	//layer      tex     flags
	[ LAYER_BD, 0,         0 ], //   BACK WALL
	[ LAYER_FG, 1, FLAG_WALL ], // = WALL
	[ LAYER_FG, 2,         0 ], // S STAIRS_L
	[ LAYER_FG, 3,         0 ], // s STAIRS_L_TOP
	[ LAYER_FG, 4,         0 ], // + STAIRS_L_BOTTOM
	[ LAYER_FG, 2, FLAG_FLIP ], // T STAIRS_R
	[ LAYER_FG, 3, FLAG_FLIP ], // t STAIRS_R_TOP
	[ LAYER_FG, 4, FLAG_FLIP ], // - STAIRS_R_BOTTOM
	[ LAYER_BG, 5,         0 ], // | ELEVATOR SHAFT
]

// light: [ z, radius, r, g, b, intensity ]

const texEnd = 6

for(let i = 0; i < 14; ++i)
	TILES.push([LAYER_BG, i + texEnd, 0, [20, 256, .3, .7, .2, 1]]) // FLOOR INDICATOR

for(let i = 0; i < emoji.length; ++i)
	TILES.push([LAYER_BG, i + texEnd + 14, i & 1]) // ? PICTURE

export const TILE_X = 0
export const TILE_Y = 1
export const TILE_TRAITS = 2

export const Tile = (traits, x, y) => [ x, y, traits ]
