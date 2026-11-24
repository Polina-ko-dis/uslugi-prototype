const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function confirmation(page, props = {}, search = '') {
  const storage = new Map();
  const context = vm.createContext({
    URLSearchParams,
    location: { search },
    document: { body: { getAttribute() { return null; } } },
    localStorage: {
      getItem(key) { return storage.get(key) || null; },
      setItem(key, value) { storage.set(key, value); },
      removeItem(key) { storage.delete(key); }
    },
    addEventListener() {},
    DCLogic: class {
      constructor(props) { this.props = props; this.state = {}; }
      setState(patch) { Object.assign(this.state, patch); }
    }
  });
  context.window = context;
  for (const file of ['catalog.js', 'proto-logic.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  const html = fs.readFileSync(path.join(__dirname, '..', page + '.html'), 'utf8');
  const script = html.match(/<script type="text\/x-dc-logic"[^>]*>([\s\S]*?)<\/script>/)[1];
  const Component = vm.runInContext('(function () { ' + script + '; return Component; })()', context);
  return new Component({ payment: 'paid', status: 'confirmed', ...props }).renderVals();
}

for (const page of ['Success', 'SuccessTablet', 'SuccessDesktop']) {
  test(`${page}: confirmed orders distinguish online and on-site payment`, () => {
    const online = confirmation(page, { payment: 'paid' });
    const onsite = confirmation(page, { payment: 'hotel' });
    assert.equal(online.isDone, true);
    assert.equal(onsite.isDone, true);
    assert.equal(online.title, 'Заказ подтвержден');
    assert.equal(onsite.title, 'Заказ подтвержден');
    assert.equal(online.pillText, 'Оплачен онлайн');
    assert.equal(onsite.pillText, 'Оплата на месте');
    assert.ok(!online.pending);
    assert.ok(!onsite.pending);
  });

  test(`${page}: payment previews override the default and unpaid values stay unpaid`, () => {
    const onsite = confirmation(page, { payment: 'paid' }, '?payment=hotel');
    const online = confirmation(page, { payment: 'hotel' }, '?payment=paid');
    const pending = confirmation(page, { payment: 'pending' });
    const unknown = confirmation(page, {}, '?payment=constructor');
    assert.equal(onsite.pillText, 'Оплата на месте');
    assert.equal(online.pillText, 'Оплачен онлайн');
    assert.equal(pending.pillText, 'Ожидает оплаты');
    assert.equal(unknown.pillText, 'Оплата на месте');
    assert.equal(pending.pending, true);
  });

  test(`${page}: pending payment has its own waiting screen`, () => {
    const pending = confirmation(page, {}, '?payment=pending');
    assert.equal(pending.title, 'Заказ ожидает оплаты');
    assert.equal(pending.pillText, 'Ожидает оплаты');
    assert.equal(pending.pending, true);
    assert.equal(pending.isWaiting, true);
    assert.equal(pending.isDone, false);
    const checking = confirmation(page, { payment: 'pending' }, '?status=checking');
    const failed = confirmation(page, { payment: 'pending' }, '?status=failed');
    assert.equal(checking.pending, false);
    assert.equal(failed.pending, false);
  });

  test(`${page}: checking and failed payments do not appear confirmed`, () => {
    const checking = confirmation(page, {}, '?status=checking');
    const failed = confirmation(page, {}, '?status=failed');
    assert.equal(checking.isDone, false);
    assert.equal(checking.isChecking, true);
    assert.equal(checking.pillText, 'Проверяем оплату');
    assert.equal(failed.isDone, false);
    assert.equal(failed.isFail, true);
    assert.equal(failed.pillText, 'Не оплачено');
    assert.equal(failed.canRetry, true);
  });
}
