angular.module('API')
    .factory('orginstructors_model',['abstract_model_service', function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 60,
            cache_model_prefix: 'orginstructors.',
            cache_list_name: 'orginstructors.ids',
            
            _method_get: 'user.m_getListByOrganization',
            
            _buildGetParams: function( ids ){
                return { organization_id : ids, type : 'instructor' };
            }
        });
        
        return service;
    }]);