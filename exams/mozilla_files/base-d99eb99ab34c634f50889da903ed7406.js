var config = {};

var app = {};

app.templateCache = {};

var showIndicator = function(text) {
  $('.indicator').addClass('active').find('h3').text(text);
};

var hideIndicator = function() {
  $('.indicator').removeClass('active').find('h3').text('');
};

var toggleIndicator = function() {
  $('.indicator').toggleClass('active');
};

$.fn.autocomplete = function(options) {
  options = utils.extend({
    src: this.data('src') || function(){ },
    process: function(row) {
      return row._id;
    },
    update: function(row) {
      return row;
    }
  }, options);
  var cache = {};
  this.typeahead({
    source: function(query, process) {
      $.debounce(250, function() {
        $.get(typeof options.src === "function" ? options.src(query) : options.src, function(results) {
          var suggestions = [];
          cache = {};
          for(var i=0; i<results.length; i++) {
            var id = options.process(results[i]);
            cache[id] = results[i];
            suggestions.push(id);
          }
          process(suggestions);
        });
      })();
      process(['Loading...']);
    },
    updater: function(item) {
      options.update(cache[item], item);
      return item;
    }
  });
};

Handlebars.registerHelper('getItem', function() {
  var ret = arguments[0] || null;
  for(var i=1; i<arguments.length - 1; i++) {
    ret = ret ? ret[arguments[i]] : null;
  }
  return ret || arguments[arguments.length - 1].hash.default || null;
});

Handlebars.registerHelper('ifItem', function() {
  var ret = arguments[0] || null;
  for(var i=1; i<arguments.length - 1; i++) {
    ret = ret ? ret[arguments[i]] : null;
  }
  var options = arguments[arguments.length - 1];
  return ret ? options.fn(this) : options.inverse(this);;
});

Handlebars.registerHelper('setIndex', function(value){
    this.index = Number(value);
});

Handlebars.registerHelper('hashColor', function(str) {
  return utils.hashColor(str);
});

Handlebars.registerPartial("license_li", $("#license-li-partial-template").html());

