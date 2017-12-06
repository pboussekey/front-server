angular.module('elements')
    .directive('imageOnload',['filters_functions', function(filters_functions){
        return {
            scope : {
              url : "@imageOnload",
              onerror : "=onerror"
            },
            link : function(scope, element){
                function onload(){
                    if(scope.url ){      
                        element[0].classList.remove("loaded");      
                        var img = new Image();
                        img.onerror = function(){
                            element[0].classList.add("loaded");   
                            element[0].classList.add("error");  
                            if(scope.onerror){ 
                                scope.onerror();
                            }
                        }
                        img.onload = function () {
                           element[0].classList.add("loaded");
                        };
                        img.src = scope.url;
                    }
                    else{
                        element[0].classList.add("loaded");
                    }
                }
                
                
               onload();
                scope.$watch("url", function(next, previous){
                    if(next !== previous){
                        onload();
                    }
                });
            },
            restrict: 'A'
        };
    }]);