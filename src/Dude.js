import {
	svg,
	animate,
	rect,
	rrect,
	ellipse,
	line,
	group,
	depthFilter,
	sobel,
	ANIMATION_EASE,
	ANIMATION_PHASE,
	ANIMATION_POS,
} from './graphics.js'

import {
	easeLinear,
	easeCosine,
	identity,
	dist1,
} from './helper.js'

const COLOR_SKIN = 0
const COLOR_TORSO = 1
const COLOR_SLEEVE = 2
const COLOR_PANTS = 3
const COLOR_SHOES = 4
const COLOR_HAT = 5

const PALETTES = [
	[
		'#fcc', // COLOR_SKIN
		'#444', // COLOR_TORSO
		'#fcc', // COLOR_SLEEVE
		'#55f', // COLOR_PANTS
		'#fff', // COLOR_SHOES
		'#0000', // COLOR_HAT
	],
	[
		'#fcc', // COLOR_SKIN
		'#444', // COLOR_TORSO
		'#444', // COLOR_SLEEVE
		'#444', // COLOR_PANTS
		'#444', // COLOR_SHOES
		'#444', // COLOR_HAT
	],
]

const SCALE = .3
const WIDTH = 340
const HEIGHT = 480

const JOINT_BODY = 0
const JOINT_HEAD = 1
const JOINT_TORSO = 2
const JOINT_LARM = 3
const JOINT_LOWERLARM = 4
const JOINT_RARM = 5
const JOINT_LOWERRARM = 6
const JOINT_LLEG = 7
const JOINT_LOWERLLEG = 8
const JOINT_LFOOT = 9
const JOINT_RLEG = 10
const JOINT_LOWERRLEG = 11
const JOINT_RFOOT = 12

const JOINTS = [
	[ 125, 480 ],
	[ 125, 100 ],
	[  85, 260 ],
	[ 125, 125 ],
	[ 125, 195 ],
	[ 125, 125 ],
	[ 125, 195 ],
	[ 125, 260 ],
	[ 125, 370 ],
	[ 118, 465 ],
	[ 125, 260 ],
	[ 125, 370 ],
	[ 118, 465 ],
]

const head = (colors, filter='') => group(JOINT_HEAD,
	rect(110, 80, 35, 30) // neck
	+ ellipse(135, 32, 25, 20) // top of head
	+ rrect(100, 20, 70, 70, 20, 40) // head
	+ ellipse(125, 47, 10, 14, '#0003') // ear
	+ ellipse(130, 51, 10, 10) // ear
	+ ellipse(123, 53, 5, 5, '#0003') // ear
	+ ellipse(167, 62, 12, 10) // nose
	+ ellipse(148, 85, 15, 12) // chin

	+ ellipse(155, 45, 14, 10, '#0004') // eye socket
	+ line(153, 33, 165, 36, '#000c', 3, 'round') // eyebrow
	+ ellipse(158, 45, 8, 6, '#fff') // eye
	+ ellipse(163, 45, 3, 3, '#000') // pupil
	+ rrect(147, 72, 20, 10, 5, 5, '#f88') // mouth

	+ rrect(95, 8, 40, 30, 10, 20, colors[COLOR_HAT])
	+ rrect(130, 6, 45, 30, 15, 20, colors[COLOR_HAT])
	+ rrect(80, 31, 110, 10, 10, 10, colors[COLOR_HAT]),

	colors[COLOR_SKIN],
	`filter="${filter}"`
)

const torso = (colors, filter='') => group(JOINT_TORSO,
	rrect(88, 105, 80, 165, 20, 100, colors[COLOR_TORSO]), '', `filter="${filter}"`
)

