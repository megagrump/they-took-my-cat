const STAIRS_DIRECTIONS = [
	[ 1, -1], // right up
	[-1,  1], // right down
	[-1, -1], // left up
	[ 1,  1], // left down
]

export const Stairs = (direction, x, y) => [ STAIRS_DIRECTIONS[direction], x, y ]
