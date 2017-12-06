angular.module('app_social',['ui.router','API','EVENTS','filters','UPLOAD'])
     .run(['events_service', 'events', 'social_service',
        function( events_service, events , social_service ){
            
            events_service.on( events.logout_success, function(){
                social_service.clear();
            });
            
    }]);
    
ANGULAR_MODULES.push('app_social');
