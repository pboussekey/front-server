
angular.module('API')
    .factory('cvn_model',['abstract_model_service','$q','api_service',
        function(abstract_model_service, $q, api_service){

            var service = new abstract_model_service({
                outdated_timeout: 1000*60*5,  // 5 mn.

                cache_size: 60,
                cache_model_prefix: 'c.',
                cache_list_name: 'c.ids',

                _method_get: 'conversation.get',
                create: function( users ){
                    return api_service.queue('conversation.create',{users:users})
                        .then(function( id ){
                            return service.get([id]).then(function(){ return id; });
                        });
                },
                getByUsers: function( users ){
                    return api_service.queue('conversation.getIdByUser',{user_id:users})
                        .then(function( id ){
                            if( id ){
                                return service.get([id]).then(function(){ return id; });
                            }else
                                return false;
                        });
                }
            });

            return service;
        }
    ]);
