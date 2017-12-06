angular.module('API')
    .factory('orggrades_model',['abstract_model_service', function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 60,
            cache_model_prefix: 'orggrades.',
            cache_list_name: 'orggrades',
            
            _method_get: 'page.getGrades',
            
            _buildGetParams: function( ids ){
                return { id : ids };
            }
        });
        
        return service;
    }]);