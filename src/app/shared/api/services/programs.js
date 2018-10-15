
angular.module('API')
    .factory('programs_service',['api_service',
        function( api_service ){

            var service = {
                getList: function(page_id, search, filter ){

                    return api_service.send('pageprogram.getList',{
                        search:search,
                        filter:filter,
                        page_id :  page_id
                    });
                }
            };

            return service;
        }
    ]);
