
angular.module('customElements')
    .directive('postUserLikes',[
        function(){
            return {
                restrict:'A',
                scope:{
                    id:'=postUserLikes',
                    close:'=close'
                },
                controller: 'post_user_likes_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/post/user_likes/user_likes.html'
            };
        }
    ]);