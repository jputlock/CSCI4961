Handlebars.registerPartial("attribute", $("#attribute-template").html());

var LicenseView = new moduleView({
  el: $('#license_root')[0],
  template: 'license-template',
  reloadSource: function() {
    return '/api/license/' + this.data._id;
  },
  editing_title: false,
  user_relationship: {},
  setRelationship: function(relationship) {
    this.user_relationship = relationship;
    this.render();
  },
  getChild: function(name) {
    for(var i=0; i<this.children.length; i++) {
      if(this.children[i].view.name == name) return this.children[i].view;
    }
  },
  sticky: false,
  syncOnlyVersioned: false,
  restoreScroll: true,
  events: {
    'click .edit-title': function(ev) {
      this.editing_title = true;
      this.render();
      $('#input-license-title')[0].focus();
    },
    /*'click .btn-endorse-license': function(ev) {
      var self = this;
      API.query({ url: '/api/license/' + this.data._id + '/endorse', type: 'POST' }).success(function(data) {
        self.data.endorsements++;
        self.resetHash();
        self.setRelationship(data);
      });
    },
    'click .btn-unendorse-license': function(ev) {
      var self = this;
      API.query({ url: '/api/license/' + this.data._id + '/unendorse', type: 'POST' }).success(function(data) {
        self.data.endorsements--;
        self.resetHash();
        self.setRelationship(data);
      });
    },*/
    'click .btn-report-license': function(ev) {
      var license = this;
      launchModal({
        template: 'report-license-template',
        callbacks: {
          'submit': function() {
            var self = this;
            API.query({ url: '/api/license/' + license.data._id + '/report', type: 'POST', data: $(self.el).find('form').serialize() }).success(function(res, type, xhr) {
              self.close();
              utils.growl(res, { type: 'success' });
            });
            return false;
          }
        }
      });
    },
    'click .btn-follow-license': function(ev) {
      var self = this;
      API.query({ url: '/api/license/' + this.data._id + '/follow', type: 'POST' }).success(function(data) {
        self.data.favorites = self.data.favorites + 1 || 1;
        self.resetHash();
        self.setRelationship(data);
      });
    },
    'click .btn-unfollow-license': function(ev) {
      var self = this;
      API.query({ url: '/api/license/' + this.data._id + '/unfollow', type: 'POST' }).success(function(data) {
        self.data.favorites = self.data.favorites - 1 || 0;
        self.resetHash();
        self.setRelationship(data);
      });
    },
    'blur #input-license-title': function(ev) {
      this.data.title = $(ev.target).val();
      this.sync();
      this.editing_title = false;
      this.render();
    },
    'click .btn-remove-tag': function(ev) {
      var self = this, tag = $(ev.currentTarget).data('tag');
      API.action('/api/license/' + this.data._id + '/removeTag?tag=' + tag).success(function() {
        self.reload();
      });
    },
    'click .missing': function(ev) {
      alert("The Doctype format for this license has changed.  If you'd like to add missing modules, simple edit the base license (i.e. title) and save in order to generate missing modules.");
    }
  },
  module: '',
  setModule: function(module, doNotRender) {
    if(this.module == module) return;
    if(!this.data.modules || !(module in this.data.modules)) return routie('');
    this.module = module;
    if(!doNotRender)
      this.render();
  },
  super: utils.computed(function() {
    return window.user && (LicenseView.data.manager._id == window.user._id || window.user.super);
  }),
  missing_modules: utils.computed(function() {
    return $(LicenseView.data.type.modules).not(Object.keys(LicenseView.data.modules)).get();
  }), 
  onRender: function() {
    var self = this;
    var padding = 45;
    var isSticky = $(window).scrollTop() + padding > $('.sticky-anchor').offset().top;

    function setSticky(toggle) {
      if(self.sticky == toggle) return;
      self.sticky = toggle;
      if(toggle) {
        $('.sticky-padder').removeClass('hidden').addClass('sticky-anchor');
        $('.license-navigation').removeClass('sticky-anchor').addClass('sticky');
        $('.sticky-info').removeClass('hidden');
        $('.stats').addClass('hidden');
      } else {
        $('.sticky-padder').removeClass('sticky-anchor').addClass('hidden');
        $('.license-navigation').removeClass('sticky').addClass('sticky-anchor');
        $('.sticky-info').addClass('hidden');
        $('.stats').removeClass('hidden');
      }
    }

    $(window).off('scroll.stickybar').on('scroll.stickybar', function() {
      setSticky($(window).scrollTop() + padding > $('.sticky-anchor').offset().top);
    });

    setSticky(isSticky); 

    var value_cache = {};
    $('#input-add-tag').typeahead({
      source: function(query, process) {
          $.debounce(250, function() {
            $.get('/api/tags/search?title=' + query, function(results) {
                var suggestions = [];
                value_cache = {}
                for(var i=0; i<results.length; i++) {
                  value_cache[results[i].title] = results[i];
                  suggestions.push(results[i].title);
                }
                process(suggestions);
            });
          })();
      },
      updater: function(value) {
        for(var i=0; i<self.data.tags.length; i++) {
          if(self.data.tags[i]._id == value_cache[value]._id) return;
        }
        self.data.tags.push(value_cache[value]);
        API.action('/api/license/' + self.data._id + '/addTag?tag=' + value_cache[value]._id).success(function() {
          self.render();
        });
      }
    }).keypress(function(e) {
      if(e.keyCode == 13) {
        //POST a create tag 
        API.query({ type: 'POST', url: '/api/tags', data: {
          title: $(this).val()
        } }).success(function(tag) {
          self.data.tags.push(tag);
          self.render();
        });
      }
    });
  },
  _modules: {},
  onSave: function() {
    var self = this;
    if(!self.data.modules) return;
    var keys = Object.keys(self.data.modules);
    for(var i=0; i<keys.length; i++) {
      //TODO: set module in hash, if exists just set data, reset _data hash and render
      var base = (modules[keys[i]] || { events: {} });
      base.events = utils.extend({
        'click .fork-module': function(ev) {
          var self = this;
          $(self.el).find('*[name]').each(function() {
            self.data[$(this).attr('name')] = $(this).val();
          });
          if(!self.modified.eval(self)) {
            self.setFlash("Think about some changes you'd make before submitting.");
            return;
          }
          var changesets = LicenseView.data.modules.changesets || null;
          if(changesets) {
            var modal = launchModal({
              module: self,
              user: user,
              onRender: function() {
                utils.defer(function() {
                  $(modal.el).find('input[name=title]')[0].select();
                });
              },
              template: 'create-fork-modal-template',
              callbacks: {
                'submit': function() {
                  API.query({ url: '/api/modules/changesets/' + changesets._id + '/addFork', data: {
                    module_name: self.name,
                    module: utils.collapse(self.data),
                    title: $(modal.el).find('input[name=title]').val(),
                    description: $(modal.el).find('textarea[name=description]').val()
                  }, type: 'POST', collapse: false }).success(function(data) {
                    modal.close();
                    self.editing = false;
                    LicenseView.getChild('changesets').reload(function() {
                      routie('changesets/forks/' + data._id);
                    });
                  }); 
                }
              }
            });
            self.render();
          }
        }
      }, base.events);
      var newModule = new moduleView(utils.extend({
        name: keys[i],
        el: $('<div></div>')[0],
        restoreScroll: true,
        overwriteChildEvents: true,
        template: 'module-' + keys[i] + '-template',
        reloadSource: function() {
          return '/api/modules/' + this.name + '/' + this.data._id;
        },
        flash: "",
        setFlash: function(flash) {
          this.flash = flash;
          this.render();
          this.flash = "";
        },
        onSave: function() {
          var restore = JSON.parse(LicenseView._data);
          if(!restore || !restore.modules[this.name]) return;
          restore.modules[this.name] = this.data;
          LicenseView._data = JSON.stringify(restore);
          //reset all module references to license?
        },
        super: LicenseView.super,
        data: self.data.modules[keys[i]]
      }, base || {}));
      var moduleEdit = new View({
        module: newModule,
        el: $('<span></span>')[0],
        template: 'module-edit-tools-template',
        modified: newModule.modified,
        super: newModule.super
      });
      newModule.register(moduleEdit, '.module-edit-tools');
      self.register(newModule, '#module-' + keys[i]);
    }
  }
});

function init(data) {
  //render initial data
  LicenseView.setData(data);

  var comments = new commentView({
    el: $('<div></div>'),
    parent: LicenseView.data._id,
    replying: !!(window.user)
  });
  comments.reload();
  LicenseView.register(comments, '.comments-root');

  function bindAnims() {
    //introductory animations
    utils.defer(function() {
      $('.license-navigation').addClass('animated fadeInRight');
      $('.subtitle').addClass('animated fadeIn');
      $('h1.license-title').addClass('animated fadeInLeft');
    });
  }

  //set routes
  var keys = data.type.modules;
  for(var i=0; i<keys.length; i++) {
    routie(keys[i], LicenseView.setModule.bind(LicenseView, keys[i]));
  }
  routie('', function() {
    LicenseView.setModule(keys[0]);
  });
  routie('*', function() {
    routie('');
    bindAnims();
  });
  window.scrollTo(0, 0);

  //load user relationship
  $.get('/api/license/' + LicenseView.data._id + '/user').success(function(relationship_data) {
    LicenseView.setRelationship(relationship_data);
    bindAnims();
  });

  bindAnims();
}

$('.input-short-url').click(function() {
  $(this)[0].select();
})