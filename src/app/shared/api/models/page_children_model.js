
angular.module('API')
    .factory('pchildren_model',['abstract_model_service',function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            cache_size: 60,
            cache_model_prefix: 'pchildren.',
            cache_list_name: 'pchildren.ids',

            _method_get: 'page.getListRelationId',
            
            _buildGetParams: function( ids ){
                return { parent_id : ids };
            }
        });
        
        return service;
    }]);