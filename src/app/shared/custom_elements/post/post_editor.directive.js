
angular.module('customElements')
    .directive('postEditor',[
        function(){
            return {
                restrict:'A',
                scope:{
                    id:'=postEditor',
                    comment: '=',
                    close:'=close'
                },
                controller: 'post_editor_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/post/post_editor.html'
            };
        }
    ]);