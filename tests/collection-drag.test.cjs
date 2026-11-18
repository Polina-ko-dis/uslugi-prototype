const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const script = new vm.Script(fs.readFileSync(path.join(__dirname, '../proto-logic.js'), 'utf8'));

function events() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    emit(type, properties = {}) {
      const event = {
        pointerType: 'mouse', pointerId: 1, isPrimary: true, button: 0, buttons: 1,
        clientX: 300, clientY: 100, detail: 1, cancelable: true, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        stopImmediatePropagation() { this.stopped = true; },
        ...properties
      };
      for (const listener of listeners.get(type) || []) {
        listener(event);
        if (event.stopped) break;
      }
      return event;
    }
  };
}

function fixture({ mouseDrag = true } = {}) {
  const document = Object.assign(events(), {
    body: { getAttribute(name) { return name === 'data-collection-drag' && mouseDrag ? 'mouse' : null; } },
    head: { appendChild() {} },
    createElement() { return {}; }
  });
  const window = Object.assign(events(), { CAT: {}, setTimeout, clearTimeout });
  const attributes = new Map();
  const row = {
    scrollLeft: 100, scrollWidth: 2000, clientWidth: 700,
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
    setPointerCapture(id) { this.capture = id; },
    hasPointerCapture(id) { return this.capture === id; },
    releasePointerCapture() { this.capture = null; },
    closest(selector) { return selector === '.pop-row' ? this : null; },
    contains(target) { return target === this || target.row === this; }
  };
  const card = { row, closest(selector) { return selector === '.pop-row' ? row : null; } };
  const outside = { closest() { return null; } };
  script.runInNewContext({ window, document, location: { search: '' }, URLSearchParams,
    localStorage: { getItem() { return null; } }, setTimeout, clearTimeout });
  const emit = (type, properties) => document.emit(type, { target: card, ...properties });
  return { row, card, outside, emit, window };
}

test('dragging a service image moves the collection by the pointer distance', () => {
  const { row, emit } = fixture();
  emit('pointerdown');
  const move = emit('pointermove', { clientX: 140 });
  assert.equal(row.scrollLeft, 260);
  assert.equal(move.defaultPrevented, true);
});

test('the mobile version has no custom mouse drag or native gesture interception', () => {
  const { row, emit } = fixture({ mouseDrag: false });
  emit('pointerdown');
  const move = emit('pointermove', { clientX: 140 });
  emit('pointerup', { buttons: 0 });
  assert.equal(row.scrollLeft, 100);
  assert.equal(move.defaultPrevented, false);
  assert.equal(emit('click').defaultPrevented, false);
  assert.equal(emit('dragstart').defaultPrevented, false);
});

test('small hand movement preserves an ordinary card click', () => {
  const { row, emit } = fixture();
  emit('pointerdown');
  emit('pointermove', { clientX: 297 });
  emit('pointerup', { clientX: 297, buttons: 0 });
  assert.equal(row.scrollLeft, 100);
  assert.equal(emit('click').defaultPrevented, false);
});

test('release after a drag cannot activate a service or add button', () => {
  const { emit } = fixture();
  emit('pointerdown');
  emit('pointermove', { clientX: 140 });
  emit('pointerup', { clientX: 140, buttons: 0 });
  const click = emit('click');
  assert.equal(click.defaultPrevented, true);
  assert.equal(click.stopped, true);
});

test('the next intentional click works immediately after a drag', () => {
  const { emit } = fixture();
  emit('pointerdown');
  emit('pointermove', { clientX: 140 });
  emit('pointerup', { buttons: 0 });
  emit('pointerdown');
  emit('pointerup', { buttons: 0 });
  assert.equal(emit('click').defaultPrevented, false);
});

test('releasing outside the collection ends the drag', () => {
  const { row, outside, emit } = fixture();
  emit('pointerdown');
  emit('pointermove', { clientX: 140 });
  emit('pointerup', { target: outside, buttons: 0 });
  emit('pointermove', { clientX: 80 });
  assert.equal(row.scrollLeft, 260);
});

for (const reason of ['pointercancel', 'lostpointercapture', 'blur']) {
  test(`${reason} ends dragging without leaving a stuck gesture`, () => {
    const { row, emit, window } = fixture();
    emit('pointerdown');
    emit('pointermove', { clientX: 140 });
    if (reason === 'blur') window.emit(reason); else emit(reason);
    emit('pointermove', { clientX: 80 });
    assert.equal(row.scrollLeft, 260);
  });
}

for (const properties of [{ pointerType: 'touch' }, { button: 2 }, { isPrimary: false }, { ctrlKey: true }]) {
  test(`native interaction is preserved for ${JSON.stringify(properties)}`, () => {
    const { row, emit } = fixture();
    emit('pointerdown', properties);
    const move = emit('pointermove', { clientX: 140, ...properties });
    emit('pointerup', { buttons: 0, ...properties });
    assert.equal(row.scrollLeft, 100);
    assert.equal(move.defaultPrevented, false);
    assert.equal(emit('click').defaultPrevented, false);
  });
}

test('vertical movement is not intercepted as horizontal dragging', () => {
  const { row, emit } = fixture();
  emit('pointerdown');
  const move = emit('pointermove', { clientX: 290, clientY: 180 });
  assert.equal(row.scrollLeft, 100);
  assert.equal(move.defaultPrevented, false);
});

test('native image dragging is prevented only inside a collection', () => {
  const { emit, outside } = fixture();
  assert.equal(emit('dragstart').defaultPrevented, true);
  assert.equal(emit('dragstart', { target: outside }).defaultPrevented, false);
});
