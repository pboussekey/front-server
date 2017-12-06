
angular.module('API')
    .factory('page_model',['abstract_model_service', function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 60,
            cache_model_prefix: 'pg.',
            cache_list_name: 'pgs.ids',
            
            _method_get: 'page.get',
            _format: function( datum ){
                datum.tags = datum.tags || [];
                return datum;
            }
        });
        
        return service;
    }]);