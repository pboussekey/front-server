
angular.module('customElements')
    .directive('userConnections',[
        function(){
            return {
                restrict:'A',
                scope:{
                    id:'=userConnections',
                    close:'=close'
                },
                controller: 'user_connections_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/user/user_connections/user_connections.html'
            };
        }
    ]);