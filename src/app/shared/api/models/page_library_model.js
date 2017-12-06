
angular.module('API')
    .factory('plibrary_model',['abstract_model_service',function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            cache_size: 60,
            cache_model_prefix: 'plibrary.',
            cache_list_name: 'plibrary.ids',

            _method_get: 'library.m_getListByPage',
            _buildGetParams: function( ids ){
                return { page_id: ids };
            }  
        });
        
        return service;
    }]);