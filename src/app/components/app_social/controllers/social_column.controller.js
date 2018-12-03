angular.module('app_social').controller('social_column_controller',
    ['$scope', 'user_model', 'social_service','events_service','community_service','page_model',
        'notifier_service','users_status','statuses','conversations_paginator','session','filters_functions','conversations',
        '$translate', 'pages_config',
        function( $scope, user_model,  social_service, events_service, community_service, page_model,
            notifier_service,  users_status, statuses, conversations_paginator, session, filters_functions, conversations,
            $translate, pages_config ){

            var ctrl = this,
                statesWatchIdentifier,
                page_size = 20;

            ctrl.search = '';
            ctrl.pages_config = pages_config;
            ctrl.me = session.id;

            ctrl.pages = page_model.list;

            ctrl.displayed_connections = [];
            ctrl.users = user_model.list;
            ctrl.organizations = page_model.list;
            // SET SOCIAL SERVICE SCOPE.
            social_service.scope = $scope;

            // EXPOSE SOCIAL SERVICE
            ctrl.social = social_service;



            ctrl.messagesUnread = function(){
              return conversations.channel_unreads.length
                  + conversations.conversation_unreads.length;
            };

            function onConversationUnread(){
                ctrl.refreshConversation = true;
                ctrl.searchConversations();
            }

            // GET UNREADS CONVERSATIONS
            conversations.getConversationUnreads().then(function(){
                conversations.conversation_unreads.forEach(function(conversation_id){
                    ctrl.openConversation(null, null, conversation_id, true);
                });
                angular.forEach(conversations.connection_unreads, function(conversation_id){
                    ctrl.openConversation(null, null, conversation_id, true);
                });
            });

            ctrl.getConversationUnread = function( id ){
                return conversations.conversation_unreads.indexOf(id) !== -1 ? 'new': undefined;
            };

            // INIT CONVERSATIONS.
            ctrl.conversations = [];

            getBaseConversations();

            ctrl.searchConversations = function(){
                if( !ctrl.search_conversations_queued ){
                    var promise;

                    if( ctrl.loading_conversations ){
                        ctrl.search_conversations_queued = true;
                        promise = ctrl.loading_conversations = ctrl.loading_conversations.then(searchConversations);
                    }
                    else if( ctrl.search ){
                        ctrl.loading_conversations = promise = searchConversations();
                    }else{
                        ctrl.loading_conversations = promise = clearConversationSearch();
                    }

                    promise.then(function(){
                        ctrl.search_conversations_queued = false;
                        clearConversationPromise( promise );
                    },function(){ clearConversationPromise( promise ); });

                    return promise;
                }
            };

            ctrl.nextConversations = function(){
                if( !ctrl.loading_conversations ){
                    var promise;

                    if( ctrl.filtering_conversations ){
                        ctrl.conversations_page++;
                        promise = ctrl.loading_conversations = conversations.searchConversations( ctrl.search, ctrl.conversations_page, page_size )
                            .then(function( data ){
                                return loadConversationsUsers(data.list).then(function(){
                                    Array.prototype.push.apply( ctrl.conversations, data.list );
                                });
                            });
                    }else{
                        promise = ctrl.loading_conversations = conversations_paginator.next().then(function( models ){
                            return loadConversationsUsers( models );
                        });
                    }

                    if( promise ){
                        promise.then(function(){
                            clearConversationPromise( promise );
                        }, function(){ clearConversationPromise( promise ); });
                    }
                }
            };

            ctrl.clearConversationSearch = function(){
                var promise = clearConversationSearch();
                promise.then(function(){
                    clearConversationPromise( promise );
                }, function(){ clearConversationPromise( promise ); });
            };

            function loadConversationsUsers( models ){
                var users = [];

                models.forEach(function(c){
                    Array.prototype.push.apply(users, c.users);
                });

                return user_model.queue(users);
            }

            function getBaseConversations(){
                var force = ctrl.refreshConversation;
                ctrl.refreshConversation = false;

                return conversations_paginator.get(force).then(function(){
                    return loadConversationsUsers( conversations_paginator.list ).then(function(){
                        ctrl.conversations = conversations_paginator.list;
                    });
                });
            }

            function clearConversationPromise( promise ){
                if( ctrl.loading_conversations === promise ){
                    ctrl.loading_conversations = undefined;
                }
            }

            function searchConversations(){
                ctrl.filtering_conversations = true;
                return conversations.searchConversations( ctrl.search, 1, page_size ).then(function( data ){
                    return loadConversationsUsers( data.list ).then(function(){
                        ctrl.conversations_page = 1;
                        ctrl.conversations = data.list;
                    });
                });
            }

            function clearConversationSearch(){
                var promise;

                if( ctrl.loading_conversations ){
                    promise = ctrl.loading_conversations = ctrl.loading_conversations.then(getBaseConversations);
                }else{
                    promise = ctrl.loading_conversations = getBaseConversations();
                }

                return promise;
            }

            // SEARCH AND FILTER STUFF.

            ctrl.onSearchFocus = function(){
                if( !social_service.column_expanded ){
                    social_service.expandColumn();
                }
            };

            ctrl.onSearchKeyup = function(){
                // SEARCH CONVERSATIONS
                ctrl.searchConversations();
            };

            ctrl.clearSearch = function(){
                ctrl.search = '';
                // CLEAR CONVERSATION SEARCH
                ctrl.clearConversationSearch();
            };

            ctrl.printName = function( cvn ){
                var name = '';

                (cvn.users || []).forEach(function(id){
                    if( session.id !== id ){
                        name += filters_functions.usernameshort( user_model.list[id].datum )+', ';
                    }
                });

                return name.slice(0,-2);
            };

            ctrl.openConversation = function( conversation, user_id, conversation_id, reduced ){
                social_service.openConversation( conversation, user_id ? [user_id] : null, conversation_id, reduced );
            };


            events_service.on('conversation.newunread', onConversationUnread);

            // ON SCOPE DESTROY => UNBIND EVENT LISTENERS.
            $scope.$on('$destroy',function(){
                events_service.off('conversation.newunread', onConversationUnread);
            });
     }]);
