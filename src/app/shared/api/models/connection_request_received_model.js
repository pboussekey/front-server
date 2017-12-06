
angular.module('API')
    .factory('crr_model',['abstract_model_service',function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 60,
            cache_model_prefix: 'connection.req_received.',
            cache_list_name: 'connection.rr.ids',            
            _method_get: 'contact.getListRequestId',
            _buildGetParams: function( ids ){
                return { user_id : ids };
            }
        });
        
        window.crr_model = service;
        
        return service;
    }]);