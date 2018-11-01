angular.module('login').controller('registered_controller',
    ['account', 'preregistration', '$translate', 'notifier_service', 'modal_service',
        function( account, preregistration, $translate, notifier_service, modal_service ){
            var ctrl = this;
            ctrl.resend = function(){
                if(!ctrl.sending){
                    ctrl.sending = true;
                      account.presign_in( null, null, preregistration.email, preregistration.organization_id).then(function(){
                        ctrl.sending = false;
                        modal_service.open({
                            template: 'app/components/login/tpl/confirm-modal.html',
                            scope:{
                                email: preregistration.email
                            },
                            reference: document.activeElement
                        });
                    });
                }
            };

        }
    ]);
