import cheerio from 'cheerio';

export default class IceCap {
  static get MODE_APPEND() { return 'append'; }
  static get MODE_WRITE() { return 'write'; }
  static get MODE_REMOVE() {return 'remove'; }
  static get MODE_PREPEND() {return 'prepend'; }

  static get CALLBACK_TEXT() { return 'text'; }
  static get CALLBACK_LOAD() { return 'html'; }

  constructor(html, {autoClose = true, autoDrop = true} = {autoClose: true, autoDrop: true}) {
    if (!html) {
      throw new Error('html must be specified.');
    }

    if (typeof html === 'string') {
      this._$root = cheerio.load(html).root();
    } else if (html.find) {
      this._$root = html;
    }
    this._options = {autoClose, autoDrop};
  }

  set autoDrop(val) {
    this._options.autoDrop = val;
  }

  get autoDrop() {
    return this._options.autoDrop;
  }

  set autoClose(val) {
    this._options.autoClose = val;
  }

  get autoClose() {
    return this._options.autoClose;
  }

  text(id, value, mode = this.constructor.MODE_APPEND) {
    var nodes = this._nodes(id);

    if (this._options.autoDrop && !value) {
      nodes.remove();
      return;
    }

    if (value === null || value === undefined) value = '';

    let transformedValue;
    for (var node of nodes.iterator) {
      let currentValue = node.text() || '';
      switch (mode) {
        case this.constructor.MODE_WRITE:
          transformedValue = value;
          break;
        case this.constructor.MODE_APPEND:
          transformedValue = currentValue + value;
          break;
        case this.constructor.MODE_REMOVE:
          transformedValue =  currentValue.replace(new RegExp(value, 'g'), '');
          break;
        case this.constructor.MODE_PREPEND:
          transformedValue = value + currentValue;
          break;
        default:
          throw Error(`unknown mode. mode = "${mode}"`);
      }

      node.text(transformedValue);
    }

    return this;
  }

  load(id, ice, mode = this.constructor.MODE_APPEND) {
    var html = '';
    if (ice instanceof IceCap) {
      html = ice.html;
    } else if(ice){
      html = ice.toString();
    }

    var nodes = this._nodes(id);

    if (this._options.autoDrop && !html) {
      nodes.remove();
      return;
    }

    nodes.attr('data-ice-loaded', '1');
    let transformedValue;
    for (var node of nodes.iterator) {
      let currentValue = node.html() || '';
      switch (mode) {
        case this.constructor.MODE_WRITE:
          node.text('');
          transformedValue = html;
          break;
        case this.constructor.MODE_APPEND:
          transformedValue = currentValue + html;
          break;
        case this.constructor.MODE_REMOVE:
          transformedValue = currentValue.replace(new RegExp(html, 'g'), '');
          break;
        case this.constructor.MODE_PREPEND:
          transformedValue = html + currentValue;
          break;
        default:
          throw Error(`unknown mode. mode = "${mode}"`);
      }

      node.html(transformedValue);
    }

    return this;
  }

  attr(id, key, value, mode = this.constructor.MODE_APPEND) {
    var nodes = this._nodes(id);
    var transformedValue;

    if (value === null || value === undefined) value = '';

    for (var node of nodes.iterator) {
      let currentValue = node.attr(key) || '';
      switch (mode) {
        case this.constructor.MODE_WRITE:
          transformedValue = value;
          break;
        case this.constructor.MODE_APPEND:
          transformedValue = currentValue + value;
          break;
        case this.constructor.MODE_REMOVE:
          transformedValue = currentValue.replace(new RegExp(value, 'g'), '');
          break;
        case this.constructor.MODE_PREPEND:
          transformedValue = value + currentValue;
          break;
        default:
          throw Error(`unknown mode. mode = "${mode}"`);
      }

      node.attr(key, transformedValue);
    }

    return this;
  }

  loop(id, values, callback) {
    if (!Array.isArray(values)) {
      throw new Error(`values must be array. values = "${values}"`)
    }

    if (['function', 'string'].indexOf(typeof callback) === -1) {
      throw new Error(`callback must be function. callback = "${callback}"`);
    }

    if (typeof callback === 'string') {
      switch (callback) {
        case this.constructor.CALLBACK_TEXT:
          callback = (i, value, ice)=> ice.text(id, value);
          break;
        case this.constructor.CALLBACK_LOAD:
          callback = (i, value, ice)=> ice.load(id, value);
          break;
        default:
          throw Error(`unknown callback. callback = "${callback}"`);
      }
    }

    var nodes = this._nodes(id);

    if (values.length === 0) {
      nodes.remove();
      return;
    }

    for (var node of nodes.iterator) {
      var results = [];
      for (let j = 0; j < values.length; j++) {
        let parent = cheerio.load('<div/>').root();
        let clonedNode = node.clone();
        let textNode = cheerio.load('\n').root();

        parent.append(clonedNode);
        results.push(clonedNode[0]);
        results.push(textNode[0]);

        let ice = new IceCap(parent);
        callback(j, values[j], ice);
      }
      node.parent().append(results);
      node.remove();
    }

    return this;
  }

  into(id, value, callback) {
    let nodes = this._nodes(id);

    if (value === '' || value === null || value === undefined) {
      nodes.remove();
      return;
    }
    else if (Array.isArray(value)) {
      if (value.length === 0) {
        nodes.remove();
        return;
      }
    }

    if (typeof callback !== 'function') {
      throw new Error(`callback must be function. callback = "${callback}"`);
    }

    for (let node of nodes.iterator) {
      let ice = new IceCap(node);
      callback(value, ice);
    }

    return this;
  }

  drop(id, isDrop = true) {
    if (!isDrop) return;

    var nodes = this._nodes(id);
    nodes.remove();

    return this;
  }

  close() {
    if (!this._$root) return this;

    this._html = this._takeHTML();
    this._$root = null;
    return this;
  }

  get html() {
    if (!this._$root) return this._html;

    this._html = this._takeHTML();

    if (this._options.autoClose) {
      this.close();
    }

    return this._html;
  }

  _nodes(id) {
    if (!this._$root) throw new Error('can not operation after close.');
    if (!id) throw new Error('id must be specified.');

    var $nodes = this._$root.find(`[data-ice="${id}"]`);

    var filtered = this._filter($nodes);

    if (filtered.length === 0) console.log(`[0;33mwarning: node not found. id = ${id}[0m`);

    return filtered;
  }

  _filter(nodes) {
    let results = [];
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes.eq(i);
      let length = node.parents('[data-ice-loaded]').length;
      if (length === 0) {
        results.push(node[0]);
      }
    }

    var $result = cheerio(results);

    Object.defineProperty($result, 'iterator', {
      get: function(){
        var nodes = [];
        for (var i = 0; i < this.length; i++) {
          nodes.push(this.eq(i));
        }
        return nodes;
      }
    });

    return $result;
  }

  _takeHTML(){
    var loadedNodes = this._$root.find('[data-ice-loaded]').removeAttr('data-ice-loaded');

    var html = this._$root.html();

    loadedNodes.attr('data-ice-loaded', 1);

    return html;
  }
}
