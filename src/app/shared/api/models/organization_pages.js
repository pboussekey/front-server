angular.module('API')
    .factory('orgpages_model',['abstract_model_service', function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 60,
            cache_model_prefix: 'orgpages.',
            cache_list_name: 'orgpages.ids',
            
            _method_get: 'page.m_getListByOrganization',
            
            _buildGetParams: function( ids ){
                return { organization_id : ids };
            }
        });
        
        return service;
    }]);