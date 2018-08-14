angular.module('login').controller('signin_controller',
    ['account','modal_service','notifier_service','customizer','$translate','$state','$stateParams','session','api_service','service_garbage', 'user',
        function( account, modal_service, notifier_service, customizer, $translate, $state, $stateParams, session, api_service, service_garbage, user ){
            var ctrl = this;

            document.title = 'TWIC - Sign in';
            ctrl.user = user;
            if(user){
                ctrl.is_active = user.is_active;
                ctrl.email = user.email;
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

            ctrl.isPasswordForgotten = $state.current.name === 'newpassword';

            ctrl.errorLabels = {
                1: 'common.password_empty',
                2: 'common.password_error',
                3: 'common.academic_email_error'
            };

            ctrl.password_error = false;
            ctrl.password = ctrl.confirm_password = '';

            ctrl.linkedin_url = account.getLinkedinLink('signup_'+$stateParams.signup_token);

            ctrl.signInWithPassword = function(){
                if( !ctrl.password ){
                    ctrl.password_error = 1;
                }else if( ctrl.password !== ctrl.confirm_password ){
                    ctrl.password_error = 2;
                }else{
                    account.sign_in( $stateParams.signup_token, ctrl.password, ctrl.firstname, ctrl.lastname ).then(undefined, function(){
                        $translate('ntf.err_already_signin').then(function( translation ){
                            notifier_service.add({type:'error',message: translation});
                        });

                        $state.go('login');
                    });
                }
            };

            ctrl.signInWithEmail = function(){
                if( !ctrl.email ){
                    ctrl.email_error = 3;
                }
                else if(!ctrl.organization){
                    ctrl.organizations = account.getListOrganizations(ctrl.email);
                    //account.getListOrganizations(ctrl.email).then(function(organizations)){
                    //ctrl.organizations = organizations;
                   if(!ctrl.organizations || !ctrl.organizations.length){
                         ctrl.email_error = 3;
                   }
                   else{
                     ctrl.email_error = 0;
                   }
                   //}
                }else{
                    account.sign_in( null, null, null, null, ctrl.email, ctrl.organization.id ).then(function(){
                      ctrl.email_error = 3;
                    }, function(){
                        $translate('ntf.mail_signin_sent').then(function( translation ){
                            notifier_service.add({type:'message',message: translation });
                        });
                        ctrl.email_error = 3;
                    });
                }
            };



            // PRIVACIES & TERMS
            this.openPrivacies = function( $event ){
                modal_service.open({
                    reference: $event.target,
                    label: 'Privacies',
                    template:'app/components/login/tpl/privacies.html'
                });
            };

            this.openTC = function( $event ){
                modal_service.open({
                    reference: $event.target,
                    label: 'Terms and conditions',
                    template:'app/components/login/tpl/terms-and-conditions.html'
                });
            };

            this.help = function(){
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
