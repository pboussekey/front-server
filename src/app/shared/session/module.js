angular.module('SESSION',['EVENTS','STORAGE'])
    .factory('session',['storage',
        function( storage ){
            
            function session(){
                this.set( JSON.parse( storage.getItem('session') || '{}' ) );
            }
            
            session.prototype.set = function( data ){
                var self = this;
                
                Object.keys( data ).forEach(function(key){
                    self[key] = data[key];
                });
                
                storage.setItem('session', JSON.stringify(self), true );
            };
            
            session.prototype.clear = function(){
                var self = this;
                
                Object.keys( self ).forEach(function(key){
                    delete( self[key] );
                });
                
                storage.removeItem('session');
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