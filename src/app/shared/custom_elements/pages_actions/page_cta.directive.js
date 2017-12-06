(function(){
    angular.module('customElements')
        .directive('pagecta',[
            function(){
                return {
                    restrict: 'A',
                    templateUrl: 'app/shared/custom_elements/pages_actions/page_cta.html',
                    controller: 'page_actions_controller',
                    scope: {
                        page: '=pagecta',
                        onstatechange: '='
                    }
                };
            }
        ]);
})();