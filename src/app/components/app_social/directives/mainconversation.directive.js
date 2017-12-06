
angular.module('app_social')
    .directive('mainconversation',['social_service',
        function( social_service ){
            return {
                restrict:'E',
                scope:{
                    conversation:'=cvn',
                    mustwatch:'='
                },
                controller: 'conversation_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/components/app_social/tpl/mainconversation.template.html',
                link: function( scope ){
                    social_service.current_loaded = true;
                    scope.mustwatch = true;
                    
                    scope.$on('$destroy',function(){
                        social_service.current_loaded = false;
                    });
                }
            };
        }
    ]);