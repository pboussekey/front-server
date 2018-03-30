angular.module('app_layout')
    .factory('state_service',[
        function( ){

            var service = { 
                current_state : "",
                parent_state : ""
            };
            return service;
        }
    ]);
