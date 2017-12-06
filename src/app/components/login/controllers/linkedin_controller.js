angular.module('login').controller('linkedin_controller',
    ['account','modal_service','notifier_service','customizer','$translate','$state','session',
        function( account, modal_service, notifier_service, customizer, $translate, $state, session ){
            var ctrl = this,
                params = {};

            document.title = 'TWIC - Checking authorization...';

            if( location.search ){
                location.search.slice(1).split('&').forEach(function( paramString ){
                    var p = paramString.split('=');
                    params[p[0]] = p[1];
                });
            }

            if( params.code && params.state ){
                account.linkedin_signin( params.code, params.state.slice(0,7) === 'signup_' ? params.state.slice(7): undefined ).then( undefined, function(){
                    if( params.state.slice(0,7) === 'signup_' ){
                        $translate('ntf.err_signin_state').then(function( translation ){
                            notifier_service.add({type:'error',title: translation});
                        });
                    }else{
                        $translate('ntf.err_linkedin_signup').then(function( translation ){
                            notifier_service.add({type:'error',title: translation});
                        });
                    }
                    redirect();
                });
            }else{
                $translate('ntf.err_linkedin_auth').then(function( translation ){
                    notifier_service.add({type:'error',title: params.error_description?decodeURIComponent(params.error_description):translation });
                    redirect();
                });
            }

            function redirect(){
                if( params.state.slice(0,7) === 'signup_' ){
                    $state.go('signin',{signup_token: params.state.slice(7) });
                }else if( session.id ){
                    $state.go('lms.dashboard');
                }else{
                    $state.go('login');
                }
            }

        }
    ]);
