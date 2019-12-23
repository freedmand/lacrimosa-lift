function symmod(a, b) {
  if (a < 0) {
    a += Math.ceil(-a / b) * b;
  }
  return ((a + Math.floor(b / 2)) % b) - Math.floor(b / 2);
}

class Interval {
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
  }

  equals(other) {
    return this.y == other.y;
  }

  static between(noteName1, noteName2) {
    return Note.getInterval(Note.fromName(noteName1), Note.fromName(noteName2));
  }

  static unison() {
    return Interval.between('C0', 'C0');
  }

  static aug1() {
    return Interval.between('C0', 'C#0');
  }

  static min2() {
    return Interval.between('C0', 'Db0');
  }

  static min3() {
    return Interval.between('C0', 'Eb0');
  }

  static maj3() {
    return Interval.between('C0', 'E0');
  }

  static fourth() {
    return Interval.between('C0', 'F0');
  }

  static fifth() {
    return Interval.between('C0', 'G0');
  }

  static min7() {
    return Interval.between('C0', 'Bb1');
  }

  static maj7() {
    return Interval.between('C0', 'B1');
  }
}

class Note {
  constructor({ x, y }) {
    this.x = x;
    this.y = y;

    this.deriveNAO();
  }

  static fromInterval(baseNote, interval) {
    return new Note({
      x: baseNote.x + interval.x,
      y: baseNote.y + interval.y,
    });
  }

  static getInterval(note1, note2) {
    return new Interval({
      x: note2.x - note1.x,
      y: note2.y - note1.y
    })
  }

  static fromName(noteName) {
    const baseNote = noteName.substring(0, 1).toUpperCase().charCodeAt(0) - 'D'.charCodeAt(0);
    if (baseNote > 3 || baseNote < -3) throw new Error("INVALID");
    const remainder = noteName.substring(1);
    const parts = remainder.split(/([-0-9]+)/);
    const accidentals = parts[0];
    const octave = parseInt(parts[1]);
    let accidental = 0;
    for (let i = 0; i < accidentals.length; i++) {
      if (accidentals.charAt(i) == 'b') {
        accidental--;
      } else if (accidentals.charAt(i) == '#') {
        accidental++
      } else {
        throw new Error("INVALID ACCIDENTAL");
      }
    }

    return Note.fromNAO(baseNote, accidental, octave);
  }

  equivalentNote(other) {
    return symmod(this.y - other.y, 12) == 0;
  }

  static fromNAO(n, a, o) {
    return new Note(Note.deriveXY(n, a, o));
  }

  static deriveXY(n, a, o) {
    return {
      x: symmod(-3 * n, 11) - 11 * a + o,
      y: symmod(2 * n, 7) + 7 * a,
    };
  }

  deriveNAO() {
    this.n = symmod(11 * this.y, 7);
    this.a = Math.round(this.y / 7);
    this.o = Math.round(11 * this.y / 7) + this.x;
  }

  baseName() {
    let note = String.fromCharCode('D'.charCodeAt(0) + this.n);
    if (this.a > 0) {
      note += '#'.repeat(this.a);
    } else if (this.a < 0) {
      note += 'b'.repeat(-this.a);
    }
    return note;
  }

  equals(other) {
    return this.x == other.x && this.y == other.y;
  }

  toString() {
    return `${this.baseName()}${this.o}`;
  }
}


class Chord {
  constructor({ chordTemplate, notes, root, bass, treble, quality }) {
    this.chordTemplate = chordTemplate;
    this.notes = notes;
    this.root = root;
    this.bass = bass;
    this.treble = treble;
    this.quality = quality;
  }

  matches(chordTemplate) {
    return this.chordTemplate.equals(chordTemplate);
  }

  toString() {
    return `${this.root.baseName()}${this.quality}${this.root.equals(this.root) ? '' : `/${this.bass.baseName()}`} ${this.treble.baseName()}`;
  }
}

class ChordTemplate {
  constructor(intervals, root, treble, quality) {
    this.intervals = intervals;
    this.root = root;
    this.treble = treble;
    this.quality = quality;
  }

  equals(other) {
    if (this.intervals.length != other.intervals.length) return false;
    for (let i = 0; i < this.intervals.length; i++) {
      const i1 = this.intervals[i];
      const i2 = other.intervals[i];
      if (!i1.equals(i2)) return false;
    }
    if (!this.root.equals(other.root)) return false;
    if (!this.treble.equals(other.treble)) return false;
    if (this.quality != other.quality) return false;
    return true;
  }

  static fromNotes(notes, rootNote, trebleNote, quality) {
    const baseNote = Note.fromName(notes[0]);
    return new ChordTemplate(notes.slice(1).map(n => Note.getInterval(baseNote, Note.fromName(n))), Note.getInterval(baseNote, Note.fromName(rootNote)), Note.getInterval(baseNote, Note.fromName(trebleNote)), quality);
  }

  applyToNote(note) {
    return new Chord({
      chordTemplate: this,
      notes: [note, ...this.intervals.map(i => Note.fromInterval(note, i))],
      root: note,
      bass: Note.fromInterval(note, this.root),
      treble: Note.fromInterval(note, this.treble),
      quality: this.quality
    });
  }
}

