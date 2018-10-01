angular.module('community').controller('category_controller',
    ['$scope','community_service','session', '$q', 'global_search', 'user_model', 'filters_functions', 'community_categories',
        'category', 'page_model', 'social_service', 'modal_service', 'tags_constants', 'global_loader',
        function($scope, community_service, session, $q, global_search, user_model, filters_functions, community_categories,
        category,  page_model, social_service, modal_service, tags_constants, global_loader){

        var ctrl = this;
        ctrl.categories = community_categories;
        ctrl.seed = parseInt(Math.random() * 99) + 1;
        ctrl.pages = page_model.list;
        ctrl.results = [];
        ctrl.search =  $scope.$parent.pctrl.search;
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


        ctrl.session = session;
        user_model.queue([ctrl.session.id]).then(function(){
            ctrl.tags = user_model.list[ctrl.session.id].datum.tags.map(function(tag){ return tag.name; });
        });
        ctrl.tags_constants = tags_constants;
        ctrl.addTagFilter = function(tag){
            ctrl.search = ((ctrl.search || "") + " " + tag).trim();
            ctrl.onSearch();
        };
        community_service.tags(null,
            [
              ctrl.tags_constants.categories.SKILL,
              ctrl.tags_constants.categories.CAREER,
              ctrl.tags_constants.categories.HOBBY,
              ctrl.tags_constants.categories.LANGUAGE
            ], 1, 10).then(function(tags){
            ctrl.mostused_tags = tags;
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

        ctrl.breadcrumb = [{ text : 'Discover' }];



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
