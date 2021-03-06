angular.module('login').controller('login_controller',
    ['$scope', 'account','modal_service','notifier_service','customizer',
    '$translate', '$timeout', 'state_service', 'global_loader', '$stateParams','$state',
        function($scope, account, modal_service, notifier_service, customizer,
          $translate, $timeout, state_service, global_loader, $stateParams, $state){
            var ctrl = this;


            this.is_loginform = false;
            this.is_forgotpwdform = false;
            this.account_error = false;
            this.password_error = false;
            this.global_loader = global_loader;
            this.email = '';
            this.password = '';

            this.states = {
               EMAIL : 'email',
               LOGIN : 'login',
               FORGOTPWD : 'forgotpwd',
               CREATE : 'create',
            };
            this.state = this.states.EMAIL;

            this.isApp = (navigator.userAgent.indexOf('twicapp') !== -1);
            this.year = (new Date()).getUTCFullYear();

            this.title = customizer.get('title');
            this.subtitle = customizer.get('subtitle');
            this.powered = customizer.get('powered');

            ctrl.linkedin_url = account.getLinkedinLink();

            this.checkEmail = function(){
                ctrl.processing = true;
                ctrl.account_error = false;
                var domain = location.hostname.replace( CONFIG.hostname_end, '');
                account.checkEmail(ctrl.email).then(function(user){
                    if(!user){
                        account.getListOrganizations(ctrl.email).then(function(organizations){
                            if(!organizations || !organizations.length){
                                ctrl.account_error = true;
                                ctrl.processing = false;
                                return;
                            }
                            var domains = organizations.map(function(organization){
                                return organization.libelle;
                            });
                            if(domains[0] && domains.indexOf(domain) === -1){
                                window.location.href = location.protocol+'//'+domains[0] + CONFIG.hostname_end + "/email/" + ctrl.email;
                                ctrl.processing = false;
                                return;
                            }
                            ctrl.goToState(ctrl.states.CREATE);
                            if(organizations.length === 1){
                                ctrl.organization = organizations[0];
                            }
                            ctrl.organizations = organizations;
                        });
                  }
                  else{
                      ctrl.user = user;
                      ctrl.processing = false;
                      if(user.organization && user.organization.libelle && user.organization.libelle !== domain){
                          window.location.href = location.protocol+'//'+ user.organization.libelle + CONFIG.hostname_end + "/email/" + ctrl.email;
                          return;
                      }
                      if(user.is_active && user.email && ctrl.email && user.email.toLowerCase() === ctrl.email.toLowerCase()){
                          ctrl.goToState(ctrl.states.LOGIN);
                      }
                      else if(user.is_active){
                          ctrl.updated_email_error = true;
                      }
                      else if(user.invitation_date){
                          $state.go('pending', { email : ctrl.email });
                      }
                      else{
                          ctrl.goToState(ctrl.states.CREATE);
                          ctrl.organizations = [user.organization];
                          ctrl.organization = user.organization;
                      }
                  }
              });
            };

            this.goToState = function(state){
                ctrl.organization = null;
                ctrl.organizations = [];
                ctrl.state = state;
                ctrl.processing = false;
            };

            this.confirmInstitution = function(){
                ctrl.processing = true;
                account.presign_in( null, null, ctrl.email, ctrl.organization.id ).then(function(token){
                    $translate('ntf.mail_signin_sent').then(function( translation ){
                        ctrl.email_error = 0;
                        ctrl.processing = false;
                        notifier_service.add({type:'message',message: translation });
                    });
                    $state.go('registered', { email :  ctrl.email, organization : ctrl.organization.id });
                }, function(){
                    ctrl.processing = true;
                });
            };

            if($stateParams.email){
                ctrl.email = $stateParams.email;
                ctrl.checkEmail();
            }


            this.login = function(){
                if(!this.processing){
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
                    this.processing = true;
                    global_loader.loading('login', 0);
                    account.login({user:this.email.trim(),password:this.password.trim()}).then( undefined, function( error ){
                        if( error.code === account.errors.PASSWORD_INVALID ){
                            this.password_error = true;
                        }else if( error.code === account.errors.ACCOUNT_INVALID ){
                            this.account_error = true;
                        }
                        global_loader.done('login', 0);
                        this.processing = false;
                    }.bind(this));
                }
            };

            this.resestPassword = function(){
                this.account_error = false;
                ctrl.processing = true;

                account.lostpassword( this.email ).then(function(){
                    ctrl.processing = false;
                    $translate('ntf.password_reset').then(function( translation ){
                        notifier_service.add({type:'message',message: translation});
                    });
                    ctrl.goToState(ctrl.states.LOGIN);

                }, function( error ){
                    ctrl.processing = false;
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
                        email: ctrl.email,
                        nickname: null,
                    });
                }
            };

            this.openExplanations = function($event){
                modal_service.open({
                    reference: $event.target,
                    template:'app/components/login/tpl/signin-explanations.html',
                    scope : {
                        help : ctrl.help
                    }
                });
            };

        }
    ]);
