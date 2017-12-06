
angular.module('elements')
    .directive('dta',[function(){
        return {
            restrict: 'A',
            scope: {
                text: '=dta'
            },
            template:'<ng-transclude></ng-transclude>',
            transclude: true,
            link: function( scope, element ){                
                var ta = element[0].querySelector('textarea'),
                    ta_copier = element[0].querySelector('div[aria-hidden]');
                
                if( ta && ta_copier ){
                    ta.addEventListener('keyup', copy);
                    ta.addEventListener('paste', copy);
                    ta.addEventListener('keydown', copy);
                }
                
                function copy(){
                    if( ta && ta_copier ){
                        ta_copier.innerHTML = ta.value+'\n';
                    }
                }
                
                scope.$watch('text', function(a, b){
                    if( ta && ta_copier ){
                        setTimeout(copy);
                    }                    
                });
                
                setTimeout(copy);
            }
        };
    }]);