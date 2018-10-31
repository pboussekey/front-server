angular.module('login').controller('forgotpwd_controller',
    ['account','modal_service','notifier_service','customizer','$translate', 'global_loader', '$q',
     '$state','$stateParams', 'state_service', 'session','api_service','service_garbage', 'user', 'programs_service',
        function( account, modal_service, notifier_service, customizer, $translate, global_loader, $q,
          $state, $stateParams, state_service, session, api_service, service_garbage, user, programs_service ){
            var ctrl = this;

            state_service.setTitle('Sign in');
            ctrl.user = user;
            if(user){
                ctrl.is_active = user.is_active;
                ctrl.email = user.email;
                ctrl.firstname = user.firstname;
                ctrl.lastname = user.lastname;
                ctrl.organization_id = user.organization_id;
            }

            // MAKE SURE USER IS DISCONNECTED & ALL DATAS & SERVICES ARE CLEARED.
            session.clear();
            var c = {headers:{}};
            c.headers[CONFIG.api.authorization_header] = '';
            api_service.configure(c);
            service_garbage.clear();
            // CLEARED....

            ctrl.title = customizer.get('title');
            ctrl.subtitle = customizer.get('subtitle');
            ctrl.powered = customizer.get('powered');
            ctrl.year = (new Date()).getUTCFullYear();


            ctrl.errorLabels = {
                1: 'common.password_empty',
                2: 'common.password_error',
                3: 'common.academic_email_error',
                4: 'common.graduation_error',
                5: 'ntf.err_email_already_used'
            };

            ctrl.password_error = false;
            ctrl.password = ctrl.confirm_password = '';
            ctrl.current_year = new Date().getFullYear();

            ctrl.linkedin_url = account.getLinkedinLink('signup_'+$stateParams.signup_token);


            var alphanumeric_pwd = new RegExp('^[a-zA-Z0-9]+$');
            ctrl.getPasswordStrength = function(){
                if(!ctrl.password || !ctrl.password.length){
                    return 0;
                }
                return 1 + (ctrl.password.length > 7 ? 1 : 0)
                    + (alphanumeric_pwd.test(ctrl.password) ? 0 : 1)
                    + (ctrl.password.toLowerCase() === ctrl.password ? 0 : 1);
            };
            ctrl.onPwdChange = function(){
                ctrl.pwd_strength = ctrl.getPasswordStrength();
            }

            ctrl.resetPassword = function(){
                if( !ctrl.password ){
                    ctrl.password_error = 1;
                }else if( ctrl.password !== ctrl.confirm_password ){
                    ctrl.password_error = 2;
                }
                else{
                    if(!ctrl.processing){
                        ctrl.processing = true;
                        global_loader.loading('signin', 0);
                        account.sign_in( $stateParams.token, ctrl.password ).then(function(){
                            ctrl.processing = false;
                            global_loader.done('signin', 0);
                        }, function(){
                            $translate('ntf.err_already_signin').then(function( translation ){
                                notifier_service.add({type:'error',message: translation});
                            });

                            $state.go('login');
                        });
                    }
                }
            };

            // PRIVACIES & TERMS
            ctrl.openPrivacies = function( $event ){
                modal_service.open({
                    reference: $event.target,
                    label: 'Privacies',
                    template:'app/components/login/tpl/privacies.html'
                });
            };

            ctrl.openTC = function( $event ){
                modal_service.open({
                    reference: $event.target,
                    label: 'Terms and conditions',
                    template:'app/components/login/tpl/terms-and-conditions.html'
                });
            };

            ctrl.help = function(){
                if( drift.api ){
                    drift.api.sidebar.toggle();
                }else{
                    drift.on('ready', function(){
                        drift.api.sidebar.toggle();
                    });
                }
            };


        }
    ]);
