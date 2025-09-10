import { gl } from './display.js'

const TRIANGLE_FAN = 0x0006
const FLOAT = 0x1406
const ARRAY_BUFFER = 0x8892
const DYNAMIC_DRAW = 0x88e8

export class GeomBuffer {
	constructor(attributes, maxInstances, instanceSize, vertices) {
		const size = maxInstances * instanceSize + vertices.byteLength
		this._numVertices = vertices.byteLength / attributes[0][1]
		this._numInstances = 0
		this._instanceStart = vertices.length
		this._instanceSize = instanceSize >> 2
		this._data = new Float32Array(size >> 2)
		this._data.set(vertices)
		this._dirty = true

		this._vao = gl.createVertexArray()
		gl.bindVertexArray(this._vao)
		this._buffer = gl.createBuffer()
		gl.bindBuffer(ARRAY_BUFFER, this._buffer)
		attributes.forEach((a, index) => {
			gl.enableVertexAttribArray(index)
			gl.vertexAttribPointer(index, a[0], FLOAT, false, a[1], a[2])
			gl.vertexAttribDivisor(index, a[3] ?? 0)
		})

		gl.bufferData(ARRAY_BUFFER, size, DYNAMIC_DRAW)
		gl.bufferSubData(ARRAY_BUFFER, 0, this._data, 0)
		gl.bindVertexArray(null)
	}

	draw() {
		gl.bindVertexArray(this._vao)
		if(this._dirty) {
			gl.bindBuffer(ARRAY_BUFFER, this._buffer)
			gl.bufferSubData(ARRAY_BUFFER, 0, this._data, 0)
			this._dirty = false
		}
		gl.drawArraysInstanced(TRIANGLE_FAN, 0, this._numVertices, this._numInstances)
	}

	_addInstance(data) {
		return this._setInstanceData(this._numInstances++, data)
	}

	_setInstanceData(instance, data) {
		this._data.set(data, this._instanceStart + instance * this._instanceSize)
		this._dirty = true
		return instance
	}
}