var utils = {
  extend: function() {
    function migrate(dest, src) {
      if (utils.isNull(src)) return false;
      var keys = Object.keys(src);
      for(var i=0; i<keys.length; i++) {
        dest[keys[i]] = src[keys[i]];
      }
      return dest;
    }

    var dest = arguments[0];
    var sources = Array.prototype.slice.call(arguments, 1);
    for(var i=0; i<sources.length; i++) {
      migrate(dest, sources[i]);
    }
    return dest;
  },
  omit: function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  },
  pullApply: function(dest, src) {
    //recursively extend, but ignore all objectID fields (if dest is a hash/array and src is a string, omit src)
    //destructive to dest and src
    var keys = Object.keys(src);
    for(var i=0; i<keys.length; i++) {
      
    }

  },
  hashColor: function(str) {
    for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));
    for (var i = 0, colour = "#"; i < 3; colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));
    return colour;
  },
  growl: function(messages, options) {
    options = utils.extend({
      type: '',
      align: 'center'
    }, options);
    if(messages instanceof Array) {
      for(var i=0; i<messages.length; i++) {
        $.bootstrapGrowl(messages[i], options);
      }
    } else {
      $.bootstrapGrowl(messages, options);
    }
  },
  //shallow copy
  copy: function(obj) {
    return obj instanceof Array ? obj.slice() : utils.extend({}, obj);
  },
  isNull: function(obj) {
    return typeof obj === "undefined" || obj == undefined || obj == null;
  },
  compileTemplate: function(template) {
    if(!(template in app.templateCache))
      app.templateCache[template] = Handlebars.compile(template);
    return app.templateCache[template];
  },
  launchModal: function(options, target) {
    if(target == null) target = 'body';
    var modal = new modalView(options);
    $(target).append(modal.el);
    return modal;
  },
  //turn a hash into form elements that can be submitted in the same format
  hashToForm: function(data, variable_name, parent) {
    parent = $(parent || "<div style='display:none'></div>");
    if(!data) return parent;

    function makeInput(scope, val, varname) {
      parent.append('<label for="input-' + scope + '">' + varname[0].toUpperCase() + varname.slice(1) + ':</label>\
        <input id="input-' + scope + '" type="text" name="' + scope + '" value="' + val + '" />');
    }
    (function make(hash, current_scope) {
      var keys = Object.keys(hash);
      for(var i=0; i<keys.length; i++) {
        var scope = current_scope + '[' + keys[i] + ']';
        var val = hash[keys[i]];
        if(val instanceof Array) {
          for(var q=0; q<val.length; q++) {
            makeInput(scope, val[q], keys[i]);
          }
        } else if(typeof val === "object") {
          make(val, scope);
        } else {
          makeInput(scope, val, keys[i]);
        }
      }
    })(data, variable_name);
    return parent.html();
  },
  computed: function(valueFunc) {
    return new ComputedValue(valueFunc);
  },
  collapse: function(object, ignoreVersioned) {
    if(object instanceof Array) {
      if(object.length <= 0) return ''; //empty array as empty str
      var arr = [];
      for(var i=0; i<object.length; i++) {
        //__v to only select non-embedded docs
        if(object[i]._id  && (object[i].__v != null || ignoreVersioned)) {
          arr.push(object[i]._id);
        } else {
          arr.push(utils.collapse(object[i], ignoreVersioned));
        }
      }
      return arr;
    } else if (object instanceof Object) {
      var keys = Object.keys(object);
      var obj = {};
      for(var i=0; i<keys.length; i++) {
        if(object[keys[i]]._id && (object[keys[i]].__v != null || ignoreVersioned)) {
          obj[keys[i]] = object[keys[i]]._id;
        } else {
          obj[keys[i]] = utils.collapse(object[keys[i]], ignoreVersioned);
        }
      }
      return obj;
    }
    return object;
  },
  showLogin: function() {
    if(!window.logged_in) { $('#btn-login').trigger('click'); }
  },
  defer: function(func) {
      //set on requestAnimationFrame to guarantee after frame has been drawn
      var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                  window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
      setTimeout(function(){requestAnimationFrame(func)}, 1); //push this to a new async thread to get executed so it guarantees a separate frame
  },
  setPath: function(object, path, value, default_null) {
    var np = path.slice(path.indexOf('.') + 1), op = path.slice(0, path.indexOf('.'));
    if(np == path) return object[path] = value;
    if(typeof object[op] === "undefined" || object[op] == null) object[op] = default_null || {};
    return utils.setPath(object[op], np, value);
  },
  diff: function(el_a, el_b) {
    //old_node && new_node - no diff
    //old_node && null - deletion
    //null && new_node - insertion
    var diff = {
      old_node: el_a, 
      new_node: el_b,
      children: []
    };
    function compare(node_a, node_b) {
      return (node_a ? node_a.outerHTML || node_a.textContent : undefined) == 
             (node_b ? node_b.outerHTML || node_b.textContent : undefined);
    }
    function shallow_compare(node_a, node_b) {
      //if they have children
      return node_a && node_b && node_a.childNodes && node_b.childNodes && node_a.tagName && node_a.tagName == node_b.tagName;
    }
    //base case
    if(!compare(el_a, el_b)) {
      console.log(el_a);
      console.log(el_b);
      if (el_a == undefined) {
        diff.old_node = undefined;
        diff.new_node = el_b;
      } else if (el_b == undefined) {
        diff.old_node = el_a;
        diff.new_node = undefined;
      } else {
        //map equal elements and null elements
        //[b,d]     --> [null, b, null, d,    null]
        //[a,b,c,e] --> [a,    b, c,    null, e   ]
        //[ins a, same b, ins c, same d, ins e, del d, ins e]
        //push a diff() to each 

        //loop through first arr
        //if cur element isn't in second arr, push an old: cur, new: null
        //
        var c_a = el_a.childNodes || [];
        var c_b = el_b.childNodes || [];
        var last_match = -1;
        for(var i=0, q=0; i < c_a.length || q < c_b.length; q++) {
          if(compare(c_a[i], c_b[q])) {
            //treat all previous b elements as insertions
            for(var v=0; v < q; v++) {
              diff.children.push(utils.diff(undefined, c_b[v]));
            }
            //insert match
            diff.children.push(utils.diff(c_a[i], c_b[q]));
            last_match = q;
            i++;
            continue;
          } else if(shallow_compare(c_a[i], c_b[q])) {
            //elements are equal on same level but not deeply
            diff.children.push(utils.diff(c_a[i], c_b[q]));
            continue
          } else if(q >= c_b.length && i < c_a.length) {
            //exhauses all b's, so an element a was deleted
            q = last_match;
          }
          diff.children.push(utils.diff(c_a[i], c_b[q]));
        }
      }
    }
    return diff;
  }
};

