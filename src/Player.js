import * as world from './world.js'
import * as game from './game.js'
import * as input from './input.js'
import {
	Dude,
	ANIM_WALK,
	ANIM_NONE,
	ANIM_IDLE,
} from './Dude.js'
import { alertMobs } from './Mob.js'
import { randomItem, dist1 } from './helper.js'
import { addToHud, showText } from './display.js'
import {
	moveAction,
	doorAction,
	animAction,
} from './actions.js'
import { emoji } from './graphics.js'
import { sounds, SOUND_DING } from './audio/audio.js'

const FIREDELAY = .5
let lastFireTime = -FIREDELAY

export class Player extends Dude {
	type = world.TYPE_PLAYER

	constructor(buf, x, y) {
		super(buf, x, y, world.PLAYER_Z, 3 * 64)

		this._keyMap = {
			[input.KEY_DOWN]: () => this._downPressed(),
			[input.KEY_UP]: () => this._upPressed(),
			[input.KEY_FIRE]: () => this._firePressed(),
		}
	}

	tick(dt) {
		super.tick(dt)
		if(!this._door && !this.dead && !this._actionList[0]) {
			if(this._isInElevator()) {
				input.keys[input.KEY_DOWN] && (this._elevator.d = 1)
				input.keys[input.KEY_UP] && (this._elevator.d = -1)
			}

			this._crouching = input.keys[input.KEY_CROUCH]
			this._walk(-input.keys[input.KEY_LEFT] + input.keys[input.KEY_RIGHT], dt)
		}
	}

	keyPressed(key) {
		if(this._actionList[0])
			return;
		const b = this._keyMap[key] ?? (() => 0)
		b()
	}

	_downPressed() {
		if(this._door)
			return this._leaveRoom()

		if(this._crouching)
			return;

		const stairs = this._isAtStairs(1)
		if(stairs)
			return this._useStairs(stairs)
	}

	_upPressed() {
		if(this._door)
			return this._leaveRoom()

		this._crouching = false

		const door = world.getDoorAt(this.x, this.y)
		if(door) {
			if(door.color == 'X' && game.inventory.indexOf('C') == -1) {
				return showText(`You can't leave without Manny`)
			}

			if(game.inventory.indexOf(door.color) == -1) {
				return showText(`You need a ${door.name} key`)
			}

			return this._useDoor(door)
		}

		const stairs = this._isAtStairs(-1)
		if(stairs)
			return this._useStairs(stairs)
	}

	_firePressed() {
		if(this._door || game.time - lastFireTime < FIREDELAY)
			return;

		this._shoot()
		alertMobs()
		lastFireTime = game.time
	}

	_useDoor(door) {
		this._door = door
		if(door) {
			this._scheduleActions(
				animAction(this, ANIM_WALK),
				moveAction(this, door.x),
				() => {
					this.setAnim(ANIM_NONE)
					return door.open()
				},
				doorAction(this, true),
				() => {
					door.color == 'X' && game.gameOver()
					return true
				}
			)
		}
		else {
			this._scheduleActions(
				doorAction(this),
				animAction(this, ANIM_IDLE)
			)
		}
	}

	_useStairs(stairs) {
		const [ dir, x, y ] = stairs
		const tx = x + dir[0] * 256, ty = y + dir[1] * 256
		this._flip(dir[0], 0)
		this.setAnim(ANIM_WALK)
		this._scheduleActions(
			moveAction(this, x, y),
			moveAction(this, tx, ty, .7),
			animAction(this, ANIM_IDLE)
		)
	}

	_leaveRoom() {
		const d = this._door
		this._useDoor()

		if(d.o)
			return;
		d.o = true

		alertMobs()

		if(d.key) {
			game.inventory.push(d.key)
			showText(`You found a ${d.keyName} key`)
			addToHud(`<span style="background-color:${d.keyColor}">🔑</span>`)
			sounds[SOUND_DING]()
			return d.key = null
		}

		if(d.cat) {
			d.cat = null
			game.inventory.push('C')
			addToHud('🐈‍⬛')
			sounds[SOUND_DING]()
			return showText(`You found Manny!<br>Now get out of here!`)
		}

		if(d.life) {
			d.life = null
			game.changeLives(1)
			sounds[SOUND_DING]()
			return showText('You found a 🧡')
		}

		if(Math.random() < .7) {
			return showText(`They keep ${randomItem(emoji)} in there!`)
		}

		showText('Nothing in there')
	}

	_isAtStairs(dir) {
		for(const stairs of world.stairs) {
			const [ d, x, y ] = stairs
			if(
				d[1] == dir &&
				dist1(x, this.x) < 32 &&
				dist1(y, this.y) < 8
			) {
				return stairs
			}
		}
	}
}

