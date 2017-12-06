angular.module('login').controller('login_controller',
    ['$scope', 'account','modal_service','notifier_service','customizer','$translate', '$timeout',
        function($scope, account, modal_service, notifier_service, customizer, $translate, $timeout ){
            var ctrl = this;

            document.title = 'TWIC - Login';

            this.is_loginform = true;
            this.account_error = false;
            this.password_error = false;

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

                document.title = 'TWIC - Retrieve your password';
            };

            this.showLoginForm = function(){
                this.is_loginform = true;
                this.account_error = false;
                this.password_error = false;

                document.title = 'TWIC - Login';
            };


            this.submit = function(){
                if( this.is_loginform ){
                    this.login();
                }else{
                    this.retrievePassword();
                }
            };

            this.login = function(){
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
                account.login({user:this.email.trim(),password:this.password.trim()}).then( undefined, function( error ){
                    if( error.code === account.errors.PASSWORD_INVALID ){
                        this.password_error = true;
                    }else if( error.code === account.errors.ACCOUNT_INVALID ){
                        this.account_error = true;
                    }
                }.bind(this));
            };

            this.retrievePassword = function(){
                this.account_error = false;

                account.lostpassword( this.email ).then(function(){

                    $translate('ntf.password_reset').then(function( translation ){
                        notifier_service.add({type:'message',title: translation});
                    });

                    ctrl.showLoginForm();

                }, function( error ){
                    // ERR => DISPLAY ERROR
                    if( error.code === account.errors.ACCOUNT_INVALID ){
                        this.account_error = true;
                    }else{
                        // TO REMOVE WHEN API START HANDLING ERRORS
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

            if( !window.linkedchat ){
                window.linkedchat = {
                    name: "Unknown visitor",
                    titleOpened: "Ask us everything"
                };
            }else{
                window.linkedchat.name = "Unknown visitor";
                window.linkedchat.titleOpened = "Ask us everything";
                if( window.linkedchat.updateInfo ){
                    window.linkedchat.updateInfo();
                }
            }

            this.help = function(){
                window.linkedchat.openChat();
                $timeout.cancel(launchSupport); 
            };
        }
    ]);
