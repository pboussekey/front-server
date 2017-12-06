
angular.module('API')
    .factory('service_garbage',[
        function(){
            
            var service = {
                list: [],
                declare: function( clearFn ){
                    this.list.push( clearFn );
                },
                clear: function(){
                    service.list.forEach(function( fn ){
                        fn();
                    });
                }                
            };
            
            return service;
        }
    ]);