
angular.module('customElements')
    .directive('groupPost',[
        function(){
            return {
                restrict:'A',
                controller: 'group_post_controller',
                controllerAs: 'gctrl',
                templateUrl: 'app/shared/custom_elements/post/group_template.html'
            };
        }
    ]);
