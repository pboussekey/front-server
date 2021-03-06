angular.module('app_layout')
    .factory('global_loader',['$timeout',
        function($timeout){
            var MAX_TIMEOUT = 10000;
            function removeTimeout(key){
                if(service.timeouts[key]){
                    $timeout.cancel(service.timeouts[key]);
                    if(service.timeouts[key].$$state.status === 1){
                       service.is_processing--;
                    }
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
                globals : [],
                reset : function(){
                    if(Object.keys(service.timeouts).length){
                        Object.keys(service.timeouts).forEach(service.done);
                    }
                },
                loading : function(keys, delay, global){
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
                          delay =  delay >= 0  ? delay : 500
                        );
                        if(global){
                            service.globals.push(key);
                            document.querySelector("#body").classList.add('hidden');
                        }
                        service.timeouts[key] = timeout;
                        service.done(key, MAX_TIMEOUT);
                      });
                },
                done : function(key, delay){
                    $timeout(function(){
                         service.globals = service.globals.filter(function(g){ return g !== key });
                         if(!service.globals.length){
                            document.querySelector("#body").classList.remove('hidden');
                         }
                         removeTimeout(key);
                    } , delay >= 0  ? delay : 200  );
                }
            };
            return service;
        }
    ]);
