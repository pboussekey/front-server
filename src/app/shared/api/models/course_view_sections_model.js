
angular.module('API')
    .factory('course_view_sections_model',['abstract_model_service',function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 40,
            cache_model_prefix: 'c.vitms.',
            cache_list_name: 'c.vitms.ids',
            
            _method_get: 'item.getListId',
            
            _buildGetParams: function( ids ){
                return { 
                    page_id: ids,
                    is_publish: true
                };
            }
        });
        
        return service;
    }]);