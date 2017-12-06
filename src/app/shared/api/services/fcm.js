angular.module('API')
    .factory('fcm_service',
        ['api_service',
            function( api_service){                
                var service = {
                    
                    register: function( token, uid ){
                        return api_service.send('user.registerFcm', { token : token, uuid : uid });
                    }
                };
                return service;
            }
        ]);