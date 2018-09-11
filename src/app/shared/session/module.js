angular.module('SESSION',['EVENTS','STORAGE'])
    .factory('session',['storage',
        function( storage ){

            function session(){
                this.set( JSON.parse( document.cookie.replace(/(?:(?:^|.*;\s*)twic\s*\=\s*([^;]*).*$)|^.*$/, "$1")||'{}' ) );
            }

            session.prototype.set = function( data ){
                var self = this;

                Object.keys( data ).forEach(function(key){
                    self[key] = data[key];
                });

                document.cookie = "twic="+JSON.stringify(self)+"; expires="+(new Date(Date.now()+1000*60*60*24*30)).toUTCString()+ (location.protocol=="https:"?"; secure":"");
            };

            session.prototype.clear = function(){
                var self = this;

                Object.keys( self ).forEach(function(key){
                    delete( self[key] );
                });

                document.cookie = "twic=;expires=Thu, 01 Jan 1970 00:00:00 UTC";
            };

            return new session();
        }
    ])
    .run(['events_service','events','session',
        function( events_service, events, session ){
            // CLEAR SESSION ON DISCONNECTION
            events_service.on( events.logout_success, function(){
                session.clear();
            });
        }
    ]);

ANGULAR_MODULES.push('SESSION');
