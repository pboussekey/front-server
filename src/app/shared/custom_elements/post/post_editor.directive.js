
angular.module('customElements')
    .directive('postEditor',[
        function(){
            return {
                restrict:'A',
                scope:{
                    id:'=postEditor',
                    comment: '=',
                    sharedId: '=',
                    sharingType:'=',
                    close:'=close',
                    onvalidation:'=?'
                },
                controller: 'post_editor_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/post/post_editor.html'
            };
        }
    ]);
