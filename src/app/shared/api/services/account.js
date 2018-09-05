
angular.module('API')
    .factory('account',['api_service','events_service','session','events',
        function(api_service,events_service, session, events){

            var service = {
                errors:{
                    ACCOUNT_NOT_FOUND: -32000,
                    PASSWORD_INVALID: -32032,
                    ACCOUNT_INVALID: -32033
                },
                lostpassword: function( email ){
                    return api_service.send('user.lostPassword',{email:email}).then(function(done){
                        if( done ){
                            return done;
                        }else{
                            throw new Error('Lost Password failed');
                        }
                    });
                },
                linkedin_signin: function( accesstoken, accounttoken ){
                    return api_service.send('user.linkedinSignIn',{ code:accesstoken, account_token: accounttoken })
                        .then(logged);
                },
                presign_in: function(  firstname, lastname, email, organization_id ){
                    return api_service.send('user.preSignIn',{ firstname: firstname, lastname: lastname, email : email, page_id : organization_id });
                },
                sign_in: function( accounttoken, password, firstname, lastname ){
                    return api_service.send('user.signIn',{ account_token: accounttoken, password: password, firstname : firstname, lastname : lastname })
                        .then(logged);
                },
                login: function( credentials ){
                    return api_service.send('user.login',credentials)
                        .then(logged);
                },
                logout: function(){
                    events_service.process( events.logout_call ).finally(function(){
                        api_service.send('user.logout')
                            .finally(function(){
                                events_service.process( events.logout_success );
                            }.bind(this));
                    }.bind(this));
                },
                getLinkedinLink: function( state ){
                    return CONFIG.signin.linkedin.url
                        .replace('{STATE}', state || Date.now() )
                        .replace('{CLIENT_ID}', CONFIG.signin.linkedin.id)
                        .replace('{REDIRECT_URI}', encodeURIComponent(location.protocol+'//'+location.host+'/linkedin_signin') );
                },
                getListOrganizations: function( email ){
                    return api_service.send('page.getListByEmail',{email:email}).then(function(institutions){
                        return institutions;
                    });
                }
            };

            function logged( data ){
                // POPULATING SESSION OBJECT.
                session.set(data);
                // SETTING SESSION UID !
                session.set({ uid: Date.now()+(''+Math.random()).slice(2) });
                // PROPAGE LOGGED EVENT.
                events_service.process( events.logged );
            }

            return service;
        }
    ]);
