
angular.module('USERS_STATUS')
    .factory('users_status',['websocket','events_service','connections','statuses',function( websocket, events_service, connections, statuses ){
        
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
                /*if( service.socket ){
                    console.log('CLEAR LISTENING ?!');
                    service.socket.off('user.connected', service.onConnected );
                    service.socket.off('user.disconnected', service.onDisconnected );
                }*/               
                
                Object.keys(service.status).forEach(function(id){
                    delete(service.status[id]);
                });
            }
        };
        
        window.userStatus = service;
                    
        return service;      
    }]);