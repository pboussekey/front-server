angular.module('SEARCH')
    .factory('global_search', ['$q', 'community_service', 'user_model', 'page_model', 'session',
        function($q, community_service, user_model, page_model, session){
            var service = {
                search : "",
                hide : false,
                lists : {},
                loading : false,
                bootstrap : null,
                onChange : function(search){
                    return service.research(search, 3, service.lists);
                },
                research : function(search, n, lists){
                    var deferred = $q.defer();
                    var step = 5;
                    service.loading = true;
                    var onload = function(){
                        step--;
                        if(!step){
                            deferred.resolve(lists);
                            service.loading = false;
                        }
                    };
                    lists =  lists || {};
                    service.search = search;
                    community_service.users(search, 1, n, null, null, null, null, null, { type : 'affinity' }).then(function(r){
                        user_model.queue(r.list).then(function(){
                            var users = r.list.map(function(id){ return user_model.list[id].datum; });
                            page_model.queue(users.filter(function(u){ return u.organization_id; }).map(function(u){ return u.organization_id; })).then(function(){
                                users.forEach(function(u){
                                    if(u.organization_id){
                                        u.organization = page_model.list[u.organization_id].datum;
                                    }
                                });
                                lists.users = { count : r.count, list : users };
                                onload();
                             });
                        });
                    }.bind(this));
                    community_service.pages( search, 1, n, 'event')
                        .then(function(r){
                        page_model.queue(r.list).then(function(){
                            lists.events = { count : r.count, list : r.list.map(function(id){ return page_model.list[id].datum; })};
                            onload();
                        });
                    }.bind(this));
                    community_service.pages( search, 1, n, 'group')
                        .then(function(r){
                        page_model.queue(r.list).then(function(){
                            lists.groups = { count : r.count, list : r.list.map(function(id){ return page_model.list[id].datum; })};
                            onload();
                        });
                    }.bind(this));
                    community_service.pages(search, 1, n, 'organization')
                        .then(function(r){
                        page_model.queue(r.list).then(function(){
                            lists.organizations = { count : r.count, list : r.list.map(function(id){ return page_model.list[id].datum; })};
                            onload();
                        });

                    }.bind(this));
                    community_service.pages(search, 1, n, 'course')
                        .then(function(r){
                        page_model.queue(r.list).then(function(){
                            lists.courses = { count : r.count, list : r.list.map(function(id){ return page_model.list[id].datum; })};
                            onload();
                        });

                    }.bind(this));

                    return deferred.promise;
                },
                getBootstrap : function(force){
                     var deferred = $q.defer();
                     if(service.bootstrap === null || force){
                          service.research(null, 6).then(function(bootstrap){
                             service.bootstrap = bootstrap;
                             deferred.resolve(service.bootstrap);
                          });
                      }
                      else{
                          deferred.resolve(service.bootstrap);
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
