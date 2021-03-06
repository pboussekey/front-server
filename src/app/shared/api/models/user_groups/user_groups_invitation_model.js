
angular.module('API')
    .factory('ugi_model',['abstract_model_service','pages_constants',
        function(abstract_model_service,pages_constants){        
        
            var service = new abstract_model_service({
                outdated_timeout: 1000*60*60*2,  // 2 hours.

                cache_size: 10,
                cache_model_prefix: 'ugi.',
                cache_list_name: 'ugi.ids',
                _method_get: 'pageuser.getListByUser',
                _buildGetParams: function( ids ){
                    return { user_id: ids, type: pages_constants.pageTypes.GROUP, state : pages_constants.pageStates.INVITED };
                }
            });

            return service;
        }
    ]);