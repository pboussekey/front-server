angular.module('community').controller('community_controller',
    ['community_service','session', '$q', 'global_search', 'user_model', 'filters_functions',
        '$stateParams', 'page_model', 'social_service', 'modal_service',
        function( community_service, session, $q, global_search, user_model, filters_functions,
        $stateParams,  page_model, social_service, modal_service ){

        var ctrl = this;
        document.title = 'TWIC - Browse';
        ctrl.seed = parseInt(Math.random() * 99) + 1;
        ctrl.pages = page_model.list;
        ctrl.global_search = global_search;
        ctrl.results = [];
        ctrl.filters = {
            organization : [],
            role : "",
            page_type : null
        };

        ctrl.addFilter = function(item, type){
            if(ctrl.filters[type].indexOf(item) === -1){
                ctrl.filters[type].push(item);
                ctrl.onSearch();
            }
        };


        ctrl.session = session;
        ctrl.page = 1;
        ctrl.page_size = 50;

        var deferred;
        ctrl.onSearch = function(){
            if(deferred){
                deferred.reject();
            }
            deferred = null;
            ctrl.page = 1;
            ctrl.category.list = [];
            ctrl.finished = false;
            init();
        };

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

        ctrl.breadcrumb = [{ text : 'Browse' }];


        ctrl.categories = {
            all : {
                name : "All",
                key : "all",
                fill : function(){

                    community_service.users(global_search.search, 1, 6, null, null, null, ctrl.seed).then(function(r){

                        ctrl.categories.users.count = r.count;
                        ctrl.categories.users.list = r.list;
                    });
                    community_service.pages( global_search.search, 1, 6, 'event')
                        .then(function(r){
                            ctrl.categories.events.count = r.count;
                            ctrl.categories.events.list = r.list;
                    });
                    community_service.pages( global_search.search, 1, 6, 'group')
                        .then(function(r){
                            ctrl.categories.groups.count = r.count;
                            ctrl.categories.groups.list = r.list;
                    });
                    community_service.pages( global_search.search, 1, 6, 'organization')
                        .then(function(r){
                            ctrl.categories.institutions.count = r.count;
                            ctrl.categories.institutions.list = r.list;
                    });

                    if(session.roles[1]){
                        community_service.pages( global_search.search, 1, 6, 'course')
                            .then(function(r){
                                ctrl.categories.courses.count = r.count;
                                ctrl.categories.courses.list = r.list;
                        });
                    }

                }
            },
            users : {
                name : "People",
                key :  "users",
                list : [],
                fill : function(){
                    return community_service.users( global_search.search, ctrl.page, ctrl.page_size, null, ctrl.filters.organization, ctrl.filters.role, ctrl.seed, ctrl.filters.page_type )
                        .then(function(r){

                        return r;
                    });
                },
                filters : ['organization', 'role']
            },
            events : {
                name : "Events",
                key : "events",
                list : [],
                fill : function(){
                    var start = ctrl.filters.events === 'upcoming'  ? new Date().toISOString() : null;
                    var end = ctrl.filters.events === 'past' ? new Date().toISOString() : null;
                    var strict =  ctrl.filters.events === 'past';
                    return community_service.pages( global_search.search, ctrl.page, ctrl.page_size, 'event', ctrl.filters.organization, null, start, end, strict)
                        .then(function(r){

                        return r;
                    });
                },
                filters : ['organization', 'events']
            },
            groups : {
                name : "Groups",
                key : "groups",
                list : [],
                fill : function(){
                    return community_service.pages( global_search.search, ctrl.page, ctrl.page_size, 'group', ctrl.filters.organization )
                        .then(function(r){

                        return r;
                    });
                },
                filters : ['organization']
            },
            institutions : {
                name : "Institutions",
                key : "institutions",
                list : [],
                fill : function(){
                    return community_service.pages( global_search.search, ctrl.page, ctrl.page_size, 'organization', ctrl.filters.organization )
                        .then(function(r){

                        return r;
                    });
                },
                filters : []
            }

        };
        if(session.roles[1]){
            ctrl.categories.courses = {
                name : "Courses",
                key : "courses",
                list : [],
                fill : function(){
                    return community_service.pages( global_search.search, ctrl.page, ctrl.page_size, 'course', ctrl.filters.organization ).then(function(r){

                        return r;
                    });
                },
                filters : ['organization']
            };
        }
        ctrl.category = ctrl.categories[$stateParams.category || 'all'];
        ctrl.nextPage = function(){
            if(deferred || ctrl.finished){
                return;
            }
            global_search.searching = true;
            deferred = $q.defer();
            deferred.promise = ctrl.category.fill();
            deferred.promise.then(ctrl.afterSearch);
            return  deferred.promise;

        };

        ctrl.afterSearch = function( r ){
            deferred = null;
            ctrl.page++;
            global_search.searching = false;
            ctrl.finished = r.list.length === 0;
            ctrl.category.list = ctrl.category.list.concat(r.list);
            ctrl.category.count = r.count;
        };


        var init = function(){
           ctrl.category.key !== 'all' ? ctrl.nextPage() : ctrl.category.fill();
        };

        init();




    }
]);
