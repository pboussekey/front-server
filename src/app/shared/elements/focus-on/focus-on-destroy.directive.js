
angular.module('elements')
    .directive('focusOnDestroy',[
        function(  ){
            return {
                restrict: 'A',
                scope:{
                    selector:'@focusOnDestroy'
                },
                link: function( scope ){
                    scope.$on('$destroy', function() {
                        setTimeout(function(){
                            var focused = document.querySelector(scope.selector);     
                            if(focused !== null){
                                focused.focus();
                            }
                        },100);
                    });
                }
            };
        }
    ]);