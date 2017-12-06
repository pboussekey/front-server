
angular.module('Library')
    .factory('library_service',['api_service', '$timeout',
        function(api_service, $timeout ){
            var RETRY_SESSION_BOX = 202;
            var service = {
                getSession: function(document){
                    return api_service.send('library.getSession', { id: document.id }).catch(function(err) {
                        if (err.code === RETRY_SESSION_BOX) {
                            return $timeout(this.getSession.bind(null, api_service, $timeout, document), +err.message.slice(-1));
                        }

                        throw err;
                    });
                }.bind(this)
            };
            
            return service;
        }
    ]);