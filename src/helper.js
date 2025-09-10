export const identity = a => a

export const easeLinear = (a, b, dt) => (1 - dt) * a + dt * b

export const easeCosine = (a, b, dt) => easeLinear(a, b, (1 - Math.cos(dt * Math.PI)) * .5)

export const sampleArray = (values, ratio, ease = easeLinear) => {
	const max = values.length - 1
	const index = Math.min(Math.max(0, max - 1), (ratio * max)|0)
	return ease(values[index], values[index + 1], (ratio * max) - index)
}

export const randomItem = a => a[(Math.random() * a.length)|0]

export const pointInBox = (x, y, l, t, r, b) => !(l > x || t > y || r < x || b < y)

export const dist1 = (a, b) => Math.abs(a - b)

export const dist2sq = (x1, y1, x2, y2) => (x1 - x2)**2 + (y1 - y2)**2
