(function(){
    angular.module('customElements')
        .directive('cnctactions',[
            function(){
                return {
                    restrict: 'E',
                    templateUrl: 'app/shared/custom_elements/connection_actions/template.html',
                    controller: 'connection_actions_controller',
                    scope: {
                        user: '=connection',
                        onstatechange: '='
                    }
                };
            }
        ]);
})();