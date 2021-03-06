angular.module('login',['ui.router','API','EVENTS','CUSTOM'])
    .config(['$stateProvider', function( $stateProvider ){
        $stateProvider.state('login',{
            controller:'login_controller as ctrl',
            url:'/',
            templateUrl:'app/components/login/tpl/main.html',
            resolve: {
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }]
            }
        });

        $stateProvider.state('email',{
            controller:'login_controller as ctrl',
            url:'/email/:email',
            templateUrl:'app/components/login/tpl/main.html',
            resolve: {
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }]
            }
        });


        $stateProvider.state('explanations',{
            controller:'login_controller as ctrl',
            url:'/explanations',
            templateUrl:'app/components/login/tpl/signin-explanations.html',
            resolve: {
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }]
            }
        });

        $stateProvider.state('tac',{
            url:'/terms-and-conditions',
            templateUrl:'app/components/login/tpl/tac.html'
        });

        $stateProvider.state('confirm-email',{
            controller:'confirm_email_controller as ctrl',
            url:'/confirm-email/:id/:token',
            templateUrl:'app/components/login/tpl/confirm-email.html',
            resolve: {
                updated : ['user_profile', '$stateParams', function(profile, $stateParams){
                    return profile.confirmEmailUpdate($stateParams.id, $stateParams.token).then(function(r){
                        return r;
                    });
                }],
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }]

            },
            logout : true
        });

        $stateProvider.state('registered',{
            url:'/registered/:email/:organization',
            controller:'registered_controller as ctrl',
            templateUrl:'app/components/login/tpl/registered.html',
            resolve: {
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }]

            }
        });

        $stateProvider.state('unsubscribe',{
            url:'/unsubscribe/:key',
            controller:'unsubscribe_controller as ctrl',
            templateUrl:'app/components/login/tpl/unsubscribe.html',
            resolve: {
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }],
                settings: [ '$stateParams', 'account', function( $stateParams, account ){
                    return account.getSettings($stateParams.key)
                }]

            },
            logout : true
        });

        $stateProvider.state('pending',{
            url:'/pending/:email',
            controller:'pending_controller as ctrl',
            templateUrl:'app/components/login/tpl/pending.html',
            resolve: {
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }],
                user : ['account', '$stateParams', '$state', function(account, $stateParams, $state){
                    return account.checkEmail($stateParams.email).then(function(user){
                        if(!user || user.is_active || !user.invitation_date){
                            $state.go('login');
                            return;
                        }
                        else{
                            return user;
                        }
                    });
                }]

            }
        });

        $stateProvider.state('signin',{
            url:'/signin/:signup_token',
            controller:'signin_controller as ctrl',
            templateUrl:'app/components/login/tpl/signin.html',
            resolve: {
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }],
                user : ['api_service', '$stateParams', '$state', function(api_service, $stateParams, $state){
                    return $stateParams.signup_token ? api_service.send('user.checkAccountToken', { token : $stateParams.signup_token }).then(function(user){
                        return !user.email ? user.preregistration : user;
                    }) : false;
                }]
            }
        });

        $stateProvider.state('newpassword',{
            url:'/newpassword/:token',
            controller:'forgotpwd_controller as ctrl',
            templateUrl:'app/components/login/tpl/forgotpwd.html',
            resolve: {
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }],
                user : ['api_service', '$stateParams', '$state', function(api_service, $stateParams, $state){
                    return api_service.send('user.checkAccountToken', { token : $stateParams.token }).then(function(user){
                        if(user === false){
                            $state.go('login');
                            return null;
                        }
                        else{
                            return user;
                        }
                    });
                }]
            }
        });

        $stateProvider.state('linkedin_redirect',{
            url:'/linkedin_signin',
            controller:'linkedin_controller as ctrl',
            templateUrl:'app/components/login/tpl/redirect.html',
            resolve: {
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }]
            }
        });

        $stateProvider.state('mobile',{
            url:'/mobile/:fcmtoken/:fcmuid',
            controller:'login_controller as ctrl',
            templateUrl:'app/components/login/tpl/main.html',
            resolve: {
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }]
            }
        });

    }]);

ANGULAR_MODULES.push('login');
