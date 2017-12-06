angular.module('WEBSOCKET').factory('websocket',[
    '$q','session','fingerprint',
    function( $q, session,fingerprint ){

        var wsurl = location.protocol+'//'+CONFIG.rt.domain+':'+CONFIG.rt.port;

        var socket,
            io = require('socket.io-client'),
            socketQ = $q.defer(),
            socketPromise = socketQ.promise;



        var service = {
            interval_time: 1000*60,
            get: function(){
                return socketPromise;
            },
            connect: function(){
                if( socket ){
                    socket.connect();
                }else{
                    socket = io.connect( wsurl,{secure:true, /*transports:['websocket']*/});
                    socket.on('authenticated',function(){
                        socket._isAuthenticated = true;
                        socketQ.resolve(socket);
                        service.interval = setInterval(function(){ socket.emit('status'); },service.interval_time);
                    });

                    window.soket = socket;

                    socket.on('connect',function(){
                        socket.emit('authentify',{
                            connection_token: fingerprint( session.id ),
                            authentification: session.wstoken,
                            id : session.id,
                            connected: true
                        });
                    });
                }
            },
            disconnect: function(){
                clearInterval( service.interval );
                if( socket ){
                    socket.disconnect();
                    socket._isAuthenticated = false;
                }
            }
        };
        return service;
    }
]);
