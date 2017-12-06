angular.module('TRACKER',['ui.router','API','SESSION','EVENTS','STORAGE'])
    .factory('tracker_service',['api_service',
        function( api_service ){
        
            var service = {                
                register: function( activities ){
                    return api_service.send('activity.add',{ activities: activities });
                }                
            };
            
            return service;
        }
    ])
    .run(['$rootScope','tracker_service','$state','events_service','events','session','storage',
        function($rootScope,tracker_service, $state, events_service, events, session, storage ){
            
            $rootScope.$on('$stateChangeSuccess', function() {  
                if( session.id ){
                    tracker_service.register([{
                        event:'navigation',
                        date:(new Date()).toISOString(),
                        object:{name:$state.current.name,data:$state.params}
                    }]);
                }
            });
            
            events_service.on( events.logged, function(){
                logged();
            });
            
            events_service.on( events.logout_call, function(){
                tracker_service.register([{
                    event:'logout',
                    date:(new Date()).toISOString()
                }]);
            });
            
            if( session.id ){
                if( storage.getItem('redirect') ){
                    storage.removeItem('redirect');
                }else{
                    logged();
                }
            }
            
            function logged(){
                tracker_service.register([{
                    event:'logged',
                    date:(new Date()).toISOString()
                }]);
            }
        }
    ]);

ANGULAR_MODULES.push('TRACKER');

