angular.module('elements')
    .directive('noscroll',['events_service', function(events_service){
        return {
            scope :{
                force : '=?'
            },
            restrict: 'A',
            link : function(scope, element){

                // BIND EVENTS
                element[0].addEventListener('mouseover', function(e){
                    if (!document.querySelector('#body').classList.contains('noscroll')) {
                        var containerHeight = element[0].outerHeight;
                        var contentHeight = element[0].scrollHeight;

                        if (contentHeight>containerHeight || scope.force){
                            document.querySelector('#body').classList.add('noscroll');
                        }
                    }
                  }, true);

                element[0].addEventListener('mouseout', function(){
                      document.querySelector('#body').classList.remove('noscroll');
                }, true);


                element[0].addEventListener('wheel', function(e){
                    if (!document.querySelector('#body').classList.contains('noscroll')) {
                           return;

                     } else {
                         e.preventDefault();
                         return false;
                     }
                }, true);

            }
        };
    }]);
