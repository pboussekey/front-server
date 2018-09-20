angular.module('app_social')
    .factory('social_service',['events_service','cvn_model','session','websocket', '$q', 'user_model',
        function( events_service, cvn_model, session, websocket,  $q, user_model){

            var service = {
                fullMode: false,
                current: undefined,
                list: [],
                events : {},
                column_expanded: true,
                clear: function(){
                    service.fullMode = false;
                    service.current = undefined;
                    service.list.forEach(function(conversation){
                        service.closeConversation(conversation);
                    });
                },
                reduceColumn: function(){
                    service.column_expanded = false;
                    events_service.process('social.column_state_change');
                },
                expandColumn: function(){
                    service.column_expanded = true;
                    events_service.process('social.column_state_change');
                },
                switchColumnState: function(){
                    if( service.column_expanded ){
                        service.reduceColumn();
                    }else{
                        service.expandColumn();
                    }
                },
                switchMode: function(){
                    service.fullMode = !service.fullMode;

                    if( service.fullMode ){
                        document.querySelector('#body').classList.add('noscroll');
                    }else{
                        document.querySelector('#body').classList.remove('noscroll');
                    }

                    events_service.process('social.switchmode');
                },
                openMobile: function(){
                    service.ismobileopen = true;
                    service.fullMode = true;
                    document.querySelector('#body').classList.add('noscroll');
                },
                closeMobile: function(){
                    service.ismobileopen = false;
                    service.fullMode = false;
                    document.querySelector('#body').classList.remove('noscroll');
                },
                closeConversation: function( conversation ){
                    if( service.fullMode && conversation === service.current ){
                        if( !service.ismobileopen ){
                            service.switchMode();
                        }
                        service.current = undefined;

                    }else{
                        var idx = service.list.indexOf( conversation );

                        if( idx !== -1 ){
                            service.list.splice( idx, 1);
                            events_service.process('social.conversation.close', conversation );
                        }
                    }
                    if(service.events[conversation.id]){
                        events_service.off(null, service.events[conversation.id]);
                        service.events[conversation.id] = null;
                    }
                },

                onNewMessage: function( data ){
                    if( service.list.some(function(c){ return c.id === data.conversation_id; })
                        || ( service.current && service.current.id === data.conversation_id ) ){
                        events_service.process('conversation.'+data.conversation_id+'.msg', data.id );
                    }else{
                        service.getConversation(null, null, data.conversation_id).then(function(c){
                            if(c.type !== 3){
                                service.openConversation( undefined, undefined, data.conversation_id, true );
                            }
                        });
                    }

                    events_service.process('conversation.unread', data.conversation_id, data.type, data.users );
                },
                getConversation : function(conversation, user_ids, conversation_id, reduced){
                    var deferred = $q.defer();
                     if( !conversation ){
                        if( user_ids && user_ids.length ){

                            if( user_ids.indexOf( session.id ) === -1 ){
                                user_ids.push( session.id );
                            }

                            cvn_model.getByUsers( user_ids ).then(function( id ){
                                if( id ){
                                    deferred.resolve( cvn_model.list[id].datum );
                                }else{
                                    deferred.resolve({users:user_ids, type:2 });
                                }
                            });
                        }else if( conversation_id ){
                            cvn_model.get([conversation_id]).then(function(){
                                deferred.resolve( cvn_model.list[conversation_id].datum );
                            });
                        }
                    }else{
                        deferred.resolve( conversation );
                    }
                    return deferred.promise;
                },
                isOpen : function(user_id){
                    return (service.fullMode ? [service.current] : service.list).some(function(cvn){
                        return cvn && cvn.users && cvn.users.length === 2 && cvn.users.indexOf(user_id) !== -1;
                    });
                },
                openConversation: function( conversation, user_ids, conversation_id, reduced ){
                    // GET CONVERSATION.
                    if( user_ids ){
                        user_model.queue(user_ids);
                    }
                    this.getConversation(conversation, user_ids, conversation_id, reduced).then(function(cvn){
                        open( cvn );
                    });

                    function open( cvn ){
                        cvn.trackid = cvn.id || '#v#'+Date.now();
                        if( ( service.ismobileopen || document.body.getBoundingClientRect().width <= 1024  ) && !service.fullMode ){
                            service.switchMode();
                        }

                        if( service.fullMode && !reduced ){
                            service.current = cvn;
                        }else if( !service.fullMode ){
                            service.list.some(function( c ){
                                if( ( cvn.id && c.id === cvn.id ) || ( c.type===2 && cvn.type === 2
                                    && c.users.sort().toString()===cvn.users.sort().toString() ) ){
                                    cvn = c;
                                    return true;
                                }
                            });
                            if( service.list.indexOf(cvn) === -1 ){
                                service.list.push( cvn );
                                if(cvn.page_id){
                                    var closeConversation = function(){
                                        service.closeConversation(cvn);
                                    };
                                    service[cvn.id] =  events_service.on('pageuserDeleted#' + cvn.page_id, closeConversation);
                                }
                                  console.log('REDUCED?', reduced);
                                if( reduced ){
                                    cvn.reduced = reduced;
                                }
                            }
                            else if(cvn.expand){
                                cvn.expand();
                            }
                        }

                        events_service.process('social.conversation.open', cvn );
                    }
                }
            };

            websocket.get().then(function(socket){
                socket.on('ch.message', service.onNewMessage.bind(service));
            });

            window.social = service;

            return service;
        }
    ]);
