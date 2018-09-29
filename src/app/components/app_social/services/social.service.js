angular.module('app_social')
    .factory('social_service',['events_service','cvn_model','session',
        'websocket', '$q', 'user_model', 'filters_functions', 'notifications_service',
        function( events_service, cvn_model, session,
                  websocket,  $q, user_model, filters_functions, notifications_service){

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
                    var idx = service.list.indexOf( conversation );

                    if( idx !== -1 ){
                        service.list.splice( idx, 1);
                        events_service.process('social.conversation.close', conversation );
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
                    if(data.user_id && (data.text || data.filename)){
                        user_model.queue([data.user_id]).then(function(){
                          var user = user_model.list[data.user_id];
                          var text = filters_functions.username(user.datum) + ' says "'+ data.text+'"';
                          if(data.filename){
                              text = filters_functions.username(user.datum) + ' shared a '+ filters_functions.filetype(data.filetype)
                                + ' : ' + data.filename;
                          }
                          if(data.link){
                            text = filters_functions.username(user.datum) + ' shared a link : ' + data.filename;
                          }
                          notifications_service.desktopNotification(
                              text,
                              filters_functions.dmsLink(user.datum.avatar, [80,'m',80]) || "",
                              function(){ service.openConversation(null, null, data.conversation_id);}
                            );
                        });

                    }
                    events_service.process('conversation.unread', data.conversation_id, data.type, data.users );
                },
                getConversation : function(conversation, user_ids, conversation_id, reduced){
                     var deferred = $q.defer();
                     if( !conversation ){
                        var cvn = { users : user_ids , id : conversation_id, type : 2 };
                        if( user_ids && user_ids.length ){

                            if( user_ids.indexOf( session.id ) === -1 ){
                                cvn.users.push(session.id);
                            }
                            cvn_model.getByUsers( user_ids ).then(function( id ){
                                if( id ){
                                    Object.assign(cvn,  cvn_model.list[id].datum );
                                }
                                else{
                                   Object.assign(cvn,  { new : true } );
                                }
                            });
                        }else if( conversation_id ){
                            cvn_model.get([conversation_id]).then(function(){
                                Object.assign(cvn,  cvn_model.list[conversation_id].datum );
                            });
                        }
                        deferred.resolve(cvn);
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
                        service.list.some(function( c ){
                            console.log("OPEN", c, cvn);
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
                            if( reduced ){
                                cvn.reduced = reduced;
                            }
                        }
                        else if(cvn.expand){
                            cvn.expand();
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
