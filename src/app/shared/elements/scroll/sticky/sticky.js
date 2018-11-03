angular.module('elements')
    .directive('sticky',['events_service', function(events_service){
        return {
            scope : {
            },
            link : function(scope, element){
                var previousSize = null;
                function init(){
                    var bounds = element[0].getBoundingClientRect();
                    if(previousSize !== element[0].clientHeight){
                        var distance = Math.min( 120, document.querySelector('#body').clientHeight - element[0].clientHeight  );
                        element[0].style.top = distance +'px';
                        previousSize = element[0].clientHeight;
                    }
                }
                events_service.on('window.scrolled', init);
                init();

                scope.$on('$destroy', function(){
                    events_service.off('window.scrolled', init);
                });
            },
            restrict: 'A'
        };
    }]);
