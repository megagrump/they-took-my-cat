import * as world from './world.js'
import { respawn } from './game.js'
import { changeLives } from './game.js'
import { dist1 } from './helper.js'
import { isVisible } from './camera.js'
import { ANIM_DIE } from './Dude.js'
import { sounds, SOUND_DIE, SOUND_SCREAM } from './audio/audio.js'

export const moveAction = (dude, x, y = dude.y, speed = 1) => {
	let clampX, clampY
	return dt => {
		if(!clampX) {
			clampX = x < dude.x ? Math.max : Math.min
			clampY = y < dude.y ? Math.max : Math.min
			dist1(dude.x, x) > 16 && dude._flip(Math.sign(x - dude.x), dt)
		}

		dude.move(
			Math.sign(x - clampX(dude.x, x)),
			Math.sign(y - clampY(dude.y, y)),
			dt * speed
		)
		dude.x = clampX(dude.x, x)
		dude.y = clampY(dude.y, y)
		return dude.x == x && dude.y == y
	}
}

export const doorAction = (dude, enter) => {
	let time = 0
	return dt => {
		time = Math.min(1, time + dt * 2)
		dude.alpha = enter ? 1 - time : time
		return time == 1
	}
}

export const animAction = (dude, anim) => {
	return () => {
		dude.setAnim(anim)
		return true
	}
}

export const fallAction = (dude, floor, gravity) => {
	// FIXME: should use rayCast for correct height when falling on elevator
	let time = 0
	return dt => {
		if(time == 0) sounds[SOUND_SCREAM]()
		time += dt
		dude.y = Math.min(floor, dude.y + dt * gravity)
		return dude.y >= floor
	}
}

export const dieAction = dude => {
	let time = 0
	return dt => {
		time == 0 && isVisible(dude) && sounds[SOUND_DIE]()
		time += dt
		dude.setAnim(ANIM_DIE)
		dude.dead = true
		dude.alpha = Math.max(0, 1 - time)
		if(dude != world.player && time >= 1) {
			world.removeSprite(dude)
			return true
		}
		else if(time >= 2) {
			if(changeLives(-1)) {
				world.removeSprite(dude)
				respawn()
				return true
			}
		}
	}
}
