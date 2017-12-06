
angular.module('API')
    .factory('ucm_model',['abstract_model_service','pages_constants',
        function(abstract_model_service, pages_constants){        
        
            var service = new abstract_model_service({
                outdated_timeout: 1000*60*60*2,  // 2 hours.

                cache_size: 10,
                cache_model_prefix: 'uc.',
                cache_list_name: 'uc.ids',
                _method_get: 'pageuser.getListByUser',
                _buildGetParams: function( ids ){
                    return { user_id: ids, type: pages_constants.pageTypes.COURSE, state : pages_constants.pageStates.MEMBER };
                }
            });

            return service;
        }
    ]);