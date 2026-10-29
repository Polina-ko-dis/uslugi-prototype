/* Общая логика страниц прототипа. */
(function () {
  'use strict';
  var C = window.CAT;
  var qs = new URLSearchParams(location.search);
  var P = {};
  P.qs = qs;
  P.base = {
    hdr() {
    const st = this.state || {};
    const open = st.menu ?? (this.props.showMenu ?? false);
    const cur = st.cur || 'RUB';
    const lang = st.lang || 'ru';
    const item = 'width: 100%; min-height: 44px; padding: 0 10px; border: 0; border-radius: 14px; font: inherit; font-size: 15px; color: #15161A; display: flex; align-items: center; gap: 10px; text-align: left; cursor: pointer; ';
    const curList = [['RUB', '₽'], ['USD', '$'], ['EUR', '€'], ['KZT', '₸']];
    const langList = [['ru', 'Русский', 'RU'], ['en', 'English', 'EN'], ['de', 'Deutsch', 'DE'], ['zh', '中文', 'ZH']];
    const on = 'background: #F4F3EF; font-weight: 600';
    const off = 'background: transparent; font-weight: 500';
    const curs = curList.map(([code, sym]) => ({ code, sym, sel: code === cur, style: item + (code === cur ? on : off), pick: () => this.setState({ cur: code }) }));
    const langs = langList.map(([id, name]) => ({ name, sel: id === lang, style: item + (id === lang ? on : off), pick: () => this.setState({ lang: id }) }));
    return {
    menuOpen: open,
    menuExpanded: open ? 'true' : 'false',
    toggleMenu: () => this.setState({ menu: !open }),
    curs, langs,
    curSym: curList.find((c) => c[0] === cur)[1],
    langCode: langList.find((l) => l[0] === lang)[2],
    globeStyle: 'height: 44px; padding: 0 10px 0 12px; border: 0; border-radius: 999px; font: inherit; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; ' + (open ? 'background: #15161A; color: #FFFFFF' : 'background: #F4F3EF; color: #15161A'),
    chevStyle: 'transition: transform .2s; transform: rotate(' + (open ? '180' : '0') + 'deg)'
    };
    },
    icPalette() {
    const acc = this.props.accent ?? '#3355F0';
    const toHsl = (hex) => { const n = parseInt(hex.replace('#', ''), 16); const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s * 100, l * 100]; };
    const toHex = (h, s, l) => { s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l); const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))); return '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join(''); };
    const pw = (v, from, to) => v <= from ? (from ? v * to / from : to) : to + (v - from) * (100 - to) / (100 - from);
    const A = toHsl('#1B5EB2'), B = toHsl(acc);
    const list = '002e6a 062b5d 083b82 0d468c 1251a0 155eaf 1b5eb2 233247 3076d4 3a86d2 559fff 6eadff 99c9f7 a0caff d8e9ff e8f2ff eaf5ff eaf6ff'.split(' ');
    return 'display: contents; ' + list.map((hx) => { const c = toHsl(hx); const h = (c[0] + B[0] - A[0] + 360) % 360; return '--ic' + hx + ': ' + toHex(h, pw(c[1], A[1], B[1]), pw(c[2], A[2], B[2])); }).join('; ');
    },
    bindCart() {
      var self = this;
      this.__unsub = C.cart.subscribe(function () { self.setState({ tick: (self.state.tick || 0) + 1 }); });
    }
  };
  P.mix = function (Cls) {
    Object.keys(P.base).forEach(function (k) { if (!Cls.prototype[k]) Cls.prototype[k] = P.base[k]; });
    var mount = Cls.prototype.componentDidMount;
    Cls.prototype.componentDidMount = function () { this.bindCart(); if (mount) mount.call(this); };
    var un = Cls.prototype.componentWillUnmount;
    Cls.prototype.componentWillUnmount = function () { if (this.__unsub) this.__unsub(); if (un) un.call(this); };
    return Cls;
  };
  /* контекст: откуда открыт экран */
  P.ctx = function () {
    var c = qs.get('c');
    var from = qs.get('from') || (c ? 'cat' : 'main');
    if (!C.catById[c]) c = from === 'cat' ? 'banya' : null;
    return { from: from, c: c };
  };
  P.fromQS = function (from, c) { return from === 'cat' && c ? 'from=cat&c=' + c : 'from=main'; };
  P.home = function (S) { return 'Main' + S + '.html'; };
  P.catHref = function (S, c) { return 'Main' + S + '.html?c=' + c; };
  P.backHref = function (S, ctx) { return ctx.from === 'cat' && ctx.c ? P.catHref(S, ctx.c) : P.home(S); };
  P.svcHref = function (S, id, from, c) { return 'Service' + S + '.html?s=' + id + '&' + P.fromQS(from, c); };
  P.cartVals = function (S, from, c) {
    var n = C.cart.count(), t = C.cart.total();
    var label = n + ' ' + C.plural(n, 'услуга', 'услуги', 'услуг');
    return {
      hasCart: n > 0, cartCount: n, cartLabel: label, cartTotal: C.money(t),
      cartAria: 'Корзина: ' + label + ' на ' + C.money(t),
      cartHref: 'Cart' + S + '.html?' + P.fromQS(from, c)
    };
  };
  P.card = function (s, S, from, c) {
    var n = C.cart.countOf(s.id);
    return {
      id: s.id, name: s.short && S === '' ? s.name : s.name, img: s.img,
      href: P.svcHref(S, s.id, from, c),
      guests: s.guests, duration: s.duration,
      hasPrice: s.price !== null, noPrice: s.price === null,
      priceLabel: s.price === 0 ? 'Бесплатно' : (s.price === null ? '' : C.money(s.price)),
      inCart: n > 0, inCartQty: n,
      add: function () { C.cart.add(s.id); }
    };
  };
  P.go = function (url) { location.href = url; };
  /* A/B-тест: ?ab=a|b включает вариант (запоминается), ?ab=off выключает.
     В тесте — дефолтная тема с фото, без демо-панели. */
  P.ab = (function () {
    var v = qs.get('ab');
    try {
      if (v === 'a' || v === 'b') localStorage.setItem('uslugi-ab', v);
      else if (v === 'off') localStorage.removeItem('uslugi-ab');
      v = localStorage.getItem('uslugi-ab');
    } catch (e) { v = v === 'a' || v === 'b' ? v : null; }
    return v === 'a' || v === 'b' ? v : null;
  })();
  var AB_LS = { 'uslugi-theme': 'default', 'uslugi-scope': 'accent', 'uslugi-photo': '1' };
  P.lsGet = function (k) {
    if (P.ab && k in AB_LS) return AB_LS[k];
    try { return localStorage.getItem(k); } catch (e) { return null; }
  };
  if (P.ab) {
    var st = document.createElement('style');
    st.textContent = '[aria-label="Демо-настройки"]{display:none!important}';
    document.head.appendChild(st);
  }
  window.P = P;
})();

