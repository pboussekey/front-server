angular.module('elements')
    .directive('imageOnload',['filters_functions', function(filters_functions){
        return {
            scope : {
              url : "@imageOnload",
              size : "=imageSize",
              onerror : "=onerror"
            },
            link : function(scope, element){
                var original;
                var falseimg = new Image();
                var img = new Image();
                function onload(){
                    original = !scope.size;
                    if(scope.url ){
                        element[0].classList.remove("loaded");
                        element[0].classList.remove("preloaded");
                        element[0].classList.remove("error");
                        element[0].style.backgroundImage = "";
                        falseimg.src = "";
                        img.src = "";
                        if(scope.size && scope.url.indexOf('//') === -1){
                            var falseurl = filters_functions.dmsLink(scope.url, [ parseInt(scope.size[0] / 5), scope.size[1], parseInt(scope.size[2] / 5)]);

                            falseimg.onload = function(){
                              if(!element[0].classList.contains('loaded')){
                                  element[0].style.backgroundImage = "url('"+ falseurl + "')";
                                  element[0].classList.add("preloaded");
                              }
                            };
                            falseimg.src = falseurl;
                        }
                        var url = scope.size && scope.url.indexOf('//') === -1 ? filters_functions.dmsLink(scope.url, scope.size) : scope.url;
                        img.onerror = function(){
                            if(!original){
                                url = filters_functions.dmsLink(scope.url);
                                original = true;
                            }
                            element[0].classList.add("loaded");
                            element[0].classList.add("error");
                            if(scope.onerror){
                                scope.onerror();
                            }
                            element[0].style.backgroundImage = "url('"+ url + "')";
                        };
                        img.onload = function () {
                           element[0].style.backgroundImage = "url('"+ url + "')";
                           element[0].classList.add("loaded");
                        };
                        img.src = url;



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
