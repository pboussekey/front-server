angular.module('HANGOUT').factory('tokbox',['events_service', 'hgt_events', '$q',
    function(events_service, hgt_events, $q){

        var service = {
            current_session : null,
            streams : [],
            options : {
                chromeExtensionId: CONFIG.tokbox_screensharing_chrome_id,
                chromeExtensionUrl: CONFIG.tokbox_chrome_extension_url
            },
            init : function(){
                var deferred = $q.defer();
                if(service.inited){
                    deferred.resolve();
                }
                else{
                    if( OT.checkSystemRequirements() ){

                        var ua = navigator.userAgent.toLowerCase();
                        service.browser = ua.indexOf('firefox')!==-1?'firefox':ua.indexOf('chrome')?'chrome':false;

                        service.webrtc_support = true;
                        // Register screensharing extension. ( for chrome )
                        if(service.browser === 'chrome' && service.options.chromeExtensionId ){
                            OT.registerScreenSharingExtension('chrome', service.options.chromeExtensionId, 2);
                        }

                        // Check screensharing support.
                        OT.checkScreenSharingCapability(function( capability ){
                            if( !capability.supported || capability.extensionRegistered === false ){
                                service.screensharing_support = false;
                            }else{
                                service.screensharing_support = true;
                                service.screensharing_installed = capability.extensionInstalled;
                            }
                            service.inited = true;
                            deferred.resolve();
                        });

                    }
                    else{
                        service.webrtc_support = false;
                        service.screensharing_support = false;
                        deferred.reject();
                    }
                }
                return deferred.promise;
            },
            getExtension : function(){

                var deferred = $q.defer();
                if(service.screensharing_installed || service.browser === 'firefox'){
                    deferred.resolve( true );
                }
                else if( service.browser === 'chrome' ){
                    if( chrome ){
                        chrome.webstore.install( service.options.chromeExtensionUrl ,function(){
                            service.screensharing_installed = true;
                            service.current_session.screensharing_installed = true;
                            deferred.resolve( true );
                        },function(){
                            console.log('ERR', arguments);
                            deferred.reject();
                        });
                    }
                }
                else{
                    deferred.reject();
                }

                return deferred.promise;
            },
            getSession : function(session_id, token){
                var deferred = $q.defer();
                service.init().then(function(){
                    if(service.current_session || !service.webrtc_support){
                        deferred.reject();
                        return deferred.promise;
                    }
                    var session = OT.initSession(CONFIG.tokbox_api_key, session_id);
                    session.screensharing_support =  service.screensharing_support;
                    session.screensharing_installed = service.screensharing_installed;
                    session.on({
                        streamCreated: service.onStreamCreated,
                        streamDestroyed: service.onStreamDestroyed,
                        sessionDisconnected : service.onSessionDisconnect,
                        connectionCreated: service.onUserConnected,
                        connectionDestroyed: service.onUserDisconnected,
                        signal : service.onSignal
                    });
                    service.current_session = session;

                    session.connect(token, function(error) {
                        if(error){
                           deferred.reject();
                        }
                        else{
                            deferred.resolve(session);
                        }
                    });

                }, function(){
                    deferred.reject();
                });

                return deferred.promise;

            },
            publish : function(session, stream, options){
                var deferred = $q.defer();
                stream.publisher = OT.initPublisher( null, options );
                stream.publisher.on({
                    videoElementCreated: function( event ){
                        stream.element = event.element;
                        service.streams.push(stream);
                        deferred.resolve();
                    },
                    streamCreated: function( event ){
                        events_service.process( hgt_events.tb_stream_published, stream );
                    },
                    streamDestroyed: function( event ){
                        event.preventDefault();
                        events_service.process( hgt_events.tb_stream_destroyed, stream );
                    }
                }, this);
                session.publish( stream.publisher, function(error) {
                    if(error){
                        session.unpublish(stream.publisher);
                        stream.publisher = null;
                        events_service.process( hgt_events.tb_publishing_error, stream );
                        deferred.reject();
                    }
                });
                return deferred.promise;
            },
            unpublish : function(publisher){
                service.current_session.unpublish(publisher);
            },
            suscribe : function( stream, options){
                var deferred = $q.defer();
                stream.subscriber = service.current_session.subscribe(stream, null, options, function(error) {
                    if(error){
                       deferred.reject();
                    }
                });
                stream.subscriber.on({
                    videoElementCreated: function( event ){
                        stream.element = event.element;
                        service.streams.push(stream);
                        deferred.resolve();
                    }
                }, this);
                return deferred.promise;
            },
            disconnect : function(){
                if(service.current_session){
                    service.streams.forEach(function(stream){
                        if(stream.suscriber){
                            service.current_session.unsuscribe(stream.suscriber);
                        }
                        if(stream.publisher){
                            stream.publisher.destroy();
                        }
                    });
                    service.streams = [];
                    service.current_session.off();
                    service.current_session.disconnect();
                    service.current_session = null;
                }
            },
            onStreamCreated : function(e){
                events_service.process(hgt_events.tb_stream_created, e.stream);
            },
            onStreamDestroyed : function(e){
                events_service.process(hgt_events.tb_stream_destroyed, e.stream);
            },
            onSessionDisconnect : function(e){
                service.disconnect();
            },
            onUserConnected : function( event ){
                events_service.process( hgt_events.hgt_user_connected, event, service.getUser(event.connection.data) );
            },
            onUserDisconnected : function( event ){
                events_service.process( hgt_events.hgt_user_disconnected, event, service.getUser(event.connection.data) );
            },
            forceUnpublish : function( stream ){
                service.current_session.forceUnpublish( stream );
            },

            forceDisconnect : function( connection ){
                service.current_session.forceDisconnect( connection );
            }   ,
            onSignal : function( event ){
                console.log("ON SIGNAL",event.type.slice(7), event, service.getUser(event.from.data), event.to);
                events_service.process( event.type.slice(7), event, service.getUser(event.from.data), event.to );
            },
            getUser : function( datas ){
                var datas = JSON.parse(datas);
                Object.keys(datas).forEach(function(k){
                    if( typeof datas[k] === 'string' ){
                        datas[k] = decodeURIComponent( datas[k] );
                    }
                });

                return datas;
            }

        };
        window.tokbox = service;
        return service;
    }
]);
