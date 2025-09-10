/* -*- mode: javascript; tab-width: 4; indent-tabs-mode: nil; -*-
*
* Copyright (c) 2011-2013 Marcus Geelnard
*
* This software is provided 'as-is', without any express or implied
* warranty. In no event will the authors be held liable for any damages
* arising from the use of this software.
*
* Permission is granted to anyone to use this software for any purpose,
* including commercial applications, and to alter it and redistribute it
* freely, subject to the following restrictions:
*
* 1. The origin of this software must not be misrepresented; you must not
*    claim that you wrote the original software. If you use this software
*    in a product, an acknowledgment in the product documentation would be
*    appreciated but is not required.
*
* 2. Altered source versions must be plainly marked as such, and must not be
*    misrepresented as being the original software.
*
* 3. This notice may not be removed or altered from any source
*    distribution.
*
*/

/*
altered by megagrump to reduce minified size of player and songs
*/

"use strict";

const SONG_DATA = 0
const SONG_ROWLEN = 1
const SONG_PATTERNLEN = 2
const SONG_ENDPATTERN = 3
const SONG_NUMCHANNELS = 4

const INSTRUMENT = 0
const PATTERN = 1
const COLUMN = 2

const NOTES = 0
const EFFECT = 1

export default mSong => {
    //--------------------------------------------------------------------------
    // Private methods
    //--------------------------------------------------------------------------

    // Oscillators
    const osc_sin = value => Math.sin(value * 6.283184);

    const osc_saw = value => 2 * (value % 1) - 1;

    const osc_square = value => (value % 1) < 0.5 ? 1 : -1;

    const osc_tri = value => {
        let v2 = (value % 1) * 4;
        if(v2 < 2) return v2 - 1;
        return 3 - v2;
    };

    const getnotefreq = n => 0.003959503758 * (2 ** ((n - 128) / 12));

    const createNote = (instr, n, rowLen) => {
        let osc1 = mOscillators[instr[INSTRUMENT][0]],
            o1vol = instr[INSTRUMENT][1],
            o1xenv = instr[INSTRUMENT][3]/32,
            osc2 = mOscillators[instr[INSTRUMENT][4]],
            o2vol = instr[INSTRUMENT][5],
            o2xenv = instr[INSTRUMENT][8]/32,
            noiseVol = instr[INSTRUMENT][9],
            attack = instr[INSTRUMENT][10] * instr[INSTRUMENT][10] * 4,
            sustain = instr[INSTRUMENT][11] * instr[INSTRUMENT][11] * 4,
            release = instr[INSTRUMENT][12] * instr[INSTRUMENT][12] * 4,
            releaseInv = 1 / release,
            expDecay = -instr[INSTRUMENT][13]/16,
            arp = instr[INSTRUMENT][14],
            arpInterval = rowLen * (2 **(2 - instr[INSTRUMENT][15]));

        const noteBuf = new Int32Array(attack + sustain + release);

        // Re-trig oscillators
        let c1 = 0, c2 = 0;

        // Local variables.
        let j, j2, e, rsample, o1t, o2t;

        // Generate one note (attack + sustain + release)
        for (j = 0, j2 = 0; j < attack + sustain + release; j++, j2++) {
            if (j2 >= 0) {
                // Switch arpeggio note.
                arp = (arp >> 8) | ((arp & 255) << 4);
                j2 -= arpInterval;

                // Calculate note frequencies for the oscillators
                o1t = getnotefreq(n + (arp & 15) + instr[INSTRUMENT][2] - 128);
                o2t = getnotefreq(n + (arp & 15) + instr[INSTRUMENT][6] - 128) * (1 + 0.0008 * instr[INSTRUMENT][7]);
            }

            // Envelope
            e = 1;
            if (j < attack) {
                e = j / attack;
            } else if (j >= attack + sustain) {
                e = (j - attack - sustain) * releaseInv;
                e = (1 - e) * (3 ** (expDecay * e));
            }

            // Oscillator 1
            c1 += o1t * e ** o1xenv;
            rsample = osc1(c1) * o1vol;

            // Oscillator 2
            c2 += o2t * e ** o2xenv;
            rsample += osc2(c2) * o2vol;

            // Noise oscillator
            if (noiseVol) {
                rsample += (2 * Math.random() - 1) * noiseVol;
            }

            // Add to (mono) channel buffer
            noteBuf[j] = (80 * rsample * e) | 0;
        }

        return noteBuf;
    };


    //--------------------------------------------------------------------------
    // Private members
    //--------------------------------------------------------------------------

    // Array of oscillator functions
    const mOscillators = [
        osc_sin,
        osc_square,
        osc_saw,
        osc_tri
    ];

    //--------------------------------------------------------------------------
    // Initialization
    //--------------------------------------------------------------------------

    // Init iteration state variables
    const mLastRow = mSong[SONG_ENDPATTERN];
    let mCurrentCol = 0;

    // Prepare song info
    const mNumWords =  mSong[SONG_ROWLEN] * mSong[SONG_PATTERNLEN] * (mLastRow + 1) * 2;

    // Create work buffer (initially cleared)
    const mMixBuf = new Int32Array(mNumWords);

    //--------------------------------------------------------------------------
    // Public methods
    //--------------------------------------------------------------------------

    // Generate audio data for a single track
    return context => {
        // Local variables
        let i, j, p, row, col, n, cp,
            k, t, rsample, rowStartSample, f;

        // Put performance critical items in local variables
        const chnBuf = new Int32Array(mNumWords),
            instr = mSong[SONG_DATA][mCurrentCol],
            rowLen = mSong[SONG_ROWLEN],
            patternLen = mSong[SONG_PATTERNLEN];

        // Clear effect state
        let low = 0, band = 0, high;
        let lsample, filterActive = false;

        // Clear note cache.
        let noteCache = [];

         // Patterns
         for (p = 0; p <= mLastRow; ++p) {
            cp = instr[PATTERN][p];

            // Pattern rows
            for (row = 0; row < patternLen; ++row) {
                // Execute effect command.
                const cmdNo = cp ? instr[COLUMN][cp - 1][EFFECT][row] : 0;
                if (cmdNo) {
                    instr[INSTRUMENT][cmdNo - 1] = instr[COLUMN][cp - 1][EFFECT][row + patternLen] || 0;

                    // Clear the note cache since the instrument has changed.
                    if (cmdNo < 17) {
                        noteCache = [];
                    }
                }

                // Put performance critical instrument properties in local variables
                let oscLFO = mOscillators[instr[INSTRUMENT][16]],
                    lfoAmt = instr[INSTRUMENT][17] / 512,
                    lfoFreq = (2 ** (instr[INSTRUMENT][18] - 9)) / rowLen,
                    fxLFO = instr[INSTRUMENT][19],
                    fxFilter = instr[INSTRUMENT][20],
                    fxFreq = instr[INSTRUMENT][21] * 43.23529 * 3.141592 / 44100,
                    q = 1 - instr[INSTRUMENT][22] / 255,
                    dist = instr[INSTRUMENT][23] * 1e-5,
                    drive = instr[INSTRUMENT][24] / 32,
                    panAmt = instr[INSTRUMENT][25] / 512,
                    panFreq = 6.283184 * (2 ** (instr[INSTRUMENT][26] - 9)) / rowLen,
                    dlyAmt = instr[INSTRUMENT][27] / 255,
                    dly = instr[INSTRUMENT][28] * rowLen & ~1;  // Must be an even number

                // Calculate start sample number for this row in the pattern
                rowStartSample = (p * patternLen + row) * rowLen;

                // Generate notes for this pattern row
                for (col = 0; col < 4; ++col) {
                    n = cp ? instr[COLUMN][cp - 1][NOTES][row + col * patternLen] : 0;
                    if (n) {
                        if (!noteCache[n]) {
                            noteCache[n] = createNote(instr, n, rowLen);
                        }

                        // Copy note from the note cache
                        const noteBuf = noteCache[n];
                        for (j = 0, i = rowStartSample * 2; j < noteBuf.length; j++, i += 2) {
                          chnBuf[i] += noteBuf[j];
                        }
                    }
                }

                // Perform effects for this pattern row
                for (j = 0; j < rowLen; j++) {
                    // Dry mono-sample
                    k = (rowStartSample + j) * 2;
                    rsample = chnBuf[k];

                    // We only do effects if we have some sound input
                    if (rsample || filterActive) {
                        // State variable filter
                        f = fxFreq;
                        if (fxLFO) {
                            f *= oscLFO(lfoFreq * k) * lfoAmt + 0.5;
                        }
                        f = 1.5 * Math.sin(f);
                        low += f * band;
                        high = q * (rsample - band) - low;
                        band += f * high;
                        rsample = fxFilter == 3 ? band : fxFilter == 1 ? high : low;

                        // Distortion
                        if (dist) {
                            rsample *= dist;
                            rsample = rsample < 1 ? rsample > -1 ? osc_sin(rsample*.25) : -1 : 1;
                            rsample /= dist;
                        }

                        // Drive
                        rsample *= drive;

                        // Is the filter active (i.e. still audiable)?
                        filterActive = rsample * rsample > 1e-5;

                        // Panning
                        t = Math.sin(panFreq * k) * panAmt + 0.5;
                        lsample = rsample * (1 - t);
                        rsample *= t;
                    } else {
                        lsample = 0;
                    }

                    // Delay is always done, since it does not need sound input
                    if (k >= dly) {
                        // Left channel = left + right[-p] * t
                        lsample += chnBuf[k-dly+1] * dlyAmt;

                        // Right channel = right + left[-p] * t
                        rsample += chnBuf[k-dly] * dlyAmt;
                    }

                    // Store in stereo channel buffer (needed for the delay effect)
                    chnBuf[k] = lsample | 0;
                    chnBuf[k+1] = rsample | 0;

                    // ...and add to stereo mix buffer
                    mMixBuf[k] += lsample | 0;
                    mMixBuf[k+1] += rsample | 0;
                }
            }
        }

        if(++mCurrentCol == mSong[SONG_NUMCHANNELS]) {
            const buffer = context.createBuffer(2, mNumWords / 2, 44100);
            for (let i = 0; i < 2; i ++) {
                const data = buffer.getChannelData(i);
                for (let j = i; j < mNumWords; j += 2) {
                    data[j >> 1] = mMixBuf[j] / 65536;
                }
            }
            return buffer;
        }
    };
};
