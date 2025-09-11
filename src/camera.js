import { resX, resY } from './display.js'
import { dist1 } from './helper.js'
import { player } from './world.js'
import { MAP_WIDTH, MAP_HEIGHT } from './building.js'

const ww = MAP_WIDTH * 64, wh = MAP_HEIGHT * 64
const midX = resX * .5, midY = resY * .5

const boundsLeft = -Math.max(0, midX - ww * .5)
const boundsTop = -Math.max(0, midY - wh * .5)
const boundsRight = ww - resX
const boundsBottom = wh - resY

const interp = (v, target, step) => v + Math.sign(target - v) * Math.min(dist1(target, v), step)

const calcTarget = (px, py) => [
	Math.max(boundsLeft, Math.min(boundsRight, px - midX)),
	Math.max(boundsTop, Math.min(boundsBottom, py - 96 - midY))
]

let [ x, y ] = calcTarget(0, wh)
let right = x + resX, bottom = y + resY
let targetX = x, targetY = y
let shakeVal = 0

export const getX = () => Math.round(x)

export const getY = () => Math.round(y)

export const shake = () => shakeVal = 1

export const tick = dt => {
	[ targetX, targetY ] = calcTarget(player.x, player.y)
	const move = 1.8 ** Math.log((targetX - x)**2 + (targetY - y)**2 + 1)

	x = interp(x, targetX, move * dt) + shakeVal * (1 - 2 * Math.random()) * 4
	y = interp(y, targetY, move * dt) + shakeVal * (1 - 2 * Math.random()) * 4
	right = x + resX
	bottom = y + resY
	shakeVal = Math.max(0, shakeVal - dt)
}

export const isVisible = sprite => !(y > sprite.b || bottom < sprite.t || x > sprite.r || right < sprite.l)

export const isFullyVisible = sprite => sprite.t >= y && sprite.b <= bottom && sprite.l >= x && sprite.r <= right
