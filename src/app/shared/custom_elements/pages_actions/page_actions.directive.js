(function(){
    angular.module('customElements')
        .directive('pageactions',[
            function(){
                return {
                    restrict: 'A',
                    templateUrl: 'app/shared/custom_elements/pages_actions/page_actions.html',
                    controller: 'page_actions_controller',
                    scope: {
                        page: '=pageactions',
                        onstatechange: '='
                    }
                };
            }
        ]);
})();