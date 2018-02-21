angular.module('app_layout')
    .factory('state_service',[
        function( ){

            var service = { 
                parent_state : ""
            };
            return service;
        }
    ]);
