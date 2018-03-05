angular.module('login',['ui.router','API','EVENTS','CUSTOM'])
    .config(['$stateProvider', function( $stateProvider ){
        $stateProvider.state('login',{
            controller:'login_controller as ctrl',
            templateUrl:'app/components/login/tpl/main.html',
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

        $stateProvider.state('signin',{
            url:'/signin/:signup_token',
            controller:'signin_controller as ctrl',
            templateUrl:'app/components/login/tpl/signin.html',
            resolve: {
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }],
                user : ['api_service', '$stateParams', '$state', function(api_service, $stateParams, $state){
                    return api_service.send('user.checkAccountToken', { token : $stateParams.signup_token }).then(function(user){
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

        $stateProvider.state('newpassword',{
            url:'/newpassword/:signup_token',
            controller:'signin_controller as ctrl',
            templateUrl:'app/components/login/tpl/signin.html',
            resolve: {
                custom: [ 'customizer', function( customizer ){
                    return customizer.load();
                }],
                user : ['api_service', '$stateParams', '$state', function(api_service, $stateParams, $state){
                    return api_service.send('user.checkAccountToken', { token : $stateParams.signup_token }).then(function(user){
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
