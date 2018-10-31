
angular.module('API')
    .factory('account',['api_service','events_service','session','events',
        function(api_service,events_service, session, events){

            var service = {
                errors:{
                    ACCOUNT_NOT_FOUND: -32000,
                    PASSWORD_INVALID: -32032,
                    ACCOUNT_INVALID: -32033,
                    ACCOUNT_ALREADY_EXIST : -32501,
                    INACTIVE_ACCOUNT_ALREADY_EXIST : -32502,
                },
                checkEmail : function(email){
                    return api_service.send('user.checkEmail',{email:email});
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
                sign_in: function( accounttoken, password, firstname, lastname, graduation_year, program_name ){
                    return api_service.send('user.signIn',{ account_token: accounttoken, password: password,
                              firstname : firstname, lastname : lastname, graduation_year : graduation_year, page_program_name : program_name })
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
