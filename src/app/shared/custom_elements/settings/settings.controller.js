angular.module('customElements').controller('settings_controller',
    ['$scope','profile','notifier_service','upload_service','api_service','countries','user_model','session','$translate','account',
        'events_service', 'events',
        function( $scope, profile, notifier_service, upload_service, api_service, countries, user_model, session, $translate, account,
        events_service, events){
            var ctrl = this;

            ctrl.form = {};

            var email_regex = new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)+$');

            // INIT FORM DATAS
            ctrl.loading = true;
            user_model.queue([session.id]).then(function(){
              ctrl.form.id = session.id;
              ctrl.current_year = new Date().getFullYear();
              ctrl.form.firstname = user_model.list[session.id].datum.firstname;
              ctrl.form.lastname = user_model.list[session.id].datum.lastname;
              ctrl.form.origin = user_model.list[session.id].datum.origin;
              ctrl.form.address = user_model.list[session.id].datum.address;
              ctrl.form.email = user_model.list[session.id].datum.email;
              ctrl.form.graduation_year = user_model.list[session.id].datum.graduation_year;
              ctrl.form.swap_email = session.swap_email;
              ctrl.form.has_email_notifier = user_model.list[session.id].datum.has_email_notifier;
              ctrl.isNotLinkedinPaired = !session.has_linkedin;
              ctrl.loading = false;
            });

            if( ctrl.isNotLinkedinPaired ){
                ctrl.linkedin_url = account.getLinkedinLink();
            }

            ctrl.onAvatarFile = function( files ){
                if( files.length ){
                    ctrl.loadCropper( URL.createObjectURL(files[0]), false, true );
                    ctrl.hasAvatar = true;
                }
            };

            ctrl.searchOrigin = function(search){
                if(!search){
                    ctrl.form.origin = null;
                    return [];
                }
                else{
                    return countries.getList(search);
                }
            };

            ctrl.sendConfirmEmailUpdate = function(){
                profile.sendEmailUpdateConf().then(function(){
                    $translate('ntf.mail_update_sent').then(function( translation ){
                        notifier_service.add({type:'message',message: translation});
                    });
                });
            };


            ctrl.cancelEmailUpdate = function(){
                profile.cancelEmailUpdate().then(function(){
                    $translate('ntf.mail_update_canceled').then(function( translation ){
                        ctrl.form.swap_email = null;
                        session.set({ swap_email : null });
                        notifier_service.add({type:'message',message: translation});
                    });
                });
            };

            ctrl.setOrigin = function(origin){
                ctrl.form.origin = origin;
                return origin.short_name;
            };

            ctrl.close = function($event){
                $event.preventDefault();
                $scope.close();
            };
            ctrl.save = function(){
              ctrl.email_error = false;
              ctrl.graduation_error = false;
                // CHECK NEW PASSWORD !
                if( ctrl.form.password && ctrl.form.confirm_password && ctrl.form.confirm_password.length){
                    ctrl.form.password = ctrl.form.password.trim();

                    if( ctrl.form.password !== ctrl.form.confirm_password ){
                        ctrl.password_error = true;
                        return;
                    }
                }else{
                    ctrl.form.password = undefined;
                }
                if(ctrl.form.email !== session.email && ctrl.form.email !== session.swap_email && !email_regex.test(ctrl.form.email)){
                    ctrl.email_error = 'ntf.err_invalid_email';
                    return;
                }
                if(ctrl.form.graduation_year && (ctrl.form.graduation_year.toString().length !== 4 || isNaN(ctrl.form.graduation_year))){
                      ctrl.graduation_error = true;
                      return;
                }
                else if(!ctrl.form.graduation_year){
                    ctrl.form.graduation_year = 'null';
                }
                // Build param object.
                var params = Object.keys( ctrl.form ).reduce(function(params,key){
                    if( ctrl.form[key] !== undefined ){
                        params[key] = ctrl.form[key];
                    }
                    return params;
                },{});

                profile.update( params ).then(function(){
                    $translate('ntf.info_updated').then(function( translation ){

                        if(ctrl.form.email !== session.email && ctrl.form.email !== session.swap_email){
                            notifier_service.add({
                                type:'message',
                                message: 'A confirmation email has been sent to : <b>' + ctrl.form.email + '</b>. Until you confirm this change, you will need to use your current email address to log in to your account.',
                                time : 10000
                            });
                            session.set({ swap_email : ctrl.form.email });
                        }
                        else{
                            notifier_service.add({type:'message',message: translation });
                        }
                    });
                    $scope.close();
                }, function(){
                    ctrl.email_error = 'ntf.err_email_already_used';
                });
            };

            events_service.on(events.user_updated, function(args){
                var id = parseInt(args.datas[0].data);
                if(ctrl.form.swap_email && session.id === id){
                    $scope.close();
                }
            });


        }
    ]);
