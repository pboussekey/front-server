
angular.module('API')
    .factory('item_users_model',['abstract_model_service','api_service',function(abstract_model_service, api_service ){

        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.

            cache_size: 60,
            cache_model_prefix: 'itmusers.',
            cache_list_name: 'ium.ids',

            _method_get: 'item.getListItemUser',

            addUsers: function( item_id, users, group_id ){
                return api_service.queue('item.addUsers',{id: item_id, user_ids: users, group_id: group_id})
                    .then(function(){
                        return service.queue([item_id], true);
                    });
            },
            removeUsers: function( item_id, users ){
                return api_service.queue('item.deleteUsers',{id: item_id, user_ids:users})
                    .then(function(){
                        return service.queue([item_id], true);
                    });
            }
        });

        return service;
    }]);
