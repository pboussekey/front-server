
angular.module('customElements')
    .directive('postUserSharings',[
        function(){
            return {
                restrict:'A',
                scope:{
                    id:'=postUserSharings',
                    close:'=close'
                },
                controller: 'post_user_sharings_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/post/user_likes/user_likes.html'
            };
        }
    ]);
