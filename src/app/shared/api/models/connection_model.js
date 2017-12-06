
angular.module('API')
    .factory('connection_model',['abstract_model_service',function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 60,
            cache_model_prefix: 'user.cnct.',
            cache_list_name: 'users.cnct.ids',
            
            _method_get: 'contact.getListId',
            _buildGetParams: function( ids ){
                return { user_id : ids };
            }
        });
        
        window.connection_model = service;
        
        return service;
    }]);