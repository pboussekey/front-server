
angular.module('API')
    .factory('community_service',['api_service','$q','page_model','user_model',
        function( api_service, $q, page_model, user_model ){

            var service = {
                users: function( search, p, n, exclude, page_id, role, random, page_type, order, contact_state, is_pinned, is_active ){
                    var deferred = $q.defer();

                    api_service.send('user.getListId',{
                        search:search, filter:{p:p,n:n},
                        exclude:exclude,
                        page_id :  page_id,
                        role : role,
                        page_type : page_type,
                        order : random ? { type : 'random', seed : random } : order,
<<<<<<< HEAD
                        contact_state : contact_state, 
                        is_pinned : is_pinned, 
                        is_active : is_active
=======
                        contact_state : contact_state,
                        is_pinned : is_pinned
>>>>>>> e69612844399e293a196772e85d2c2a45ab5e374
                    })
                        .then(function(d){
                            user_model.get(d.list).then(function(){
                                deferred.resolve( d );
                            },function(){
                                console.log('Search All Problem: get users', arguments);
                                deferred.reject();
                            });
                        },function(){
                            console.log('Search All Problem', arguments);
                            deferred.reject();
                        });

                    return deferred.promise;
                },
                checkEmails: function(emails){
                    return api_service.send('user.getListIdByEmail',{email : emails});
                },
                tags: function(search, category, p, n, exclude){
                    return api_service.send('tag.getList',{search : search, category : category,
                      exclude : exclude, filter:{p:p,n:n,o:{"tag$weight":"DESC"}}});
                },
                connections: function( search, p, n, exclude ){
                    var deferred = $q.defer();

                    api_service.queue('user.getListId',{search:search,exclude:exclude,filter:{p:p,n:n,o:{"user$contact_state":"ASC"}},contact_state:[3]})
                        .then(function(d){
                            user_model.get(d.list).then(function(){
                                deferred.resolve( d.list );
                            },function(){
                                console.log('Search Cncts Problem: get users', arguments);
                                deferred.reject();
                            });
                        },function(){
                            console.log('Search Cncts Problem', arguments);
                            deferred.reject();
                        });

                    return deferred.promise;
                },
                subscriptions: function( page_id, p, n, search, order  ){
                    var deferred = $q.defer();
                    api_service.queue('page.getListSuscribersId',{ id : page_id, search:search,filter:{p:p,n:n}, order : order})
                        .then(function(d){
                            user_model.get(d.list).then(function(){
                                deferred.resolve( d );
                            },function(){
                                console.log('Search Cncts Problem: get users', arguments);
                                deferred.reject();
                            });
                        },function(){
                            console.log('Search Cncts Problem', arguments);
                            deferred.reject();
                        });

                    return deferred.promise;
                },
                pages: function( search, p, n, type, parent_id, exclude, start_date, end_date, strict, filters, user_id, admin, is_published ){
                    var deferred = $q.defer();
                    if(null === filters){
                        filters = {"page$id":"DESC"};
                    }
                    api_service.queue('page.getListId',
                    {
                        search:search,
                        filter:{p:p,n:n,o:filters},
                        parent_id:parent_id,
                        type : type,
                        exclude : exclude,
                        start_date : start_date,
                        end_date : end_date,
                        strict_dates : strict,
                        member_id : user_id,
                        is_member_admin : admin,
                        is_published : is_published
                    })
                        .then(function(d){
                            page_model.get(d.list).then(function(){
                                deferred.resolve( d );
                            },function(){
                                console.log('Search page problem: get pages', arguments);
                                deferred.reject();
                            });
                        },function(){
                            console.log('Search page problem: get pages', arguments);
                            deferred.reject();
                        });

                    return deferred.promise;
                },

            };

            return service;
        }
    ]);
