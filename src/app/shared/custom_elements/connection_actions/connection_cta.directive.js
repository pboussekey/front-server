(function(){
    angular.module('customElements')
        .directive('cncta',[
            function(){
                return {
                    restrict: 'E',
                    templateUrl: 'app/shared/custom_elements/connection_actions/template_cta.html',
                    controller: 'connection_actions_controller',
                    scope: {
                        user: '=connection',
                        onstatechange: '='
                    }
                };
            }
        ]);
})();