const minor1 = ChordTemplate.fromNotes(['D0', 'F0', 'A1'], 'D0', 'D1', 'min');
const dom3Over7 = ChordTemplate.fromNotes(['A0', 'C#0', 'E0', 'G0'], 'G-1', 'C#1', '7/3');
const dom5 = ChordTemplate.fromNotes(['A0', 'C#0', 'E0', 'G0'], 'A0', 'E1', '7');
const minor3 = ChordTemplate.fromNotes(['D0', 'F0', 'A1'], 'D0', 'F1', 'min');
const major3 = ChordTemplate.fromNotes(['D0', 'F#0', 'A1'], 'D0', 'F#1', 'maj');
const majorOver3 = ChordTemplate.fromNotes(['D0', 'F#0', 'A1'], 'F#0', 'D1', 'maj/3');
const dim7Over5 = ChordTemplate.fromNotes(['F#-1', 'A0', 'C0', 'Eb0'], 'C0', 'F#1', 'dim7/5');
const aug6 = ChordTemplate.fromNotes(['Bb0', 'D0', 'F0', 'G#0'], 'Bb0', 'G#1', 'aug6');
const min5Over5 = ChordTemplate.fromNotes(['A0', 'C0', 'E0'], 'E-1', 'E1', 'min/5');
const dom3 = ChordTemplate.fromNotes(['A0', 'C#0', 'E0', 'G0'], 'A0', 'C#1', '7');
const cadenceMinor1 = ChordTemplate.fromNotes(['D0', 'F0', 'A1'], 'D0', 'D1', 'min (END)');

class Markov {
  constructor(rootNote, startChord, transitions) {
    this.rootNote = rootNote;
    this.startChord = startChord;
    this.transitions = transitions;

    this.currentChord = this.startChord.applyToNote(this.rootNote);
    this.path = [this.currentChord];
  }

  shortestPath(note, iterations = 100000) {
    let minLength = null;
    let minPath = null;
    for (let i = 0; i < iterations; i++) {
      this.currentChord = this.startChord.applyToNote(this.rootNote);
      this.path = [this.currentChord];
      while (this.nextRandom()) { }
      const lastNote = this.path[this.path.length - 1].root;
      if (lastNote.equivalentNote(note)) {
        if (minLength == null || this.path.length < minLength) {
          minLength = this.path.length;
          minPath = this.path.slice();
        }
      }
    }

    return {
      length: minLength,
      path: minPath
    }
  }

  possibilities() {
    for (let i = 0; i < this.transitions.length; i++) {
      const transition = this.transitions[i];
      const fromChord = transition.from;
      if (this.currentChord.matches(fromChord)) {
        const toChords = transition.to;
        return toChords;
      }
    }
    return [];
  }

  sample() {
    const p = this.possibilities();
    if (p.length == 0) return null;
    return p[Math.floor(Math.random() * p.length)];
  }

  nextRandom() {
    const possibility = this.sample();
    if (possibility == null) return false;

    const newRoot = Note.fromInterval(this.currentChord.root, possibility.degree);
    const newChord = possibility.chord.applyToNote(newRoot);
    this.currentChord = newChord;
    this.path.push(newChord);

    return true;
  }
}

const markov = new Markov(Note.fromName('D0'), minor1, [
  {
    from: minor1,
    to: [
      {
        degree: Interval.fifth(),
        chord: dom5,
      }
    ]
  },
  {
    from: dom5,
    to: [
      {
        degree: Interval.fourth(),
        chord: minor3,
      },
      {
        degree: Interval.fourth(),
        chord: major3
      }
    ],
  },
  {
    from: minor3,
    to: [
      {
        degree: Interval.min7(),
        chord: dom5,
      },
      {
        degree: Interval.unison(),
        chord: dom3Over7,
      }
    ]
  },
  {
    from: major3,
    to: [
      {
        degree: Interval.maj7(),
        chord: dom5
      }
    ]
  },
  {
    from: dom3Over7,
    to: [
      {
        degree: Interval.fourth(),
        chord: majorOver3,
      }
    ]
  },
  {
    from: majorOver3,
    to: [
      {
        degree: Interval.aug1(),
        chord: dim7Over5,
      },
      {
        degree: Interval.min3(),
        chord: aug6,
      }
    ]
  },
  {
    from: dim7Over5,
    to: [
      {
        degree: Interval.min2(),
        chord: majorOver3,
      }
    ]
  },
  {
    from: aug6,
    to: [
      {
        degree: Interval.maj3(),
        chord: min5Over5
      }
    ]
  },
  {
    from: min5Over5,
    to: [
      {
        degree: Interval.fifth(),
        chord: dom3
      }
    ]
  },
  {
    from: dom3,
    to: [
      {
        degree: Interval.fourth(),
        chord: cadenceMinor1,
        end: true
      }
    ]
  }
]);

for (let i = -6; i <= 6; i++) {
  const note = new Note({ x: 0, y: i });
  console.log(note.baseName());

  const { length, path } = markov.shortestPath(note);

  console.log('Found path with length:', length);
  console.log(path.map(c => c.toString()));

  console.log('\n\n\n');
}
