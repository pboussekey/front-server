angular.module('elements')
    .directive('noscroll',['events_service', function(events_service){
        return {
            scope :{
                force : '=?'
            },
            restrict: 'A',
            link : function(scope, element){

                // BIND EVENTS
                element[0].addEventListener('wheel', function(e){
                    var containerHeight = element[0].outerHeight;
                    var contentHeight = element[0].scrollHeight;

                    if (contentHeight>containerHeight || scope.force){
                         e.preventDefault();
                         return false;
                   }
                });

            }
        };
    }]);
