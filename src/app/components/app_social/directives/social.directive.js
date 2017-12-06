
angular.module('app_social')
    .directive('social',[
        function(){
            return {
                restrict:'E',
                scope:{
                    
                },
                controller: 'social_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/components/app_social/tpl/social.template.html'
            };
        }
    ]);