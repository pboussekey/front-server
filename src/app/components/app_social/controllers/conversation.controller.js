angular.module('app_social').controller('conversation_controller',
    ['$scope','$element', 'user_model','events_service','upload_service','messages','session','$rootScope',
        'user_conversation_ids', 'statuses', 'users_status','filters_functions','page_model','social_service',
        'docslider_service','conversations','community_service',  'hgt_events', 'privates_hangouts', 'hangout',
        'cvn_model','$translate', '$state', 'items_model', 'pages_config',
        function( $scope, $element, user_model, events_service, upload_service, messages, session, $rootScope,
            user_conversation_ids, statuses, users_status, filters_functions, page_model, social_service,
            docslider_service, conversations, community_service, hgt_events, privates_hangouts, hangout,
            cvn_model, $translate, $state, items_model, pages_config){

            var ctrl = this, conversation;
            ctrl.message = '';
            ctrl.messengerID = 'msgID_'+(Math.random()+'').slice(2);
            ctrl.hangouts = privates_hangouts;
            ctrl.pages_config = pages_config;
            function init(){
                conversation = $scope.conversation;

                ctrl.reduced = !!conversation.reduced;
                ctrl.messageUnreads = ctrl.reduced?1:0;
                delete(conversation.reduced);

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

                    if( conversation.type === 1 ){
                        ctrl.users_pgtr = user_conversation_ids.get( conversation.id );
                        ctrl.users_pgtr.get();
                    }else{
                        ctrl.users_pgtr = undefined;
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

            ctrl.hgt_params = {
                ongoing : function(){ return conversation.type === 2 && privates_hangouts.observeds[conversation.id] && privates_hangouts.observeds[conversation.id].length > 1; },
                available : function(){
                    return conversation.type === 2 && hangout.is_available && conversation.users.some(function(uid){

                        return uid !== session.id && users_status.status[uid] === statuses.connected;
                    });
                },
                has_call : function(){ return  privates_hangouts.hasRequest(conversation.id) || privates_hangouts.hasDemand(conversation.id); },
                has_hangout : function(){ return privates_hangouts.current_hangout; }
            };

            function _launchHangout(mode){
                var url;
                if(conversation.type === 2){
                  url = '#' +  $state.href('videoconference', { id : conversation.id, mode : mode });
                }
                else{
                    url = '#' +  $state.href('liveclass', { id : conversation.item_id });
                }
                window.open(url).focus();
            }

            ctrl.launchHangout = function(){
                if(!conversation.id){
                    cvn_model.create(conversation.users).then(function(id){
                        conversation.id = id;
                        _launchHangout(ctrl.hgt_params.ongoing() ? 'join' : 'call');
                    });
                }
                else{
                    _launchHangout(ctrl.hgt_params.ongoing() ? 'join' : 'call');
                }
            };

            ctrl.acceptHangoutRequest = function(){
                ctrl.hangouts.acceptRequest(ctrl.hangouts.requests[conversation.id][0]);
                if(!ctrl.hangouts.current_hangout){
                    _launchHangout('join');
                }
                if(conversation.type === 3){
                    ctrl.close();
                }
            };

            ctrl.leaveHangout = function(){
                if(privates_hangouts.current_hangout){
                    if(conversation.type === 3){
                        ctrl.close();
                    }
                }
            };

            ctrl.cleanHangouts = function(){
                if(ctrl.hangouts.hasRequest(conversation.id)){
                    ctrl.hangouts.declineRequest(ctrl.hangouts.requests[conversation.id][0]);
                }
                if(ctrl.hangouts.hasDemand(conversation.id)){
                    ctrl.hangouts.cancelRequest(ctrl.hangouts.demands[conversation.id]);
                }
            };

            ctrl.declineRequest = function(){
               ctrl.hangouts.declineRequest(ctrl.hangouts.requests[conversation.id][0]);
                if(conversation.type === 3){
                    ctrl.close();
                }
            };

            ctrl.cancelRequest = function(){
                ctrl.hangouts.cancelRequest(ctrl.hangouts.demands[conversation.id]);
                if(conversation.type === 3){
                    ctrl.close();
                }
            };

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
                            name += filters_functions.username( user_model.list[id].datum )+', ';
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

            ctrl.onMessengerKeyUp = function( e ){
                if( e.keyCode === 13 && !e.shiftKey && ctrl.message.trim() ){
                    // SEND MESSAGE
                    var m = { text: ctrl.message, conversation_id:conversation.id};

                    if( !m.conversation_id ){
                        m.to = conversation.users;
                    }

                    sendMessage(m);
                    ctrl.message = '';
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
                    });
                }else{
                    ctrl.scrollDown();
                    buildDocs();
                    conversations.read( conversation.id );
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

            ctrl.openInMessenger = function(){
                social_service.current = conversation;
                ctrl.messageUnreads = 0;
                if(!social_service.fullMode){
                    social_service.switchMode();
                }
            };

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

             function onConnectedChanged(e){
                if(conversation.type === 2 && e.datas[0] == conversation.id){
                    if(!e.datas[1].some(function(uid){
                        return uid !== session.id;
                    }) && e.datas[3].length){
                        ctrl.cleanHangouts();
                    }
                }
            };

            function onCurrentHangoutChanged(e){
                var hgt = e.datas[1];
                if( ctrl.hgt_params.has_call() && ctrl.hgt_params.ongoing()){
                    if(hgt && hgt == conversation.id){
                        ctrl.acceptHangoutRequest();
                    }
                    else if(hgt){
                        ctrl.declineRequest();
                    }
                }
                $scope.$evalAsync();
            };

            events_service.on(hgt_events.fb_connected_changed, onConnectedChanged);
            events_service.on(hgt_events.fb_current_hangout_changed, onCurrentHangoutChanged);


            $scope.$on('$destroy', function(){
                events_service.off('conversation.'+conversation.id+'.msg',onNewMessage);
                events_service.off(hgt_events.fb_left, ctrl.cleanHangouts);
                events_service.off(hgt_events.fb_connected_changed, onConnectedChanged);
                events_service.off(hgt_events.fb_current_hangout_changed, onCurrentHangoutChanged);

                if( ctrl.stopListenNavigation ){
                    ctrl.stopListenNavigation();
                }

                if( ctrl.stopWatchFn ){
                    ctrl.stopWatchFn();
                }
            });
        }
    ]);
