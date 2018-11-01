angular.module('login').controller('pending_controller',
    ['account', 'user', '$translate', 'notifier_service', 'modal_service',
        function( account, user, $translate, notifier_service, modal_service ){
            var ctrl = this;
            ctrl.user = user;
            ctrl.resend = function(){
                if(!ctrl.sending){
                    ctrl.sending = true;
                    account.lostpassword(user.email).then(function(){
                        ctrl.sending = false;
                        modal_service.open({
                            template: 'app/components/login/tpl/confirm-modal.html',
                            scope:{
                                email: user.email
                            },
                            reference: document.activeElement
                        });
                    });
                }
            };

        }
    ]);
