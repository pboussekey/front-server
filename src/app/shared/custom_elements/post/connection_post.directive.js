
angular.module('customElements')
    .directive('connectionPost',[
        function(){
            return {
                restrict:'A',
                controller: 'connection_post_controller',
                controllerAs: 'cctrl',
                templateUrl: 'app/shared/custom_elements/post/connection_template.html'
            };
        }
    ]);