const arm = (id, colors, gun, filter='') => group(id,
	group(++id,
		ellipse(125, 195, 13, 20) // elbow joint
		+ ellipse(125, 230, 15, 50) // lower arm
		+ (gun ?
			rect(132, 270, 25, 80, '#444')
		: '')
		//+ ellipse(138, 285, 3, 10, colors[COLOR_SKIN]) // thumb
		//+ rrect(131, 280, 6, 23, 3, 5, colors[COLOR_SKIN]) // index finger
		//+ rrect(125, 280, 6, 27, 3, 5, colors[COLOR_SKIN]) // middle finger
		//+ rrect(119, 280, 6, 25, 3, 5, colors[COLOR_SKIN]) // ring finger
		//+ rrect(113, 280, 6, 20, 3, 5, colors[COLOR_SKIN]) // pinky
		//+ rrect(113, 260, 24, 25, 5, 10, colors[COLOR_SKIN]) // hand
		+ rrect(110, 260, 28, 44, 15, 10, colors[COLOR_SKIN]) // hand
	)
	+ rrect(105, 120, 40, 70, 10, 30) // biceps
	+ ellipse(125, 135, 24, 30), // shoulder

	colors[COLOR_SLEEVE],
	`filter="${filter}"`
)


const leg = (id, colors, filter) => group(id,
	group(++id,
		rrect(100, 365, 40, 90, 10, 40) // lower leg
		+ group(++id,
			rrect(110, 460, 60, 20, 30, 25) // foot
			+ rrect(105, 450, 30, 30, 5, 5), // ankle joint
			colors[COLOR_SHOES],
		)
	)
	+ ellipse(125, 280, 30, 40) // hip joint
	+ ellipse(120, 360, 20, 30) // knee
	+ rrect(95, 260, 50, 120, 20, 50), // upper leg

	colors[COLOR_PANTS],
	`filter="${filter}"`
)

const easings = [ easeLinear, easeCosine ]

// rotate, easing, translate
const a_idle = [
	, // JOINT_BODY
	[
		,
		1,
		[
			[ 0, 0 ],
			[ 0, -5, 0 ]
		],
	],
	[ // JOINT_HEAD
		,
		1,
		[
			[ 0, 0 ],
			[ 0, -5, 0 ]
		],
	],
	, // JOINT_TORSO
	, // JOINT_LARM
	[ // JOINT_LOWERLARM
		[ -65, -62, -65 ],
		1,
	],
	[ // JOINT_RARM
		[ -40, -38, -40 ],
	],
]

const a_crouch = [
	[ // JOINT_BODY
		,
		,
		[
			[ 0, 0 ],
			[ 120, 120 ]
		],
	],
	, // JOINT_HEAD
	, // JOINT_TORSO
	, // JOINT_LARM
	, // JOINT_LOWERLARM
	[ // JOINT_RARM
		[ -65, -62, -65 ],
		1,
	],
	[ // JOINT_LOWERRARM
		[ -40, -38, -40 ],
	],
	[ // JOINT_LLEG
		[ -90, -90 ],
	],
	[ // JOINT_LOWERLLEG
		[ 110, 110 ],
	],
	[ // JOINT_LFOOT
		[ -30, -30 ],
	],
	[ // JOINT_RLEG
		[ 10, 10 ],
	],
	[ // JOINT_LOWERRLEG
		[ 95, 95 ],
	],
	[ // JOINT_RFOOT
		[ 55, 55 ],
	],
]

const a_walk = [
	[ // JOINT_BODY
		,
		1,
		[
			[ 0, 0 ],
			[ 15, 0, 15, 0, 15 ]
		],
	],
	[ // JOINT_HEAD
		[ 5, 0, 5, 0, 5 ],
		1,
	],
	, // JOINT_TORSO
	[
		[ 25, -20, 25 ],
		1,
	],

	[ // JOINT_LARM
		[ -10, -50, -10 ],
		1,
	],
	,
	, // JOINT_LOWERLARM
	[
		[ 18, -30, 18 ],
		1,
	],
	[ // JOINT_RARM
		[ 10, 60, 30, 5, 20, 0, 10 ],
	],
	[ // JOINT_LOWERRARM
		[ -10, 0, 15, -5, -5, -10 ],
	],
]

