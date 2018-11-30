
angular.module('API')
    .factory('followings_model',['abstract_model_service',function(abstract_model_service){

        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.

            cache_size: 60,
            cache_model_prefix: 'contact.followings',
            cache_list_name: 'contact.followings.ids',
            _method_get: 'contact.getListFollowingsId',
            _buildGetParams: function( ids ){
                return { user_id : ids };
            }
        });

        window.followings_model = service;

        return service;
    }]);
