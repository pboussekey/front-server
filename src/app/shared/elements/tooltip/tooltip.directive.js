angular.module('elements').directive('tooltip', function(){
    return {
        link:function( scope, element){
            var toggle = element[0].querySelector('[tooltip-toggle]'),
                panel = element[0].querySelector('[tooltip-content]'),
                focusable_selector = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]";

            // SET ACCESSIBILITY ARIA ATTRIBUTES
            toggle.setAttribute('aria-haspopup', 'true');
            toggle.setAttribute('aria-expanded', 'false');

            if( !toggle.id ){
                toggle.id = 'DD_'+ (Math.random()+'').slice(2);
            }

            panel.setAttribute('aria-labelledby',toggle.id);
            panel.setAttribute('aria-hidden','true');

            // BIND EVENTS
            toggle.addEventListener('mouseover', function(e){
                open();
            });

            element[0].addEventListener('mouseout', close, true);

            function open(){
                element[0].classList.add('opened');
                var firstElement = panel.querySelector( focusable_selector );
                if(null !== firstElement){
                    firstElement.focus();
                }

                // ACCESSIBILITY ATTRIBUTES UPDATES
                toggle.setAttribute('aria-expanded', 'true');
                panel.setAttribute('aria-hidden','false');
            }


            function close(){
                element[0].classList.remove('opened');

                // ACCESSIBILITY ATTRIBUTES UPDATES
                toggle.setAttribute('aria-expanded', 'false');
                panel.setAttribute('aria-hidden','true');
            }
        },
        template:'<ng-transclude></ng-transclude>',
        transclude: true,
        restrict: 'A'
   };
});
