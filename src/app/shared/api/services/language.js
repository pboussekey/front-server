angular.module('API')
    .factory('languages',['api_service',
        function(api_service){
            var service = {
                getList: function( search, filter ){
                    return api_service.send('language.getList',{ search : search, filter : filter }).then(function(languages){
                        return languages.list ? languages.list : languages;
                    });
                }
            };
            return service; 
        }
]);