var behaviors = {
  apply: (function() {
    var t = [];
    for(var i=1; i<arguments.length; i++) {
      if(!behaviors[arguments[i]]) throw "Behavior \"" + arguments[1] + "\" does not exist!";
      t.push(behaviors[arguments[i]]);
    }
    t.push(arguments[0]);
    return utils.extend.apply(null, t);
  }).bind(behaviors),
  reloadable: {
    loading: false,
    onReload: function(cb) { cb(); }, //main callback
    reload: function(cb) {
      var self = this;
      this.onReload(function(err) {
        self.loading = false;
        return cb(err);
      });
    }
  },
  paginatable: {
    page: 0,
    pageSize: 10,
    onPageChange: function() {}, //main callback
    pageUp: function() {
      this.page++;
      this.onPageChange();
    },
    pageDown: function() {
      this.page--;
      this.onPageChange();
    },
    setPageSize: function(size) {
      this.pageSize = size;
      this.onPageChange();
    }
  },
  transitionable: {
    _target: null,
    _speed: null,
    _bindSpeed: function(target, speed) {
      target.css({
        'animation-duration': (speed/1000) + 's',
        '-webkit-animation-duration': (speed/1000) + 's'
      });
    },
    _transitions: {
      'fadeOut': function(cb) {
        if(!this._target) this._target = $(this.el).find('.transition-fade-out');
        this._target.addClass('animated fadeOut');
        this._bindSpeed(this._target, this._speed || 1000);
        setTimeout(cb, this._speed || 1000);
      },
      'fadeIn': function(cb) {
        if(!this._target) this._target = $(this.el).find('.transition-fade-in');
        this._target.addClass('animated fadeIn');
        this._bindSpeed(this._target, this._speed || 1000);
        setTimeout(cb, this._speed || 1000);
      },
      'flipInY': function(cb) {
        if(!this._target) this._target = $(this.el).find('.transition-flip-in');
        this._target.addClass('animated flipInY');
        this._bindSpeed(this._target, this._speed || 1000);
        setTimeout(cb, 1000);
      },
      'flipOutY': function(cb) {
        if(!this._target) this._target = $(this.el).find('.transition-flip-out');
        this._target.addClass('animated flipOutY');
        this._bindSpeed(this._target, this._speed || 1000);
        setTimeout(cb, 1000);
      }
    },
    play: function(transition, cb) {
      if(!cb) cb = function() {};
      this._transitions[transition].call(this, cb.bind(this));
      return this;
    },
    target: function(focus, speed) {
      focus = $(this.el).find(focus);
      this._target = focus;
      this._speed = speed;
      return this;
    },
    addTransition: function(name, transition) {
      this._transitions[name] = transition;
    }
  }
};

var launchModal = function(options) {
  options = utils.extend({
    close: function() {
      this.__proto__.close.apply(this);
    }
  }, options);
  var modal = utils.launchModal(options);
  var $modal = $(modal.el);
  return modal;
};

var confirm = function(title, message, cb) {
  return launchModal({
    template: 'confirm-modal-template',
    challenge: title,
    message: message,
    callbacks: {
      confirm: cb,
      close: function() {
        this.close();
      }
    }
  });
};

var API = {
  query: function(options) {
    if(typeof(options) !== "object")
      options = { url: options }
    options = utils.extend({
      url: '/api',
      type: 'GET',
      data: {},
      csrf: true,
      collapse: true,
      collapseVersioned: false,
      error: function(res, status, msg) {
        if(res.status == 403 && !window.logged_in) {
          utils.showLogin();
          return;
        }
        if(!res.responseJSON) return;
        utils.growl(res.responseJSON, { type: 'error' });
      },
      success: function(res, type, xhr) { 
        if(!(typeof res == "string") || !res.responseText) return;
        utils.growl((typeof res == "string") ? res : res.responseText, { type: 'success' });
      }
    }, options);
    showIndicator();
    if(typeof(options.data) === "string") {
      if(options.csrf)
        options.data += '&_csrf=' + window._csrf;
    } else {
      if(options.csrf) {
        options.data = utils.extend({ 
          _csrf: window._csrf
        }, options.collapse ? utils.collapse(options.data, options.collapseVersioned) : options.data);
      }
    }
    var req = $.ajax(options);
    req.complete(function() {
      hideIndicator();
    });
    return req;
  },
  action: function(url) {
    return API.query({ url: url, type: 'POST' });
  }
};

