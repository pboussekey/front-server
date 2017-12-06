angular.module('elements').directive('notifier',['notifier_service',
    function(notifier_service){
        return {
            scope:{},
            link: function( scope ){

                scope.notifications = notifier_service.notifications.default;
                
                scope.remove = function( notification ){
                    notifier_service.remove( notification, 'default' );
                };

            },
            templateUrl:'app/shared/elements/notifier/template.html',
            restrict: 'E'
       };
    }
]);