import { identity } from './helper.js'

const BUILDING = [
	'===============================================',
	'=                       ||d                   =',
	'=                       ||                    =',
	'=    G   G   G   G      ||   G   G   G   G    =',
	'========================||=====================',
	'=                       ||c                   =',
	'=                       ||                    =',
	'=    G   G   G   G      ||   G   G   G   G    =',
	'===============================================',
	'=         ||b           =                     =',
	'=         ||            =                     =',
	'=   G  G  ||    G    G  = G    G    G   T     =',
	'==========||===================================',
	'=         ||a           =         a||         =',
	'=         ||            =          ||         =',
	'=   G  G  ||    G    G  = R    R   || G T     =',
	'==========||=======================||==========',
	'=         ||9           ||        9||         =',
	'=         ||            ||         ||         =',
	'=   G  G  ||    R    R  ||     R   ||         =',
	'========================||=========||==========',
	'=         ||8           ||        8||         =',
	'=         ||            ||         ||         =',
	'=   G  G  ||    R    R  ||     R   || R T     =',
	'==========||===================================',
	'=         ||7            =                    =',
	'=         ||             =                    =',
	'=   G  G  ||    R    R   =  G    R      T     =',
	'==========||===================================',
	'=         ||6                    6||          =',
	'=         ||                      ||          =',
	'=     R   ||    R    R    R    R  ||          =',
	'==================================||===========',
	'=                      =         5||          =',
	'=                      =          ||          =',
	'=         G    G   B   =   B   G  ||  G       =',
	'==================================||===========',
	'=                                4||          =',
	'=                                 ||          =',
	'=    N  S  N    N     B    N   N  || N  N     =',
	'===============================================',
	'=           =        3||3                     =',
	'=           =         ||                      =',
	'=       N N =  B      ||   B    B    B  T     =',
	'======================||=======================',
	'=                    2||2                     =',
	'=                     ||                      =',
	'=     S N  R    R     ||   B    B    B   B    =',
	'======================||=======================',
	'=                    1||1                     =',
	'=                     ||                      =',
	'=       B   B   B     ||    N   N    N  T     =',
	'===============================================',
	'=                  =                          =',
	'=                  =                          =',
	'=  N  S  N   N   N =  XP v v v v        T     =',
	'===============================================',
]

export const MAP_WIDTH = BUILDING[0].length
export const MAP_HEIGHT = BUILDING.length

export const generateBuilding = () => {
	const level = [...BUILDING.join('')]

	const get = (x, y) => level[y * MAP_WIDTH + x]
	const set = (x, y, val) => Array.from(val).forEach((c, i) => level[y * MAP_WIDTH + x + i] = c)

	const generators = [
		(x, y) => { // S: stairs left
			set(--x, y--, '+')
			set(--x, y--, '+Ss')
			set(--x, y--, '+Ss^')
			set(  x, --y, 's')
		},

		(x, y) => { // T: stairs right
			set(++x, y--, '-')
			set(--x, y--, 'tT-')
			set(x++, y--, '^tT-')
			set(x + 2, --y, 't')
		},

		(x, y) => { // ' ': back wall
			// floor indicators
			if((x == 1 || x == MAP_WIDTH - 2) && y % 4 == 1) {
				return set(x, y, '0123456789abcd'[((MAP_HEIGHT - y) >> 2) - 1])
			}

			// ceiling lights
			if(y % 4 == 1 && x % 6 == 4)
				return set(x, y, '^')

			// pictures
			Math.random() < .7
			&& (y % 4 == 2 && x > 2 && x < MAP_WIDTH - 4)
			&& get(x - 1, y)
				+ get(x - 1, y + 1)
				+ get(x,     y + 1)
				+ get(x + 1, y + 1)
				+ get(x + 1, y) == '     '
			&& set(x, y, '?')
		},

		(x, y) => { // |: elevator shaft
			// elevators
			(get(x, y + 1) + get(x + 1, y) == '=|')
			&& set(x, y, '!')
		},
	]

	level.forEach((e, i) => {
		(generators['ST |'.indexOf(e)] ?? identity)(i % MAP_WIDTH, (i / MAP_WIDTH)|0)
	})

	return level
}
