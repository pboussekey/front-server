
angular.module('API')
    .factory('oadmin_model',['abstract_model_service','pages_constants', '$q',
        function(abstract_model_service, pages_constants, $q){

            var service = new abstract_model_service({
                outdated_timeout: 1000*60*60*2,  // 2 hours.

                cache_size: 10,
                cache_model_prefix: 'oadmin.',
                cache_list_name: 'oadmin.ids',
                _method_get: 'pageuser.getListByUser',
                _buildGetParams: function( ids ){
                    return { user_id: ids,
                        type: pages_constants.pageTypes.ORGANIZATION,
                        state : pages_constants.pageStates.MEMBER ,
                        role : pages_constants.pageRoles.ADMIN };
                }
            });

            return service;
        }
    ]);