const a_walk_gun = [
	[ // JOINT_BODY
		,
		1,
		[
			[ 0, 0 ],
			[ 15, 0, 15, 0, 15 ]
		],
	],
	[ // JOINT_HEAD
		[ 5, 0, 5, 0, 5 ],
		1,
	],
	, // JOINT_TORSO
	[
		[ 25, -20, 25 ],
		1,
	],
	[ // JOINT_LARM
		[ -10, -50, -10 ],
		1,
	],
	[ // JOINT_LOWERLARM
		[ -65, -55, -65 ],
		1,
	],
	[ // JOINT_RARM
		[ -40, -35, -40 ],
	],
	[ // JOINT_LOWERRARM
		[ 18, -30, 18 ],
		1,
	],
	[ // JOINT_LLEG
		[ 10, 60, 30, 5, 20, 0, 10 ],
	],
	[ // JOINT_LOWERLLEG
		[ -10, 0, 15, -5, -5, -10 ],
	],
]

const a_die = [
	[ // JOINT_BODY
		[ 0, -90 ],
		,
		[
			[ 0, 400 ],
			[ 0, 60, 0 ]
		],
	],
	[ // JOINT_HEAD
		[ 0, 60, 0 ],
	],
	, // JOINT_TORSO
	, // JOINT_LARM
	, // JOINT_LOWERLARM
	[ // JOINT_RARM
		[ 0, -40, 0 ],
	],
	[ // JOINT_LOWERRARM
		[ 0, -40, 0 ],
	],
	[ // JOINT_LLEG
		[ 0, -90 ],
	],
	[ // JOINT_LOWERLLEG
		[ 0, 180 ],
	],
	, // JOINT_LFOOT
	[
		[ 0, -90 ],
	],
	[ // JOINT_RLEG
		[ 0, 180 ],
	],
]

export const ANIM_WALK = 0
export const ANIM_WALK_GUN = 1
export const ANIM_DIE = 2
export const ANIM_CROUCH = 3
export const ANIM_IDLE = 4
export const ANIM_NONE = 5

const ANIMATIONS = [
	[ a_walk, 30 ],
	[ a_walk_gun, 30 ],
	[ a_die, 15 ],
	[ a_crouch, 30 ],
	[ a_idle, 30 ],
]

ANIMATIONS.forEach(([anim], animId) => {
	anim.forEach((joint, jointId) => {
		joint[ANIMATION_PHASE] = animId == ANIM_DIE ? 0 : .25
		joint[ANIMATION_EASE] = easings[joint[ANIMATION_EASE] ?? 0]
		joint[ANIMATION_POS] = JOINTS[jointId]
	})

	// mirrored limbs with shifted animation phase
	if(animId <= ANIM_WALK_GUN) {
		[,,,,,3,4,,,,7,8,9].forEach((srcIndex, targetIndex) => {
			const shifted = anim[targetIndex] ?? { ...anim[srcIndex] }
			shifted[ANIMATION_PHASE] += .5
			anim[targetIndex] = shifted
		})
	}
})

const generateSVG = (palette, depthPass) => {
	const colors = PALETTES[palette]
	const depth = depthPass ?
		depthFilter + rect(0, 0, WIDTH, HEIGHT, '#444')
		: ''

	const d = d => depthPass ? `url(#d${d})` : ''

	return svg(
		WIDTH,
		HEIGHT,
		depth +
		group(0,
			arm(JOINT_LARM, colors, false, d(2)) +
			head(           colors,        d(1)) +
			leg(JOINT_LLEG, colors,        d(2)) +
			leg(JOINT_RLEG, colors,        d(1)) +
			torso(          colors,        d(1)) +
			arm(JOINT_RARM, colors, true,  d(0))
		)
	)
}

export const genDude = palette => Promise.all(
	ANIMATIONS.map(([ anim, frames ]) => Promise.all([
		Promise.all(
			animate(generateSVG(palette, 0), anim, frames, identity, SCALE)
		),
		Promise.all(
			animate(generateSVG(palette, 1), anim, frames, b => sobel(b, 2, 20), SCALE)
		)
	]))
)


//---------------------------------------------------------------------------

import * as world from './world.js'
import { Sprite } from './Sprite.js'
import {
	sounds,
	SOUND_SHOT,
	SOUND_HIT,
	SOUND_CRUSH,
} from './audio/audio.js'
import {
	animAction,
	fallAction,
	dieAction,
} from './actions.js'

import { GRAVITY, LETHAL_FALL_DISTANCE, gameOver } from './game.js'
import { SPRBUF_HEIGHT, SPRBUF_WIDTH } from './Renderer.js'

