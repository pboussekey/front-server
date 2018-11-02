angular.module('login').controller('registered_controller',
    ['account', '$stateParams', '$translate', 'notifier_service', 'modal_service',
        function( account, $stateParams, $translate, notifier_service, modal_service ){
            var ctrl = this;
            ctrl.resend = function(){
                if(!ctrl.sending){
                    ctrl.sending = true;
                      account.presign_in( null, null, $stateParams.email, $stateParams.organization).then(function(){
                        ctrl.sending = false;
                        modal_service.open({
                            template: 'app/components/login/tpl/confirm-modal.html',
                            scope:{
                                email: $stateParams.email
                            },
                            reference: document.activeElement
                        });
                    });
                }
            };

        }
    ]);
