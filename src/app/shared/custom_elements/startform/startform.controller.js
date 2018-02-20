angular.module('customElements').controller('startform_controller',
    ['$scope','profile','notifier_service','upload_service','api_service','countries','user_model','session','$translate','account',
        function( $scope, profile, notifier_service, upload_service, api_service, countries, user_model, session, $translate, account ){
            var ctrl = this;

            ctrl.form = {};

            // INIT FORM DATAS
            ctrl.form.nickname = user_model.list[session.id].datum.nickname;
            ctrl.form.origin = user_model.list[session.id].datum.origin;
            ctrl.form.address = user_model.list[session.id].datum.address;
            ctrl.form.lockedemail = user_model.list[session.id].datum.email;

            ctrl.isNotLinkedinPaired = !session.has_linkedin;
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

            ctrl.setOrigin = function(origin){
                ctrl.form.origin = origin;
                return origin.short_name;
            };

            ctrl.close = function($event){
                $event.preventDefault();
                $scope.close();
            };

            ctrl.save = function(){
                // CHECK NEW PASSWORD !

                if( ctrl.form.password ){
                    ctrl.form.password = ctrl.form.password.trim();

                    if( ctrl.form.password !== ctrl.form.confirm_password ){
                        ctrl.password_error = true;
                        return;
                    }
                }else{
                    ctrl.form.password = undefined;
                }

                if( ctrl.hasAvatar ){
                    ctrl.crop().then(function(blob){
                        var u = upload_service.upload('avatar', blob, 'profile_'+session.id+'.png' );

                        u.promise.then(function(d){
                            ctrl.form.avatar = d.avatar;

                            profile.update( ctrl.form ).then(function(){
                                $translate('ntf.info_updated').then(function( translation ){
                                    notifier_service.add({type:'message',title: translation});
                                });
                                $scope.close();
                            });
                        });
                    });
                }else{
                    profile.update( ctrl.form ).then(function(){
                        $translate('ntf.info_updated').then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });
                        $scope.close();
                    });
                }
            };


        }
    ]);
