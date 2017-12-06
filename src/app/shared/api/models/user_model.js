
angular.module('API')
    .factory('user_model',['abstract_model_service',function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 60,
            cache_model_prefix: 'user.',
            cache_list_name: 'users.ids',
            
            _method_get: 'user.get'
        });
        
        return service;
    }]);