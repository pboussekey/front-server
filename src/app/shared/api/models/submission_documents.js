
angular.module('API')
    .factory('submission_docs_model',['abstract_model_service','api_service', function(abstract_model_service, api_service){        
        
        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.
            
            cache_size: 60,
            cache_model_prefix: 'subdoc.',
            cache_list_name: 'subdoc.ids',
            
            _method_get: 'submission.getListLibrary',
            
            _buildGetParams: function( ids ){
                return { item_id: ids };
            },
            
            add: function( library_id, item_id, user_id ){
                return api_service.queue('submission.add',{user_id:user_id, item_id: item_id, library_id: library_id})
                    .then(function(){
                        if( service.list[item_id] && service.list[item_id].datum ){
                            if( service.list[item_id].datum.indexOf( library_id ) === -1 ){
                                service.list[item_id].datum.push(library_id);
                                service._updateModelCache(item_id);
                            }
                        }
                    });
            },
            
            remove: function( library_id, item_id ){
                return api_service.send('submission.remove',{library_id: library_id })
                    .then(function(){
                        if( service.list[item_id] && service.list[item_id].datum ){
                            service.list[item_id].datum.splice(service.list[item_id].datum.indexOf(library_id), 1);
                            service._updateModelCache(item_id);
                        }
                    });
            }
        });
        
        return service;
    }]);