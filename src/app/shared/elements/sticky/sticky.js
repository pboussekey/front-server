angular.module('elements')
    .directive('sticky',[function(){
        return {
            scope : {
            },
            link : function(scope, element){
                element[0].style.position = "sticky";
                var distance = Math.min( 120, document.querySelector('#body').clientHeight - element[0].clientHeight - 80 );
                element[0].style.top = distance +'px';
            },
            restrict: 'A'
        };
    }]);
