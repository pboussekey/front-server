angular.module('elements').directive('panel', ['panel_service', function(panel_service){
    return {
        scope:{},
        resrict:'E',
        templateUrl:'app/shared/elements/panel/panel.template.html',
        link: function( $scope, element ) {
            var focusable_selector = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]";
            $scope.opened = false;
            $scope.launched = false;
            $scope.service = panel_service;

            $scope.$on('$destroy', function(){
                document.removeEventListener('keydown', onKeyDown, true);
            });

            $scope.launchClose = function(){
                if( panel_service.datas.launchClose ){
                    panel_service.datas.launchClose().then(closePanel);
                }else{
                    closePanel();
                }
            };

            $scope.launch = function(){
                setTimeout(function(){
                    $scope.$evalAsync(function(){
                        $scope.launched = true;
                    });
                },50);
            };

            panel_service.declareDirectiveMethods( openPanel, closePanel );

            // DECLARING FUNCTIONS...
            function openPanel(){
                $scope.opened = panel_service.opened = true;
                // LISTEN TO KEYDOWN TO CATCH FOCUSING.
                document.addEventListener('keydown', onKeyDown, true );
                // FOCUS
                $scope.$evalAsync(function(){
                    setTimeout(function(){
                        var focusable = element[0].querySelector(focusable_selector);
                        if( focusable ){
                            element[0].querySelector(focusable_selector).focus();
                        }
                    });
                });
            }

            function closePanel(){
                $scope.opened = panel_service.opened = $scope.launched = false;
                $scope.$evalAsync();
                // REMOVE DOCUMENT EVT LISTENER
                document.removeEventListener('keydown', onKeyDown, true);
                // FOCUS INITIAL REFERENCE !
                panel_service.domRef.focus();
                panel_service.clear();
            }

            function onKeyDown( e ){
                // IF NO MODAL OPENED OVER THE PANEL ...
                if( !e._modal ){
                    if(e.keyCode === 27 ){
                        $scope.launchClose();
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
