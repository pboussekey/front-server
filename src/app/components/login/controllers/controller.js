angular.module('login').controller('login_controller',
    ['$scope', 'account','modal_service','notifier_service','customizer','$translate', '$timeout', 'state_service', 'global_loader',
        function($scope, account, modal_service, notifier_service, customizer, $translate, $timeout, state_service, global_loader){
            var ctrl = this;


            this.is_loginform = false;
            this.is_forgotpwdform = false;
            this.account_error = false;
            this.password_error = false;
            this.global_loader = global_loader;
            this.email = '';
            this.password = '';

            this.isApp = (navigator.userAgent.indexOf('twicapp') !== -1);
            this.year = (new Date()).getUTCFullYear();

            this.title = customizer.get('title');
            this.subtitle = customizer.get('subtitle');
            this.powered = customizer.get('powered');

            ctrl.linkedin_url = account.getLinkedinLink();

            this.showForgotPwdForm = function(){
                this.is_loginform = false;
                this.account_error = false;
                this.password_error = false;
                ctrl.is_forgotpwdform = true;

                state_service.setTitle('Retrieve your password');
            };

            this.showLoginForm = function(){
                this.is_loginform = true;
                ctrl.is_forgotpwdform = false;
                this.account_error = false;
                this.password_error = false;

                state_service.setTitle('Login');
            };


            this.submit = function(){
                if( this.is_loginform ){
                    this.login();
                }else{
                    this.retrievePassword();
                }
            };

            this.login = function(){
                if(!this.process_login){
                    this.account_error = false;
                    this.password_error = false;
                    if(!this.email){
                        this.account_error = true;
                        return;
                    }
                    if(!this.password){
                        this.password_error = true;
                        return;
                    }
                    this.process_login = true;
                    global_loader.loading('login', 0);
                    account.login({user:this.email.trim(),password:this.password.trim()}).then( undefined, function( error ){
                        if( error.code === account.errors.PASSWORD_INVALID ){
                            this.password_error = true;
                        }else if( error.code === account.errors.ACCOUNT_INVALID ){
                            this.account_error = true;
                        }
                        global_loader.done('login', 0);
                        this.process_login = false;
                    }.bind(this));
                }
            };

            this.retrievePassword = function(){
                this.account_error = false;

                account.lostpassword( this.email ).then(function(){

                    $translate('ntf.password_reset').then(function( translation ){
                        notifier_service.add({type:'message',message: translation});
                    });
                    ctrl.is_forgotpwdform = false;
                    ctrl.is_loginform = true;
                    ctrl.showLoginForm();

                }, function( error ){
                    // ERR => DISPLAY ERROR
                    if( error.code === account.errors.ACCOUNT_NOT_FOUND ){
                        this.account_error = true;
                    }
                }.bind(this));
            };

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
                    h();
                }else{
                    drift.on('ready', h);
                }

                function h(){
                    drift.api.sidebar.toggle();
                    drift.api.setUserAttributes({
                        email: null,
                        nickname: null,
                    });
                }
            };

        }
    ]);
