
angular.module('API')
    .factory('items_info_model',['abstract_model_service',
        function( abstract_model_service ){        
        
            var service = new abstract_model_service({
                outdated_timeout: 1000*60*60*2,  // 2 hours.

                cache_size: 40,
                cache_model_prefix: 'itmi.',
                cache_list_name: 'itmi.ids',

                _method_get: 'item.getInfo'
            });

            return service;
        }
    ]);