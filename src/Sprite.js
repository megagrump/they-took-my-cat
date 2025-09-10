import { ANIM_IDLE } from './Dude.js'
import { SPRBUF_FRAMES, SPRBUF_HEIGHT, SPRBUF_WIDTH } from './Renderer.js'

const ANIMRATE = 1/30

export class Sprite {
	constructor(buf, x, y, z = 0, moveSpeed = 0) {
		this.buf = buf
		this.x = x
		this.y = y
		this.z = z
		this._moveSpeed = moveSpeed

		// pivot
		this.px = (buf[SPRBUF_WIDTH] * .5)|0
		this.py = (buf[SPRBUF_HEIGHT] * .5)|0

		this.flip = 0
		this.alpha = 1
		this.setAnim(0)
		this._animTime = 0
	}

	get l() { return (this.x - this.px)|0 }
	get t() { return (this.y - this.py)|0 }
	get r() { return this.l + this.buf[SPRBUF_WIDTH] }
	get b() { return this.t + this.buf[SPRBUF_HEIGHT] }
	get f() { return this._frame + this._baseFrame }

	tick() { }

	move(dx, dy, dt) {
		this.x += dx * this._moveSpeed * dt
		this.y += dy * this._moveSpeed * dt
	}

	setAnim(anim) {
		if(anim == this._anim)
			return;

		this._anim = anim
		this._frame = anim == ANIM_IDLE ? (Math.random() * this.buf[SPRBUF_FRAMES][anim])|0 : 0
		this._baseFrame = 0
		for(let i = 0; i < anim; ++i) {
			this._baseFrame += this.buf[SPRBUF_FRAMES][i]
		}
	}

	_animate(dt, once, reverse) {
		this._animTime += dt
		if(this._animTime < ANIMRATE)
			return;
		this._animTime -= ANIMRATE

		if(once) {
			this._frame = Math.min((this._frame + 1), this.buf[SPRBUF_FRAMES][this._anim] - 1)
		}
		else {
			if(reverse)
				this._frame = --this._frame >= 0 ? this._frame : this.buf[SPRBUF_FRAMES][this._anim] - 1
			else
				this._frame = ++this._frame % this.buf[SPRBUF_FRAMES][this._anim]
		}
	}
}
