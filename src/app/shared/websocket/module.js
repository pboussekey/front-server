angular.module('WEBSOCKET',['EVENTS','SESSION','UTILS'])
    .run(['events_service', 'events', 'websocket', 'session',
        function( events_service, events , websocket, session ){
            
            events_service.on( events.logged, function(){
                websocket.connect();
            });
            
            events_service.on( events.logout_success, function(){
                websocket.disconnect();
            });
            
            if( session.id ){
                websocket.connect();
            }
    }]);
ANGULAR_MODULES.push('WEBSOCKET');