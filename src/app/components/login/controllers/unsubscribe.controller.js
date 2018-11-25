angular.module('login').controller('unsubscribe_controller',
    ['account', 'settings', 'notifier_service', '$stateParams',
        function( account, settings, notifier_service, $stateParams ){
            var ctrl = this;
            ctrl.settings = settings;
            ctrl.confirm = function(){
                  account.updateSettings($stateParams.key, ctrl.settings.has_social_notifier, ctrl.settings.has_academic_notifier).then(function(){
                              notifier_service.add({type:'message',message: 'Settings updated' });
                  });
            };

        }
    ]);
