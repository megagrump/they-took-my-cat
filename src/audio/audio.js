import CPlayer from './soundbox.js'
import music from './music.js'
import shot from './shot.js'
import shatter from './shatter.js'
import die from './die.js'
import victory from './victory.js'
import hit from './hit.js'
import elevator from './elevator.js'
import ding from './ding.js'
import scream from './scream.js'
import crush from './crush.js'

const NullPlayer = () => context => context.createBuffer(2, 2, 44100)

export const sounds = [
	music,
	shot,
	shatter,
	die,
	victory,
	hit,
	elevator,
	ding,
	scream,
	crush,
].map(s => CPlayer(s))

export const SOUND_MUSIC = 0
export const SOUND_SHOT = 1
export const SOUND_SHATTER = 2
export const SOUND_DIE = 3
export const SOUND_VICTORY = 4
export const SOUND_HIT = 5
export const SOUND_ELEVATOR = 6
export const SOUND_DING = 7
export const SOUND_SCREAM = 8
export const SOUND_CRUSH = 9

export const genAudio = () => new Promise(resolve => {
	const context = new AudioContext()
	let current = 0

	const generator = () => {
		const buffer = sounds[current](context)
		if(buffer) {
			sounds[current++] = () => {
				context.state == 'suspended' && context.resume()
				const source = new AudioBufferSourceNode(context, { buffer, loop: buffer.duration > 20 })
				const gain = context.createGain()
				source.connect(gain).connect(context.destination)
				source.start()
				return [ source, gain ]
			}

			if(!sounds[current])
				return resolve()
		}

		requestAnimationFrame(generator)
	}

	requestAnimationFrame(generator)
})
