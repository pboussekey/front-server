angular.module('API')
    .factory('api_service',['$http','$q',function($http, $q){
        var id=0;
        var config = {
            method:'POST',
            url: CONFIG.api.url,
            responseType:'json'
        };
        var callbacks = {};

        var service = {
            onError: function( code, callback){
                if( !callbacks[code] )
                    callbacks[code] = [callback];
                else
                    callbacks[code].push(callback);
            },
            emitError: function( code, error ){
                if( callbacks[code] ){
                    callbacks[code].forEach(function(cb){
                        cb(error);
                    });
                }
            },
            configure: function(options){
                angular.merge(config,options);
            },
            send: function( method, datas, timeout ){
                var deferred = $q.defer(), uid = 0+id++;
                $http(angular.extend({data:{jsonrpc:'2.0',method:method,params:datas||{},id:uid},timeout:timeout},config))
                    .then(function(d){
                            if( d.data && d.data.error ){
                                deferred.reject( d.data.error );
                                service.emitError( d.data.error.code, d.data.error);
                            }else{
                                deferred.resolve( d.data.result );
                            }
                        },function(d){
                            deferred.reject({code:0,data:d,message:''});
                        });
                return deferred.promise;
            },
            queue: function( method, datas ){
                var deferred = $q.defer(),
                    request = {jsonrpc:'2.0',method:method,params:datas,id:0+id++};

                if( !service.preparingBatch ){
                    service.batchInQueue = [];
                    service.batchQ = {};
                    service.preparingBatch = true;

                    setTimeout(function(){ service.sendBatch(); }, 25);
                }

                service.batchInQueue.push(request);
                service.batchQ[request.id] = deferred;

                return deferred.promise;
            },
            sendBatch: function( timeout ){
                var batch = service.batchInQueue,
                    deferreds = service.batchQ;

                service.batchInQueue = service.batchQ = undefined;
                service.preparingBatch = false;

                $http(angular.extend({data:batch,timeout:timeout},config))
                    .then(function( result ){
                        if( result.data && Array.isArray(result.data) ){
                            result.data.forEach(function( datum, index ){
                                var id = datum.id || batch[index].id;
                                if( datum.error ){
                                    deferreds[id].reject( datum.error );
                                    service.emitError( datum.error.code, datum.error);
                                }else{
                                    deferreds[id].resolve( datum.result );
                                }
                            });
                        }else{
                            rejectAll( result );
                        }
                    },rejectAll);

                function rejectAll( data ){
                    Object.keys(deferreds).forEach(function(k){
                        deferreds[k].reject({data:data});
                    });
                }
            }
        };
        return service;
    }]);
