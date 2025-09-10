import { Dude, ANIM_IDLE } from './Dude.js'
import * as world from './world.js'
import { randomItem, dist1 } from './helper.js'
import { isVisible, isFullyVisible } from './camera.js'

let mobSprite

export class Mob extends Dude {
	type = world.TYPE_MOB

	constructor(x, y) {
		super(mobSprite, x, y, world.MOB_Z, 2 * 64)
		this._walking = randomItem([-1,0,1])
		this._playerDist = Infinity
		this._crouchTime = 0
		this._alertTime = 3
	}

	tick(dt) {
		const canTurn = this._playerDist > 1024 || (this.x > world.player.x && !this.flip)
		if(!this._walk(this._walking, dt, !canTurn))
			this._walking = 0
		super.tick(dt, this._walking && !canTurn && this._walking != this.dir)
	}

	_turnToPlayer() {
		this._flip(Math.sign(world.player.x - this.x), 0)
	}

	_update() {
		const [ hit, dist, obj ] = this._look()
		let walkDir = this._walking
		this._playerDist = Infinity

		if((hit & (world.HIT_WALL | world.HIT_MOB)) && dist < 256) {
			walkDir = Math.random() < .25 ? -this.dir : 0
		}

		else if(hit == world.HIT_PLAYER) {
			this._playerDist = dist
			if(dist < 256)
				walkDir = -this.dir
			else if(dist < 512)
				walkDir = Math.random() < dist / 1024 ? this.dir : 0
			else if(dist < 1024)
				walkDir = this.dir
			else
				walkDir = randomItem([-1,0,1])

			if(isFullyVisible(this)) {
				this._alertTime = 0
				if(!this._crouching) {
					this._shoot()
					alertMobs(this)
				}
			}
		}

		else {
			if(
				!world.player._door
				&& !world.player._actionList[0]
				&& dist1(world.player.y, this.y) < 32
				&& dist1(world.player.x, this.x) < dist
			) {
				this._turnToPlayer()
				this._playerDist = dist1(world.player.x, this.x)
				if(this._playerDist < 192)
					walkDir = -this.dir
			}
			else if(Math.random() < .5) {
				walkDir = randomItem([-1,0,1])
			}
		}

		if(this._alertTime < 3)
			this._crouching = this._crouchTime > 1 + Math.random() * 3 ? false : Math.random() < .5
		else
			this._crouching = false

		this._crouchTime = this._crouching ? this._crouchTime + 1 : 0
		if(!this._crouching && this._walking != walkDir)
			this.setAnim(ANIM_IDLE)
		this._walking = walkDir
		++this._alertTime
	}

	_look() {
		const hit =
			world.HIT_WALL
			| world.HIT_MOB
			| ((!world.player._door && !world.player._actionList[0]) && world.HIT_PLAYER)

		return world.castRay(this.x, this.y - 64, this.dir, 0, hit, this)
	}

	_alert = () => {
		if(dist1(this.y, world.player.y) < 64) {
			this._alertTime = 0
			this._turnToPlayer()
			this._walking = this.dir
		}
	}
}

let activeMobs = []
const MAXMOBS = 20
const TICKLENGTH = .5
let tickTime = TICKLENGTH

const spawnMob = (maxDist = 512) => {
	if(activeMobs.length >= MAXMOBS)
		return;

	const door = randomItem(world.doors.filter(d => {
		// spawn near player at doors outside view
		if(dist1(d.y, world.player.y) > maxDist || d.color == 'X' || Math.random() < .5 || isVisible(d))
			return;

		// low probability to spawn at open doors
		if(d.o && Math.random() > .02)
			return;

		// do not spawn near mob
		for(const mob of activeMobs) {
			if(dist1(mob.y, d.y) < 256 && dist1(mob.x, d.x) < 512)
				return;
		}

		return true
	}))

	if(door)
		activeMobs.push(world.addSprite(new Mob(door.x, door.y)))
}

export const alertMobs = except => {
	activeMobs.forEach(mob => mob != except && mob._alert())
}

export const tick = dt => {
	tickTime += dt
	if(tickTime < TICKLENGTH)
		return;
	tickTime = 0

	activeMobs.forEach(mob => {
		if(!mob.dead && dist1(mob.y, world.player.y) > 768) {
			mob.dead = true
			world.removeSprite(mob)
		}
	})

	if(activeMobs.some(mob => mob.dead))
		activeMobs = activeMobs.filter(mob => !mob.dead)

	spawnMob()
	activeMobs.forEach(mob => mob._update())
}

export const init = sprite => {
	mobSprite = sprite
	activeMobs.push(world.addSprite(new Mob(world.player.x + 1200, world.player.y)))
}
