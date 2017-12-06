
angular.module('app_social')
    .directive('conversation',[
        function(){
            return {
                restrict:'E',
                scope:{
                    conversation:'=cvn'
                },
                controller: 'conversation_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/components/app_social/tpl/conversation.template.html'
            };
        }
    ]);