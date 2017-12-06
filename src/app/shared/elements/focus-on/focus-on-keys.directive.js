
angular.module('elements')
    .directive('focusOnKeys',[
        function(  ){
            return {
                restrict: 'A',
                scope:{
                    selector:'@focusOnKeys',
                    keys:"="
                },
                link: function( scope, element ){
                    element[0].addEventListener('keydown', function(e){
                        setTimeout(function(){
                            if(scope.keys.indexOf(e.keyCode) !== -1){
                                var focused = document.querySelector(scope.selector);   
                                if(focused !== null){
                                    focused.focus();
                                }
                            }
                        });
                    }, true );
                }
            };
        }
    ]);