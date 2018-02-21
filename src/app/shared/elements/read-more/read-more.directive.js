angular.module('elements')
    .directive('readMore',['$timeout',
        function($timeout){
    
            return {
                scope:{
                    readMore: '@',
                    onrefresh: '='
                },
                link:function(scope, element){
                    scope.onrefresh = function(){
                        $timeout(function(){
                            var el = document.querySelector(scope.readMore);
                            if(!el || el.scrollHeight <= el.offsetHeight){
                                 element[0].classList.add('hide');
                            }
                            else{
                                element[0].classList.remove('hide');
                            }
                        });
                    };
                    scope.onrefresh();
                }
           };
        }
    ]);