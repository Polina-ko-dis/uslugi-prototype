const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function storefront() {
  const storage = new Map();
  const context = vm.createContext({
    URLSearchParams,
    location: { search: '' },
    document: { body: { getAttribute() { return null; } } },
    localStorage: {
      getItem(key) { return storage.get(key) || null; },
      setItem(key, value) { storage.set(key, value); },
      removeItem(key) { storage.delete(key); }
    },
    addEventListener() {}
  });
  context.window = context;
  for (const file of ['catalog.js', 'proto-logic.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  return context;
}

test('mini cards keep booked parameters and multiplied prices from the actual order', () => {
  const app = storefront();
  app.CAT.cart.add('city-tour', '14:00', 3);
  app.CAT.cart.add('city-tour', '14:00', 3);
  app.CAT.cart.placeOrder();

  const result = JSON.parse(JSON.stringify(app.P.successVals()));
  const card = result.orderLines[0];
  assert.equal(card.name, 'Обзорная экскурсия по Москве × 2');
  assert.deepEqual(card.properties, ['Пн, 14 декабря', '14:00', '3 гостя', '3 часа']);
  assert.equal(card.price, '15 000');
  assert.equal(card.currency, '₽');
  assert.equal(result.orderTotal, '15 000 ₽');
});

test('mini cards omit missing parameters and do not append currency to free or quoted services', () => {
  const app = storefront();
  app.CAT.cart.add('pet-bed', '', 1);
  app.CAT.cart.add('banya-wood', '11:00', 4);
  app.CAT.cart.placeOrder();

  const cards = JSON.parse(JSON.stringify(app.P.successVals().orderLines));
  assert.deepEqual(cards[0].properties, ['Пн, 14 декабря', '1 шт.']);
  assert.equal(cards[0].price, 'Бесплатно');
  assert.equal(cards[0].currency, '');
  assert.deepEqual(cards[1].properties, ['Пн, 14 декабря', '11:00', '4 гостя']);
  assert.equal(cards[1].price, 'По запросу');
  assert.equal(cards[1].currency, '');
});

test('removing a cart mini card deletes all its copies and preserves other bookings', () => {
  const app = storefront();
  app.CAT.cart.add('city-tour', '14:00', 3);
  app.CAT.cart.add('city-tour', '14:00', 3);
  app.CAT.cart.add('city-tour', '10:00', 1);
  app.CAT.cart.add('bike', '13:30', 1);

  app.P.cartPageVals({}, 'Desktop').items[0].remove();

  const updated = app.P.cartPageVals({}, 'Desktop');
  assert.equal(updated.count, 2);
  assert.equal(updated.total, '3 000 ₽');
  assert.equal(updated.items.length, 2);
  assert.match(updated.items[0].meta, /10:00/);
  assert.match(updated.items[1].name, /велосипеда/);
  const saved = JSON.parse(app.localStorage.getItem('uslugi-proto-cart-v1'));
  assert.equal(saved.length, 2);
  assert.equal(saved[0].time, '10:00');

  updated.items.forEach(item => item.remove());
  const empty = app.P.cartPageVals({}, 'Desktop');
  assert.equal(empty.empty, true);
  assert.equal(empty.notEmpty, false);
  assert.equal(empty.count, 0);
  assert.equal(empty.total, '0 ₽');
});

test('cart mini cards show the number of copies without a quantity control', () => {
  const app = storefront();
  app.CAT.cart.add('city-tour', '14:00', 3);
  app.CAT.cart.add('city-tour', '14:00', 3);

  const card = app.P.cartPageVals({}, 'Desktop').items[0];
  assert.equal(card.name, 'Обзорная экскурсия по Москве × 2');
  assert.equal(card.sum, '15 000 ₽');
});
