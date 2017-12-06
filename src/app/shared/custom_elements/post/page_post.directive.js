
angular.module('customElements')
    .directive('pagePost',[
        function(){
            return {
                restrict:'A',
                controller: 'page_post_controller',
                controllerAs: 'pctrl',
                templateUrl: 'app/shared/custom_elements/post/page_template.html'
            };
        }
    ]);