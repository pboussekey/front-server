angular.module('FIREBASE')
    .factory('FirebaseProvider',['$q','session', 'api_service',function($q, session, api_service ){

        firebase.initializeApp(CONFIG.firebase_config);

        return {
            session_id: '#sess_'+Date.now(),
            get: function(){

                var deferred = $q.defer();
                firebase.auth().signInWithCustomToken( session.fbtoken).then(function(){
                  deferred.resolve( firebase.database().ref()  );
                 }).catch(function(){
                    this.getNewToken().then(function(token){
                        session.set({ fbtoken : token });
                        firebase.auth().signInWithCustomToken( session.fbtoken).then(function(){
                          deferred.resolve( firebase.database().ref()  );
                        });
                    });
                 }.bind(this));
                return deferred.promise;
            },
            getNewToken : function(){
                return api_service.send("user.getCustomTokenfb", {}).then(function(token){
                    return token;
                });
            }
        };
    }]);
