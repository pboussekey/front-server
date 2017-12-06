
angular.module('API')
    .factory('item_user_model',['abstract_model_service','api_service',function(abstract_model_service, api_service ){

        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.

            cache_size: 60,
            cache_model_prefix: 'itu.',
            cache_list_name: 'itu.ids',

            _method_get: 'item.getListItemUser',

            submit : function( item_id, submission_id){
                return api_service.send('submission.submit',{id: submission_id})
                    .then(function(){
                        return service.get([item_id],true);
                    });
            }
        });

        window.itu = service;

        return service;
    }]);
