import './display.js'
import * as game from './game.js'
import * as world from './world.js'
import { genTiles } from './Tile.js'
import { genDude } from './Dude.js'
import { genDoor } from './Door.js'
import { genElevator } from './Elevator.js'
import { genBullet } from './Bullet.js'
import { genSign } from './sign.js'
import { genAudio } from './audio/audio.js'

requestAnimationFrame(async time => {
	world.init(...await Promise.all([
		genTiles(),
		genDude(0),
		genDude(1),
		Promise.all([
			genDoor('N'),
			genDoor('R'),
			genDoor('B'),
			genDoor('G'),
			genDoor('X'),
		]),
		genElevator(),
		genBullet(),
		genSign(),
		genAudio(),
	]))

	const frame = t => {
		document.hasFocus() && game.tick(Math.min(1/30, (t - time) * .001))
		time = t
		requestAnimationFrame(frame)
	}

	p_l.innerHTML = '<b style="cursor:pointer;"><u>START GAME</u></b>'
	p_l.onclick = () => { game.start(); requestAnimationFrame(frame) }
})
