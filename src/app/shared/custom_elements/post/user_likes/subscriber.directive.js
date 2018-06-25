
angular.module('customElements')
    .directive('subscribersModal',[
        function(){
            return {
                restrict:'A',
                scope:{
                    id:'=subscribersModal',
                    close:'=close'
                },
                controller: 'subscribers_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/post/user_likes/user_likes.html'
            };
        }
    ]);
