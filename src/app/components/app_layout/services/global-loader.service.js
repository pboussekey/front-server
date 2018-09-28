angular.module('app_layout')
    .factory('global_loader',['$timeout',
        function($timeout){
            function removeTimeout(key){
                if(service.timeouts[key]){
                    $timeout.cancel(service.timeouts[key]);
                    delete(service.timeouts[key]);
                    service.is_loading--;
                    return true;
                }
                return false;
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
                loading : function(keys, delay){
                      service.is_loading++;
                      if(!Array.isArray(keys)){
                          keys = [keys];
                      }
                      keys.forEach(function(key){

                        if(service.timeouts[key]){
                            removeTimeout(key);
                        }
                        var timeout = $timeout(function(){
                             service.is_processing++;
                          } ,
                          delay === undefined ? 1000 : delay
                        );
                        service.timeouts[key] = timeout;
                      });
                },
                done : function(key, delay){
                    $timeout(function(){
                       if(service.timeouts[key]){
                         if(service.timeouts[key].$$state.status === 1){
                            service.is_processing--;
                         }
                         removeTimeout(key);
                       }
                    } , delay || 200 );
                }
            };
            return service;
        }
    ]);