/* ---------- данные экранов ---------- */
(function () {
  'use strict';
  var C = window.CAT, P = window.P;
  var LIMIT = { '': 4, Tablet: 3, Desktop: 4 };

  P.mainVals = function (comp, S) {
    var q = ((comp.state && comp.state.query) || '').trim().toLowerCase();
    var items = C.services.filter(function (s) { return !q || s.name.toLowerCase().indexOf(q) >= 0; })
      .map(function (s) { return P.card(s, S, 'main'); });
    return Object.assign({ items: items, noResults: items.length === 0 }, P.cartVals(S, 'main'));
  };

  P.catVals = function (comp, S) {
    var ctx = P.ctx();
    var cat = C.catById[ctx.c] || C.catById.banya;
    var cur = (comp.state && comp.state.filter) || 'all';
    var base = 'flex: none; height: 36px; padding: 0 14px; border-radius: 999px; font: inherit; font-size: 14px; cursor: pointer; transition: background .2s, color .2s, border-color .2s; ';
    var list = [['all', 'Все']].concat(cat.filters.map(function (f) { return [f, f]; }));
    var filters = list.map(function (p) {
      return {
        label: p[1], pressed: cur === p[0] ? 'true' : 'false',
        pick: function () { comp.setState({ filter: p[0] }); },
        style: base + (cur === p[0] ? 'border: 1px solid #C9D6FF; background: #E6EDFF; color: #2440C8; font-weight: 600' : 'border: 1px solid #E4E2DC; background: #FFFFFF; color: #3F4147; font-weight: 500')
      };
    });
    var items = cat.items.filter(function (s) { return cur === 'all' || s.tag === cur; }).map(function (s) { return P.card(s, S, 'cat', cat.id); });
    if (typeof document !== 'undefined' && comp.__isPage) document.title = cat.name + ' — Cosmos';
    return Object.assign({
      catName: cat.name, filters: filters, hasFilters: cat.filters.length > 0, items: items,
      homeHref: P.home(S)
    }, P.cartVals(S, 'cat', cat.id));
  };

  P.svcVals = function (comp, S) {
    var ctx = P.ctx();
    var s = C.byId[P.qs.get('s')] || C.byId['banya-master'];
    var st = comp.state;
    var slot = st.slot || (s.slots ? s.slots[0] : '');
    var qty = st.qty || s.q.min;
    var base = 'height: 48px; border-radius: 14px; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; ';
    var slots = (s.slots || []).map(function (label) {
      return {
        label: label,
        pick: function () { comp.setState({ slot: label }); },
        style: base + (slot === label ? 'border: 1.5px solid #15161A; background: #15161A; color: #FFFFFF' : 'border: 1.5px solid #E4E2DC; background: #FFFFFF; color: #15161A')
      };
    });
    var hint = s.q.unit === 'guest' ? (s.q.min > 1 ? 'Минимум ' + C.qtyWord('guest', s.q.min) : 'До ' + C.qtyWord('guest', s.q.max))
      : s.q.unit === 'pcs' ? 'До ' + s.q.max + ' шт.' : 'Минимум ' + C.qtyWord(s.q.unit, s.q.min);
    var total = C.lineTotal(s, qty);
    var parts = [C.qtyWord(s.q.unit, qty)];
    if (slot) parts.push(slot);
    var back = P.backHref(S, ctx);
    if (typeof document !== 'undefined' && comp.__isPage) document.title = s.name + ' — Cosmos';
    return {
      svc: s, hasSlots: slots.length > 0, slots: slots, qty: qty,
      qLabel: s.q.label, qHint: hint,
      summary: parts.join(' · '),
      total: s.price === null ? 'По запросу' : (s.price === 0 ? 'Бесплатно' : C.money(total)),
      ctaLabel: s.price === null ? 'Запросить стоимость' : 'Добавить в корзину',
      backHref: back,
      fromCat: ctx.from === 'cat', fromMain: ctx.from !== 'cat',
      inc: function () { comp.setState({ qty: Math.min(s.q.max, qty + 1) }); },
      dec: function () { comp.setState({ qty: Math.max(s.q.min, qty - 1) }); },
      addToCart: function () { C.cart.add(s.id, slot, qty); P.go(back); }
    };
  };

  P.cartPageVals = function (comp, S) {
    var ctx = P.ctx();
    var lines = C.cart.lines();
    var items = lines.map(function (l) {
      var s = C.byId[l.id];
      var meta = [C.DATE];
      if (l.time) meta.push(l.time);
      meta.push(C.qtyWord(s.q.unit, l.qty));
      var sum = s.price === null ? 'По запросу' : (s.price === 0 ? 'Бесплатно' : C.money(C.lineTotal(s, l.qty) * l.count));
      return {
        name: s.name, meta: meta.join(' · '), qty: l.count, sum: sum,
        thumb: 'width: 64px; height: 64px; border-radius: 14px; background: #E4E2DC url(' + s.img + ') center / cover no-repeat',
        inc: function () { C.cart.setCount(l.key, Math.min(9, l.count + 1)); },
        dec: function () { C.cart.setCount(l.key, l.count - 1); }
      };
    });
    var n = C.cart.count();
    return {
      items: items, empty: items.length === 0, notEmpty: items.length > 0, count: n,
      countLabel: n + ' ' + C.plural(n, 'услуга', 'услуги', 'услуг'),
      total: C.money(C.cart.total()) + (C.cart.hasQuote() ? ' + запрос' : ''),
      backHref: P.backHref(S, ctx),
      fromCat: ctx.from === 'cat', fromMain: ctx.from !== 'cat',
      book: function () { if (!C.cart.count()) return; C.cart.placeOrder(); P.go('Success' + S + '.html'); }
    };
  };

  P.successVals = function (comp, S) {
    var o = C.cart.lastOrder() || C.cart.demoOrder();
    var lines = (o.lines || []).filter(function (l) { return C.byId[l.id]; }).map(function (l) {
      var s = C.byId[l.id];
      return {
        img: s.img, name: s.name + (l.count > 1 ? ' × ' + l.count : ''),
        when: C.DATE + (l.time ? ' · ' + l.time : ''),
        what: [C.qtyWord(s.q.unit, l.qty), /^(От|С |До |За |Доставка|Заказ|Действует|Подача|На всё)/.test(s.duration || '') ? '' : s.duration].filter(Boolean).join(' · '),
        sum: s.price === null ? 'По запросу' : (s.price === 0 ? 'Бесплатно' : C.money(C.lineTotal(s, l.qty) * l.count))
      };
    });
    return { orderNo: o.no, orderLines: lines, orderTotal: C.money(o.total || 0), hasLines: lines.length > 0 };
  };
})();
