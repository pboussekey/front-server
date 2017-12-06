angular.module('HANGOUT').factory('privates_hangouts',[
    'events_service', 'hgt_events', 'FirebaseProvider','session','$q', 'conversations', 'events',
    function(  events_service, hgt_events, FirebaseProvider, session,  $q, conversations, events ){

        var manager = {
            current_hangout : null,
            // REQUESTS YOU GOT
            requests: {},
            // REQUESTS YOU SENT
            demands: {},
            // HANGOUT OBSERVED
            observeds: {},
            
            acceptRequest: function( request ){
                manager.firebase.child('hangout_demands/'+request.user+'/'+request.id+'/accepted').push( manager.user_id );
                manager.firebase.child('hangout_requests/'+manager.user_id+'/'+request.key ).set( null );
            },

            declineRequest: function( request ){              
                manager.firebase.child('hangout_demands/'+request.user+'/'+request.id+'/declined').push( manager.user_id );
                manager.firebase.child('hangout_requests/'+manager.user_id+'/'+request.key ).set( null );
            },

            cleanUsers: function(usersIds){
                var u = [];
                usersIds.forEach(function(id){
                    if( manager.user_id != id ){
                        u.push(id);
                    }
                });
                return u;
            },
            
            sendRequest: function( hangout_id, usersIds ){
                var users = this.cleanUsers(usersIds);
                
                Object.keys( manager.demands ).forEach(function(hgt_id){
                    manager.cancelRequest( manager.demands[hgt_id] );
                });
                
                var requestRefs = [],
                    key = manager.user_id+'_'+hangout_id,
                    demandRef = manager.firebase.child('hangout_demands/'+manager.user_id+'/'+hangout_id );

                // ON DISCONNECTION => REMOVE DEMAND.
                demandRef.onDisconnect().set( null );
                // ON USER DECLINING.
                demandRef.child('declined').on('child_added', function( ds ){
                    manager.demands[hangout_id].declined.push( ds.val() );
                    var demand = manager.demands[hangout_id];
                    if( manager.demands[hangout_id].declined.length + manager.demands[hangout_id].accepted.length === users.length ){
                        manager.cancelRequest( manager.demands[hangout_id] );
                        events_service.process( hgt_events.fb_request_declined, demand );
                    }
                    
                });
                // ON USER ACCEPTING.
                demandRef.child('accepted').on('child_added', function( ds ){
                    manager.demands[hangout_id].accepted.push( ds.val() );
                    demandRef.child('accepted').off();
                    demandRef.child('declined').off();
                    delete( manager.demands[hangout_id] );
                    demandRef.set(null);
                    events_service.process( hgt_events.fb_request_accepted, manager.demands[hangout_id] );
                }.bind(this));
                // SET DEMAND
                demandRef.set({ waiting: true});

                users.forEach(function( user_id ){
                    var ref = manager.firebase.child('hangout_requests/'+user_id+'/'+key);
                    // SET REQUEST FOR USER
                    ref.set({key:key, id: hangout_id, user: manager.user_id });
                    // ON DISCONNECTION => REMOVE REQUEST.
                    ref.onDisconnect().set(null);

                    requestRefs.push(ref);
                });
                
                manager.hangoutRef.set(hangout_id);      
                

                this.demands[hangout_id] = { id:hangout_id, users:users, dRef: demandRef, rRefs: requestRefs, accepted:[], declined:[] };
                
                events_service.process( hgt_events.request_sent, this.demands[hangout_id] );
            },

            cancelRequest: function( demand ){
                
                delete( manager.demands[demand.id] );
                // DELETE USER DEMAND && CANCEL DISCONNECTION CALLBACK.
                demand.dRef.onDisconnect().cancel();
                demand.dRef.child('accepted').off();
                demand.dRef.child('declined').off();
                demand.dRef.set(null);

                // DELETE USERS REQUESTS && CANCEL DISCONNECTION CALLBACKS.
                demand.rRefs.forEach(function(ref){
                    ref.onDisconnect().cancel();
                    ref.set(null);
                });
                
                manager.quit();
                
                events_service.process( hgt_events.request_canceled, demand );
            },

            init: function(is_hangout_tab){
                manager.loaded = FirebaseProvider.get().then(function(firebase){
                    manager.is_hangout_tab = is_hangout_tab;
                    manager.firebase = firebase;
                    manager.user_id = session.id;

                    manager.cleanRef = firebase.child('hangout_requests/'+manager.user_id);
                    // Getting hangout requests & listening to its.
                    manager.cleanRef.on('child_added',function(ds){
                        manager.requestAdded( ds.val() );   
                    });

                    // Listening to canceled OR accepted requests
                    manager.cleanRef.on('child_removed', function(ds){
                        manager.requestRemoved( ds.val() );
                    });
                    
                    manager.hangoutRef = manager.firebase.child('current_hangout/'+manager.user_id);
                    manager.hangoutRef.on('value', function(ds){
                        var previous = manager.current_hangout;
                        manager.current_hangout = ds.val(); 
                        events_service.process(hgt_events.fb_current_hangout_changed, previous, manager.current_hangout);
                        if(previous !== null && manager.current_hangout === null){
                            manager.quit();
                        }
                        
                    });
                    if(manager.is_hangout_tab){
                        manager.hangoutRef.onDisconnect().set(null);
                    }
                  
                    events_service.on(hgt_events.hgt_launched ,this.onHangoutLaunched.bind(this));
                    events_service.on(hgt_events.hgt_left,this.quit.bind(this));
                    events_service.on(events.logout_success, this.quit.bind(this));

                    //delete( manager.initPromise );
                }.bind(this));
            },
            clean: function(){
                // CANCEL CURRENT DEMANDS
                Object.keys( manager.demands ).forEach(function(k){
                    manager.cancelRequest(manager.demands[k]);
                });
                // DECLINE REQUESTS
                Object.keys( manager.requests ).forEach(function(k){
                    manager.requests[k].forEach(function(r){
                        manager.declineRequest(r);
                    });
                });
            },

            requestAdded: function( request ){
                if(!manager.current_hangout || manager.current_hangout !== request.id ){
                    conversations.get({conversation_id: request.id})
                        .then(function( datas ){
                            request.users = datas.users;
                            
                            if(!manager.requests[request.id]){
                                manager.requests[request.id] = [];
                            }
                            
                            manager.requests[request.id].push(request);

                            // PROCESS EVENT.
                            events_service.process( hgt_events.fb_request_received, request );
                        });
                }else{
                    
                    if(manager.current_hangout == request.id ){
                        manager.acceptRequest(request);
                    }
                    else{
                        manager.declineRequest(request);
                    }
                }
            },

            requestRemoved: function( request ){
                if( manager.requests[request.id] ){  
                    delete(manager.requests[request.id]);
                    // PROCESS EVENT.
                    events_service.process( hgt_events.fb_request_removed, request );
                }
            },
            
            hasRequest: function(id){
                return manager.requests[id] && manager.requests[id].length;
            },

            hasDemand: function(id){
                return manager.demands[id] !== null && manager.demands[id] !== undefined;
            },
            observe: function( hangout_id, users ){
                var resolved = false,
                    deferred = $q.defer();
                
                manager.loaded.then(function(){
                    
                    if( !manager.observeds[hangout_id] ){
                        manager.observeds[hangout_id] = [];

                        manager.firebase.child('hangouts/'+hangout_id+'/connecteds').on('value', function(ds){
                            var buffer = [], added = [], removed = []; 
                            ds.forEach(function(dds){
                                var uid = dds.val();
                                if( buffer.indexOf( uid ) === -1 ){
                                    buffer.push( uid );
                                }

                                if( manager.observeds[hangout_id].indexOf( uid ) === -1
                                    && added.indexOf(uid) === -1 ){
                                    added.push(uid);
                                }
                            });

                            manager.observeds[hangout_id].forEach(function( uid ){
                                if( buffer.indexOf(uid) === -1 ){
                                    removed.push( uid );
                                }
                            });

                            manager.observeds[hangout_id] = buffer;

                            if( !resolved ){
                                resolved = true;
                                deferred.resolve( manager.observeds[hangout_id] );
                            }
                            events_service.process( hgt_events.fb_connected_changed, hangout_id, manager.observeds[hangout_id], added, removed );
                            if(manager.is_hangout_tab && removed.indexOf(manager.user_id) !== -1){
                                events_service.process( hgt_events.fb_left, hangout_id );
                            }
                            if(added.indexOf(manager.user_id) === -1){
                                events_service.process( hgt_events.fb_joined, hangout_id );
                            }
                            
                        });
                        
                        var demandRef = manager.firebase.child('hangout_demands/'+manager.user_id+'/'+ hangout_id );
                        demandRef.on('child_added', function(ds){
                            if(!manager.demands[hangout_id] && ds.val() !== null){
                                var requestRef = [];
                                if(users){
                                    users.forEach(function(user_id){
                                        var ref = manager.firebase.child('hangout_requests/'+user_id+'/'+ manager.user_id+'_'+hangout_id);
                                        requestRef.push(ref);
                                    });
                                }
                                else{
                                    users = [];
                                }
                                
                                manager.demands[hangout_id] = 
                                    { id:hangout_id, users: users, dRef: demandRef, rRefs: requestRef, accepted:[], declined:[] };
                      
                            }
                        });
                        demandRef.on('child_removed', function(){
                            delete( manager.demands[hangout_id] );
                        });

                    }else{
                        deferred.resolve();
                    }
                });
                return deferred.promise;
            },
            unobserve: function( hangout_id ){
                delete( manager.observeds[hangout_id] );
                manager.firebase.child('hangouts/'+hangout_id+'/connecteds').off();
                manager.firebase.child('hangout_demands/'+manager.user_id+'/'+ hangout_id ).off();
            },
            onHangoutLaunched : function(e){
                var hangout_id = e.datas[0].conversation_id;
                this.hangoutRef.set(hangout_id);
                this.fb_key = this.firebase.child('hangouts/'+hangout_id+'/connecteds').push(session.id).key;
                this.firebase.child('hangouts/'+hangout_id+'/connecteds/' + this.fb_key).onDisconnect().set( null );
                this.observe(hangout_id);
            },
            quit : function(e){
                manager.fb_key = null;
                manager.hangoutRef.set(null);
                manager.clean();
                events_service.process( hgt_events.fb_left);
            }
        };

        window.ptp =manager;

        return manager;
    }
]);
