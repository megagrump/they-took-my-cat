import { geomLight } from './Renderer.js'

export const LIGHT_OMNI = 0
export const LIGHT_DOWN = 1
export const LIGHT_UP = 2

export const Light = (type, x, y, z, radius, r, g, b, intens) => {
	const id = geomLight.add(type, x, y, z, radius, r, g, b, intens)

	const update = () => geomLight._setInstanceData(id, [ x, y, z, radius, r, g, b, intens ])

	return {
		get type() { return type },
		get x() { return x },
		get y() { return y },
		get i() { return intens },
		set i(i) {
			if(i != intens) {
				intens = i;
				update()
			}
		},

		pos: (_x, _y) => {
			if(x != _x || y != _y) {
				x = _x
				y = _y
				update()
			}
		},
	}
}
