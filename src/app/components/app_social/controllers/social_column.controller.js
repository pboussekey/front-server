angular.module('app_social').controller('social_column_controller',
    ['$scope', 'user_model','connections','social_service','events_service','community_service','page_model', 'hgt_events',
        'notifier_service','hangout', 'users_status','statuses','conversations_paginator','session','filters_functions','conversations',
        'channels_paginator','privates_hangouts','$translate', 'pages_config',
        function( $scope, user_model, connections, social_service, events_service, community_service, page_model, hgt_events,
            notifier_service, hangout, users_status, statuses, conversations_paginator, session, filters_functions, conversations,
            channels_paginator, privates_hangouts, $translate, pages_config ){

            var ctrl = this,
                statesWatchIdentifier,
                page_size = 10;

            ctrl.search = '';
            ctrl.pages_config = pages_config;

            ctrl.pages = page_model.list;
            ctrl.connecteds = connections.connecteds;

            ctrl.displayed_connections = [];
            ctrl.users = user_model.list;
            // SET SOCIAL SERVICE SCOPE.
            social_service.scope = $scope;

            // EXPOSE SOCIAL SERVICE
            ctrl.social = social_service;
            ctrl.hangouts = privates_hangouts;

            // INIT CONNECTIONS.
            var step=2,
                onConnectionsReady = function(){
                    step--;
                    if( !step ){
                        statesWatchIdentifier = users_status.watch( connections.connecteds, statesWatchIdentifier );
                        setConnectionsBaseList().then(function(){
                            privates_hangouts.init();
                        });
                    }
                };

            connections.load(true).then(onConnectionsReady);
            conversations.getConnectionUnreads().then(onConnectionsReady);

            ctrl.nextConnections = function(){
                if( !ctrl.loading_connections ){
                    var promise;

                    if( ctrl.filtering_connections ){
                        ctrl.connections_page++;
                        promise = ctrl.loading_connections = community_service.connections( ctrl.search, ctrl.connections_page, page_size )
                            .then(function( nextIds ){


                                return user_model.get( nextIds ).then(function(){
                                    Array.prototype.push.apply( ctrl.displayed_connections, nextIds );
                                    filterByStatus( ctrl.displayed_connections );
                                });
                            });
                    }else{
                        var notDisplayed = [];

                        connections.connecteds.forEach(function(id){
                            if( ctrl.displayed_connections.indexOf(id) === -1 ){
                                notDisplayed.push(id);
                            }
                        });

                        if( notDisplayed.length ){
                            var nextIds = notDisplayed.slice( 0, 10 );
                            promise = ctrl.loading_connections = user_model.get( nextIds ).then(function(){
                                Array.prototype.push.apply( ctrl.displayed_connections, nextIds );
                            });
                        }
                    }

                    if( promise ){
                        promise.then(function(){
                            clearConnectionPromise( promise );
                        }, function(){ clearConnectionPromise( promise ); });
                    }
                }
            };

            ctrl.searchConnections = function(){
                if( !ctrl.search_connections_queued ){
                    var promise;

                    if( ctrl.loading_connections ){
                        ctrl.search_connections_queued = true;
                        promise = ctrl.loading_connections = ctrl.loading_connections.then(searchConnections);
                    }
                    else if( ctrl.search  ){
                        ctrl.loading_connections = promise = searchConnections();
                    }else{
                        ctrl.loading_connections = promise = clearConnectionSearch();
                    }

                    promise.then(function(){
                        ctrl.search_connections_queued = false;
                        clearConnectionPromise( promise );
                    },function(){ clearConnectionPromise( promise ); });

                    return promise;
                }
            };

            ctrl.clearConnectionSearch = function(){
                var promise = clearConnectionSearch();
                promise.then(function(){
                    clearConnectionPromise( promise );
                }, function(){ clearConnectionPromise( promise ); });
            };

            ctrl.getConnectionUnread = function( id ){
                return conversations.connection_unreads[id] ?'new':undefined;
            };

            function searchConnections(){
                if( ctrl.search ){
                    return community_service.connections( ctrl.search, 1, page_size ).then(function( ids ){
                        ctrl.filtering_connections = true;
                        ctrl.connections_page = 1;
                        ctrl.displayed_connections = ids;
                        filterByStatus( ctrl.displayed_connections );
                    });
                }else{
                    setConnectionsBaseList();
                }
            }

            function clearConnectionPromise( promise ){
                if( ctrl.loading_connections === promise ){
                    ctrl.loading_connections = undefined;
                }
            }

            function clearConnectionSearch(){
                var promise;

                if( ctrl.loading_connections ){
                    promise = ctrl.loading_connections = ctrl.loading_connections.then(setConnectionsBaseList);
                }else{
                    promise = ctrl.loading_connections = setConnectionsBaseList();
                }

                return promise;
            }

            function setConnectionsBaseList(){
                var baseIds = filterByStatus( connections.connecteds );

                if( typeof conversations.connection_unreads === 'object'){
                    Object.keys(conversations.connection_unreads).forEach(function( s_user_id ){
                        var user_id = parseInt(s_user_id);
                        if( baseIds.indexOf( user_id ) === -1 ){
                            baseIds.push( user_id );
                        }
                    });
                }

                if( baseIds.length < page_size ){
                    connections.connecteds.some(function( id ){
                        if( baseIds.indexOf(id) === -1 ){
                            baseIds.push(id);
                        }
                        return baseIds.length === page_size;
                    });
                }

                // LOAD USERS
                return user_model.get(baseIds).then(function(){
                    ctrl.displayed_connections = baseIds;
                    ctrl.filtering_connections = false;
                });
            }

            function filterByStatus( ids ){
                var connecteds = [],
                    not = [];

                ids.forEach(function(id){
                    if( users_status.status[id] && users_status.status[id].state === statuses.connected ){
                        connecteds.push(id);
                    }else{
                        not.push(id);
                    }
                });

                ids.splice( 0, ids.length );
                Array.prototype.push.apply(ids, connecteds);
                Array.prototype.push.apply(ids, not);

                return connecteds;
            }



            // EVENT LISTENERS FUNCTIONS
            function onChannelUnread(){
                ctrl.refreshChannel = true;
                ctrl.searchChannels();
            }

            function onConversationUnread(){
                ctrl.refreshConversation = true;
                ctrl.searchConversations();
            }

            function onConnectionUnread(){
                ctrl.searchConnections();
            }

            function onUsersOffline(){
                filterByStatus( ctrl.displayed_connections );
                $scope.$evalAsync();
            }

            function onUsersOnline(e){
                var ids = e.datas[0].reduce(function(list, id){
                        if( connections.connecteds.indexOf(parseInt(id)) !== -1 ){
                            list.push(parseInt(id));
                        }
                        return list;
                    },[]),
                    promise;

                if( ids.length ){
                    if( ctrl.loading_connections ){
                        promise = ctrl.loading_connections = ctrl.loading_connections.then(function(){
                            onConnectionOnline(ids);
                        });
                    }else{
                        promise = onConnectionOnline(ids);
                        if( promise ){
                            ctrl.loading_connections = promise;
                        }
                    }

                    if( promise ){
                        promise.then(function(){
                            clearConnectionPromise( promise );
                        }, function(){ clearConnectionPromise( promise ); });
                    }
                }
            }

            function onConnectionOnline( ids ){
                if( ctrl.filtering_connections ){
                    filterByStatus( ctrl.displayed_connections );
                    $scope.$evalAsync();
                }else{
                    return user_model.get( ids ).then(function(){
                        ids.forEach(function(id){
                            if( ctrl.displayed_connections.indexOf(id) === -1 ){
                                ctrl.displayed_connections.push(id);
                            }
                        });
                        filterByStatus( ctrl.displayed_connections );
                    });
                }
            }

            function onConnectionState( e ){
                var connected = e.datas[0].concat(),
                    notConnected = [],
                    i = connected.length-1;

                for(;i>=0;i--){
                    if( connections.connecteds.indexOf(parseInt(connected[i])) === -1 ){
                        notConnected.push(connected[i]);
                        connected.splice(i,1);
                    }
                }

                statesWatchIdentifier = users_status.watch( connected, statesWatchIdentifier );
                users_status.unwatch( statesWatchIdentifier, notConnected );
            }

            // GET UNREADS CONVERSATIONS ( CHANNELS & CLASSIC CVNS )
            conversations.getConversationUnreads();
            conversations.getChannelUnreads();

            ctrl.getConversationUnread = function( id ){
                return conversations.conversation_unreads.indexOf(id) !== -1 ? 'new': undefined;
            };

            ctrl.getChannelUnread = function( id ){
                return conversations.channel_unreads.indexOf(id) !== -1 ? 'new': undefined;
            };

            // INIT CHANNELS.
            ctrl.channels = [];

            getBaseChannels();

            ctrl.searchChannels = function(){
                if( !ctrl.search_channels_queued ){
                    var promise;

                    if( ctrl.loading_channels ){
                        ctrl.search_channels_queued = true;
                        promise = ctrl.loading_channels = ctrl.loading_channels.then(searchChannels);
                    }
                    else if( ctrl.search ){
                        ctrl.loading_channels = promise = searchChannels();
                    }else{
                        ctrl.loading_channels = promise = clearChannelSearch();
                    }

                    promise.then(function(){
                        ctrl.search_channels_queued = false;
                        clearChannelPromise( promise );
                    },function(){ clearChannelPromise( promise ); });

                    return promise;
                }
            };

            function refreshChannel(){
                ctrl.refreshChannel = true;
                ctrl.searchChannels();
            }

            ctrl.nextChannels = function(){
                if( !ctrl.loading_channels ){
                    var promise;

                    if( ctrl.filtering_channels ){
                        ctrl.channels_page++;
                        promise = ctrl.loading_channels = conversations.searchChannels( ctrl.search, ctrl.channels_page, page_size )
                            .then(function( data ){
                                return loadChannelsUsers(data.list).then(function(){
                                    Array.prototype.push.apply( ctrl.channels, data.list );
                                });
                            });
                    }else{
                        promise = ctrl.loading_channels = channels_paginator.next().then(function( models ){
                            return loadChannelsUsers( models );
                        });
                    }

                    if( promise ){
                        promise.then(function(){
                            clearChannelPromise( promise );
                        }, function(){ clearChannelPromise( promise ); });
                    }
                }
            };

            ctrl.clearChannelSearch = function(){
                var promise = clearChannelSearch();
                promise.then(function(){
                    clearChannelPromise( promise );
                }, function(){ clearChannelPromise( promise ); });
            };

            function loadChannelsUsers( models ){
                var users = [];

                models.forEach(function(c){
                    Array.prototype.push.apply(users, c.users);
                });

                return user_model.queue(users);
            }

            function loadChannelPages( models ){
                var pages = [];

                models.forEach(function(c){
                    pages.push( c.page_id );
                });

                return page_model.queue( pages );
            }

            function getBaseChannels(){
                var force = ctrl.refreshChannel;
                ctrl.refreshChannel = false;

                return channels_paginator.get( force ).then(function(){
                    return loadChannelPages( channels_paginator.list ).then(function(){
                        ctrl.channels = channels_paginator.list;
                    });
                });
            }

            function clearChannelPromise( promise ){
                if( ctrl.loading_channels === promise ){
                    ctrl.loading_channels = undefined;
                }
            }

            function searchChannels(){
                ctrl.filtering_channels = true;
                return conversations.searchChannels( ctrl.search, 1, page_size ).then(function( data ){
                    return loadChannelsUsers( data.list ).then(function(){
                        ctrl.channels_page = 1;
                        ctrl.channels = data.list;
                    });
                });
            }

            function clearChannelSearch(){
                var promise;

                if( ctrl.loading_channels ){
                    promise = ctrl.loading_channels = ctrl.loading_channels.then(getBaseChannels);
                }else{
                    promise = ctrl.loading_channels = getBaseChannels();
                }

                return promise;
            }

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
                // SEARCH CONNECTIONS
                ctrl.searchConnections();

                // SEARCH CHANNELS
                ctrl.searchChannels();

                // SEARCH CONVERSATIONS
                ctrl.searchConversations();
            };

            ctrl.clearSearch = function(){
                ctrl.search = '';
                // CLEAR CONNECTIONS SEARCH
                ctrl.clearConnectionSearch();
                // CLEAR CHANNELS SEARCH
                ctrl.clearChannelSearch();
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

            ctrl.openConversation = function( conversation, user_id, conversation_id ){
                social_service.openConversation( conversation, user_id ? [user_id] : null, conversation_id );
            };

             //HANGOUT
            var hangoutRing = new Audio('assets/audio/ringtone.mp3');
            hangoutRing.loop = true;

            events_service.on( hgt_events.fb_request_received, function( evt ){
                if(!hangout.is_available){
                    privates_hangouts.declineRequest(evt.datas[0]);
                    events_service.process( hgt_events.hgt_not_available);
                }
                else if(!privates_hangouts.current_hangout){
                    hangoutRing.play();
                    ctrl.openConversation( null, null, evt.datas[0].id );
                }
                else if(evt.datas[0].id !== privates_hangouts.current_hangout){
                    privates_hangouts.declineRequest(evt.datas[0]);
                }

            });

            events_service.on( hgt_events.fb_request_removed, function( evt ){
                if(!Object.keys(privates_hangouts.requests).length){
                    hangoutRing.pause();
                }
            });

            events_service.on( hgt_events.fb_request_declined, function( evt ){
                if(!Object.keys(privates_hangouts.requests).length){
                    hangoutRing.pause();
                }

                if( evt.datas[0].declined && evt.datas[0].declined.length === 1 ){
                    var user = filters_functions.username(user_model.list[evt.datas[0].declined[0]].datum);
                    $translate('ntf.err_hangout_user_busy',{username: user }).then(function( translation ){
                        notifier_service.add({type:'error',message: translation});
                    });
                }else{
                    $translate('ntf.err_hangout_people_busy').then(function( translation ){
                        notifier_service.add({type:'error',message: translation});
                    });
                }
            });

            events_service.on( hgt_events.hgt_not_available, function( evt ){
                if(ctrl.hangouts.current_hangout){
                    ctrl.hangouts.current_hangout.leave();
                }
                $translate('ntf.err_hangout_unsupported').then(function( translation ){
                    notifier_service.add({type:'error',message: translation});
                });
            });



            events_service.on( hgt_events.fb_request_accepted, function( evt ){
                hangoutRing.pause();
            });

              // ADD EVENT LISTENERS
            events_service.on('connectionState', ctrl.searchConnections);
            events_service.on('connectionState', onConnectionState);

            events_service.on('usersOnline', onUsersOnline);
            events_service.on('usersOffline', onUsersOffline);

            events_service.on('conversation.newunread', onConversationUnread);
            events_service.on('channel.newunread', onChannelUnread);
            events_service.on('connection.newunread', onConnectionUnread);

            events_service.on( 'userState', refreshChannel);

            // ON SCOPE DESTROY => UNBIND EVENT LISTENERS.
            $scope.$on('$destroy',function(){
                events_service.off('usersOffline', onUsersOffline );
                events_service.off('usersOnline', onUsersOnline);
                events_service.off('connectionState', ctrl.searchConnections);
                events_service.off('connectionState', onConnectionState);

                events_service.off('conversation.newunread', onConversationUnread);
                events_service.off('channel.newunread', onChannelUnread);
                events_service.off('connection.newunread', onConnectionUnread);

                events_service.off( 'userState', refreshChannel);

                users_status.unwatch(statesWatchIdentifier);
            });




     }]);
