angular.module('login').controller('signin_controller',
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

            ctrl.isPasswordForgotten = $state.current.name === 'newpassword';

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

            ctrl.signInWithPassword = function(){
                if( !ctrl.password ){
                    ctrl.password_error = 1;
                }else if( ctrl.password !== ctrl.confirm_password ){
                    ctrl.password_error = 2;
                }
                else if(ctrl.graduation_year && (ctrl.graduation_year.toString().length !== 4 || isNaN(ctrl.graduation_year))){
                    ctrl.graduation_error = 4;
                }else{

                    if(!ctrl.processing){
                        ctrl.processing = true;
                        global_loader.loading('signin', 0);
                        account.sign_in( $stateParams.signup_token, ctrl.password, ctrl.firstname, ctrl.lastname, ctrl.graduation_year, ctrl.search_program.search ).then(function(){
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

            ctrl.signInWithEmail = function(){
                if( !ctrl.email ){
                    ctrl.email_error = 3;
                }
                else if(!ctrl.organization){
                    account.getListOrganizations(ctrl.email).then(function(organizations){
                        ctrl.organizations = organizations;
                       if(!ctrl.organizations || !ctrl.organizations.length){
                          ctrl.email_error = 3;
                       }
                       else{
                          if(ctrl.organizations.length === 1){
                              ctrl.organization = ctrl.organizations[0];
                          }
                          ctrl.email_error = 0;
                       }
                   }, function(){
                      ctrl.email_error = 5;
                   });
                }
                if(ctrl.organization){
                    if(!ctrl.processing){
                        ctrl.processing = true;
                        account.presign_in( ctrl.firstname, ctrl.lastname, ctrl.email, ctrl.organization.id ).then(function(){
                            $translate('ntf.mail_signin_sent').then(function( translation ){
                                ctrl.email_error = 0;
                                ctrl.processing = false;
                                notifier_service.add({type:'message',message: translation });
                            });
                            $state.go('registered');
                        }, function(){
                            ctrl.email_error = 3;
                            ctrl.processing = false;
                        });
                  }
                }
            };

            //PROGRAMS
            var previousSearch;
            ctrl.searchPrograms = function(search, filter){
                if(search !== previousSearch){
                    ctrl.ended_programs = false;
                }
                if(!ctrl.loading_programs && !ctrl.ended_programs){
                    ctrl.loading_programs = true;
                    return programs_service.getList(ctrl.organization_id, search, filter).then(function(programs){
                        ctrl.loading_programs = false;
                        ctrl.ended_programs = programs.list.length < 10;
                        return programs.list;
                    });
                }
                else{
                   var q = $q.defer();
                   q.resolve([]);
                   return q.promise;
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
