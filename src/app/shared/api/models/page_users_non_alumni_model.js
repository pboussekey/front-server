
angular.module('API')
    .factory('punal_model',['abstract_model_service', 'pages_constants',function(abstract_model_service, pages_constants){

        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.

            cache_size: 60,
            cache_model_prefix: 'pgunal.',
            cache_list_name: 'pgunal.ids',

            _method_get: 'pageuser.getListByPage',

            _buildGetParams: function( ids ){
                return { page_id: ids, state : pages_constants.pageStates.MEMBER, role : pages_constants.pageRoles.USER, order : { type : 'name'}, alumni : false };
            }
        });

        return service;
    }]);
