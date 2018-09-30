angular.module('app_layout')
    .factory('state_service',[
        function( ){

            var service = {
                current_state : "",
                parent_state : "",
                setTitle : function(title){
                    service.title = title;
                    document.title = service.title;
                }
            };
            return service;
        }
    ]);
