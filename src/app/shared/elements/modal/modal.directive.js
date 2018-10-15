angular.module('elements').directive('modal', ['modal_service', function(modal_service){
    return {
        scope:{},
        resrict:'E',
        templateUrl:'app/shared/elements/modal/template.html',
        link: function($scope, element ) {
            var focusable_selector = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not(#back-to-top), iframe, object, embed, [tabindex], [contenteditable]";

            $scope.ctrl = modal_service;

            $scope.clickOnOverlay = function(){
                if( !modal_service.blocked ){
                    modal_service.close();
                }
            };

            $scope.onLoad = function(){
                setTimeout(function(){
                    var focusables = element[0].querySelectorAll( focusable_selector );
                    if(focusables.length){
                        focusables[focusables.length > 2 ? 2 : 0].focus();
                    }
                },100);
            };

            document.addEventListener('keydown', onKeyDown, true );
            element[0].querySelector('.modaloverlay').addEventListener('mousewheel', onMouseWheel, true );

            $scope.$on('$destroy', function(){
                document.removeEventListener('keydown', onKeyDown);
                element[0].querySelector('.modaloverlay').removeEventListener('mousewheel', onMouseWheel, true );
            });

            function onMouseWheel(e){
                if(e.target.classList.contains("modaloverlay")){
                    e.preventDefault();
                }
            }

            function onKeyDown( e ){
                if( modal_service.opened ){
                    // INDICATE THAT THIS EVENT HAPPENED WITH MODAL OPENED.
                    e._modal = true;

                    if(e.keyCode === 27 ){
                        $scope.$evalAsync(function(){ // Esc
                            modal_service.close();
                        });
                    }else if( e.keyCode === 9 ){ // Tab or Maj+tab
                        var focusables = element[0].querySelectorAll(focusable_selector);
                        var index = Array.prototype.indexOf.call(focusables, document.activeElement);

                        if( index === -1 ){
                            element[0].querySelector( focusable_selector ).focus();
                            e.preventDefault();
                        }else if( index === focusables.length-1 && !e.shiftKey ){
                            focusables[0].focus();
                            e.preventDefault();
                        }else if( index === 0 && e.shiftKey ){
                            focusables[focusables.length-1].focus();
                            e.preventDefault();
                        }
                    }
                }
            }
        }
    };
}]);
