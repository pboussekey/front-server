angular.module('login').controller('pending_controller',
    ['account', 'user', '$translate', 'notifier_service',
        function( account, user, $translate, notifier_service ){
            var ctrl = this;
            ctrl.user = user;
            ctrl.resend = function(){
                if(!ctrl.sending){
                    ctrl.sending = true;
                    account.lostpassword(user.email).then(function(){
                        ctrl.sending = false;
                        $translate('ntf.mail_signin_sent').then(function( translation ){
                            notifier_service.add({type:'message',message: translation });
                        });
                    });
                }
            };

        }
    ]);
