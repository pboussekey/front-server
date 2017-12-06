angular.module('elements')
    .directive('infiniteScroll',function(){
        return {
            scope : {
                args: "=infiniteScroll" // { cb: callback, container: Selector|Element , distance: 10, reverse: true/false }
            },
            link : function(scope, element){                
                var container = element[0],
                    distance = parseInt(scope.args.distance) || 0,
                    reverse = !!scope.args.reverse;
                
                if( scope.args.container ){
                    if( scope.args.container === 'window' ){
                        container = document.body;
                    }else if( typeof scope.args.container === 'string' ){
                        container = document.querySelector(scope.args.container) || element[0];
                    }else if( scope.args.container instanceof Element ){                    
                        container = scope.args.container;
                    }
                }
                
                // BIND EVENTS
                var bindedElement = container === document.body ? window: container;
                bindedElement.addEventListener('scroll', checkForUpdate );
                scope.$on('$destroy',function(){
                    bindedElement.removeEventListener('scroll', checkForUpdate );
                });
                
                // CHECK FOR UPDATE
                function checkForUpdate(e){
                    var scrollTop = container === document.body ? window.scrollY :  container.scrollTop;
                    
                    if( scope.args.cb 
                        && ( (!reverse && scrollTop + container.offsetHeight >= container.scrollHeight - distance )
                            || (reverse && scrollTop < distance) ) ){
                        scope.args.cb();
                    }
                }
            },
            restrict: 'A'
        };
    });