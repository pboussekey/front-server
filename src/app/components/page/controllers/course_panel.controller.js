angular.module('page').controller('course_panel_controller',
    ['$scope','$element','items_childs_model','items_model','course_panel_service','$translate','notifier_service',
        function( $scope, $element, items_childs_model, items_model, course_panel_service, $translate, notifier_service ){
            var ctrl = this;
            
            // MANAGE WCAG. ( FOCUS MANAGEMENT )
            var mainContainer = document.querySelector('#layout_container main'),
                focusable_selector = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]";
            
            // LISTEN TO KEYDOWN TO CATCH FOCUSING.
            document.addEventListener('keyup', onKeyUp, true );
            
            $scope.$on('$destroy', function(){
                document.removeEventListener('keyup', onKeyUp);
            });

            function onKeyUp( e ){
                if( ctrl.opened ){    
                    if(e.keyCode === 27 ){
                        $scope.$evalAsync(function() { // Esc
                            ctrl.close();
                        });
                    }else if( e.keyCode === 9 ){ // Tab or Maj+tab   
                        if( !$element[0].contains(document.activeElement)
                            && mainContainer.contains(document.activeElement) ){
                            $element[0].querySelector(focusable_selector).focus();
                        }
                    }                    
                }
            }
            
            
            ctrl.open = function( mode, options ){
                
                // FOCUS
                setTimeout(function(){
                    $element[0].querySelector(focusable_selector).focus();
                });
            };
            
            
            ctrl.close = function(){
                
                
            };
            
            
            
        }
    ]);