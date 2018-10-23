
angular.module('customElements')
    .directive('postUserViews',[
        function(){
            return {
                restrict:'A',
                scope:{
                    id:'=postUserViews',
                    close:'=close'
                },
                controller: 'post_user_views_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/post/user_likes/user_likes.html'
            };
        }
    ]);
