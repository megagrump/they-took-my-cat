export const KEY_DOWN = 0
export const KEY_UP = 1
export const KEY_LEFT = 2
export const KEY_RIGHT = 3
export const KEY_FIRE = 4

export const keys =    [ 0, 0, 0, 0, 0 ]
export const oldKeys = [ 0, 0, 0, 0, 0 ]

const bindings = [
	'owDown', 'S',
	'owUp', 'W',
	'owLeft', 'A',
	'owRight', 'D',
	'ce', 'X'
]

const handler = stateValue => ev => {
	const b = bindings.indexOf(ev.code.substr(3)) >>> 1
	if(b <= KEY_FIRE) {
		keys[b] = stateValue
		ev.preventDefault()
	}
}

document.onkeydown = handler(1)
document.onkeyup = handler(0)

export const handleInput = player => {
	for(let k = KEY_DOWN; k <= KEY_FIRE; ++k) {
		keys[k] != oldKeys[k] && !oldKeys[k] &&	!player.dead && player.keyPressed(k)
		oldKeys[k] = keys[k]
	}
}
