
angular.module('API')
    .factory('puunsent_model',['abstract_model_service', 'pages_constants',function(abstract_model_service, pages_constants){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 60,
            cache_model_prefix: 'pgunsent.',
            cache_list_name: 'pgunsent.ids',
            
            _method_get: 'pageuser.getListByPage',
            
            _buildGetParams: function( ids ){
                return { page_id: ids, sent : 0, state : pages_constants.pageStates.INVITED, order : { type : 'created_date'} };
            }
        });
        
        return service;
    }]);