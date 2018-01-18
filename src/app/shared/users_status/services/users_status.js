
angular.module('USERS_STATUS')
    .factory('users_status',['websocket','events_service','connections','statuses',function( websocket, events_service, connections, statuses ){

        var globalEvents = {};
        globalEvents[statuses.connected] = 'usersOnline';
        globalEvents[statuses.disconnected] = 'usersOffline';

        var service = {
            interval_time: 1000*60,
            ownstatus: statuses.connected,
            status:{},
            identifiers:{},
            // Start service, listen to websocket server events to update users status.
            run: function(){
                websocket.get().then(function(socket){
                    // When websocket's connection go down -> set users status to unknow.
                    socket.on('disconnect', function(){
                        Object.keys(service.status).forEach(function(id){
                            service.status[id].state = statuses.unknow;
                            events_service.process('userStatus#'+id, statuses.unknow );
                        });
                        clearInterval( service.interval );
                    });
                    // When user(s) status changed.
                    socket.on('user_status_change', service.onStatusChange );
                    // When user reconnect.
                    socket.on('authenticated', function(){
                        socket.emit('watch_user_status',{ users: Object.keys(service.status) });
                        service.setInterval( socket );
                    });
                    // Refresh your own status at regular interval.
                    service.setInterval( socket );
                });
            },
            setInterval: function( socket ){
                service.interval = setInterval(function(){
                    socket.emit('status', service.ownstatus );
                }, service.interval_time);
            },
            onStatusChange: function( data ){
                console.log('ON STATUS', data );

                var keys = Object.keys(statuses);

                Object.keys(data).forEach(function(status_key){
                    if( keys.indexOf(status_key) !==-1 ){
                        var users = [];
                        data[status_key].forEach(function(user_id){
                            if( service.status[user_id] ){
                                users.push( parseInt(user_id) );
                                service.status[user_id].state = statuses[status_key];
                                // Send user changed state event.
                                events_service.process('userStatus#'+user_id, statuses[status_key] );
                            }
                        });
                        // Send global status event.
                        events_service.process( globalEvents[statuses[status_key]], users );
                    }
                });
            },
            watch: function( user_ids, listenerIdentifier ){                
                var identifier = listenerIdentifier || Symbol(Date.now()),
                    towatch = [];

                console.log('WATCH', user_ids, identifier );

                if( !service.identifiers[identifier] ){
                    service.identifiers[identifier] = [];
                }

                user_ids.forEach(function(id){
                    if( !service.status[id] ){
                        service.status[id] = {ids:[identifier],state:statuses.unknow};
                        towatch.push( id );
                    }else if( service.status[id].ids.indexOf(identifier) === -1 ){
                        service.status[id].ids.push( identifier );
                    }

                    if( service.identifiers[identifier].indexOf(parseInt(id)) === -1 ){
                        service.identifiers[identifier].push(parseInt(id));
                    }
                });

                websocket.get().then(function(socket){
                    socket.emit('watch_user_status', { users: towatch });
                });

                return identifier;
            },
            unwatch: function( identifier ){
                console.log('UNWATCH', identifier );

                if( identifier && service.identifiers[identifier] ){
                    var users = service.identifiers[identifier];

                    console.log('users', users );
                    // Remove identifier from user listeners & delete user if there is no listeners left.
                    users.forEach(function(id){
                        service.status[id].ids.splice( service.status[id].ids.indexOf(identifier), 1 );
                        if( !service.status[id].ids.length ){
                            delete( service.status[id] );
                        }
                    });
                    // Delete identifier user list.
                    delete( service.identifiers[identifier] );
                    // Notify realtime server to stop watching these users.
                    websocket.get().then(function(socket){
                        socket.emit('unwatch_user_status', { users: users });
                    });
                }
            },
            clear: function(){
                service.identifiers = {};
                Object.keys(service.status).forEach(function(id){
                    delete(service.status[id]);
                });
            }
        };

        /*
        var service = {
            status:{},
            init: function(){
                events_service.on('connectionState', function( d ){

                    var noMoreConnected = [],
                        newConnections = [];

                    Object.keys( service.status ).forEach(function( id ){
                        if( connections.connecteds.indexOf(parseInt(id)) === -1 ){
                            noMoreConnected.push(id);
                        }
                    });

                    connections.connecteds.forEach(function(id){
                        if( service.status[id] === undefined ){
                            newConnections.push(id);
                        }
                    });

                    if( newConnections.length ){
                        service.set( newConnections );
                    }
                    if( noMoreConnected.length ){
                        service.unset( noMoreConnected );
                    }
                });

                websocket.get().then(function(socket){
                    service.socket = socket;

                    socket.on('user.connected',service.onConnected);
                    socket.on('user.disconnected',service.onDisconnected);

                    // WHEN SERVER OR USER LOST WSCONNECTION
                    socket.on('disconnect', function(){
                        Object.keys(service.status).forEach(function(id){
                            service.status[id] = statuses.unknow;
                            events_service.process('userStatus#'+id, statuses.unknow );
                        });
                    });

                    // WHEN SERVER OR USER RECONNECT.
                    socket.on('authenticated', function(){
                        // LISTEN TO CONTACTS
                        socket.emit('setContacts', { contacts: Object.keys(service.status) });
                    });

                    if( socket._isAuthenticated ){
                        socket.emit('setContacts', { contacts: Object.keys(service.status) });
                    }
                });
            },
            onConnected: function( data ){
                var reallyConnecteds = [];

                data.forEach(function( _id ){
                    var id = parseInt( _id );
                    if( connections.connecteds.indexOf( id ) !== -1 ){
                        reallyConnecteds.push(id);
                        service.status[id] = statuses.connected;
                        events_service.process('userStatus#'+id, statuses.connected );
                    }
                });

                if( reallyConnecteds.length ){
                    events_service.process('usersOnline', reallyConnecteds);
                }
            },
            onDisconnected: function( data ){
                data.forEach(function( _id ){
                    var id = parseInt( _id );
                    service.status[id] = statuses.disconnected;
                    events_service.process('userStatus#'+id, statuses.disconnected );
                });

                if( data.length ){
                    events_service.process('usersOffline', data);
                }
            },
            set: function( users ){
                websocket.get().then(function(socket){
                    // ADDING USERS TO STATUS
                    users.forEach(function(id){
                        service.status[id] = statuses.unknow;
                    });
                    // LISTEN TO NEW CONTACTS
                    socket.emit('setContacts', { contacts: users });
                });
            },
            unset: function( users ){
                websocket.get().then(function(socket){
                    // REMOVING USERS FROM STATUS
                    users.forEach(function(id){
                        delete(service.status[id]);
                    });
                    // STOP LISTENING TO REMOVED CONTACTS
                    socket.emit('removeContacts', { contacts: users });
                });
            },
            clear:function(){
                //if( service.socket ){
                //    console.log('CLEAR LISTENING ?!');
                //    service.socket.off('user.connected', service.onConnected );
                //    service.socket.off('user.disconnected', service.onDisconnected );
                //}

                Object.keys(service.status).forEach(function(id){
                    delete(service.status[id]);
                });
            }
        };*/

        window.userStatus = service;

        return service;
    }]);
