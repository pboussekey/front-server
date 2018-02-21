angular.module('elements')
    .directive('readMore',['$timeout',
        function($timeout){
    
            return {
                scope:{
                    readMore: '@',
                },
                link:function(scope, element){
                    $timeout(function(){
                        var el = document.querySelector(scope.readMore);
                        if(el.scrollHeight <= el.offsetHeight){
                             element[0].classList.add('hide');
                        }
                    });
                }
           };
        }
    ]);