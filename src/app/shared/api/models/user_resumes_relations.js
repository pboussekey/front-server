
angular.module('API')
    .factory('user_resumes_model',['abstract_model_service',function(abstract_model_service){
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*48,  // 2 days.
            
            cache_size: 60,
            cache_model_prefix: 'user.resume.',
            cache_list_name: 'user.resume.cached',
            
            _method_get: 'resume.getListId',
            _buildGetParams: function( ids ){
                return { user_id: ids };
            }  
        });
        
        return service;
    }]);