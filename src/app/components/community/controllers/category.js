angular.module('community').controller('category_controller',
    ['$scope','community_service','session', '$q', 'global_search', 'user_model', 'filters_functions', 'community_categories',
        'category', 'page_model', 'social_service', 'modal_service', 'tags_constants', 'global_loader', 'user_tags', '$q',
        function($scope, community_service, session, $q, global_search, user_model, filters_functions, community_categories,
        category,  page_model, social_service, modal_service, tags_constants, global_loader, user_tags, $q){

        var ctrl = this;
        ctrl.categories = community_categories;
        ctrl.seed = parseInt(Math.random() * 99) + 1;
        ctrl.pages = page_model.list;
        ctrl.results = [];
        ctrl.session = session;
        ctrl.filters_tpl = "app/components/community/tpl/filters.html";
        ctrl.toggleFilters = function(){
            ctrl.filters_opened = !ctrl.filters_opened;
        };
        ctrl.category = ctrl.categories[category || 'all'];
        ctrl.filters =   ctrl.category.last_filters || {
            organization : [],
            role : null,
            page_type : null,
            is_pinned : null,
            events : null,
            tags : []
        };
        ctrl.search = "";
        if(global_search.search && global_search.search.length){
            ctrl.search = global_search.search;
            global_search.search = "";
        }
        else if(ctrl.category.last_search){
            ctrl.search = ctrl.category.last_search;
        }
        ctrl.showTags = {};
        ctrl.checkboxes = {};
        ctrl.tags_constants = tags_constants;
        ctrl.hideInputs = {};
        ctrl.loading = {};
        ctrl.ended = {};
        ctrl.previous = {};

        ctrl.isInSearch = function(tag, category){
            return ctrl.filters.tags && ctrl.filters.tags.indexOf(category + ":" + tag) >= 0;
        };

        ctrl.searchTags = {};
        ctrl.input_tags = {};

        user_model.queue([session.id]).then(function(){
            ctrl.suggestions = {};

            ctrl.suggestions.address = [];
            var address = user_model.list[session.id].datum.address;
            if(address){
                if(address.country){
                    ctrl.suggestions.address.push(address.country.short_name);
                }
                if(address.division && ctrl.suggestions.address.indexOf(address.division.name) === -1){
                    ctrl.suggestions.address.push(address.division.name);
                }
                if(address.city && ctrl.suggestions.address.indexOf(address.city.name) === -1){
                    ctrl.suggestions.address.push(address.city.name);
                }
            }

            ctrl.suggestions.origin = [];
            var origin = user_model.list[session.id].datum.origin;
            if(origin){
                ctrl.suggestions.origin.push(origin.short_name);
            }

            ctrl.suggestions.graduation = [];
            var classYear = user_model.list[session.id].datum.graduation_year;
            if(classYear){
                ctrl.suggestions.graduation.push(classYear);
            }
            ctrl.suggestions.organization = [];
            var organization_id = user_model.list[session.id].datum.organization_id;
            if(organization_id){
                page_model.queue([organization_id]);
                ctrl.suggestions.organization.push(organization_id);
            }

            user_tags.getList(ctrl.session.id).then(function(list){
                ctrl.tags = list;
                angular.forEach(ctrl.tags, function(tags, category){
                    ctrl.suggestions[category] = tags.slice(0,2).map(function(t){ return t.name;});
                });
                angular.forEach(ctrl.suggestions, function(suggestions, category){
                    ctrl.searchTags[category] = function(search, filters){
                        if(ctrl.previous[category] !== search){
                            ctrl.ended[category] = false;
                        }
                        if(!ctrl.loading[category] && !ctrl.ended[category]){
                            ctrl.loading[category] = true;
                            ctrl.previous[category] = search;
                            return community_service.tags(search,
                                  [category], filters.p, filters.n ,ctrl.suggestions[category].map(function(t){ return t;})).then(function(tags){
                                  ctrl.loading[category] = false;
                                  ctrl.ended[category] = tags.length < 10;
                                  return tags;
                            });
                        }
                        else{
                            var deferred = $q.defer()
                            deferred.resolve([]);
                            return deferred.promise;
                        }
                    };

                    ctrl.hideInputs[category] = function(){
                          ctrl.showTags[category] = false;
                          ctrl.ended[category] = false;
                          $scope.$evalAsync();
                    };
                });


                ctrl.searchTags['organization'] = function(search,filter){
                    if(ctrl.previous['organization'] !== search){
                        ctrl.ended['organization'] = false;
                    }
                    if(!ctrl.loading['organization'] && !ctrl.ended['organization']){
                        ctrl.loading['organization'] = true;
                        ctrl.previous['organization']  = search;
                        return community_service.pages( search, filter.p, filter.n, 'organization', null, ctrl.suggestions.organization).then(function(r){
                            return page_model.queue(r.list).then(function(){
                                ctrl.ended['organization'] = r.list.length < 10;
                                ctrl.loading['organization'] = false;
                                return r.list;
                            });
                        });
                    }
                    else{
                        var deferred = $q.defer()
                        deferred.resolve([]);
                        return deferred.promise;
                    }
                };

                ctrl.filters.tags.forEach(function(tag){
                    tag = tag.split(':');
                    if(tag.length === 2 && ctrl.suggestions[tag[0]].indexOf(tag[1]) === -1){
                        ctrl.suggestions[tag[0]].push(tag[1]);
                    }
                });
            });


        });

        ctrl.additionalTags = {};
        ctrl.toggleTagFilter = function(tag, category, exclusive){
            if(!ctrl.isInSearch(tag, category)){
                if(exclusive || !tag){
                    ctrl.filters.tags = ctrl.filters.tags.filter(function(t){
                        return t.indexOf(category + ":") !== 0;
                    });
                }
                if(tag){
                    ctrl.filters.tags.push(category + ":" + tag);
                    if(ctrl.suggestions[category].indexOf(tag) === -1){
                        ctrl.suggestions[category].push(tag);
                    }
                }
            }
            else if(!exclusive){
                ctrl.filters.tags.splice(ctrl.filters.tags.indexOf(category + ":" + tag), 1);
            }
            ctrl.onSearch();
        };

        ctrl.toggleFilter = function(item, type){
            var index = ctrl.filters[type].indexOf(item);
            if(index >= 0){
               ctrl.filters[type].splice(index, 1);
            }
            else{
                ctrl.filters[type].push(item);
                if(ctrl.suggestions[type].indexOf(item) === -1){
                    ctrl.suggestions[type].push(item);
                }
            }
            ctrl.onSearch();
        };



        ctrl.page = 1;
        ctrl.page_size = 36;

        ctrl.openConversation= function(user){
            social_service.openConversation(null, [user], null);
        };


        ctrl.viewConnections = function( $event, id ){
             if( user_model.list[id].datum.contacts_count ){
                 modal_service.open( {
                     template: 'app/shared/custom_elements/user/user_connections/connections_modal.html',
                     reference: $event.target,
                     scope: {
                         user_id: id
                     },
                     label: filters_functions.username(user_model.list[id].datum) + "'s connection" + (user_model.list[id].datum.contacts_count > 1 ? "s" : "")
                 });
             }
         };




        var deferred;
        ctrl.onSearch = function(){

            ctrl.page = 1;
            ctrl.category.list = [];
            ctrl.finished = false;
            $scope.$parent.pctrl.search = ctrl.search;
            init();
        };
        ctrl.nextPage = function(){
            if(ctrl.searching || ctrl.finished){
                return;
            }
            ctrl.searching = true;
            return ctrl.category.fill(ctrl.search, ctrl.page, ctrl.page_size, ctrl.filters).then(function(r){
                ctrl.page++;
                ctrl.searching = false;
                ctrl.finished = r < ctrl.page_size;
            });

        };


        var init = function(){
            ctrl.searching = true;
            ctrl.category.fill(ctrl.search.trim(), ctrl.page, ctrl.page_size, ctrl.filters).then(function(r){
                ctrl.searching = false;
                ctrl.finished = r < ctrl.page_size;
            });
        };

        init();





    }
]);