var ComputedValue = function(computed) {
  this.valueFunction = computed || function(){};
};

ComputedValue.prototype.eval = function(ctx) {
  return this.valueFunction.call(ctx);
};

//views = controllers
//todo: implement callbacks on view hide and destroy
var View = function(options) {
  var self = this;
  utils.extend(self, {
    template: null,
    el: null,
    events: {},
    behaviors: [],
    children: [],
    restoreScroll: false,
    beforeRender: function(){},
    onRender: function(){},
    overwriteChildEvents: false
  }, behaviors.apply.apply(behaviors, [options].concat(options.behaviors || [])));

  if(!self.el) throw "View element undefined.";
  self.el = self.el.tagName ? self.el : $(self.el)[0] || document.getElementById(self.el);
  
  if(!self.template) throw "View template undefined.";
  self.template = self.template.tagName ? self.template : document.getElementById(self.template);
  self.doRender = utils.compileTemplate(self.template ? self.template.innerHTML : '');
};

//render with self as context
View.prototype.render = function(restoreScroll) {
  var self = this;
  restoreScroll = restoreScroll == null ? self.restoreScroll : restoreScroll;

  //need a surrogate to map evaluated function values, move context variables to a child object
  var computed = {};
  var keys = Object.keys(self);
  for(var i=0; i<keys.length; i++) {
    if(self[keys[i]] instanceof ComputedValue) {
      computed[keys[i]] = self[keys[i]].eval(self);
    }
  }

  self.beforeRender();
  if(restoreScroll)
    var oldScroll = $(document).scrollTop();

  //render
  self.unbindEvents();
  self.el.innerHTML = self.doRender(utils.extend(utils.extend({}, self), computed));
  if(!self.overwriteChildEvents) self.bindEvents(); //these events are not applied to child views.

  //rehook child elements instead of setting target to new elements, keeps ref but results in extra container
  $(self.children).each(function(i, child) {
    if(child.view && child.el && child.view instanceof View) {
      var target = $(self.el).find(child.el) || $('<div></div>');
      if(target) {
        target.html(''); //clear render target
        $(child.view.el).appendTo(target); //hook onto target
        child.view.render(false); //render child view
      }
    }
  });

  if(self.overwriteChildEvents) self.bindEvents();
  self.onRender();
  if(restoreScroll) 
    $(document).scrollTop(oldScroll);
  return self;
};

//dispose events before render for memory leaks
View.prototype.unbindEvents = function() {
  var self = this;
  //clear events
  if(utils.isNull(self.events)) return false;
  var keys = Object.keys(self.events);
  for(var i=0;i<keys.length;i++) {
    var key = keys[i];
    var ev = key.slice(0, key.indexOf(' '));
    var $el = $(self.el).find(key.slice(key.indexOf(' ') + 1));
    $el.off(ev);
  }
  return self;
};

View.prototype.bindEvents = function() {
  var self = this;
  //clear events
  if(utils.isNull(self.events)) return false;
  var keys = Object.keys(self.events);
  for(var i=0;i<keys.length;i++) {
    var key = keys[i];
    var ev = key.slice(0, key.indexOf(' '));
    var $el = $(self.el).find(key.slice(key.indexOf(' ') + 1));
    $el.off(ev).on(ev, self.events[keys[i]].bind(self));
  }
  return self;
};

//register child view
View.prototype.register = function(child, el) {
  var self = this;
  if(child instanceof View) {
    self.children.push({ el: el, view: child });
  }
  return self;
};

var AnimView = function(options) {
  var self = this;
  options = utils.extend({
      css: '',
      max_transition_length: 0,
      transitions: [{}] // 'anim', ['anim'], { target: '', class: 'anim', length: 100}, [{}]
  }, options);

  View.apply(this, [options]);

  /* workaroud for css anim procs */
  self.render(); //render first
  self.bindAnimations();
  return self;
};

