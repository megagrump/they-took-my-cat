import {
	svg,
	render,
	rect,
	ellipse,
	rrect,
	line,
	noise,
	sobel,
} from './graphics.js'

import {
	dist1,
	dist2sq,
} from './helper.js'

import { Sprite } from './Sprite.js'
import { Light, LIGHT_DOWN } from './Light.js'
import * as world from './world.js'
import { TILE_TRAITS, TRAITS_FLAGS } from './Tile.js'
import { SPRBUF_HEIGHT } from './Renderer.js'
import { sounds, SOUND_ELEVATOR } from './audio/audio.js'

export const genElevator = async () => {
	let grating = ''
	for(let i = 16; i < 48; i += 6)
		grating += line(1, i, 126, i, '#0004')

	const diffuse = svg(128, 288,
		rrect(0, 0, 128, 288, 8, 8, '#89a')
		+ grating
		+ rect(8, 64, 112, 192, '#fff')
	)

	const depth = svg(128, 288,
		noise(.1, .4)
		+ rect(0, 0, 128, 288, '#444')
		+ rrect(2, 2, 124, 284, 8, 8, '#888')
		+ grating
		+ rrect(4, 4, 120, 280, 8, 8, '#fff4', 'filter="url(#n)"')
		+ rect(8, 62, 112, 194, '#000d')

		+ ellipse( 10,  10, 2, 2, '#fff')
		+ ellipse( 10,  54, 2, 2, '#fff')
		+ ellipse(118,  10, 2, 2, '#fff')
		+ ellipse(118,  54, 2, 2, '#fff')
		+ ellipse( 18, 270, 2, 2, '#fff')
		+ ellipse(110, 270, 2, 2, '#fff')
	)

	const [ color, bump ] = await Promise.all([ render(diffuse), render(depth) ])
	return [ [color], [sobel(bump, 2, 20)] ]
}

const MINWAIT = 2 // secs

export class Elevator extends Sprite {
	type = world.TYPE_ELEVATOR

	constructor(buf, x, y) {
		super(buf, x, y, world.ELEVATOR_Z, 3 * 64)
		this.light = Light(LIGHT_DOWN, x, y - 190, 16, 256, 1, .2, .1, 1)

		this.py = 256

		this._maxY = y
		let ty = this.t >>> 6
		while(world.get(x >>> 6, ty - 1)[TILE_TRAITS][TRAITS_FLAGS] == 0)
			--ty
		this._minY = (ty * 64) + buf[SPRBUF_HEIGHT]

		this._dy = 0
		this._lastDir = 1
		this._targetY = y
		this._waitTime = Math.random() * MINWAIT
		this.d = 0
	}

	tick(dt) {
		this.move(0, this._dy, dt)
		const volume = Math.min(.8, 200000 / (1 + dist2sq(this.x, this.y, world.player.x, world.player.y)))

		if(this.y == this._targetY) {
			this._waitTime += dt + 3 * dt * Math.abs(this.d)
			if(this._waitTime >= MINWAIT) {
				this._waitTime = 0
				this._dy = 0
				if((this.d == 1 && this.y < this._maxY) || (this.d == -1 && this.y > this._minY)) {
					this._dy = this.d
				}
				else if(!this.d) {
					this._dy = (this.y <= this._minY || this.y >= this._maxY) ? -this._lastDir : this._lastDir
				}
				if(this._dy) {
					this._targetY = this._targetY + this._dy * 256
					if(volume > .05) {
						this._sound = sounds[SOUND_ELEVATOR]()
						this._sound[1].gain.value = volume
					}
				}
			}
		}
		else {
			if(this._sound)
				this._sound[1].gain.value = volume > .05 ? volume : 0
			this._waitTime = 0
			if(
				(this._dy ==  1 && this.y >= this._targetY) ||
				(this._dy == -1 && this.y <= this._targetY)
			) {
				this.y = this._targetY
				this._lastDir = this._dy
				this._dy = 0
			}
		}

		this.d = 0
		this.light.pos(this.x, this.y - 190)
	}

	hitTest(x1, y1, x2, y2) {
		if(x1 == x2 && x1 >= this.l && x1 <= this.r) {
			if(y1 <= this.t)
				return [ world.HIT_ELEVATOR_ROOF, this.t - y1 ]

			if(y1 < this.y) {
				return [ world.HIT_ELEVATOR_FLOOR, this.y - y1 ]
			}
		}
		else if(y1 == y2) {
			if(y1 >= this.t && y1 <= this.t + 64) {
				if((x1 <= this.x && x2 >= this.x) || (x1 >= this.x && x2 <= this.x))
					return [ world.HIT_ELEVATOR_ROOF, dist1(this.x, x1) ]
			}
			else if(y1 >= this.y && y1 <= this.b) {
				if((x1 <= this.x && x2 >= this.x) || (x1 >= this.x && x2 <= this.x))
					return [ world.HIT_ELEVATOR_FLOOR, dist1(this.x, x1) ]
			}
		}
	}
}
