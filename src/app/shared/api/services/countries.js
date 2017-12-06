angular.module('API')
    .factory('countries',['api_service',
        function(api_service){
            var service = {
                getList: function(search){
                    return api_service.send('country.getList',{ filter : { search : search, n : 5, p : 1} })
                        .then(function(countries){
                            return countries.results;
                    });
                }
            };
            return service; 
        }
]);