AnimView.prototype = Object.create(View.prototype);

AnimView.prototype.bindAnimations = function() {
  var self = this;
  var transitions = self.transitions;
  if(!(transitions instanceof Array)) transitions = [transitions];
  for(var i=0; i<transitions.length; i++) {
    var trans = transitions[i];
    if(typeof trans === "string") trans = { class: trans };
    var target = trans.target ? $(self.el).find(trans.target).andSelf().filter(trans.target) : $(self.el); //workaround for lack of self filters
    target.removeClass(trans.class); //force animations
    if(trans.length) {
      if(self.max_transition_length < trans.length) self.max_transition_length = trans.length;
      var keys = ['transition-duration', '-webkit-transition-duration', 'animation-duration', '-webkit-animation-duration'];
      var tail = ': ' + trans.length + 's !important;';
      target.attr('style', (target.css(keys, '').attr('style') || '') + keys.join(tail) + tail);
    }
    utils.defer(target.addClass.bind(target, trans.class));
  }
};

AnimView.prototype.unbindAnimations = function() {
  var self = this;
  var transitions = self.transitions;
  if(!(transitions instanceof Array)) transitions = [transitions];
  for(var i=0; i<transitions.length; i++) {
    var trans = transitions[i];
    if(typeof trans === "string") trans = { class: trans };
    if(!trans.target) {
      $(self.el).removeClass(trans.class);
      continue;
    }
    $(self.el).find(trans.target).andSelf().filter(trans.target).removeClass(trans.class); //workaround for lack of self filters
  }
};

var modalView = function(options) {
  var self = this;
  options = utils.extend({
    template: 'default-modal-template',
    view: null,
    _flash: [],
    flashes: utils.computed(function() {
      var f = this._flash;
      this._flash = [];
      return f;
    }),
    flash: function(type, msg) {
      this._flash.push({
        type: type,
        message: msg
      });
    },
    onShow: function() {},
    callbacks: {}, 
    el: $('<div></div>')[0], //pseudo-wrapper in memory
    transitions: { target: '.modal', class: 'in', length: .3 }
  }, options, {
    //usage: { success: function() { ... } }, success is bound to some el, i.e. <a class="closeModal" data-status="success"> (...) </a>
    events: utils.extend({
      'click [data-status]:not(.closeModal)': function(ev) {
        return self.trigger($(ev.target).data('status'));
      },
      'click .closeModal': function(ev) {
        var callbackType = $(ev.target).data('status');
        if(!callbackType) callbackType = 'close';
        if(self.trigger(callbackType, [ev]) !== false)
          self.close(); //special hack for css3 animations
        return false;
      }
    }, options.events || {})
  });

  AnimView.apply(this, [options]);

  $(self.el).find('.modal').on('hidden', self.close.bind(self));
  self.onShow();
};

modalView.prototype = Object.create(AnimView.prototype);

//close the modal
modalView.prototype.close = function() {
  var self = this;
  self.unbindAnimations();
  setTimeout(function() {
    $(self.el).remove();
  }, self.max_transition_length * 1000);
  return self;
};

//trigger a modal event
modalView.prototype.trigger = function(callbackType, args) {
  var self = this;
  if(callbackType in self.callbacks && self.callbacks[callbackType].apply(self, args) === false) return false; //allow for callback to cancel
  return self;
};

