import {
	svg,
	render,
	ellipse,
	sobel,
} from './graphics.js'

export const genBullet = async () => {
	const bullet = await render(svg(8, 8, ellipse(4, 4, 4, 4, '#fff')))

	return [ [ bullet ], [ sobel(bullet, 2, 100) ] ]
}

// --------------------------------------------------------------------------

import { sounds, SOUND_SHATTER, SOUND_HIT } from './audio/audio.js'
import { Sprite } from './Sprite.js'
import { Light, LIGHT_OMNI } from './Light.js'
import { isVisible } from './camera.js'
import * as world from './world.js'

let muzzleFlash

export const tickFlash = dt => muzzleFlash.i = Math.max(0, muzzleFlash.i - dt * 8)

export class Bullet extends Sprite {
	type = world.TYPE_BULLET

	constructor(buf) {
		muzzleFlash ||= Light(LIGHT_OMNI, -1000, 0, 32, 256, 1, .4, .4, 0)

		super(buf, -1000, 0, world.BULLET_Z, 800)
		this.light = Light(LIGHT_OMNI, -1000, 0, 16, 192, 1, .8, .6, 0)
		this.alpha = 0
	}

	spawn(owner, yoffset) {
		this._dx = owner.dir
		this.x = owner.x + 64 * this._dx
		this.y = yoffset + owner.y - 115
		this.alpha = 1
		this.light.pos(this.x, this.y)
		this.light.i = 1
		muzzleFlash.pos(this.x, this.y)
		muzzleFlash.i = 1.1
		this._owner = owner
		this._hit = owner.type == world.TYPE_PLAYER ? world.HIT_MOB : (world.HIT_PLAYER | world.HIT_MOB)
	}

	_destroy() {
		this.alpha = 0
		this.light.i = 0
	}

	tick(dt) {
		if(this.alpha == 0)
			return;

		const [ hit, dist, obj ] = world.castRay(this.x, this.y, this._dx, 0,
			world.HIT_WALL |
			world.HIT_LIGHT |
			world.HIT_ELEVATOR_FLOOR |
			world.HIT_ELEVATOR_ROOF |
			this._hit
		)

		if(
			!isVisible(this) ||
			(hit == world.HIT_WALL && dist <= 32) ||
			(
				((hit & (world.HIT_ELEVATOR_FLOOR | world.HIT_ELEVATOR_ROOF)) > 0)
				&& dist <= 64
			)
		) {
			isVisible(this) && sounds[SOUND_HIT]()
			return this._destroy()
		}
		else if((hit & this._hit) && dist <= 64) {
			obj.die()
			return this._destroy()
		}
		else if(hit == world.HIT_LIGHT && dist <= 32) {
			sounds[SOUND_SHATTER]()
			obj.i = 0
		}

		this.move(this._dx, 0, dt)
		this.light.pos(this.x, this.y)
	}
}
