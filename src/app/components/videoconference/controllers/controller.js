angular.module('videoconference').controller('hangout_controller',
    ['$scope', 'current_hangout', 'mode', 'session', 'conversation',
        'social_service', 'privates_hangouts', 'events_service', 'hgt_events',
        '$timeout', 'users', 'conversations', 'modal_service', '$translate',
        'notifier_service', 'filters_functions', 'user_model',
        function($scope, current_hangout, mode, session,  conversation,
        social_service, privates_hangouts, events_service,hgt_events,
        $timeout, users, conversations, modal_service, $translate,
        notifier_service, filters_functions, user_model){
            var ctrl = this;

            //CONSTANTS & CONFIG
            ctrl.cvn_types = { HANGOUT : 2, LIVECLASS : 3 };
            ctrl.cvn_columns = { CHAT : 'chat', STREAMS : 'streams', OPTIONS : 'options' };
            ctrl.me = session;
            ctrl.is_admin = mode === 'admin';
            ctrl.cvn_type = conversation.datum.type === 2 ? ctrl.cvn_types.HANGOUT : ctrl.cvn_types.LIVECLASS;
            ctrl.selected_column = ctrl.cvn_columns.STREAMS;
            ctrl.session = session;
            ctrl.user_model = user_model.list;

            //CONVERSATIONS
            ctrl.conversations = social_service.list;
            ctrl.conversations.push(conversation.datum);
            ctrl.conversation = conversation;
            ctrl.openConversation = function(users, cvn){
                if(users){
                    users.forEach(function(u){
                       ctrl.unreadConversations[u] = 0;
                    });
                    users.push(session.id);
                    if(!ctrl.conversations.some(function( c ){
                        if(c.type === 2 && c.users.sort().toString()=== users.sort().toString() ){
                            c.reduced = false;
                            ctrl.selected_conversation = c;
                            if(c.id != ctrl.conversation.id){
                                ctrl.private_conversation = c;
                            }
                            ctrl.selected_column = ctrl.cvn_columns.CONVERSATIONS;
                            return true;
                        }
                        else{
                            return false;
                        }
                    })){
                        social_service.getConversation(null, users).then(function(cvn){
                            ctrl.conversations.push(cvn);
                            cvn.reduced = false;
                            ctrl.selected_conversation = cvn;
                            if(cvn.id !== ctrl.conversation.datum.id){
                                ctrl.private_conversation = cvn;
                            }
                            ctrl.selected_column = ctrl.cvn_columns.CONVERSATIONS;
                        });
                    }
                }
                else if(cvn){
                    cvn.users.forEach(function(u){
                       ctrl.unreadConversations[u] = 0;
                    });
                    ctrl.selected_conversation = cvn;
                    ctrl.selected_column = ctrl.cvn_columns.CONVERSATIONS;
                }
            };

            ctrl.printNames = function(conversation){
                  var name = '';

                    (conversation.users || []).forEach(function(id){
                        if( session.id !== id ){
                            name += filters_functions.username( user_model.list[id].datum )+', ';
                        }
                    });

                    return name.slice(0,-2);
            };

            ctrl.selected_conversation = conversation.datum;


            //STREAMS

            ctrl.hangout = current_hangout;
            ctrl.primary_stream = null;
            ctrl.hangouts = privates_hangouts;

            ctrl.setMainStream = function(stream){
                $timeout(function(){
                    ctrl.primary_stream = stream.id;
                    events_service.process(hgt_events.hgt_layout_changed);
                    $scope.$evalAsync();
                });
            };

            function onNewStream(e) {
                if(!ctrl.primary_stream ||
                    !ctrl.hangout.streams[ctrl.primary_stream]  ||
                    ctrl.primary_stream === 'camera' ||
                    ctrl.primary_stream === 'screen'){

                    ctrl.setMainStream(e.datas[0]);
                }
            }

            function onStreamRemoved(e){
                if(!privates_hangouts.current_hangout){
                    ctrl.primary_stream = null;
                    return;
                }
                else if(!ctrl.primary_stream || ctrl.primary_stream === e.datas[0].id){
                    var streams = Object.keys(ctrl.hangout.streams);
                    if(streams.length === 0){
                       ctrl.primary_stream = null;
                    }
                    else{
                         ctrl.setMainStream(ctrl.hangout.streams[streams[0]]);
                    }
                }
                ctrl.current_sharings.camera = ctrl.hangout.streams.camera !== undefined && ctrl.hangout.streams.camera.data.video;
                ctrl.current_sharings.microphone = ctrl.hangout.streams.camera !== undefined && ctrl.hangout.streams.camera.data.audio;
            }

            function onConnectedChanged(e){
                if(ctrl.cvn_type === ctrl.cvn_types.HANGOUT && e.datas[0] == conversation.datum.id){
                    if(!e.datas[1].some(function(uid){
                        return uid !== session.id;
                    }) && e.datas[3].length){
                        ctrl.leaveHangout();
                    }
                    e.datas[1].forEach(function(u){
                        if(ctrl.users.indexOf(u) === -1){
                            ctrl.users.push(u);
                        }
                    });
                }
                /*if(ctrl.is_admin && ctrl.cvn_type === ctrl.cvn_types.LIVECLASS && e.datas[1].some(function(uid){
                        return uid !== session.id;
                    })
                    && ctrl.recording === undefined && e.datas[0] == conversation.datum.id){
                    conversations.startRecord(conversation.datum.id);
                    ctrl.recording = true;
                }*/
            };

            function onFbLeft(e){
                ctrl.leaveHangout();
            };

            function onHangoutAccepted(e){
               ctrl.has_call = false;
                hangoutRing.pause();
                ctrl.hangout.launch().then(function(){
                    ctrl.toggleCamera();
                });
            };

            function onHangoutDeclined(e){
                if(ctrl.cvn_type === ctrl.cvn_types.HANGOUT){
                    ctrl.leaveHangout();
                }
            };

            function onHangoutRemoved(e){
                if(ctrl.cvn_type === ctrl.cvn_types.HANGOUT){
                    ctrl.leaveHangout();
                }
            };

            function onRequestReceived(type, id, accept, decline){
                ctrl.sharing_requests.push({ type : type, user_id : id, accept : accept, decline : decline });
                if(!ctrl.current_request){
                    processNextRequest();
                }
            };

           function onRequestCanceled(type, id){
                if(ctrl.is_admin){
                    ctrl.sharing_requests = ctrl.sharing_requests.filter(function(req){
                       return req.type !== type || req.user_id !== id;
                    });
                    if(ctrl.current_request && ctrl.current_request.type === type && ctrl.current_request.user_id === id){
                        ctrl.current_request = null;
                        modal_service.close();
                        processNextRequest();
                    }
                }
            };

            //OPTIONS

            //Liveclass sharing requests
            ctrl.sharing_requests = []; //Admin requests list
            ctrl.current_request = null; //Admin current request shown in modal

            ctrl.current_requests = { microphone : false, camera : false, screen : false }; // BASIC USER CURRENT REQUESTS
            ctrl.current_sharings = { microphone : false, camera : false, screen : false }; // BASIC USER CURRENT SHARED DEVICES



            function processNextRequest(){
                if(ctrl.sharing_requests.length){
                    ctrl.current_request = ctrl.sharing_requests.splice(0,1)[0];
                    openConfirmModal(ctrl.current_request);
                }
            }

            function onRequestProcessed(){
                if(ctrl.current_request){
                    if(ctrl.current_request.accepted){
                        if(ctrl.current_request.accept){
                            ctrl.current_request.accept(ctrl.current_request.user_id);
                        }
                    }
                    else{
                        if(ctrl.current_request.decline){
                            ctrl.current_request.decline(ctrl.current_request.user_id);
                        }
                    }
                }
                ctrl.current_request = null;
                $timeout(processNextRequest);
            }

            function onCameraRequestsReceived(e){
                if(ctrl.is_admin){
                    onRequestReceived(
                        "camera",
                        e.datas[1].id,
                        ctrl.hangout.acceptCameraSharing.bind(ctrl.hangout),
                        ctrl.hangout.declineCameraSharing.bind(ctrl.hangout)
                    );
                }
                else if(ctrl.current_requests.camera){
                    ctrl.current_requests.camera = false;
                    ctrl.current_sharings.camera = true;
                    ctrl.current_sharings.microphone = true;
                    if(!ctrl.hangout.streams.camera){
                        ctrl.hangout.shareCamera();
                    }
                    else if(!ctrl.hangout.streams.camera.data.video){
                        ctrl.hangout.streams.camera.toggleVideo();
                    }
                }
                else{
                     onRequestReceived(
                        "camera",
                        e.datas[1].id,
                        function(){
                            ctrl.current_requests.camera = false;
                            ctrl.current_sharings.camera = true;
                            ctrl.current_sharings.microphone = true;
                            if(!ctrl.hangout.streams.camera){
                                ctrl.hangout.shareCamera();
                            }
                            else if(!ctrl.hangout.streams.camera.data.video){
                                ctrl.hangout.streams.camera.toggleVideo();
                            }
                        },
                        null
                    );
                }
            };

            function onMicrophoneRequestsReceived(e){
                if(ctrl.is_admin){
                    onRequestReceived(
                        "microphone",
                        e.datas[1].id,
                        ctrl.hangout.acceptMicrophoneSharing.bind(ctrl.hangout),
                        ctrl.hangout.declineMicrophoneSharing.bind(ctrl.hangout)
                    );
                }
                else if(ctrl.current_requests.microphone){
                   ctrl.current_requests.microphone = false;
                   ctrl.current_sharings.microphone = true;
                   ctrl.hangout.shareMicrophone();
                }
                else{
                     onRequestReceived(
                        "microphone",
                        e.datas[1].id,
                        function(){
                            ctrl.current_requests.microphone = false;
                            ctrl.current_sharings.microphone = true;
                            ctrl.hangout.shareMicrophone();
                        },
                        null
                    );
                }
            };

            function onScreenRequestsReceived(e){
                if(ctrl.is_admin){
                    onRequestReceived(
                        "screen",
                        e.datas[1].id,
                        ctrl.hangout.acceptScreenSharing.bind(ctrl.hangout),
                        ctrl.hangout.declineScreenSharing.bind(ctrl.hangout)
                    );
                }
                else if(ctrl.current_requests.screen){
                    ctrl.current_requests.screen = false;
                    ctrl.hangout.shareScreen();
                }
                else{
                    onRequestReceived(
                        "screen",
                        e.datas[1].id,
                        function(){
                            ctrl.current_requests.screen = false;
                            ctrl.hangout.shareScreen();
                        },
                        null
                    );
                }
            }

            function onCameraRequestsCanceled(e){
                 if(ctrl.is_admin){
                   onRequestCanceled("camera", e.datas[1].id);
                }
                else if(ctrl.current_requests.camera){
                   ctrl.current_requests.camera = false;
                }
            }

            function onMicrophoneRequestsCanceled(e){
                 if(ctrl.is_admin){
                   onRequestCanceled("microphone", e.datas[1].id);
                }
                else if(ctrl.current_requests.microphone){
                    ctrl.current_requests.microphone = false;
                }
            }

            function onScreenRequestsCanceled(e){
                 if(ctrl.is_admin){
                   onRequestCanceled("screen", e.datas[1].id);
                }
                else if(ctrl.current_requests.screen){
                   ctrl.current_requests.screen = false;
                }
            }

            function onUserConnected(e){
                if(ctrl.current_requests.camera){
                    ctrl.hangout.askShareCamera(e.datas[1].id);
                }
                if(ctrl.current_requests.microphone){
                    ctrl.hangout.askShareMicrophone(e.datas[1].id);
                }
                if(ctrl.current_requests.screen){
                    ctrl.hangout.askShareScreen(e.datas[1].id);
                }
            }

            ctrl.getCameraLabel = function(){
                if(ctrl.current_sharings.camera){
                    return 'Camera ON';
                }
                else if(ctrl.current_sharings.microphone || ctrl.is_admin || ctrl.cvn_type === ctrl.cvn_types.HANGOUT){
                    return "Camera OFF";
                }
                else if(ctrl.current_requests.camera){
                    return "Request sent";
                }
                else{
                    return "Ask to share your camera";
                }
            };

            ctrl.getMicrophoneLabel = function(){
                if(ctrl.current_sharings.microphone){
                    return 'Microphone ON';
                }
                else if(ctrl.current_sharings.camera || ctrl.is_admin || ctrl.cvn_type === ctrl.cvn_types.HANGOUT){
                    return "Microphone OFF";
                }
                else if(ctrl.current_requests.microphone){
                    return "Request sent";
                }
                else{
                    return "Ask to share your micro";
                }
            };

            ctrl.getScreenLabel = function(){
                if(ctrl.hangout.streams.screen){
                    return 'Screen shared';
                }
                else if(ctrl.is_admin || ctrl.cvn_type === ctrl.cvn_types.HANGOUT){
                    return "Share my screen";
                }
                else if(ctrl.current_requests.screen){
                    return "Request sent";
                }
                else{
                    return "Ask to share your screen";
                }
            };


            ctrl.toggleCamera = function(){
                if(ctrl.current_sharings.microphone){
                    ctrl.hangout.streams.camera.toggleVideo();
                    ctrl.current_sharings.camera = !ctrl.current_sharings.camera;
                }
                else if(ctrl.current_sharings.camera){
                    ctrl.hangout.unpublish(ctrl.hangout.streams.camera);
                    ctrl.current_sharings.microphone = false;
                    ctrl.current_sharings.camera = false;
                }
                else if(ctrl.is_admin || ctrl.cvn_type === ctrl.cvn_types.HANGOUT){
                    ctrl.hangout.shareCamera();
                    ctrl.current_sharings.camera = true;
                    ctrl.current_sharings.microphone = true;
                }
                else{
                    requestSharingCamera();
                }
            };

            ctrl.toggleMicrophone = function(){
                if(ctrl.current_sharings.camera){
                    ctrl.hangout.streams.camera.toggleSound();
                    ctrl.current_sharings.microphone = !ctrl.current_sharings.microphone;
                }
                else if(ctrl.current_sharings.microphone){
                    ctrl.hangout.unpublish(ctrl.hangout.streams.camera);
                    ctrl.current_sharings.microphone = false;
                        ctrl.current_sharings.camera = false;
                }
                else if(ctrl.is_admin || ctrl.cvn_type === ctrl.cvn_types.HANGOUT){
                    ctrl.hangout.shareMicrophone();
                    ctrl.current_sharings.microphone = true;
                }
                else{
                    requestSharingMicrophone();
                }
            };

            ctrl.toggleScreen = function(){
                if( ctrl.hangout.streams.screen ){
                    ctrl.hangout.unpublish(ctrl.hangout.streams.screen) ;
                }
                else if(ctrl.is_admin || ctrl.cvn_type === ctrl.cvn_types.HANGOUT){
                    ctrl.hangout.shareScreen();
                }
                else{
                    requestSharingScreen();
                }
            };

            ctrl.toggleRecord = function(){
                ctrl.recording = !ctrl.recording;
                if(!ctrl.recording){
                    conversations.stopRecord(conversation.datum.id);
                }
                else{
                    conversations.startRecord(conversation.datum.id);
                }
            };

            function requestSharingCamera(to){
                if(ctrl.current_requests.camera){
                    ctrl.current_requests.camera = false;
                    ctrl.hangout.declineCameraSharing();
                }else{
                    if(ctrl.current_requests.microphone){
                        ctrl.hangout.declineMicrophoneSharing();
                    }
                    ctrl.current_requests.camera = true;
                    ctrl.hangout.askShareCamera(to);
                }
            }

            function requestSharingMicrophone(to){
                if(ctrl.current_requests.microphone){
                    ctrl.current_requests.microphone = false;
                    ctrl.hangout.declineMicrophoneSharing();
                }else{
                    if(ctrl.current_requests.camera){
                        ctrl.hangout.declineCameraSharing();
                    }
                    ctrl.current_requests.microphone = true;
                    ctrl.hangout.askShareMicrophone(to);

                }
            }

            function requestSharingScreen(to){
                if(ctrl.current_requests.screen){
                    ctrl.current_requests.screen = false;
                    ctrl.hangout.declineMicrophoneSharing();
                }else{
                    ctrl.current_requests.screen = true;
                    ctrl.hangout.askShareScreen(to);
                }
            }

            ctrl.leaveHangout = function(){
                if(privates_hangouts.current_hangout){
                    privates_hangouts.quit();
                }
                if(ctrl.is_admin && ctrl.recording){
                    conversations.stopRecord(conversation.datum.id).then(function(){
                        window.close();
                    });
                }
                else{
                    window.close();
                }
            };

            function openConfirmModal(request){
                request.accepted = false;
                modal_service.open({
                    label: "Request received",
                    scope : {
                        you : session.id,
                        request : request
                    },
                    template: 'app/components/videoconference/tpl/confirm_modal.html',
                    reference: document.activeElement,
                    onclose : onRequestProcessed
                });
            }

            ctrl.unreadConversations = {};
            ctrl.unreadPublic = 0;
            function onConversationUnread(e){
                if(e.datas[0] !== ctrl.conversation.datum.id){
                    e.datas[2].forEach(function(u){
                        if(u !== session.id){
                            if(!ctrl.unreadConversations[u]){
                                ctrl.unreadConversations[u] = 0;
                            }
                            if(ctrl.selected_conversation.id !== e.datas[0]){
                                ctrl.unreadConversations[u]++;
                            }
                        }
                    });
                }
                else if(ctrl.selected_conversation !== ctrl.conversation.datum){
                    ctrl.unreadPublic++;
                }
            }

            //USERS

            ctrl.users = users;


            //EVENTS

            events_service.on(hgt_events.hgt_publishing_camera_error, function( evt ){
                $translate('ntf.err_hangout_cam_sharing').then(function( translation ){
                    notifier_service.add({type:'error',message: translation});
                });
            });

            events_service.on(hgt_events.hgt_publishing_microphone_error, function( evt ){
                $translate('ntf.err_hangout_mic_sharing').then(function( translation ){
                    notifier_service.add({type:'error',message: translation});
                });
            });

            events_service.on(hgt_events.hgt_stream_added, onNewStream);
            events_service.on(hgt_events.hgt_stream_removed, onStreamRemoved);
            events_service.on(hgt_events.fb_connected_changed, onConnectedChanged);
            events_service.on(hgt_events.fb_left, onFbLeft);
            events_service.on(hgt_events.fb_request_declined, onHangoutDeclined);
            events_service.on(hgt_events.fb_request_removed, onHangoutRemoved);
            events_service.on(hgt_events.fb_request_accepted, onHangoutAccepted);
            events_service.on('conversation.unread', onConversationUnread);
            if(ctrl.is_admin){
                events_service.on(hgt_events.ask_camera_auth, onCameraRequestsReceived);
                events_service.on(hgt_events.ask_microphone_auth, onMicrophoneRequestsReceived);
                events_service.on(hgt_events.ask_screen_auth, onScreenRequestsReceived);
            }
            else{
                events_service.on(hgt_events.camera_requested, onCameraRequestsReceived);
                events_service.on(hgt_events.microphone_requested, onMicrophoneRequestsReceived);
                events_service.on(hgt_events.screen_requested, onScreenRequestsReceived);
                events_service.on(hgt_events.hgt_user_connected, onUserConnected)
            }
            events_service.on(hgt_events.cancel_camera_auth, onCameraRequestsCanceled);
            events_service.on(hgt_events.cancel_microphone_auth, onMicrophoneRequestsCanceled);
            events_service.on(hgt_events.cancel_screen_auth, onScreenRequestsCanceled);
              //HANGOUT
            var hangoutRing = new Audio('assets/audio/ringtone.mp3');
            hangoutRing.loop = true;

            if(ctrl.cvn_type === ctrl.cvn_types.HANGOUT){
                if(mode === 'call'){
                    privates_hangouts.sendRequest(conversation.datum.id, ctrl.users);
                    hangoutRing.play();
                    ctrl.has_call = true;
                }
                else if(mode !== 'call'){
                    ctrl.hangout.launch().then(function(){
                        if(ctrl.hangout.users.length === 1 && ctrl.cvn_type === ctrl.cvn_types.HANGOUT){
                            ctrl.leaveHangout();
                        }
                        else{
                            ctrl.toggleCamera();
                        }
                    });
                }
            }
            else{
                ctrl.hangout.launch().then(function(){
                    if(ctrl.is_admin){
                        ctrl.toggleCamera();
                    }
                });

            }



            $scope.$on('$destroy', function(){
                privates_hangouts.quit();
                events_service.off(hgt_events.hgt_stream_added, onNewStream);
                events_service.off(hgt_events.hgt_stream_removed, onStreamRemoved);
                events_service.off(hgt_events.fb_connected_changed, onConnectedChanged);
                events_service.off(hgt_events.fb_left, onFbLeft);
                events_service.off(hgt_events.fb_request_declined, onHangoutDeclined );
                events_service.off(hgt_events.fb_request_removed, onHangoutRemoved);
                events_service.off(hgt_events.fb_request_accepted, onHangoutAccepted);

                if(ctrl.is_admin){
                    conversations.stopRecord(conversation.datum.id);
                    events_service.off(hgt_events.ask_camera_auth, onCameraRequestsReceived);
                    events_service.off(hgt_events.microphone_requested, onMicrophoneRequestsReceived);
                    events_service.off(hgt_events.screen_requested, onScreenRequestsReceived);
                }
                else{
                    events_service.off(hgt_events.camera_requested, onCameraRequestsReceived);
                    events_service.off(hgt_events.microphone_requested, onMicrophoneRequestsReceived);
                    events_service.off(hgt_events.screen_requested, onScreenRequestsReceived);
                }
                events_service.off(hgt_events.cancel_camera_auth, onCameraRequestsCanceled);
                events_service.off(hgt_events.cancel_microphone_auth, onMicrophoneRequestsCanceled);
                events_service.off(hgt_events.cancel_screen_auth, onScreenRequestsCanceled);
            });
        }
    ]);
