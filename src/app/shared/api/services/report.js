angular.module('API')
    .factory('report',
        ['api_service',
            function( api_service){                
                var service = {
                    types: {
                        user: 'user_id',
                        post: 'post_id',
                        page: 'page_id'
                    },
                    send: function( type, id, reason ){
                        if( Object.keys(service.types).some(function(k){ return type===service.types[k]; }) && id ){
                            var params = {reason: reason||''};
                            params[type] = id;
                            return api_service.send('report.add', params );
                        }
                    }
                };
                return service;
            }
        ]);