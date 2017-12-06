angular.module('API')
    .factory('orgstudents_model',['abstract_model_service', function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 60,
            cache_model_prefix: 'orgstudents.',
            cache_list_name: 'orgstudents.ids',
            
            _method_get: 'user.m_getListByOrganization',
            
            _buildGetParams: function( ids ){
                return { organization_id : ids, type : 'student' };
            }
        });
        
        return service;
    }]);