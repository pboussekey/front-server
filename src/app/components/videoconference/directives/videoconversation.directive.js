
angular.module('videoconference')
    .directive('videoconversation',[
        function(){
            return {
                restrict:'A',
                scope:{
                    conversation:'=videoconversation'
                },
                controller: 'conversation_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/components/videoconference/tpl/conversation.template.html'
            };
        }
    ]);