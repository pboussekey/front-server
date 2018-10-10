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
            role : null,
            page_type : null,
            is_pinned : null,
            events : null
        };
        ctrl.category = ctrl.categories[category || 'all'];

        ctrl.showTags = {};
        ctrl.checkboxes = {};
        ctrl.tags_constants = tags_constants;


        ctrl.isInSearch = function(tag){
            return ctrl.search && ctrl.search.toLowerCase().indexOf(tag.toString().toLowerCase()) >= 0;
        };

        ctrl.searchTags = function(search, category){
            return community_service.tags(search,
                [category], 1, 5).then(function(tags){
                return tags;
            });
        };

        ctrl.searchTags = {};
        ctrl.input_tags = {};
        user_model.queue([session.id]).then(function(){
            ctrl.suggestions = { skill : [], hobby : [], career : [], languages : [] };
            user_tags.getList(ctrl.session.id).then(function(list){
                ctrl.tags = list;
                angular.forEach(ctrl.tags, function(tags, category){
                    ctrl.suggestions[category] = tags.slice(0,3).map(function(t){ return t.name;});
                });

            });

            ctrl.suggestions.address = [];
            var address = user_model.list[session.id].datum.address;
            if(address){
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

            angular.forEach(ctrl.suggestions, function(suggestions, category){
                ctrl.searchTags[category] = function(search){
                    return community_service.tags(search,
                          [category], 1, 5, ctrl.suggestions[category].map(function(t){ return t;})).then(function(tags){
                          return tags;
                    });
                };
            });

            ctrl.suggestions.organization = [];
            var organization_id = user_model.list[session.id].datum.organization_id;
            if(organization_id){
                page_model.queue([organization_id]);
                ctrl.suggestions.organization.push(organization_id);
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

        ctrl.toggleFilter = function(item, type){
            var index = ctrl.filters[type].indexOf(item);
            if(index >= 0){
               ctrl.filters[type].splice(index, 1);
            }
            else{
                ctrl.filters[type].push(item);
                if(ctrl.suggestions.organization.indexOf(item) === -1){
                    ctrl.suggestions.organization.push(item);
                }
            }
            ctrl.onSearch();
        };



        ctrl.page = 1;
        ctrl.page_size = 50;

        ctrl.searchOrganization = function(search,filter){
            ctrl.loading = true;
            return community_service.pages( search, filter.p, filter.n, 'organization', null, ctrl.suggestions.organization).then(function(r){
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
