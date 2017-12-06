angular.module('API')
    .factory('course_assignments_model',['abstract_model_service',function(abstract_model_service ){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 40,
            cache_model_prefix: 'c.itma.',
            cache_list_name: 'c.itma.ids',
            
            _method_get: 'item.getListAssignmentId',
            
            _buildGetParams: function( ids ){
                return { page_id: ids };
            }
        });
        
        
        return service;
    }]);