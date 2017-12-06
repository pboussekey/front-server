
angular.module('app_social')
    .directive('socialcolumn',[
        function(){
            return {
                restrict:'A',
                scope:{
                    
                },
                controller: 'social_column_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/components/app_social/tpl/social_column.template.html'
            };
        }
    ]);