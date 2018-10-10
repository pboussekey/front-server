angular.module('community').controller('category_controller',
    ['$scope','community_service','session', '$q', 'global_search', 'user_model', 'filters_functions', 'community_categories',
        'category', 'page_model', 'social_service', 'modal_service', 'tags_constants', 'global_loader', 'user_tags',
        function($scope, community_service, session, $q, global_search, user_model, filters_functions, community_categories,
        category,  page_model, social_service, modal_service, tags_constants, global_loader, user_tags){

        var ctrl = this;
        ctrl.categories = community_categories;
        ctrl.seed = parseInt(Math.random() * 99) + 1;
        ctrl.pages = page_model.list;
        ctrl.results = [];
        ctrl.search =  $scope.$parent.pctrl.search;
        ctrl.session = session;
        ctrl.filters = {
            organization : [],
            role : "",
            page_type : null,
            is_pinned : null,
        };
        ctrl.category = ctrl.categories[category || 'all'];
        ctrl.addFilter = function(item, type){
            if(ctrl.filters[type].indexOf(item) === -1){
                ctrl.filters[type].push(item);
                ctrl.onSearch();
            }
        };

        ctrl.showTags = {};
        ctrl.suggestions = {};
        ctrl.checkboxes = {};
        ctrl.tags_constants = tags_constants;
        user_tags.getList(ctrl.session.id).then(function(list){
            ctrl.tags = list;
            angular.forEach(ctrl.tags, function(tags, category){
                ctrl.suggestions[category] = tags.slice(0,3).map(function(t){ return t.name;});
            });

        });

        ctrl.isInSearch = function(tag){
            return ctrl.search.toLowerCase().indexOf(tag.toLowerCase()) >= 0;
        };

        ctrl.searchTags = function(search, category){
            return community_service.tags(search,
                [category], 1, 5).then(function(tags){
                return tags;
            });
        };

        user_model.queue([session.id]).then(function(){
            var address = user_model.list[session.id].datum.address;
            if(address){
                ctrl.suggestions.address = [];
                if(address.country){
                    ctrl.suggestions.address.push(address.country.short_name);
                }
                if(address.division){
                    ctrl.suggestions.address.push(address.division.name);
                }
                if(address.city){
                    ctrl.suggestions.address.push(address.city.name);
                }
            }
        });

        ctrl.additionalTags = {};
        ctrl.toggleTagFilter = function(tag, category){
            if(!ctrl.isInSearch(tag)){
                ctrl.search = ((ctrl.search || "") + " " + tag).trim();
                if(category && ctrl.suggestions[category].indexOf(tag) === -1){
                    ctrl.suggestions[category].push(tag);
                }
            }
            else{
                var regEx = new RegExp(tag, "ig");
                ctrl.search = ctrl.search.replace(regEx, '').trim();
            }
            ctrl.onSearch();
        };

        ctrl.searchTags = {};
        ctrl.input_tags = {};
        angular.forEach(ctrl.tags_constants.categories, function(category){
            ctrl.searchTags[category] = function(search){
                return community_service.tags(search,
                      [category], 1, 5, ctrl.suggestions[category].map(function(t){ return t;})).then(function(tags){
                      return tags;
                });
            };
            ctrl.searchTags.address = function(search){
                return community_service.tags(search,
                      ['address'], 1, 5, ctrl.suggestions['address'].map(function(t){ return t;})).then(function(tags){
                      return tags;
                });
            };
        });


        ctrl.page = 1;
        ctrl.page_size = 50;

        ctrl.searchOrganization = function(search,filter){
            ctrl.loading = true;
            return community_service.pages( search, filter.p, filter.n, 'organization').then(function(r){
                ctrl.loading = false;
                return page_model.queue(r.list).then(function(){
                    return r.list;
                });
            });
        };

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
            if(deferred){
                deferred.reject();
            }
            deferred = null;
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
            deferred = $q.defer();
            deferred.promise = ctrl.category.fill(ctrl.search, ctrl.page, ctrl.page_size, ctrl.filters);
            deferred.promise.then(function(r){
                deferred = null;
                ctrl.page++;
                ctrl.searching = false;
                ctrl.finished = r === 0;
            });
            return  deferred.promise;

        };


        var init = function(){
           ctrl.searching = true;
            var promise = ctrl.category.fill(ctrl.search, ctrl.page, ctrl.page_size, ctrl.filters);
            if(promise.then){
                promise.then(function(){
                    ctrl.searching = false;
               });
            }
        };

        init();





    }
]);
