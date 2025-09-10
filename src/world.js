import { generateBuilding, MAP_WIDTH, MAP_HEIGHT } from './building.js'
import { Player } from './Player.js'
import * as mob from './Mob.js'
import { Sprite } from './Sprite.js'
import { Door } from './Door.js'
import { Light, LIGHT_OMNI, LIGHT_DOWN, LIGHT_UP } from './Light.js'
import { Elevator } from './Elevator.js'
import { Bullet, tickFlash } from './Bullet.js'
import { randomItem, pointInBox, dist1 } from './helper.js'
import { Stairs } from './Stairs.js'
import { createSpriteBuffer, buildMap } from './Renderer.js'

import {
	Tile,
	TILES,
	TILEID,
	TRAITS_LIGHT,
	TILE_TRAITS,
	TRAITS_FLAGS,
	FLAG_WALL,
} from './Tile.js'

export const map = []
export const lights = []
export const sprites = []
export const doors = []
export const stairs = []
export const elevators = []
export const bullets = []

export let player
let playerSpawn = []

export const get = (x, y) => map[y * MAP_WIDTH + x]

const set = (x, y, tile) => map[y * MAP_WIDTH + x] = tile

export const HIT_WALL = 0x01
export const HIT_ELEVATOR_ROOF = 0x02
export const HIT_ELEVATOR_FLOOR = 0x04
export const HIT_PLAYER = 0x08
export const HIT_MOB = 0x10
export const HIT_LIGHT = 0x20

export const TYPE_PLAYER = HIT_PLAYER
export const TYPE_DOOR = 0x100
export const TYPE_BULLET = 0x200
export const TYPE_MOB = HIT_MOB
export const TYPE_ELEVATOR = HIT_ELEVATOR_FLOOR | HIT_ELEVATOR_ROOF

const HIT_SPRITES = HIT_ELEVATOR_FLOOR | HIT_ELEVATOR_ROOF | HIT_PLAYER | HIT_MOB

export const ELEVATOR_Z = 1
export const DOOR_Z = 2
export const MOB_Z = 3
export const PLAYER_Z = 4
export const BULLET_Z = 5

export const isWall = (x, y) => (get(x, y)[TILE_TRAITS][TRAITS_FLAGS] & FLAG_WALL) > 0

export const isObstacle = (x, y, dx) => {
	for(const elevator of elevators) {
		if(dist1(elevator.x, x) > 64 || elevator.b < y - 128 || elevator.t >= y)
			continue
		if(dist1(y, elevator.y) > 7)
			return true
	}

	x = ((x + dx) >>> 6)|0
	y = (y >>> 6)|0
	for(let i = y - 2; i < y; ++i) {
		if(isWall(x, i))
			return true
	}
}

const MAXX = MAP_WIDTH * 64 - 1
const MAXY = MAP_HEIGHT * 64 - 1

const noHit = [ 0, Infinity ]
export const castRay = (x1, y1, dx, dy, mask, ignore) => {
	let wallDist = Infinity, spriteDist = Infinity, lightDist = Infinity
	let spriteHit, spritePartHit, lightHit

	x1 = Math.min(MAXX, Math.max(0, x1))
	y1 = Math.min(MAXY, Math.max(0, y1))
	const x2 = Math.min(MAXX, Math.max(0, x1 + dx * 1e5))
	const y2 = Math.min(MAXY, Math.max(0, y1 + dy * 1e5))

	if(mask & HIT_WALL) {
		if(dx != 0) {
			for(let i = x1 >>> 6; i != (x2 >>> 6) + dx; i += dx) {
				if(isWall(i, y1 >>> 6)) {
					wallDist = dist1(i * 64 + 32, x1)
					break
				}
			}
		}
		else {
			for(let i = y1 >>> 6; i != (y2 >>> 6) + dy; i += dy) {
				if(isWall(x1 >>> 6, i)) {
					wallDist = dist1(i * 64 + dy * 32, y1)
					break
				}
			}
		}
	}

	(mask & HIT_LIGHT) && lights.forEach(light => {
		if(light.i > 0 && dist1(y1, light.y) < 32) {
			const dist = dist1(x1, light.x)
			if(dist < lightDist) {
				lightDist = dist
				lightHit = light
			}
		}
	});

	// FIXME: no need to check doors, exclude them from enumeration here
	(mask & HIT_SPRITES) && sprites.forEach(sprite => {
		if((sprite.type & mask) && sprite != ignore) {
			const [ hit, dist ] = sprite.hitTest(x1, y1, x2, y2) ?? noHit
			if(dist < spriteDist) {
				spriteDist = dist
				spriteHit = sprite
				spritePartHit = hit
			}
		}
	});

	if(wallDist <= spriteDist + 32 && wallDist <= lightDist + 32)
		return [ HIT_WALL, wallDist - 1 ]

	if(spriteDist < lightDist)
		return [ spritePartHit, spriteDist, spriteHit ]

	if(lightDist < Infinity)
		return [ HIT_LIGHT, lightDist, lightHit ]

	return noHit
}

