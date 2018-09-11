
angular.module('customElements')
    .directive('settings',[
        function(){
            return {
                restrict:'A',
                scope:{
                    close:'='
                },
                controller: 'settings_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/settings/settings.html'
            };
        }
    ]);
