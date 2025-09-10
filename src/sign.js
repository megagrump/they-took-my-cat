import {
	svg,
	render,
	text,
	sobel,
} from './graphics.js'

export const genSign = async () => {
	const sign = await render(svg(500, 120,
		text("PET &amp; WILDLIFE", 250, 40, 's', '#fb8')
		+ text("SNATCHERS INC.", 250, 90, 's', '#fb8')
	))

	return [ [ sign ], [ sobel(sign, 1, 10) ] ]
}
