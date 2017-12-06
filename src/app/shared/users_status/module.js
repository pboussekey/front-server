angular.module('USERS_STATUS',['EVENTS','WEBSOCKET','SESSION','API'])
    .run(['events_service','events','users_status','session',
        function( events_service, events, users_status, session ){
            
            users_status.init();
            
            /*events_service.on( events.logged, function(){
                
            });
            
            if( session.id ){
                users_status.init();
            }*/

            events_service.on( events.logout_success, function(){
                users_status.clear();
            });
        }]);
ANGULAR_MODULES.push('USERS_STATUS');