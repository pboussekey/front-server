
angular.module('API')
    .factory('item_submission_model',['abstract_model_service','api_service',
        function( abstract_model_service, api_service ){        
        
            var service = new abstract_model_service({
                outdated_timeout: 1000*60*60*2,  // 2 hours.

                cache_size: 40,
                cache_model_prefix: 'itmsub.',
                cache_list_name: 'itmsub.ids',

                _method_get: 'item.getListSubmission',
            
                submit: function( item_id ){
                    return api_service.send('submission.submit',{ item_id: item_id }).then(function(){
                        return service.get([item_id], true);
                    });
                }
            });

            return service;
        }
    ]);