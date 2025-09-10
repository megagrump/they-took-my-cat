import * as camera from './camera.js'
import * as world from './world.js'
import * as mob from './Mob.js'
import { render } from './Renderer.js'
import { showText, addToHud, removeFromHud } from './display.js'
import { sounds, SOUND_MUSIC, SOUND_VICTORY } from './audio/audio.js'
import { handleInput } from './input.js'
import { identity } from './helper.js'

export const GRAVITY = 20 * 64
export const LETHAL_FALL_DISTANCE = 4 * 64
export const inventory = [ 'N' ]
export let time

let music
let running
let lives = 3

export const start = () => {
	time = 0
	music = sounds[SOUND_MUSIC]()

	p_t.style.display = 'none'
	p_c.style.display = 'block'
	showText('Locate and rescue Manny 🐈‍⬛')
	addToHud(`<span style="background-color:#888">🔑</span>`)
	for(let i = 0; i < lives; ++i)
		addToHud('🧡', true)
}

export let tick = dt => {
	time += dt

	handleInput(world.player)
	camera.tick(dt)
	world.tick(dt)
	mob.tick(dt)

	render()
}

export const respawn = () => {
	const newCat = inventory.indexOf('C') >= 0
	if(newCat) {
		inventory.splice(inventory.indexOf('C'), 1)
		removeFromHud('🐈‍⬛')
		showText('They took your cat again!')
	}

	world.respawn(newCat)
}

export const gameOver = lost => {
	music[0].stop()
	!lost && sounds[SOUND_VICTORY]()
	tick = identity
	p_ui.style.backgroundColor = '#0008'
	p_ui.style.pointerEvents = 'auto'
	p_ui.innerHTML =
		`<div><b>${lost ? "YOU FAILED" : "YOU RESCUED MANNY! 🐈‍⬛"}</b></div>`
		+ `<div><a href="javascript:window.location.reload()">Play again</a></div>`
}

export const changeLives = d => {
	lives += d
	if(lives < 0)
		return gameOver(true)
	d > 0 ?	addToHud('🧡', true) : removeFromHud('🧡')
	return true
}