export class Dude extends Sprite {
	constructor(buf, x, y, z, moveSpeed) {
		super(buf, x, y, z, moveSpeed)
		this.py = buf[SPRBUF_HEIGHT] - 1
		this.px = Math.round(buf[SPRBUF_WIDTH] * .4)
		this.setAnim(ANIM_IDLE)
		this._timeSinceFlip = 1
		this._actionList = []
		this.dir = 1
	}

	tick(dt, backwards) {
		this._actionList[0] && this._actionList[0](dt) && this._actionList.shift()
		!this.dead && this._crouching && this.setAnim(ANIM_CROUCH)

		if(!this.dead && !this._actionList[0]) {
			const [ ceiling, ceilingDist ] = world.castRay(this.x, this.t, 0, -1, world.HIT_WALL)
			if(ceilingDist < 96 - (this._crouching ?? 0) * 32) {
				const [ elevator, elevatorDist ] = world.castRay(this.x, this.y - 32, 0, 1, world.HIT_ELEVATOR_ROOF)
				if(elevatorDist < 64) {
					sounds[SOUND_CRUSH]()
					this.die() // crushed on top of elevator
				}
			}

			if(!this.dead) {
				const [ elevator, elevatorDist ] = world.castRay(this.x, this.t, 0, -1, world.HIT_ELEVATOR_FLOOR)
				if(elevatorDist < 96 - (this._crouching ?? 0) * 32) {
					sounds[SOUND_CRUSH]()
					this.die() // crushed below elevator
				}
			}

			if(!this.dead) {
				let [ hit, dist ] = world.castRay(this.x, this.y - 32, 0, 1, world.HIT_WALL | world.HIT_ELEVATOR_ROOF | world.HIT_ELEVATOR_FLOOR)
				dist -= hit == world.HIT_WALL ? 64 : 32
				if(dist < LETHAL_FALL_DISTANCE) {
					this.y = Math.min(this.y + dist, this.y + dt * GRAVITY)
				}
				else {
					this._scheduleActions(
						animAction(this, ANIM_IDLE),
						fallAction(this, this.y + dist, GRAVITY),
						dieAction(this)
					)
				}
			}
		}

		super._animate(dt, this._anim == ANIM_DIE, backwards)
	}

	die() {
		if(this.type == world.TYPE_PLAYER && window.idkfa) return;
		this._crouching = false
		this.dead = true
		this._scheduleActions(dieAction(this))
	}

	hitTest(x1, y1, x2, y2) {
		if(this.dead || this._actionList[0] || this._door)
			return;

		if(y1 == y2 && y1 >= this.t && y1 <= this.y) {
			if(this._crouching && this.t + 50 > y1)
				return;

			if((x1 <= this.x && x2 >= this.x) || (x1 >= this.x && x2 <= this.x))
				return [ this.type, dist1(this.x, x1) ]
		}
	}

	_flip(dx, dt) {
		const flip = dx == 0 ? this.flip : dx < 0 ? 1 : 0
		if(flip != this.flip) {
			this.dir *= -1
			this.flip = flip
			this._timeSinceFlip = -dt
			this.px = this.buf[SPRBUF_WIDTH] - this.px
		}

		this._timeSinceFlip += dt
		return this._timeSinceFlip < .15
	}

	_walk(dx, dt, noFlip) {
		if(this.dead || this._crouching || (!noFlip && this._flip(dx, dt)))
			return;

		if(dx != 0) {
			this.setAnim(ANIM_WALK_GUN)
			if(!world.isObstacle(this.x + dx * 64, this.y, dx)) {
				this.move(dx, 0, dt)
				return true
			}
		}
		else {
			this.setAnim(ANIM_IDLE)
		}
	}

	_shoot() {
		world.getBullet().spawn(this, this._crouching ? 32 : 0)
		sounds[SOUND_SHOT]()
	}


	_scheduleActions(...actions) {
		this._actionList.length = 0
		this._actionList.push(...actions)
	}

	_isInElevator() {
		this._elevator = null
		for(const elevator of world.elevators) {
			if(
				dist1(elevator.y, this.y) <= 2 &&
				dist1(elevator.x, this.x) < 64
			) {
				return this._elevator = elevator
			}
		}
	}
}
