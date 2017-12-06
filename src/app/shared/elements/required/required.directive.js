
angular.module('elements')
    .directive('required',[
        function(){
            return {
                restrict: 'A',
                link: function( scope , element){
                    element[0].setAttribute('aria-required','true');
                }
            };
        }
    ]);