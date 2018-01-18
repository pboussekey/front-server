
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
            unwatch: function( identifier, users ){
                if( identifier && service.identifiers[identifier] ){
                    var usersList = users || service.identifiers[identifier],
                        toUnwatch = [];

                    // Remove identifier from user listeners & delete user if there is no listeners left.
                    usersList.forEach(function(id){
                        if( service.status[id] ){
                            service.status[id].ids.splice( service.status[id].ids.indexOf(identifier), 1 );
                            if( !service.status[id].ids.length ){
                                delete( service.status[id] );
                                toUnwatch.push( id );
                            }
                        }
                    });
                    // Delete identifier if we remove all identifier watched users.
                    if( !users ){                        
                        delete( service.identifiers[identifier] );
                    }
                    // Notify realtime server to stop watching these users.
                    websocket.get().then(function(socket){
                        socket.emit('unwatch_user_status', { users: toUnwatch });
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

        return service;
    }]);