export const addSprite = sprite => {
	sprites.push(sprite)
	spritesDirty = true
	return sprite
}

export const removeSprite = sprite => {
	spritesDirty = true
	sprites.splice(sprites.indexOf(sprite), 1)
}

export const getDoorAt = (x, y) => {
	for(const door of doors) {
		if(pointInBox(x, y, door.l, door.t, door.r, door.b))
			return door
	}
}

let currentBullet = 0
export const getBullet = () => bullets[currentBullet++ % bullets.length]

export const respawn = newCat => {
	player = addSprite(new Player(player.buf, ...playerSpawn))
	if(newCat) {
		const door = randomItem(doors.filter(d => d.color == 'G'))
		door.close()
		door.cat = true
	}
}

let spritesDirty = true
export const tick = dt => {
	if(spritesDirty) {
		sprites.sort((a, b) => a.z - b.z)
		spritesDirty = false
	}
	sprites.forEach(s => s.tick(dt))
	tickFlash(dt)
}

export const init = (tiles, playerSprite, mobSprites, doorSprites, elevatorSprite, bulletSprite, signSprite) => {
	doorSprites = createSpriteBuffer([
		doorSprites.reduce((a, d) => (a.push(...d[0]), a), []),
		doorSprites.reduce((a, d) => (a.push(...d[1]), a), [])
	])
	elevatorSprite = createSpriteBuffer(elevatorSprite)

	const level = generateBuilding()
	const doorColors = 'NRBGX'

	level.forEach((t, i) => {
		const x = i % MAP_WIDTH
		const y = (i / MAP_WIDTH)|0
		const worldX = x * 64
		const worldY = y * 64

		if(t == 'P') {
			playerSpawn = [ worldX, worldY + 63 ]
			player = addSprite(new Player(createSpriteBuffer(playerSprite, true), worldX, worldY + 63, [ 'N' ]))
			t = ' '
		}
		else if(t == '!') {
			const e = addSprite(new Elevator(elevatorSprite, worldX + 64, worldY + 64))
			lights.push(e.light)
			elevators.push(e)
			t = '|'
		}
		else if(t == '^') {
			lights.push(Light(
				LIGHT_DOWN,
				worldX + 32,
				worldY + 2,
				48, 256, .8, .9, 1, 1
			))
			t = ' '
		}
		else if(t == 'v') {
			Light(
				LIGHT_UP,
				worldX + 32,
				worldY + 62,
				16, 256, 1, .9, .8, 1
			)
			t = ' '
		}
		else if(doorColors.indexOf(t) >= 0) {
			doors.push(addSprite(new Door(
				doorSprites,
				worldX + 32,
				worldY + 63,
				t,
				doorColors.indexOf(t),
				Math.random() > .5
			)))
			t = ' '
		}
		else if('TtSs'.indexOf(t) >= 0 && level[(y + 1) * MAP_WIDTH + x] == '=') {
			const w = 'tS'.indexOf(t) >= 0 ? 63 : 0
			stairs.push(Stairs('TtSs'.indexOf(t), worldX + w, worldY + 63))
		}

		let tileId = TILEID.indexOf(t)

		// random picture
		tileId += (t == '?') * (Math.random() * (TILES.length - tileId))|0

		const traits = TILES[tileId]
		set(x, y, Tile(traits, worldX, worldY))

		traits[TRAITS_LIGHT] && Light(
			LIGHT_OMNI,
			worldX + 32,
			worldY + 32,
			...traits[TRAITS_LIGHT]
		)
	})

	mob.init(createSpriteBuffer(mobSprites, true))

	addSprite(new Sprite(createSpriteBuffer(signSprite), 1824, MAXY - 160))

	bulletSprite = createSpriteBuffer(bulletSprite)
	for(let i = 0; i < 12; ++i)
		bullets.push(addSprite(new Bullet(bulletSprite)))

	// place keys
	Array.from(doorColors.substring(1)).forEach((k, i) => randomItem(
		doors.filter(d => doorColors.indexOf(d.color) == i)
	).key = k)

	// place manny
	randomItem(doors.filter(d => !d.key && d.y < 512 && d.color == 'G')).cat = true

	// place up to 2 extra lives
	randomItem(doors.filter(d => !d.key && !d.cat)).life = true
	randomItem(doors.filter(d => !d.key && !d.cat)).life = true

	buildMap(map, tiles)
}
