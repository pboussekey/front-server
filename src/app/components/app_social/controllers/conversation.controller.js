angular.module('app_social').controller('conversation_controller',
    ['$scope','$element', 'user_model','events_service','upload_service','messages','session','$rootScope',
        'user_conversation_ids', 'statuses', 'users_status','filters_functions','page_model','social_service',
        'docslider_service','conversations','community_service',
        '$state', 'items_model', 'pages_config', '$timeout', 'websocket',
        function( $scope, $element, user_model, events_service, upload_service, messages, session, $rootScope,
            user_conversation_ids, statuses, users_status, filters_functions, page_model, social_service,
            docslider_service, conversations, community_service,
            $state, items_model, pages_config, $timeout, websocket){

            var ctrl = this, conversation;
            ctrl.message = '';
            ctrl.messengerID = 'msgID_'+(Math.random()+'').slice(2);
            ctrl.pages_config = pages_config;

            function focusInput(){
                var input = document.querySelector('#'+ctrl.messengerID);
                if(input !== null){
                    input.focus();
                }
            };

            function init(){
                websocket.get().then(function(socket){
                    ctrl.socket = socket;
                });
                conversation = $scope.conversation;

                ctrl.reduced = !!conversation.reduced;
                ctrl.messageUnreads = ctrl.reduced?1:0;
                delete(conversation.reduced);

                ctrl.users_pgtr = undefined;
                ctrl.users_displayed = [];
                ctrl.sending_messages = [];
                ctrl.docs = [];
                ctrl.messages = [];
                ctrl.addingUsers = false;
                ctrl.userstoadd = [];
                ctrl.users = user_model.list;

                if(!conversation.main_stream){
                    conversation.main_stream = null;
                }
                // IF REAL CONVERSATION => GET MESSAGES PAGINATOR
                if( conversation.id ){
                    ctrl.paginator = messages.get( conversation.id );

                    // DEFINE CONVERSATION USERS LIST
                    if( conversation.type === 1 ){
                        ctrl.users_pgtr = user_conversation_ids.get( conversation.id );
                        ctrl.users_pgtr.get().then(function(){
                            ctrl.users_displayed = ctrl.users_pgtr.indexes;
                        });
                    }else{
                        ctrl.users_displayed = conversation.users.concat();
                    }

                    // INIT MESSAGES
                    if( ctrl.paginator.list.length && conversation.type === 1 ){
                        ctrl.messages = ctrl.paginator.list.slice(0);
                    }else if( conversation.type === 2 ){
                        ctrl.messages = ctrl.paginator.list;
                    }

                    // GET PAGE
                    if( conversation.page_id ){
                        page_model.get([conversation.page_id]).then(function(){
                            ctrl.page_fields = pages_config[page_model.list[conversation.page_id].datum.type].fields;
                        });
                    }
                    if(conversation.item_id){
                        items_model.queue([conversation.item_id]).then(function(){
                            ctrl.item = items_model.list[conversation.item_id].datum;
                        });
                    }

                    // GET LAST MESSAGES.
                    if( !ctrl.reduced ){
                        ctrl.paginator.get(true).then(function( data ){
                            onRefresh( data );
                            if( ctrl.messages.length < ctrl.paginator.page_number
                                || ctrl.paginator.total === ctrl.messages.length ){
                                ctrl.nomoremsg = true;
                            }
                        });
                    }
                }else{
                    ctrl.paginator = undefined;
                    ctrl.users_pgtr = undefined;
                    ctrl.nomoremsg = true;
                    ctrl.users_displayed = conversation.users || [];
                }

                // WATCH USERS STATUS
                if( conversation.users && conversation.users.length ){
                    ctrl.watchStatusIdentifier = users_status.watch( conversation.users );
                }

                // CONVERSATION DISPLAY
                ctrl.avatarStyle = {};
                ctrl.avatarLetter = '';

                if( conversation.type === 2 && conversation.users.length === 2 ){
                    conversation.users.forEach(function(id){
                        if( id !== session.id ){
                            user_model.queue([id]).then(function(){
                                ctrl.connection = user_model.list[id];
                                ctrl.avatarStyle = filters_functions.dmsBgUrl( ctrl.connection.datum.avatar, [80,'m',80] );
                                ctrl.avatarLetter = filters_functions.userletter( ctrl.connection.datum );

                                if( ctrl.connectionChanged ){
                                    ctrl.connectionChanged(id);
                                }
                            });
                        }
                    });

                }else{
                    ctrl.connection = undefined;
                }

                // LISTEN TO NEW MESSAGES
                if( conversation.id ){
                    events_service.on('conversation.'+conversation.id+'.msg', onNewMessage );
                }
                $timeout(focusInput);
                conversation.expand = expandConversation;
            }

            // SET FILE INPUT ID
            $scope.file_input_id = 'cvnFid'+( (Math.random()+'').slice(2) )+Date.now();
            // SET AUTOCOMPLETE ID
            ctrl.autocompleteId ='cvnAC'+( (Math.random()+'').slice(2) )+Date.now();
            // EXPOSE PAGES ( NEEDED TO DISPLAY SCHOOL )
            ctrl.pages = page_model.list;
            // EXPOSE USERS
            ctrl.users = user_model.list;
            // EXPOSE SESSION
            ctrl.session = session;

            init();

            ctrl.setMainStream = function(stream){
                conversation.main_stream = stream.id;
                events_service.process(hgt_events.hgt_layout_changed);
                $scope.$evalAsync();
            };

            ctrl.searchUsers = function( search ){
                return community_service.connections( search, 1, 4, ctrl.userstoadd.concat(conversation.users) ).then(function(ids){
                    return user_model.get(ids).then(function(){
                        return ids;
                    });
                });
            };

            ctrl.onAutocomplete = function( user ){
                ctrl.userstoadd.push( user );
            };

            ctrl.printName = function(){
                if( conversation.type === 1 ){
                    return conversation.name;
                }else if(conversation.type === 3 && ctrl.item){
                    return ctrl.item.title;
                }
                else{
                    var name = '';

                    (conversation.users || []).forEach(function(id){
                        if( session.id !== id ){
                            name += filters_functions.usernameshort( user_model.list[id].datum )+', ';
                        }
                    });

                    return name.slice(0,-2);
                }
            };

            ctrl.addUsers = function(){
                if( ctrl.userstoadd.length ){
                    if( conversation.id ){
                        social_service.openConversation( null, ctrl.userstoadd.concat(conversation.users) );
                    }else{
                        Array.prototype.push.apply( conversation.users, ctrl.userstoadd );
                        // REMOVE 2 USERS CVN STYLE
                        ctrl.connection = false;
                        ctrl.avatarStyle = {};
                        ctrl.avatarLetter = '';
                    }
                    ctrl.userstoadd = [];
                    ctrl.addingUsers = false;
                }
            };

            ctrl.sendPrivateMessage = function( user_id ){
                social_service.openConversation( null, [user_id]);
            };

            ctrl.close = function(){
                social_service.closeConversation( conversation );
            };

            ctrl.switchState = function(){
                if( ctrl.reduced ){
                    expandConversation();
                }else{
                    reduceConversation();
                }
            };

            ctrl.loadNextUsers = function(){
                if( ctrl.users_pgtr && !ctrl.loadingNU ){
                    ctrl.loadingNU = true;

                    ctrl.users_pgtr.next().then(function(){
                        ctrl.loadingNU = false;
                    });
                }
            };

            ctrl.getPrevious = function(){
                if( !ctrl.loadingPrevious && !ctrl.nomoremsg ){
                    ctrl.loadingPrevious = true;
                    ctrl.paginator.next().then(onPrevious);
                }
            };

            ctrl.onMessengerKeyDown = function( e ){
                if(!ctrl.typing && ctrl.socket){
                    ctrl.typing = true;
                    ctrl.socket.emit('ch.writing',{ id:conversation.id, users: conversation.users });
                    $timeout(function(){
                        ctrl.typing = false;
                    },1000);
                }
                if( e.keyCode === 13 && !e.altKey){
                    e.stopPropagation();
                    e.preventDefault();
                    // SEND MESSAGE
                    if( ctrl.message.trim()){
                        var m = { text: ctrl.message, conversation_id:conversation.id};

                        if( !m.conversation_id ){
                            m.to = conversation.users;
                        }

                        sendMessage(m);
                    }
                    ctrl.message = '';
                }
                else if(e.keyCode === 13 && e.altKey){
                    ctrl.message += "\n";
                }
            };

            ctrl.sendFileMessage = function( files ){
                if( files.length ){
                    sendMessage({file:files[0]});
                }
            };

            ctrl.send = function(){
                if( ctrl.message.trim() ){
                    // SEND MESSAGE
                    var m = { text: ctrl.message, conversation_id:conversation.id};

                    if( !m.conversation_id ){
                        m.to = conversation.users;
                    }

                    sendMessage(m);
                    ctrl.message = '';

                    document.querySelector('#'+ctrl.messengerID).focus();
                }
            };

            function sendMessage( message ){
                var sendingStackRef = ctrl.sending_messages;

                sendingStackRef.push( message );
                $scope.$evalAsync();
                ctrl.scrollDown();

                var onMessageSent = function( data ){
                    if( !conversation.id ){
                        conversation.id = parseInt( data.conversation_id );
                        ctrl.paginator = messages.get( conversation.id );
                        ctrl.messages = ctrl.paginator.list;
                        events_service.on('conversation.'+conversation.id+'.msg', onNewMessage );
                    }

                    ctrl.paginator.get(true).then(function( d ){
                        if( ctrl.sending_messages === sendingStackRef ){
                            sendingStackRef.splice( sendingStackRef.indexOf(message), 1 );
                            onRefresh( d );
                        }
                    });
                };

                if( message.file ){
                    var onUploadProgress = function( e ){
                            message.progress = '('+(e.total? ((100 * e.loaded / e.total)+'').slice(0,3) : '0')+'%)';
                        },
                        onUploadDone = function( d ){
                            var m = {
                                conversation_id:conversation.id,
                                library: { name: message.file.name,type:message.file.type, token: d.token }
                            };

                            if( !m.conversation_id ){
                                m.to = conversation.users;
                            }

                            messages.send(m).then(onMessageSent);
                        };

                    if( message.file.type.indexOf('image/') !== -1 ){
                        message.picture = window.URL.createObjectURL(message.file);
                        $scope.$evalAsync();
                        ctrl.scrollDown();

                        upload_service.uploadImage( 'token', message.file, message.file.name).then(function( upload ){
                            upload.promise.then(onUploadDone,null,onUploadProgress);
                        });
                    }else{
                        upload_service.upload( 'token', message.file, message.file.name)
                            .promise.then(onUploadDone,null,onUploadProgress);
                    }
                }else{
                    messages.send( message ).then(onMessageSent);
                }
            }

            function reduceConversation(){
                ctrl.reduced = true;
                ctrl.userstoadd = [];
                ctrl.addingUsers = false;
            }

            function expandConversation(){
                if( ctrl.messageUnreads ){
                    ctrl.paginator.get(true).then(onRefresh);
                }

                ctrl.reduced = false;
                ctrl.userstoadd = [];
                ctrl.addingUsers = false;
                ctrl.messageUnreads = 0;
                ctrl.scrollDown();
                $timeout(focusInput);
            }

            function buildDocs(){
                ctrl.docs = [];
                ctrl.paginator.list.forEach(function( m ){
                    if( m.library ){
                        ctrl.docs.push( m.library );
                    }
                });

                ctrl.docs.reverse();
            }

            function onRefresh( messages ){
                if( conversation.type === 1 || conversation.type === 3 ){
                    var users = [];
                    messages.forEach(function(m){ users.push(m.user_id); });
                    user_model.queue(users).then(function(){
                        ctrl.messages = ctrl.paginator.list.slice(0);
                        ctrl.scrollDown();
                        buildDocs();
                        conversations.read( conversation.id );
                        if(ctrl.socket && ctrl.messages.length){
                            ctrl.socket.emit('ch.read',{ id:conversation.id, users : conversation.users, message_id: ctrl.messages[0].id });
                        }
                    });
                }else{
                    ctrl.scrollDown();
                    buildDocs();
                    conversations.read( conversation.id );
                    if(ctrl.socket && ctrl.messages.length){
                        ctrl.socket.emit('ch.read',{ id:conversation.id, users : conversation.users,message_id: ctrl.messages[0].id });
                    }
                }
            }

            function onPrevious( messages ){
                if( !messages || messages.length < ctrl.paginator.page_number ){
                    ctrl.nomoremsg = true;
                    ctrl.loadingPrevious = false;
                }

                if( conversation.type === 1 ){
                    var users = [];
                    messages.forEach(function(m){ users.push(m.user_id); });
                    user_model.queue(users).then(function(){
                        ctrl.messages = ctrl.paginator.list.slice(0);
                        ctrl.loadingPrevious = false;
                        buildDocs();

                        if( messages && messages.length ){
                            setTimeout(function(){
                                $element[0].querySelector( '#cm'+messages[0].id ).scrollIntoView(true);
                            });
                        }
                    });
                }else{
                    ctrl.loadingPrevious = false;
                    buildDocs();

                    if( messages && messages.length ){
                        setTimeout(function(){
                            $element[0].querySelector( '#cm'+messages[0].id ).scrollIntoView(true);
                        });
                    }
                }
            }

            ctrl.openDoc = function( doc, evt ){
                docslider_service.open( {docs:ctrl.docs}, 'View conversation documents', evt.target, ctrl.docs.indexOf(doc)+1 );
            };

            ctrl.scrollDown = function(){
                setTimeout(function(){
                    var list = $element[0].querySelector('.cvn-messages');
                    if( list ){
                        list.scrollTop = list.scrollHeight;
                    }
                }.bind(this));
            };

            function onNewMessage(){
                if( ctrl.reduced ){
                    ctrl.messageUnreads++;
                }else{
                    ctrl.paginator.get(true).then(onRefresh);
                }
            }

            if( $scope.mustwatch ){
                ctrl.stopWatchFn = $scope.$watch( 'conversation', function( niu, old){
                    if( niu !== old ){
                        if( old.id ){
                            events_service.off('conversation.'+old.id+'.msg',onNewMessage);
                        }
                        init();
                    }
                });

                ctrl.stopListenNavigation = $rootScope.$on('$stateChangeStart', ctrl.close );
            }




            $scope.$on('$destroy', function(){
                events_service.off('conversation.'+conversation.id+'.msg',onNewMessage);

                if( ctrl.watchStatusIdentifier ){
                    users_status.unwatch( ctrl.watchStatusIdentifier );
                }

                if( ctrl.stopListenNavigation ){
                    ctrl.stopListenNavigation();
                }

                if( ctrl.stopWatchFn ){
                    ctrl.stopWatchFn();
                }
            });
        }
    ]);
