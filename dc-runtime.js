/* Minimal runtime for exported Design Component pages: templates + DCLogic classes. */
(function () {
  'use strict';
  var REG = {};
  var uid = 0;
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;
  var XLINK = 'http://www.w3.org/1999/xlink';

  function lookup(path, scopes) {
    var parts = path.split('.');
    for (var i = scopes.length - 1; i >= 0; i--) {
      var s = scopes[i];
      if (s && typeof s === 'object' && parts[0] in s) {
        var v = s;
        for (var j = 0; j < parts.length; j++) { if (v == null) return undefined; v = v[parts[j]]; }
        return v;
      }
    }
    return undefined;
  }
  function str(v) { return v == null || v === false ? '' : String(v); }
  function interp(text, scopes) {
    var m = WHOLE.exec(text);
    if (m) return lookup(m[1], scopes);
    return text.replace(HOLE, function (_, p) { return str(lookup(p, scopes)); });
  }

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var host = this.__host;
    if (host && !host.prevState) host.prevState = this.state;
    var p = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, p);
    if (host) host.schedule();
  };
  DCLogic.prototype.renderVals = function () { return {}; };

  function register(name, tplEl, code, propsJson) {
    var props = {};
    try {
      var decl = JSON.parse(propsJson || '{}');
      Object.keys(decl).forEach(function (k) { if (k[0] !== '$' && decl[k] && 'default' in decl[k]) props[k] = decl[k].default; });
    } catch (e) { console.warn('bad data-props for', name, e); }
    var Cls = new Function('DCLogic', code + '\n;return Component;')(DCLogic);
    var frag = tplEl.content;
    (function mark(n) { n.__id = ++uid; for (var c = n.firstChild; c; c = c.nextSibling) mark(c); })(frag);
    REG[name] = { Cls: Cls, frag: frag, props: props };
  }

  /* ---------- template -> vnodes ---------- */
  function buildKids(node, scopes, key, out) {
    for (var c = node.firstChild; c; c = c.nextSibling) buildNode(c, scopes, key, out);
    return out;
  }
  function buildNode(n, scopes, key, out) {
    var k = key + '.' + n.__id;
    if (n.nodeType === 3) {
      var t = n.nodeValue;
      out.push({ t: 'text', key: k, v: t.indexOf('{{') < 0 ? t : str(interp(t, scopes)) });
      return;
    }
    if (n.nodeType !== 1) return;
    var tag = n.localName;
    if (tag === 'sc-if') {
      var cond = interp(n.getAttribute('value') || '', scopes);
      if (cond) buildKids(n, scopes, k, out);
      return;
    }
    if (tag === 'sc-for') {
      var list = interp(n.getAttribute('list') || '', scopes) || [];
      var as = n.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var sc = {}; sc[as] = list[i];
        buildKids(n, scopes.concat([sc]), k + '#' + i, out);
      }
      return;
    }
    if (tag === 'dc-import') {
      out.push({ t: 'comp', key: k, name: n.getAttribute('name') });
      return;
    }
    var attrs = {}, events = {}, ref = null;
    for (var a = 0; a < n.attributes.length; a++) {
      var at = n.attributes[a], name = at.name;
      if (name.indexOf('hint-') === 0) continue;
      var val = at.value.indexOf('{{') < 0 ? at.value : interp(at.value, scopes);
      if (name === 'ref') { ref = typeof val === 'function' ? val : null; continue; }
      if (name.slice(0, 2) === 'on' && name.length > 2) {
        var ev = name.slice(2);
        if (ev === 'change' && (tag === 'input' || tag === 'textarea')) ev = 'input';
        if (typeof val === 'function') events[ev] = val;
        continue;
      }
      attrs[name] = val;
    }
    out.push({ t: 'el', key: k, tag: tag, ns: n.namespaceURI, attrs: attrs, events: events, ref: ref, kids: buildKids(n, scopes, k, []) });
  }

  /* ---------- vnodes -> DOM ---------- */
  function setAttr(el, name, v, vn) {
    if (name === 'value' && (vn.tag === 'input' || vn.tag === 'textarea' || vn.tag === 'select')) {
      var s = str(v); if (el.value !== s) el.value = s; return;
    }
    if (name === 'checked' && vn.tag === 'input') { el.checked = !!v; return; }
    if (v == null || v === false) {
      if (name.indexOf('xlink:') === 0) el.removeAttributeNS(XLINK, name.slice(6)); else el.removeAttribute(name);
      return;
    }
    var sv = v === true ? '' : String(v);
    if (name.indexOf('xlink:') === 0) el.setAttributeNS(XLINK, name, sv); else el.setAttribute(name, sv);
  }
  function listen(el, vn) {
    el.__h = vn.events;
    Object.keys(vn.events).forEach(function (ev) {
      if (el.__on && el.__on[ev]) return;
      el.__on = el.__on || {};
      el.__on[ev] = true;
      el.addEventListener(ev, function (e) { var h = el.__h && el.__h[ev]; if (h) return h(e); });
    });
  }
  function create(vn, parentHost) {
    if (vn.t === 'text') { vn.dom = document.createTextNode(vn.v); return vn.dom; }
    if (vn.t === 'comp') {
      var holder = document.createElement('dc-host');
      vn.dom = holder;
      vn.inst = mountInto(vn.name, holder, parentHost);
      return holder;
    }
    var el = vn.ns && vn.ns !== 'http://www.w3.org/1999/xhtml' ? document.createElementNS(vn.ns, vn.tag) : document.createElement(vn.tag);
    vn.dom = el;
    Object.keys(vn.attrs).forEach(function (k) { setAttr(el, k, vn.attrs[k], vn); });
    vn.kids.forEach(function (c) { el.appendChild(create(c, parentHost)); });
    if (vn.tag === 'textarea' && 'value' in vn.attrs) el.value = str(vn.attrs.value);
    listen(el, vn);
    if (vn.ref) parentHost.refs.push([vn.ref, el]);
    return el;
  }
  function destroy(vn) {
    if (vn.t === 'comp' && vn.inst) vn.inst.unmount();
    if (vn.kids) vn.kids.forEach(destroy);
  }
  function update(old, vn, host) {
    vn.dom = old.dom;
    if (vn.t === 'text') { if (old.v !== vn.v) vn.dom.nodeValue = vn.v; return; }
    if (vn.t === 'comp') { vn.inst = old.inst; return; }
    var el = vn.dom;
    Object.keys(old.attrs).forEach(function (k) { if (!(k in vn.attrs)) setAttr(el, k, null, vn); });
    Object.keys(vn.attrs).forEach(function (k) { if (old.attrs[k] !== vn.attrs[k] || k === 'value') setAttr(el, k, vn.attrs[k], vn); });
    listen(el, vn);
    patchKids(el, old.kids, vn.kids, host);
    if (vn.ref) host.refs.push([vn.ref, el]);
  }
  function same(a, b) { return a.t === b.t && (a.t !== 'el' || (a.tag === b.tag && a.ns === b.ns)) && (a.t !== 'comp' || a.name === b.name); }
  function patchKids(parent, oldKids, newKids, host) {
    var byKey = {};
    oldKids.forEach(function (o) { byKey[o.key] = o; });
    var used = {};
    newKids.forEach(function (vn) {
      var o = byKey[vn.key];
      if (o && same(o, vn) && !used[vn.key]) { used[vn.key] = true; update(o, vn, host); }
      else create(vn, host);
    });
    oldKids.forEach(function (o) { if (!used[o.key]) { destroy(o); if (o.dom && o.dom.parentNode === parent) parent.removeChild(o.dom); } });
    var cursor = parent.firstChild;
    newKids.forEach(function (vn) {
      if (vn.dom === cursor) { cursor = cursor.nextSibling; return; }
      parent.insertBefore(vn.dom, cursor);
    });
  }

  /* ---------- component hosts ---------- */
  function mountInto(name, container, parentHost) {
    var def = REG[name];
    if (!def) { console.error('Unknown component', name); return null; }
    var host = { refs: [], kids: [], pending: false, prevState: null, prevProps: null };
    var props = Object.assign({}, def.props);
    var comp = new def.Cls(props);
    if (!comp.state) comp.state = {};
    comp.props = props;
    comp.__host = host;
    comp.__isPage = !parentHost;
    host.comp = comp;
    host.render = function () {
      var vals = comp.renderVals() || {};
      var next = buildKids(def.frag, [vals], 'r', []);
      host.refs = [];
      patchKids(container, host.kids, next, host);
      host.kids = next;
      host.refs.forEach(function (r) { try { r[0](r[1]); } catch (e) { console.error(e); } });
    };
    host.schedule = function () {
      if (host.pending) return;
      host.pending = true;
      Promise.resolve().then(function () {
        host.pending = false;
        var prev = host.prevState || comp.state;
        host.prevState = null;
        host.render();
        if (comp.componentDidUpdate) comp.componentDidUpdate(comp.props, prev);
      });
    };
    host.unmount = function () {
      if (comp.componentWillUnmount) comp.componentWillUnmount();
      host.kids.forEach(destroy);
    };
    host.render();
    if (comp.componentDidMount) comp.componentDidMount();
    return host;
  }

  function boot(entry) {
    document.querySelectorAll('template[data-dc]').forEach(function (t) {
      var name = t.getAttribute('data-dc');
      var s = document.querySelector('script[type="text/x-dc-logic"][data-dc="' + name + '"]');
      register(name, t, s ? s.textContent : 'class Component extends DCLogic {}', s ? s.getAttribute('data-props') : '{}');
    });
    mountInto(entry, document.getElementById('app'), null);
  }

  window.DC = { boot: boot, DCLogic: DCLogic };
})();