var moduleView = function(options) {
  var self = this;
  options.events = utils.extend({
    'click .refresh-module': function(ev) {
      this.reload();
    },
    'click .edit-module': function(ev) {
      if(!window.logged_in) {
        utils.showLogin();
        return false;
      }
      if(!this.editing) {
        this.editing = true;
        this.render();
      }
    },
    'click .save-module': function(ev) {
      if(!window.logged_in) {
        utils.showLogin();
        return false;
      }
      var self = this;
      self.bindInputValues();
      self.sync().success(function() {
        self.editing = false;
        self.render();
        $(window).off('beforeunload');
      });
    },
    'click .set-module': function(ev) {
      var self = this;
      self.bindInputValues();
      self.editing = false;
      self.render();
    },
    'click .cancel-module': function() {
      var self = this;
      self.revert();
      self.editing = false;
      self.render();
    },
    'click .revert-module': function() {
      var self = this;
      self.revert();
    },
    'propertychange *[name]': function() {
      this.bindInputValues();
    },
    'change *[data-path]': function() {
      this.bindInputValues();
    },
    'input *[name]': function() {
      this.bindInputValues();
    }
  }, options.events || {});
  options = utils.extend({
    template: 'default-module-template',
    editing: false, 
    modified: utils.computed(function() {
      return this._data != JSON.stringify(this.data);
    }),
    bindInputValues: function() {
      var self = this;
      $(self.el).find('*[name]').each(function() {
        self.data[$(this).attr('name')] = $(this).val();
      });
      $(self.el).find('*[data-path]').each(function() {
        utils.setPath(self.data, $(this).data('path'), $(this).val(), {});
      });

      $(window).off('beforeunload');
      if(this._data != JSON.stringify(this.data) && this.editing) {
        $(window).on('beforeunload', function() {
          return "You seem to have unsaved changes here.";
        });
      }
    },
    reloadSource: "",
    onSave: function() {

    },
    name: "",
    syncOnlyVersioned: true,
    pushSource: null,
    data: {},
    _data : "" //check string
  }, options);
  //if(options.templateURL) GET template then create element and set as template. Run constructor on callback.

  View.apply(this, [options]);
  if(self.data instanceof Object && Object.keys(self.data).length > 0) self.setData(self.data);
};

moduleView.prototype = Object.create(View.prototype);

moduleView.prototype.resetHash = function() {
  this._data = JSON.stringify(this.data);
};

moduleView.prototype.setData = function(data) {
  var self = this;
  self.data = data;
  self.resetHash();
  self.onSave();
  self.render();
};

moduleView.prototype.revert = function() {
  if(this._data)
    this.setData(JSON.parse(this._data));
};

moduleView.prototype.reload = function(cb) {
  var self = this;
  var src = typeof self.reloadSource === "function" ? self.reloadSource() : self.reloadSource;
  return API.query(src).success(function(data) {
    self.setData(data);
    if(cb) { cb(data); };
  });
};

moduleView.prototype.push = function(data) {
  var self = this;
  data = data || self.data;
  var src = (typeof self.pushSource === "function" ? self.pushSource() : self.pushSource) || 
            (typeof self.reloadSource === "function" ? self.reloadSource() : self.reloadSource);
  return API.query({ type: 'POST', data: data, url: src, collapseVersioned: !self.syncOnlyVersioned }).success(self.setData.bind(self, data)); //TODO: self.setData.bind(self), have server serve up new
};

moduleView.prototype.sync = function() {
  var self = this;
  if(JSON.stringify(self.data) != self._data) {
    return self.push();
  } else {
    return self.reload();
  }
};

//new module view class
//load from DOM
//serialize from DOM
//editMode = Boolean (whether or not to display editors)
//reloadSource = String (url to GET data from)
//pushSource = String (url to POST data to)
//maybe templateURL?
//errors from utils.growl

