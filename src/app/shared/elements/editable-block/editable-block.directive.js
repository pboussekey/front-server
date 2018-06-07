angular.module('elements').directive('editableBlock',['$compile', '$timeout', function( $compile, $timeout){
    return {
        link:function( scope, element){

            var focusable_selector = "[contenteditable], a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([editable-button]):not([disabled]), iframe, object, embed, [tabindex], [contenteditable]";
            $timeout(function(){
                if(!element[0].classList.contains("disabled")){
                    var editButton = element[0].querySelector('[editable-button]');
                        function focusForm(forced){
                            var focusables = element[0].querySelectorAll(focusable_selector);
                            var index = Array.prototype.indexOf.call(focusables, document.activeElement);
                            $timeout(function(){
                                if(index === -1 && (forced || !element[0].classList.contains("editing") || !element[0].classList.contains("inline-form"))){
                                    var form =  scope.form ? document.querySelector('[editable-form]' + scope.form) : element[0].querySelector('[editable-form]');
                                    if(form !== null){
                                        var focusedElement = form.querySelector(focusable_selector);
                                        if(focusedElement !== null){
                                            focusedElement.focus();
                                        }
                                    }
                                }
                            });
                        }

                    if( editButton === null){
                        editButton = angular.element("<button type='button' class='default i-pencil' editable-button>{{ editing ? 'Editing' : '' }}</div>");
                        $compile(editButton)(scope);
                        element.append(editButton);
                        editButton = element[0].querySelector('[editable-button]');
                    }

                    var content =  element[0].querySelector('[editable-content]');
                    editButton.addEventListener('click', function(e){
                        (content !== null ? content : element[0]).click();
                        focusForm(true);
                    }, true );
                    element[0].addEventListener('click', focusForm, true );
                }
            });


        },
        scope : {
          form : "@editableBlock"
        },
        restrict: 'A'
   };
}]);
