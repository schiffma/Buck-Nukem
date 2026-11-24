"""Import a melody-only MIDI file as a song note list for src/audio.js.

Usage: python tools/midi_melody.py clarinet-polka.mid > melody.js

Used once for the clubhouse's Clarinet Polka (flutetunes.com, "clarinet-polka.mid", a melody-only
flute part of the traditional tune). The MIDI file itself is not part of the repository; the
output (CLARINET_POLKA_TUNE and CLARINET_POLKA_KEYS) is pasted into src/audio.js.

The grid is twelve steps per quarter note (32 ticks at 384 ticks per quarter), so sixteenths
(3 steps) and sixteenth-note triplets (2 steps) both fit; a 2/4 bar is 24 steps. A leading
pick-up (notes before the first full bar) is moved to the end of the last bar, where the
tune's last note leaves room, so the song loops without a gap.
"""
import struct
import sys

NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
KEY_BY_FLATS = {0: "C", -1: "F", -2: "Bb", -3: "Eb", -4: "Ab", 1: "G", 2: "D", 3: "A"}


def vlq(d, i):
    v = 0
    while True:
        b = d[i]
        i += 1
        v = (v << 7) | (b & 0x7F)
        if not b & 0x80:
            return v, i


def read_midi(path):
    """-> (ticks per quarter, [(start, length, pitch)], [(tick, key name)], beats per bar)"""
    data = open(path, "rb").read()
    if data[:4] != b"MThd":
        raise SystemExit("not a MIDI file")
    _, ntr, div = struct.unpack(">HHH", data[8:14])
    i, notes, keys, beats = 14, [], [], 2
    for _ in range(ntr):
        if data[i:i + 4] != b"MTrk":
            raise SystemExit("bad track")
        ln = struct.unpack(">I", data[i + 4:i + 8])[0]
        j, end, t, run, on = i + 8, i + 8 + ln, 0, None, {}
        while j < end:
            dt, j = vlq(data, j)
            t += dt
            st = data[j]
            if st & 0x80:
                j += 1
                run = st
            else:
                st = run
            if st == 0xFF:
                typ = data[j]
                l, j = vlq(data, j + 1)
                body = data[j:j + l]
                j += l
                if typ == 0x59:
                    keys.append((t, KEY_BY_FLATS.get(struct.unpack("b", body[:1])[0], "?")))
                elif typ == 0x58:
                    beats = body[0]
            elif st in (0xF0, 0xF7):
                l, j = vlq(data, j)
                j += l
            else:
                hi = st & 0xF0
                if hi in (0xC0, 0xD0):
                    j += 1
                    continue
                a, b = data[j], data[j + 1]
                j += 2
                if hi == 0x90 and b > 0:
                    on[a] = t
                elif hi == 0x80 or (hi == 0x90 and b == 0):
                    s0 = on.pop(a, None)
                    if s0 is not None:
                        notes.append((s0, t - s0, a))
        i = end
    notes.sort()
    return div, notes, keys, beats


def to_bars(path):
    div, notes, keys, beats = read_midi(path)
    step = div // 12                                   # 12 steps per quarter
    bar = beats * div
    first_bar = notes[0][0] // bar                     # the bar holding the pick-up
    pickup = [n for n in notes if n[0] < (first_bar + 1) * bar and n[0] % bar != 0] if notes[0][0] % bar else []
    body = [n for n in notes if n not in pickup]
    bars = {}
    for s, l, p in body:
        b = s // bar - (first_bar + (1 if pickup else 0))
        bars.setdefault(b, []).append([(s % bar) // step, p, max(1, round(l / step))])
    nbars = max(bars) + 1
    last_end = max(n[0] + n[2] for n in bars[nbars - 1])
    for s, l, p in pickup:                             # fold the pick-up into the last bar
        st = (s % bar) // step
        if st < last_end:
            raise SystemExit("the pick-up does not fit after the last note")
        bars[nbars - 1].append([st, p, max(1, round(l / step))])
    key_bars = []
    for t, k in keys:
        b = max(0, t // bar - (first_bar + (1 if pickup else 0)))
        if not key_bars or key_bars[-1][1] != k:
            key_bars.append([b, k])
    return [bars.get(b, []) for b in range(nbars)], key_bars, len(notes), beats * 12, notes


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    tune, keys, count, steps_per_bar, notes = to_bars(sys.argv[1])
    first = " ".join(NAMES[p % 12] + str(p // 12 - 1) for _, _, p in notes[:6])
    print(f"// {count} notes, {len(tune)} bars of {steps_per_bar} steps; first notes {first}")
    print("const CLARINET_POLKA_TUNE = [")
    for b, notes_ in enumerate(tune):
        print("  " + str(notes_).replace(" ", "") + ",   // " + str(b + 1))
    print("];")
    print("const CLARINET_POLKA_KEYS = " + str(keys).replace("'", '"') + ";   // [first bar (0-based), key]")


if __name__ == "__main__":
    main()
