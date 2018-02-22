angular.module('elements')
    .directive('followScroll',[
        function(  ){
            return {
                restrict: 'A',
                link: function( scope, element ){
                    var last_scroll = 0;
                    element[0].style.position = 'absolute';
                    element[0].style.top = '0px';
                    function onScroll(){
                        var delta =  window.scrollY - last_scroll;
                        var element_height = element[0].offsetHeight;
                        var element_scroll = parseInt(element[0].style.top.replace('px',''));
                        var scroll_height = window.innerHeight;
                        var scroll_Y = window.scrollY;
                        last_scroll = window.scrollY;
                        if(delta > 0){
                            if(scroll_Y > element_scroll && scroll_height >= element_height){
                                element[0].style.top = scroll_Y + 'px';
                            }
                            else if(scroll_Y + scroll_height > element_scroll + element_height && scroll_height < element_height){
                                element[0].style.top = (scroll_Y - element_height + scroll_height) + 'px';
                            }
                        }
                        else if(delta < 0){
                            if(scroll_Y < element_scroll){
                                element[0].style.top = scroll_Y + 'px';
                            }
                        }
                    };
                    window.addEventListener('scroll', onScroll, true);

                    scope.$on('$destroy', function() {
                       window.removeEventListener('scroll', onScroll, true);
                    });
                }
            };
        }
    ]);