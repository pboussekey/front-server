
angular.module('API')
    .factory('pual_model',['abstract_model_service', 'pages_constants',function(abstract_model_service, pages_constants){

        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.

            cache_size: 60,
            cache_model_prefix: 'pgual.',
            cache_list_name: 'pgual.ids',

            _method_get: 'pageuser.getListByPage',

            _buildGetParams: function( ids ){
                return { page_id: ids, state : pages_constants.pageStates.MEMBER, role : pages_constants.pageRoles.USER, order : { type : 'name'}, alumni : true };
            }
        });

        return service;
    }]);
