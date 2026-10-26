/* Каталог услуг прототипа и корзина (localStorage). */
(function () {
  'use strict';
  var U = function (id) { return 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=900&q=70'; };
  var A = function (f) { return 'assets/' + f; };

  var CATS = [
    { id: 'food', name: 'Питание', filters: ['Завтрак', 'Ужин', 'В номер'] },
    { id: 'spa', name: 'СПА', filters: ['Массаж', 'Уход'] },
    { id: 'banya', name: 'Баня', filters: ['Пожарче', 'Помягче'] },
    { id: 'rent', name: 'Прокат спортинвентаря', filters: [] },
    { id: 'transfer', name: 'Трансфер', filters: ['Аэропорт', 'Вокзал'] },
    { id: 'tours', name: 'Экскурсии', filters: ['Пешком', 'На транспорте'] },
    { id: 'kids', name: 'Для детей', filters: [] },
    { id: 'picnic', name: 'Пикник и барбекю', filters: [] },
    { id: 'pets', name: 'С питомцами', filters: [] },
    { id: 'parking', name: 'Парковка', filters: [] },
    { id: 'gifts', name: 'Подарки', filters: [] }
  ];

  var SLOTS_DAY = ['10:00', '12:30', '15:00', '18:30'];
  var SLOTS_BANYA = ['11:00', '13:30', '18:30', '23:30'];
  var SLOTS_FOOD = ['07:30', '08:30', '09:30', '10:30'];
  var SLOTS_EVE = ['18:00', '19:30', '21:00'];
  var SLOTS_TRANSFER = ['06:00', '10:00', '14:00', '20:00'];

  // q: что выбирается счётчиком; per: умножать цену на количество
  var guests = function (min, max, per) { return { label: 'Гости', unit: 'guest', min: min, max: max, per: !!per }; };
  var hours = function (min, max) { return { label: 'Часы', unit: 'hour', min: min, max: max, per: true }; };
  var days = function (min, max) { return { label: 'Сутки', unit: 'day', min: min, max: max, per: true }; };
  var pax = function (max) { return { label: 'Пассажиры', unit: 'guest', min: 1, max: max, per: false }; };
  var pcs = function (min, max) { return { label: 'Количество', unit: 'pcs', min: min, max: max, per: true }; };

  var S = [
    // Питание
    { id: 'breakfast', cat: 'food', tag: 'Завтрак', name: 'Завтрак «шведский стол»', price: 1200, img: U('1578704311587-4fbd590630d5'), guests: 'От 1 гостя', duration: 'С 7:00 до 11:00', slots: SLOTS_FOOD, q: guests(1, 8, true), desc: 'Горячие блюда, выпечка, фрукты и бариста-бар в ресторане на 2 этаже.' },
    { id: 'chef-dinner', cat: 'food', tag: 'Ужин', name: 'Ужин от шефа: сет из 5 блюд', price: 4500, img: U('1414235077428-338989a2e8c0'), guests: 'От 2 гостей', duration: '2 часа', slots: SLOTS_EVE, q: guests(2, 10, true), desc: 'Сезонное меню и винное сопровождение по желанию.' },
    { id: 'room-breakfast', cat: 'food', tag: 'В номер', name: 'Завтрак в номер', price: 1600, img: U('1596701062351-8c2c14d1fdd0'), guests: 'От 1 гостя', duration: 'Подача за 30 минут', slots: SLOTS_FOOD, q: guests(1, 4, true), desc: 'Континентальный завтрак на подносе: выпечка, йогурт, фрукты, кофе.' },
    { id: 'kids-menu', cat: 'food', tag: 'Ужин', name: 'Детское меню', price: 700, img: U('1767356326840-b78f8879e2fe'), guests: 'Для детей до 12 лет', duration: '', slots: SLOTS_EVE, q: guests(1, 6, true), desc: 'Суп, горячее и десерт в детских порциях.' },
    // СПА
    { id: 'massage', cat: 'spa', tag: 'Массаж', name: 'Классический массаж спины', price: 4500, img: U('1544161515-4ab6ce6db874'), guests: 'На 1 гостя', duration: '60 минут', slots: SLOTS_DAY, q: guests(1, 2, true), desc: 'Расслабляющий массаж спины и шейно-воротниковой зоны.' },
    { id: 'stones', cat: 'spa', tag: 'Массаж', name: 'Стоун-терапия', price: 5200, img: U('1600334089648-b0d9d3028eb2'), guests: 'На 1 гостя', duration: '75 минут', slots: SLOTS_DAY, q: guests(1, 2, true), desc: 'Массаж горячими базальтовыми камнями.' },
    { id: 'facial', cat: 'spa', tag: 'Уход', name: 'Уход за лицом', price: 3900, img: U('1616394584738-fc6e612e71b9'), guests: 'На 1 гостя', duration: '50 минут', slots: SLOTS_DAY, q: guests(1, 2, true), desc: 'Очищение, маска и увлажнение по типу кожи.' },
    { id: 'steam', cat: 'spa', tag: 'Уход', name: 'Хаммам и парная', price: 2500, img: U('1761470575018-135c213340eb'), guests: 'От 1 гостя', duration: '2 часа', slots: SLOTS_DAY, q: guests(1, 6, true), desc: 'Турецкая баня, ароматическая парная и зона отдыха.' },
    // Баня
    { id: 'banya-wood', cat: 'banya', tag: 'Пожарче', name: 'Баня на дровах', price: null, img: A('35dfe9e8efe292e177edf56b245d6fcd.jpg'), guests: 'От 4 гостей', duration: 'От 2 часов', slots: SLOTS_BANYA, q: guests(4, 12), desc: 'Отдельный банный дом с видом на лес. Стоимость зависит от дня и количества гостей.' },
    { id: 'banya-black', cat: 'banya', tag: 'Пожарче', name: 'Баня по-черному', price: 3000, img: A('b6548bdfedbb2ea2d5385a2126fe8506.jpg'), guests: 'От 4 гостей', duration: 'От 2 часов', slots: SLOTS_BANYA, q: guests(4, 12), desc: 'Традиционная баня без дымохода с мягким дымным паром.' },
    { id: 'banya-master', cat: 'banya', tag: 'Помягче', name: 'Баня с пармастером', price: 1000, img: A('0ef13fa6319fc54e36811f1e9d1af2d3.jpg'), guests: 'От 4 гостей', duration: 'От 2 часов', slots: SLOTS_BANYA, q: guests(4, 12), desc: 'Парение вениками и травяные чаи. Пармастер подберёт программу под гостей.' },
    { id: 'banya-chan', cat: 'banya', tag: 'Помягче', name: 'Банный чан под открытым небом', price: 4000, img: U('1786359410265-86e20d5da810'), guests: 'До 6 гостей', duration: '2 часа', slots: SLOTS_BANYA, q: guests(1, 6), desc: 'Горячий чан с травами на террасе банного дома.' },
    // Прокат
    { id: 'bike', cat: 'rent', name: 'Прокат горного велосипеда для поездок по окрестностям', short: 'Прокат горного велосипеда', price: 500, img: A('80425026c3bef2b091a3788efccf20ed.jpg'), guests: 'От 1 гостя', duration: 'От 1 часа', slots: SLOTS_DAY, q: hours(1, 8), desc: 'Велосипеды для взрослых и детей, шлем в комплекте.' },
    { id: 'sup', cat: 'rent', name: 'Сапборд', price: 900, img: U('1614614098579-7167dd3f4c07'), guests: 'До 2 гостей', duration: 'От 1 часа', slots: SLOTS_DAY, q: hours(1, 4), desc: 'Доска, весло и спасательный жилет. Причал у пруда.' },
    { id: 'scooter', cat: 'rent', name: 'Электросамокат', price: 400, img: U('1597260491619-bab87197869f'), guests: 'С 14 лет', duration: 'От 1 часа', slots: SLOTS_DAY, q: hours(1, 6), desc: 'Заряда хватает на 25 км по парку ВДНХ.' },
    { id: 'skates', cat: 'rent', name: 'Роликовые коньки', price: 350, img: U('1622640338505-2ad7465bda17'), guests: 'Размеры 30–46', duration: 'От 1 часа', slots: SLOTS_DAY, q: hours(1, 6), desc: 'Комплект защиты в подарок к прокату.' },
    // Трансфер
    { id: 'svo', cat: 'transfer', tag: 'Аэропорт', name: 'Трансфер в Шереметьево', price: 3900, img: U('1567808291548-fc3ee04dbcf0'), guests: 'До 3 гостей', duration: '≈ 50 минут', slots: SLOTS_TRANSFER, q: pax(3), desc: 'Автомобиль бизнес-класса, встреча с табличкой.' },
    { id: 'vko', cat: 'transfer', tag: 'Аэропорт', name: 'Трансфер во Внуково', price: 4200, img: U('1504150558240-0b4fd8946624'), guests: 'До 3 гостей', duration: '≈ 60 минут', slots: SLOTS_TRANSFER, q: pax(3), desc: 'Автомобиль бизнес-класса, детское кресло по запросу.' },
    { id: 'dme', cat: 'transfer', tag: 'Аэропорт', name: 'Трансфер в Домодедово', price: 4500, img: U('1542296332-2e4473faf563'), guests: 'До 3 гостей', duration: '≈ 70 минут', slots: SLOTS_TRANSFER, q: pax(3), desc: 'Автомобиль бизнес-класса, ожидание до 60 минут бесплатно.' },
    { id: 'station', cat: 'transfer', tag: 'Вокзал', name: 'Трансфер на вокзал', price: 2300, img: U('1553184257-604db3e574a8'), guests: 'До 3 гостей', duration: '≈ 30 минут', slots: SLOTS_TRANSFER, q: pax(3), desc: 'Любой из девяти вокзалов Москвы.' },
    // Экскурсии
    { id: 'city-tour', cat: 'tours', tag: 'На транспорте', name: 'Обзорная экскурсия по Москве', price: 2500, img: U('1513326738677-b964603b136d'), guests: 'От 1 гостя', duration: '3 часа', slots: ['10:00', '14:00'], q: guests(1, 10, true), desc: 'Красная площадь, Воробьёвы горы и Москва-Сити на комфортабельном автобусе.' },
    { id: 'space', cat: 'tours', tag: 'Пешком', name: 'Музей космонавтики', price: 1800, img: U('1764253340517-9adc9a839970'), guests: 'От 1 гостя', duration: '2 часа', slots: ['11:00', '13:00', '16:00'], q: guests(1, 10, true), desc: 'Экскурсия с гидом в пяти минутах от отеля.' },
    { id: 'vdnh', cat: 'tours', tag: 'Пешком', name: 'Прогулка по ВДНХ', price: 1200, img: U('1671696564807-d0069fa4349d'), guests: 'От 1 гостя', duration: '1,5 часа', slots: ['10:00', '12:00', '17:00'], q: guests(1, 15, true), desc: 'Фонтаны, павильоны и история главной выставки страны.' },
    { id: 'river', cat: 'tours', tag: 'На транспорте', name: 'Вечерняя прогулка на теплоходе', price: 2900, img: U('1782535163015-9d6d7a68b0e2'), guests: 'От 1 гостя', duration: '2,5 часа', slots: ['19:00', '21:00'], q: guests(1, 10, true), desc: 'Круиз по Москве-реке с ужином на борту.' },
    // Для детей
    { id: 'playroom', cat: 'kids', name: 'Детская комната', price: 800, img: U('1687946803051-51da173a9f55'), guests: 'Дети 3–10 лет', duration: 'От 1 часа', slots: SLOTS_DAY, q: hours(1, 5), desc: 'Игровая с воспитателем, пока взрослые отдыхают.' },
    { id: 'nanny', cat: 'kids', name: 'Няня в номер', price: 1200, img: U('1596066190600-3af9aadaaea1'), guests: 'Дети от 1 года', duration: 'От 2 часов', slots: SLOTS_EVE, q: hours(2, 8), desc: 'Проверенные няни с медицинскими книжками.' },
    { id: 'animator', cat: 'kids', name: 'Аниматор на праздник', price: null, img: U('1530103862676-de8c9debad1d'), guests: 'До 15 детей', duration: '1 час', slots: SLOTS_DAY, q: guests(1, 15), desc: 'Программа под возраст и тему праздника. Стоимость рассчитаем после заявки.' },
    { id: 'craft', cat: 'kids', name: 'Мастер-класс по рисованию', price: 1000, img: U('1560421683-6856ea585c78'), guests: 'Дети 5–12 лет', duration: '1 час', slots: ['11:00', '16:00'], q: guests(1, 8, true), desc: 'Все материалы включены, рисунок можно забрать с собой.' },
    // Пикник
    { id: 'gazebo', cat: 'picnic', name: 'Беседка с мангалом', price: 2500, img: U('1534177616072-ef7dc120449d'), guests: 'До 10 гостей', duration: '3 часа', slots: ['12:00', '15:00', '18:00'], q: guests(1, 10), desc: 'Мангал, решётки, угли и розжиг уже на месте.' },
    { id: 'basket', cat: 'picnic', name: 'Пикник-корзина', price: 3200, img: U('1590166774851-bc49b23a18fe'), guests: 'На 2 гостей', duration: '', slots: ['11:00', '13:00', '16:00'], q: pcs(1, 4), desc: 'Сэндвичи, сыры, фрукты, лимонад и плед.' },
    { id: 'shashlik', cat: 'picnic', name: 'Шашлык от шефа', price: null, img: U('1627947063935-55577ec3c2e1'), guests: 'От 4 гостей', duration: '', slots: ['13:00', '17:00', '19:00'], q: guests(4, 20), desc: 'Маринованное мясо, овощи гриль и соусы. Стоимость зависит от меню.' },
    // Питомцы
    { id: 'pet-stay', cat: 'pets', name: 'Размещение с питомцем', price: 1500, img: U('1742520852440-c8a2501ae628'), guests: 'Собаки до 10 кг', duration: 'За сутки', slots: null, q: days(1, 14), desc: 'Лежанка, миски и угощение в номере.' },
    { id: 'dog-walk', cat: 'pets', name: 'Выгул собаки', price: 600, img: U('1530700131180-d43d9b8cc41f'), guests: 'Любые породы', duration: '30 минут', slots: ['08:00', '13:00', '19:00'], q: pcs(1, 3), desc: 'Прогулка по парку с фотоотчётом.' },
    { id: 'pet-bed', cat: 'pets', name: 'Лежанка и набор мисок', price: 0, img: U('1581888227599-779811939961'), guests: '', duration: 'На всё проживание', slots: null, q: pcs(1, 2), desc: 'Бесплатно для гостей с питомцами.' },
    // Парковка
    { id: 'parking-out', cat: 'parking', name: 'Наземная парковка', price: 500, img: U('1593280405106-e438ebe93f5b'), guests: '1 место', duration: 'За сутки', slots: null, q: days(1, 14), desc: 'Охраняемая стоянка у главного входа.' },
    { id: 'parking-in', cat: 'parking', name: 'Подземный паркинг', price: 900, img: U('1548343361-02248be15911'), guests: '1 место', duration: 'За сутки', slots: null, q: days(1, 14), desc: 'Тёплый паркинг с лифтом в лобби.' },
    { id: 'ev', cat: 'parking', name: 'Зарядка электромобиля', price: 700, img: U('1593941707882-a5bba14938c7'), guests: 'Type 2 и CCS', duration: 'До 4 часов', slots: SLOTS_DAY, q: pcs(1, 3), desc: 'Быстрая зарядка до 50 кВт.' },
    // Подарки
    { id: 'flowers', cat: 'gifts', name: 'Букет цветов в номер', price: 3500, img: U('1523693916903-027d144a2b7d'), guests: '', duration: 'Доставка к заезду', slots: null, q: pcs(1, 3), desc: 'Сезонный букет от флориста отеля.' },
    { id: 'champagne', cat: 'gifts', name: 'Шампанское и фрукты', price: 4900, img: U('1580657274234-7339717f4541'), guests: '', duration: 'Доставка к заезду', slots: null, q: pcs(1, 3), desc: 'Бутылка игристого и фруктовая тарелка.' },
    { id: 'cake', cat: 'gifts', name: 'Праздничный торт', price: 2800, img: U('1606890737304-57a1ca8a5b62'), guests: 'На 6–8 гостей', duration: 'Заказ за 24 часа', slots: null, q: pcs(1, 2), desc: 'Надпись и оформление по вашему пожеланию.' },
    { id: 'certificate', cat: 'gifts', name: 'Подарочный сертификат в СПА', price: 5000, img: U('1549465220-1a8b9238cd48'), guests: '', duration: 'Действует 6 месяцев', slots: null, q: pcs(1, 5), desc: 'Электронный сертификат с вашим поздравлением.' }
  ];

  var byId = {};
  S.forEach(function (s) { byId[s.id] = s; });
  var catById = {};
  CATS.forEach(function (c) { catById[c.id] = c; c.items = S.filter(function (s) { return s.cat === c.id; }); });

  function plural(n, one, few, many) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b === 1) return one;
    if (b >= 2 && b <= 4) return few;
    return many;
  }
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
  function priceLabel(s) {
    if (s.price === null) return 'Цена по запросу';
    if (s.price === 0) return 'Бесплатно';
    var u = s.q.per ? ({ guest: ' / гость', hour: ' / час', day: ' / сутки', pcs: '' })[s.q.unit] : '';
    return money(s.price) + u;
  }
  function qtyWord(unit, n) {
    if (unit === 'guest') return n + ' ' + plural(n, 'гость', 'гостя', 'гостей');
    if (unit === 'hour') return n + ' ' + plural(n, 'час', 'часа', 'часов');
    if (unit === 'day') return n + ' ' + plural(n, 'сутки', 'суток', 'суток');
    return n + ' шт.';
  }
  function lineTotal(s, qty) { return s.price === null ? 0 : (s.q.per ? s.price * qty : s.price); }

  /* ---------- корзина ---------- */
  var KEY = 'uslugi-proto-cart-v1';
  var OKEY = 'uslugi-proto-order-v1';
  var DEFAULT = [
    { key: 'banya-master|11:00|4', id: 'banya-master', time: '11:00', qty: 4, count: 1 },
    { key: 'bike|13:30|1', id: 'bike', time: '13:30', qty: 1, count: 1 }
  ];
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v || d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var qs0 = new URLSearchParams(location.search);
  if (qs0.has('reset')) save(KEY, []);
  if (qs0.has('demo')) save(KEY, DEFAULT);
  var lines = load(KEY, []).filter(function (l) { return byId[l.id]; });
  var listeners = [];
  function emit() { save(KEY, lines); listeners.forEach(function (f) { try { f(); } catch (e) {} }); }

  var Cart = {
    lines: function () { return lines.slice(); },
    subscribe: function (f) { listeners.push(f); return function () { listeners = listeners.filter(function (g) { return g !== f; }); }; },
    add: function (id, time, qty) {
      var s = byId[id]; if (!s) return;
      time = time || (s.slots ? s.slots[0] : '');
      qty = qty || s.q.min;
      var key = id + '|' + time + '|' + qty;
      var l = lines.find(function (x) { return x.key === key; });
      if (l) l.count = Math.min(9, l.count + 1); else lines.push({ key: key, id: id, time: time, qty: qty, count: 1 });
      emit();
    },
    setCount: function (key, n) {
      lines = lines.map(function (l) { return l.key === key ? Object.assign({}, l, { count: n }) : l; }).filter(function (l) { return l.count > 0; });
      emit();
    },
    countOf: function (id) { return lines.reduce(function (a, l) { return a + (l.id === id ? l.count : 0); }, 0); },
    count: function () { return lines.reduce(function (a, l) { return a + l.count; }, 0); },
    total: function () { return lines.reduce(function (a, l) { return a + lineTotal(byId[l.id], l.qty) * l.count; }, 0); },
    hasQuote: function () { return lines.some(function (l) { return byId[l.id].price === null; }); },
    placeOrder: function () {
      var order = { no: String(482317105 + Math.floor(Math.random() * 900)) + '-1', lines: lines.slice(), total: Cart.total(), quote: Cart.hasQuote() };
      save(OKEY, order);
      lines = [];
      emit();
      return order;
    },
    lastOrder: function () { return load(OKEY, null); },
    demoOrder: function () {
      var t = DEFAULT.reduce(function (a, l) { return a + lineTotal(byId[l.id], l.qty) * l.count; }, 0);
      return { no: '482317105-1', lines: DEFAULT, total: t };
    },
    reset: function () { lines = DEFAULT.map(function (l) { return Object.assign({}, l); }); emit(); }
  };
  window.addEventListener('storage', function (e) { if (e.key === KEY) { lines = load(KEY, []); listeners.forEach(function (f) { f(); }); } });

  window.CAT = {
    cats: CATS, services: S, byId: byId, catById: catById,
    money: money, plural: plural, priceLabel: priceLabel, qtyWord: qtyWord, lineTotal: lineTotal,
    DATE: 'Пн, 14 декабря',
    cart: Cart
  };
})();
