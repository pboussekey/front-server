
angular.module('API')
    .factory('item_groups_model',['abstract_model_service','api_service',function(abstract_model_service, api_service ){

        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.

            cache_size: 60,
            cache_model_prefix: 'itmgrps.',
            cache_list_name: 'igm.ids',

            _method_get: 'group.getList',

            _buildGetParams: function( ids ){
                return { item_id: ids };
            },

            add: function( item_id, groups ){
                return api_service.queue('group.add',{item_id: item_id, name: groups})
                    .then(function( data ){
                        return service.get([item_id], true).then(function(){ return data; });
                    });
            },
            remove: function( item_id, groupIds ){
                return api_service.queue('group.delete',{id: groupIds })
                    .then(function(){
                        return service.queue([item_id], true);
                    });
            }
        });

        return service;
    }]);
