angular.module('API').factory('connections',
    ['api_service','session','connection_model','crr_model','crs_model','events_service','$q','service_garbage', 'events',
        function( api, session, connection_model, crr_model, crs_model, events_service, $q, service_garbage, events){

            var service = {
                loadPromise: undefined,
                connecteds: [],
                awaitings: [],
                requesteds: [],

                states: {
                    notdefined: 0,
                    connected: 1,
                    awaiting: 2,
                    unconnected: 3,
                    requested: 4
                },

                clear: function(){
                    service.connecteds.splice(0,service.connecteds.length);
                    service.awaitings.splice(0,service.awaitings.length);
                    service.requesteds.splice(0,service.requesteds.length);
                    service.loadPromise = undefined;
                },

                diff: function( oldc, olda, oldr ){
                    var buffer = {};

                    this.connecteds.forEach(function( id ){
                        if( oldc[id] !== null ){
                            buffer[id] = null;
                        }else{
                            delete( oldc[id] );
                        }
                    });

                    this.awaitings.forEach(function( id ){
                        if( olda[id] !== null ){
                            buffer[id] = null;
                        }else{
                            delete( olda[id] );
                        }
                    });

                    this.requesteds.forEach(function( id ){
                        if( oldr[id] !== null ){
                            buffer[id] = null;
                        }else{
                            delete( oldr[id] );
                        }
                    });

                    for( var k in oldc ){
                        buffer[k] = null;
                    }

                    for( var k in oldr ){
                        buffer[k] = null;
                    }

                    for( var k in olda ){
                        buffer[k] = null;
                    }

                    return Object.keys(buffer);
                },
                load: function( force ){

                    if( this.loadPromise ){
                        return this.loadPromise;
                    }else{
                        var deferred = $q.defer(),
                            step = 3,

                            oldc = this.connecteds.reduce(function(o, id){ o[id]=null; return o; },{}),
                            oldr = this.requesteds.reduce(function(o, id){ o[id]=null; return o; },{}),
                            olda = this.awaitings.reduce(function(o, id){ o[id]=null; return o; },{}),

                            onload = function(){
                                step--;
                                if( !step ){
                                    var diff  = this.diff( oldc, olda, oldr );

                                    diff.forEach(function(id){
                                        events_service.process('connectionState#'+id);
                                    });

                                    events_service.process('connectionState',diff);

                                    this.loadPromise = undefined;
                                    deferred.resolve();
                                }
                            }.bind(this);

                        if( session.id ){
                            this.loadPromise = deferred.promise;

                            connection_model.get([session.id], force).then(function(){
                                this.connecteds.splice(0, this.connecteds.length );
                                Array.prototype.push.apply( this.connecteds, connection_model.list[session.id].datum );
                                onload();
                            }.bind(this));

                            crs_model.get([session.id], force).then(function(){
                                this.requesteds.splice(0, this.requesteds.length );
                                Array.prototype.push.apply( this.requesteds, crs_model.list[session.id].datum );
                                onload();
                            }.bind(this));

                            crr_model.get([session.id], force).then(function(){
                                this.awaitings.splice(0, this.awaitings.length );
                                Array.prototype.push.apply( this.awaitings, crr_model.list[session.id].datum );
                                onload();
                            }.bind(this));
                        }else{
                            deferred.resolve();
                        }

                        return deferred.promise;
                    }
                },
                search: function(){
                    // TODO
                },
                request: function( _id ){
                    var id = parseInt( _id );
                    return api.queue('contact.add',{user:id}).then(function(d){
                        if( d ){
                            // ADD USER IN REQUESTEDS
                            if( crs_model.list[session.id] ){
                                var idx = crs_model.list[session.id].datum.indexOf( id );
                                if( idx === -1 ){
                                    crs_model.list[session.id].datum.push( id );
                                    crs_model._updateModelCache( session.id );
                                }
                            }
                            var cdx = this.requesteds.indexOf( id );
                            if( cdx === -1 ){
                                this.requesteds.push( id );
                            }

                            events_service.process('connectionState#'+id);
                            events_service.process('connectionState',[id]);
                        }
                    }.bind(this),function(err){

                    });
                },
                accept: function( _id ){
                    var id = parseInt( _id );
                    return api.queue('contact.accept',{user:id}).then(function(d){
                        if( d ){
                            // REMOVE USER FROM AWAITINGS CONNECTIONS
                            if( crr_model.list[session.id] ){
                                var idx = crr_model.list[session.id].datum.indexOf( id );
                                if( idx !== -1 ){
                                    crr_model.list[session.id].datum.splice( idx, 1 );
                                    crr_model._updateModelCache( session.id );
                                }
                            }
                            var adx = this.awaitings.indexOf( id );
                            if( adx !== -1 ){
                                this.awaitings.splice( adx, 1);
                            }

                            // ADD USER IN CONNECTEDS
                            if( connection_model.list[session.id] ){
                                var idx = connection_model.list[session.id].datum.indexOf( id );
                                if( idx === -1 ){
                                    connection_model.list[session.id].datum.push( id );
                                    connection_model._updateModelCache( session.id );
                                }
                            }
                            var cdx = this.connecteds.indexOf( id );
                            if( cdx === -1 ){
                                this.connecteds.push( id );
                            }

                            events_service.process('connectionState#'+id);
                            events_service.process('connectionState',[id]);
                        }
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS  ( CRITICAL => IF AN REQUEST IS CANCELED & USER TRY TO ACCEPT IT ).
                    }.bind(this));
                },
                decline: function( _id ){
                    var id = parseInt( _id );
                    return api.queue('contact.remove',{user:id}).then(function(d){
                        // REMOVE USER FROM AWAITINGS CONNECTIONS
                        if( crr_model.list[session.id] ){
                            var idx = crr_model.list[session.id].datum.indexOf( id );
                            if( idx !== -1 ){
                                crr_model.list[session.id].datum.splice( idx, 1 );
                                crr_model._updateModelCache( session.id );
                            }
                        }
                        var adx = this.awaitings.indexOf( id );
                        if( adx !== -1 ){
                            this.awaitings.splice( adx, 1);
                        }

                        events_service.process('connectionState#'+id);
                        events_service.process('connectionState',[id]);
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS
                    }.bind(this));
                },
                remove: function( _id ){
                    var id = parseInt( _id );
                    return api.queue('contact.remove',{user:id}).then(function(d){
                        // IF USER REMOVED WAS IN CONNECTEDS
                        if( connection_model.list[session.id] ){
                            var idx = connection_model.list[session.id].datum.indexOf( id );
                            if( idx !== -1 ){
                                connection_model.list[session.id].datum.splice( idx, 1 );
                                connection_model._updateModelCache( session.id );
                            }
                        }
                        var cdx = this.connecteds.indexOf( id );
                        if( cdx !== -1 ){
                            this.connecteds.splice( cdx, 1);
                        }
                        // IF USER REMOVED WAS IN REQUESTEDS
                        if( crs_model.list[session.id] ){
                            var idx = crs_model.list[session.id].datum.indexOf( id );
                            if( idx !== -1 ){
                                crs_model.list[session.id].datum.splice( idx, 1 );
                                crs_model._updateModelCache( session.id );
                            }
                        }
                        var rdx = this.requesteds.indexOf( id );
                        if( rdx !== -1 ){
                            this.requesteds.splice( rdx, 1);
                        }

                        events_service.process('connectionState#'+id);
                        events_service.process('connectionState',[id]);
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS
                    }.bind(this));
                },
                getUserState: function( _user_id ){
                    var a, b ,c, user_id = parseInt( _user_id );

                    if( session.id ){
                        if( session.id === user_id ){
                            return this.states.notdefined;
                        }

                        a = connection_model.list[session.id] &&
                            connection_model.list[session.id].datum;

                        if( a && connection_model.list[session.id].datum.indexOf(user_id) !== -1 ){
                            return this.states.connected;
                        }

                        b = crs_model.list[session.id] &&
                            crs_model.list[session.id].datum;

                        if( b && crs_model.list[session.id].datum.indexOf(user_id) !== -1 ){
                            return this.states.requested;
                        }

                        c =  crr_model.list[session.id] &&
                            crr_model.list[session.id].datum;

                        if( c && crr_model.list[session.id].datum.indexOf(user_id) !== -1 ){
                            return this.states.awaiting;
                        }

                        return a&&b&&c?this.states.unconnected:this.states.notdefined;
                    }
                    return this.states.notdefined;
                }
            };
            events_service.on(events.connection_requested, function(){
                service.load(true);
            });
            events_service.on(events.connection_accepted, function(){
                service.load(true);
            });
            events_service.on(events.connection_removed, function(){
                service.load(true);
            });

            service_garbage.declare(function(){
                service.clear();
            });

            window.connections = service;

            return service;
        }
    ]
);
