angular.module('app_layout')
    .factory('global_loader',['$timeout',
        function($timeout){
            function removeTimeout(key){
                if(service.timeouts[key]){
                    $timeout.cancel(service.timeouts[key]);
                    delete(service.timeouts[key]);
                    service.is_loading--;
                }
            }
            var service = {
                is_processing : 0,
                is_loading : 0,
                timeouts : {},
                reset : function(){
                    if(Object.keys(service.timeouts).length){
                        Object.keys(service.timeouts).forEach(service.done);
                    }
                },
                loading : function(key, delay){
                      service.is_loading++;
                      console.log("LOADING", key, service.is_processing);
                      if(service.timeouts[key]){
                          removeTimeout(key);
                      }
                      var timeout = $timeout(function(){
                           service.is_processing++;
                        } ,
                        delay === null ? 2000 : delay
                     );
                     service.timeouts[key] = timeout;
                },
                done : function(key, delay){
                    $timeout(function(){
                       if(service.timeouts[key]){
                         service.is_processing--;
                         console.log("DONE", key, service.is_processing);
                         removeTimeout(key);
                       }
                    } , delay || 0 );
                }
            };
            return service;
        }
    ]);
