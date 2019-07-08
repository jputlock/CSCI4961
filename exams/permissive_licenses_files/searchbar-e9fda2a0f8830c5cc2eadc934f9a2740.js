(function(){
    var slug_cache = {};
    $('.main-searchbar input.searchbar').each(function() { 
        var self = this;
        $(this).typeahead({
            source: function(query, process) {
                $.debounce(250, function() {
                    $.get('/search?q=' + query, function(results) {
                        var suggestions = ['<i>Search for ' + query + '</i>'];
                        slug_cache = {};
                        for(var i=0; i<results.length; i++) {
                            slug_cache[results[i].title] = results[i].slug;
                            suggestions.push(results[i].title);
                        }
                        process(suggestions);
                    });
                })();
                process(['Loading...']);
            },
            updater: function(item) {
                if(!slug_cache[item]) return $(self).parent()[0].submit();
                window.location = '/license/' + (slug_cache[item] || item);
                return item;
            }
        });
    });

    $('.focus-searchbar').click(function() {
        var query = $(this).data('query') || '';
        $('.main-searchbar input.searchbar').val(query).select();
    });

    $('.main-searchbar').each(function() {
        var self = this;
        $(this).find('a.submit').click(function() {
            self.submit();
        });
    });

    var notification_el = $('#notification-panel')[0];
    if(notification_el) {
        var notification_view = window.notifications = new View({
            el: notification_el,
            template: $('#notification-panel-template')[0],
            open: false,
            loading: true,
            unread: window.unread_notifications,
            notifications: null,
            current_limit: 5,
            skip: 0,
            limit_reached: false,
            reload: function() {
                var self = this;
                var oldScroll = $(self.el).find('.dropdown-menu').scrollTop();
                self.loading = true;
                self.render();
                $(self.el).find('.dropdown-menu').scrollTop(oldScroll);
                $.get('/api/user/notifications?limit=' + self.current_limit + '&skip=' + self.skip).success(function(data) {
                    self.notifications = (self.notifications || []).slice(0, self.skip).concat(data);
                    self.loading = false;
                    self.unread = 0;
                    self.limit_reached = data.length == 0;
                    self.render();
                    $(self.el).find('.dropdown-menu').scrollTop(oldScroll);
                });
            },
            events: {
                'click .btn-open-notifications': function(ev) {
                    var self = this;
                    self.open = !this.open;
                    self.render();
                    if(!this.notifications) {
                        self.reload();
                    }
                    return false;
                },
                'click #notification-menu': function(ev) {
                },
                'click .btn-load-more': function(ev) {
                    this.skip = this.notifications.length;
                    this.reload();
                    return false;
                },
                'click [data-href]': function(ev) {
                    window.location = $(ev.currentTarget).data('href');
                }
            },
            onRender: function() {
                var self = this;
                if(self.open) {
                    $('body').off('click.notifications').on('click.notifications', function(ev) {
                        self.open = false;
                        self.render();
                    });
                }
                if(!self.loading && !self.limit_reached) {
                    $(self.el).find('.dropdown-menu').on('scroll', function(e) {
                        if($(this).scrollTop() >= $(this)[0].scrollHeight - $(this).outerHeight()) {
                            self.skip = self.notifications.length;
                            self.reload();
                        }
                        e.stopPropagation();
                        return false;
                    });
                }
            }
        });

        notification_view.render();
    }

    $('.btn-reverse-search').click(function() {
        return launchModal({
            template: 'reverse-search-modal-template',
            callbacks: {
                'confirm': function() {
                    var newData = { can: [], cannot: [], must: [] };
                    for(var i=0; i<3; i++) {
                        var index = ["can", 'cannot', 'must'][i];
                        for(var q=0; q<this.data[index].length; q++) {
                            newData[index].push(this.data[index][q]._id);
                        }
                    }
                    window.location = '/search?reverse=true&' + $.param(newData);
                }
            },
            behaviors: ['transitionable'],
            data: {
                can: [],
                cannot: [],
                must: []
            },
            events: {
                'click li[data-index]': function(ev) {
                    var self = this;
                    self.target($(ev.currentTarget), 200).play('fadeOut', function() {
                        self.data[$(ev.currentTarget).data('bucket')].splice($(ev.currentTarget).data('index'), 1);
                        self.render();
                    });
                }
            },
            onRender: function() {
                var self = this;
                $(self.el).find('form').addClass('in');
                $(this.el).find('li.input > input').each(function() {
                    var el = this;
                    $(this).autocomplete({
                        src: function(query) {
                            return '/api/attributes/search?title=' + query;
                        },
                        process: function(row) {
                            return row.title;
                        },
                        update: function(row) {
                            self.data[$(el).data('type')].push(row);
                            self.render();
                        } 
                    });
                });
            }
        });
    })
})();