angular.module('login').controller('registered_controller',
    ['account', '$stateParams', '$translate', 'notifier_service',
        function( account, $stateParams, $translate, notifier_service ){
            var ctrl = this;
            ctrl.resend = function(){
                if(!ctrl.sending){
                    ctrl.sending = true;
                    ($stateParams.organization ?
                        account.presign_in( null, null, $stateParams.email, $stateParams.organization)
                      : account.lostpassword($stateParams.email)).then(function(){
                        ctrl.sending = false;
                        $translate('ntf.mail_signin_sent').then(function( translation ){
                            notifier_service.add({type:'message',message: translation });
                        });
                    });
                }
            };

        }
    ]);
