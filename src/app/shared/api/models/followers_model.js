
angular.module('API')
    .factory('followers_model',['abstract_model_service',function(abstract_model_service){

        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.

            cache_size: 60,
            cache_model_prefix: 'contact.followers',
            cache_list_name: 'contact.followers.ids',
            _method_get: 'contact.getListFollowersId',
            _buildGetParams: function( ids ){
                return { user_id : ids };
            }
        });

        window.followers_model = service;

        return service;
    }]);
