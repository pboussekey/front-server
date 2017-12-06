
angular.module('API')
    .factory('pparent_model',['abstract_model_service',function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            cache_size: 60,
            cache_model_prefix: 'pparent.',
            cache_list_name: 'pparent.ids',

            _method_get: 'page.getListRelationId',
            
            _buildGetParams: function( ids ){
                return { children_id : ids };
            }
        });
        
        return service;
    }]);