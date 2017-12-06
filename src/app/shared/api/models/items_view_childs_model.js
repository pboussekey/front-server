
angular.module('API')
    .factory('items_view_childs_model',['abstract_model_service',function(abstract_model_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 40,
            cache_model_prefix: 'itm.vc.',
            cache_list_name: 'itm.vc.ids',
            
            _method_get: 'item.getListId',
            
            _buildGetParams: function( ids ){
                return { 
                    parent_id: ids,
                    is_publish: true
                };
            }
        });
        
        return service;
    }]);