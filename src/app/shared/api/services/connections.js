angular.module('API').factory('connections',
    ['api_service','session','connection_model','followers_model','followings_model','events_service','$q','service_garbage', 'events',
        function( api, session, connection_model, followers_model, followings_model, events_service, $q, service_garbage, events){

            var service = {
                loadPromise: undefined,
                connecteds: [],
                followers: [],
                followings: [],

                states: {
                    notdefined: -1,
                    unconnected: 0,
                    following: 1,
                    follower : 2,
                    connected: 3
                },

                clear: function(){
                    service.connecteds.splice(0,service.connecteds.length);
                    service.followers.splice(0,service.followers.length);
                    service.followings.splice(0,service.followings.length);
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

                    this.followers.forEach(function( id ){
                        if( olda[id] !== null ){
                            buffer[id] = null;
                        }else{
                            delete( olda[id] );
                        }
                    });

                    this.followings.forEach(function( id ){
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
                            oldr = this.followings.reduce(function(o, id){ o[id]=null; return o; },{}),
                            olda = this.followers.reduce(function(o, id){ o[id]=null; return o; },{}),

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

                            followings_model.get([session.id], force).then(function(){
                                this.followings.splice(0, this.followings.length );
                                Array.prototype.push.apply( this.followings, followings_model.list[session.id].datum );
                                onload();
                            }.bind(this));

                            followers_model.get([session.id], force).then(function(){
                                this.followers.splice(0, this.followers.length );
                                Array.prototype.push.apply( this.followers, followers_model.list[session.id].datum );
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
                follow: function( _id ){
                    var id = parseInt( _id );
                    return api.queue('contact.follow',{user:id}).then(function(d){
                        if( d ){
                            // ADD USER IN followings
                            if( followings_model.list[session.id] ){
                                var idx = followings_model.list[session.id].datum.indexOf( id );
                                if( idx === -1 ){
                                    followings_model.list[session.id].datum.push( id );
                                    followings_model._updateModelCache( session.id );
                                }
                            }
                            var fdx = this.followings.indexOf( id );
                            if( fdx === -1 ){
                                this.followings.push( id );
                            }
                            if(connection_model.list[session.id] && followers_model.list[session.id].datum.indexOf( id ) >= 0){
                                var idx = connection_model.list[session.id].datum.indexOf( id );
                                if( idx === -1 ){
                                    connection_model.list[session.id].datum.push( id );
                                    connection_model._updateModelCache( session.id );
                                }
                            }
                            var fdx = this.followers.indexOf( id );
                            var cdx = this.connecteds.indexOf( id );
                            if( fdx >= 0 &&  cdx === -1){
                                this.connecteds.push( id );
                            }

                            events_service.process('connectionState#'+id);
                            events_service.process('connectionState',[id]);
                        }
                    }.bind(this),function(err){

                    });
                },
                unfollow: function( _id ){
                    var id = parseInt( _id );
                    return api.queue('contact.unfollow',{user:id}).then(function(d){
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
                        // IF USER REMOVED WAS IN followings
                        if( followings_model.list[session.id] ){
                            var idx = followings_model.list[session.id].datum.indexOf( id );
                            if( idx !== -1 ){
                                followings_model.list[session.id].datum.splice( idx, 1 );
                                followings_model._updateModelCache( session.id );
                            }
                        }
                        var rdx = this.followings.indexOf( id );
                        if( rdx !== -1 ){
                            this.followings.splice( rdx, 1);
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

                        b = followings_model.list[session.id] &&
                            followings_model.list[session.id].datum;

                        if( b && followings_model.list[session.id].datum.indexOf(user_id) !== -1 ){
                            return this.states.follwoing;
                        }

                        c =  followers_model.list[session.id] &&
                            followers_model.list[session.id].datum;

                        if( c && followers_model.list[session.id].datum.indexOf(user_id) !== -1 ){
                            return this.states.follower;
                        }

                        return a&&b&&c?this.states.unconnected:this.states.notdefined;
                    }
                    console.log("FOLLOWERS", followers_model.list[session.id].datum);
                    return this.states.notdefined;
                }
            };
            events_service.on(events.contact_following, function(){
                service.load(true);
            });
            events_service.on(events.contact_follower, function(){
                service.load(true);
            });
            events_service.on(events.contact_unfollow, function(){
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
