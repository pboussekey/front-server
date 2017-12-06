angular.module('API')
    .factory('video_archive',
        ['api_service',
            function( api_service){                
                var service = {
                    startRecord: function(conversation_id){
                        return api_service.send('videoarchive.startRecord', { conversation_id : conversation_id });
                    },
                    stopRecord: function(conversation_id){
                        return api_service.send('videoarchive.stopRecord', { conversation_id : conversation_id });
                    }
                };
                return service;
            }
        ]);