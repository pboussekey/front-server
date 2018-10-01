angular.module('app_layout')
    .factory('state_service',['$timeout',
        function($timeout){

            var service = {
                current_state : "",
                parent_state : "",
                setTitle : function(title, temporary){
                    if(!temporary){
                        service.title = title;
                    }
                    document.title = title;
                }
            };
            return service;
        }
    ]);