var commentView = function(options) {
  var self = this;
  options = utils.extend({
    template: 'comment-module-template',
    parent: null, //id
    limit: 100,
    sortMode: 'Newest',
    sortModes: {
      'Newest': '-posted',
      'Oldest': 'posted',
      'Popular': '-votes.total',
      'Unpopular': 'votes.total',
      'Famous': '-votes.count',
      'Unnoticed': 'votes.count'
    },
    load_index: 0,
    comments: [],
    href: null,
    populate_depth: 1,
    show_parent_links: false,
    posting: false,
    loading: false,
    replying: false,
    nested: false,
    query: '',
    user: window.user || false,
    add: function(text) {
      var self = this;
      if(!self.parent) throw "No parent attached to this comment module.";
      return API.query({ 
        type: 'POST',
        url: '/api/comments',
        data: {
          parent: self.parent,
          text: text,
          href: self.href
        }
      });
    },
    reload: function() {
      var self = this; 
      if(self.parent == null) throw "No parent attached to this comment module.";
      self.loading = true;
      $.get('/api/comments?' + (self.parent ? 'parent=' + self.parent : '') + '&pageSize=' + self.limit + '&page=' + self.load_index + '&sort=' + self.sortModes[self.sortMode] + self.query)
       .success(function(data) {
        self.loading = false;
        self.comments = data;
        self.render();
      });
      return self;
    },
    loadNext: function() {
      var self = this;
      if(!self.parent) throw "No parent attached to this comment module.";
      self.load_index++;
      $.get('/api/comments?parent=' + self.parent + '&pageSize=' + self.limit + '&page=' + self.load_index)
       .success(function(data) {
        self.comments += data;
        self.render();
      });
    },
    setSortMode: function(mode) {
      if(!this.sortModes[mode]) return false;
      this.sortMode = mode;
      this.reload();
      this.render();
    },
    getComment: function(id) {
      for(var i=0; i<this.comments.length; i++) {
        if(this.comments[i]._id == id) return this.comments[i];
      }
    },
    show_replies: {},
    replies: {},
    loadReplyView: function(cid) {
      if(!this.replies[cid]) {
        this.replies[cid] = new commentView({
          el: $('<div></div>'),
          parent: cid,
          replying: false,
          nested: true,
          populate_depth: (this.populate_depth || 1) - 1,
          user: this.user,
          href: this.href
        });
        this.replies[cid].reload();
        this.register(this.replies[cid], '.comment-children[data-parent="' + cid + '"]');
      }
      return this.replies[cid];
    },
    events: {
      'submit form.comment-box': function(ev) {
        ev.stopPropagation();
        var self = this,
            message = $(this.el).find('textarea[name="comment-text"]').val();
        this.posting = true;
        this.render();
        this.add(message).success(function(data) {
          data.user = window.user;
          self.comments.unshift(data);
        }).complete(function() {
          self.posting = false;
          self.render();
        });
        return false;
      },
      'click [data-sort]': function(ev) {
        self.setSortMode($(ev.currentTarget).data('sort'));
      },
      'click .btn-vote-up': function(ev) {
        var self = this,
            id = $(ev.currentTarget).data('comment');
        API.action('/api/comments/' + id + '/upvote').success(function(data) {
          if(!data) return;
          self.getComment(id).votes = data.votes;
          self.render();
        });
      },
      'click .btn-vote-down': function(ev) {
        var self = this,
            id = $(ev.currentTarget).data('comment');
        API.action('/api/comments/' + id + '/downvote').success(function(data) {
          if(!data) return;
          self.getComment(id).votes = data.votes;
          self.render();
        });
      },
      'click .btn-view-replies': function(ev) {
        var cid = $(ev.currentTarget).data('comment')
          , comment = this.getComment(cid);
        comment.load_children = !comment.load_children;
        this.loadReplyView(cid);
        this.render();
      },
      'click .btn-add-replies': function(ev) {
        var cid = $(ev.currentTarget).data('comment')
          , comment = this.getComment(cid);
        comment.load_children = true;
        this.loadReplyView(cid).replying = true;
        this.render();
      }
    }
  }, options);
  View.apply(this, [options]);
};

commentView.prototype = Object.create(View.prototype);

var license_preview = new View({
  el: $('#license-preview')[0],
  template: 'license-preview-template',
  show_preview: false,
  loading_preview: true,
  license: null,
  select_el: null,
  select: function(el) {
    var self = this;
    self.show_preview = false;
    self.select_el = el;
    self.render();
  },
  deselect: function() {
    var self = this;
    self.select_el = null;
    self.show_preview = false;
    self.loading_preview = true;
    self.render();
  },
  onRender: function() {
    var self = this;
    $(self.el).css({
      left: $(self.select_el).offset().left + 'px',
      top: ($(self.select_el).offset().top - $(self.select_el).outerHeight()) + 'px',
      width: $(self.select_el).outerWidth() + 'px'
    });
  },
  apply: function() {
    return;
    $('.license-list > li[data-id]').each(function() {
      $(this).off('mouseenter').off('mouseleave').mouseenter(function() {
        license_preview.select($(this)[0]);
      }).mouseleave(function() {
        license_preview.deselect();
      });
    });
  },
  events: {
    'click .btn-preview': function() {
      self.show_preview = true;
      self.loading_preview = true;
      API.query('/api/license/' + self.select_id).success(function(data) {
        self.license = data;
        self.loading_preview = false;
        self.render();
      });
      self.render();
    }
  }
}); 

license_preview.apply();