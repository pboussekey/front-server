
angular.module('app_social')
    .directive('conversationpanels',[
        function(){
            return {
                restrict:'E',
                scope:{
                    
                },
                controller: 'conversation_panels_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/components/app_social/tpl/conversation_panels.template.html'
            };
        }
    ]);