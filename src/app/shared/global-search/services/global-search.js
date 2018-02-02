angular.module('SEARCH')
    .factory('global_search', ['$q', 'community_service', 'user_model', 'page_model', 'session',
        function($q, community_service, user_model, page_model, session){
            var service = {
                search : "",
                hide : false,
                lists : {},
                loading : false,
                onChange : function(search){
                    var deferred = $q.defer();
                    var step = 5;
                    service.loading = true;
                    var onload = function(){
                        step--;
                        if(!step){
                            deferred.resolve(service.lists);
                            service.loading = false;
                        }
                    };
                   service.lists = {};
                    service.search = search;
                    community_service.users(search, 1, 3, null, null, null, null, null, { type : 'affinity' }).then(function(r){
                        user_model.queue(r.list).then(function(){
                            var users = r.list.map(function(id){ return user_model.list[id].datum; });
                            page_model.queue(users.filter(function(u){ return u.organization_id; }).map(function(u){ return u.organization_id; })).then(function(){
                                users.forEach(function(u){
                                    if(u.organization_id){
                                        u.organization = page_model.list[u.organization_id].datum; 
                                    }
                                });
                                service.lists.users = { count : r.count, list : users };
                                onload();
                             });
                        });
                    }.bind(this));
                    community_service.pages( search, 1, 3, 'event')
                        .then(function(r){ 
                        page_model.queue(r.list).then(function(){
                            service.lists.events = { count : r.count, list : r.list.map(function(id){ return page_model.list[id].datum; })};
                            onload();
                        });
                    }.bind(this));
                    community_service.pages( search, 1, 3, 'group')
                        .then(function(r){
                        page_model.queue(r.list).then(function(){
                            service.lists.groups = { count : r.count, list : r.list.map(function(id){ return page_model.list[id].datum; })};
                            onload();
                        });
                    }.bind(this));
                    community_service.pages(search, 1, 3, 'organization')
                        .then(function(r){
                        page_model.queue(r.list).then(function(){
                            service.lists.organizations = { count : r.count, list : r.list.map(function(id){ return page_model.list[id].datum; })};
                            onload();
                        });
                       
                    }.bind(this));
                    if(session.roles[1]){
                        community_service.pages(search, 1, 3, 'course')
                            .then(function(r){
                            page_model.queue(r.list).then(function(){
                                service.lists.courses = { count : r.count, list : r.list.map(function(id){ return page_model.list[id].datum; })};
                                onload();
                            });

                        }.bind(this));
                    }
                    else{
                        onload();
                    }

                    return deferred.promise;
                },
                reset: function(){
                    service.search = "";
                    return "";
                }
            };
            return service;
    }]);