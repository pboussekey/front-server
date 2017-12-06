angular.module('admin')
    .directive('activity',[
        function(){
            return {
                restrict:'E',
                scope:{
                    model:"=model"
                },
                templateUrl: 'app/components/admin/tpl/activity.html',
                link: function( scope ){
                }
            };
        }
    ]);