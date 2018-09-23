angular.module('elements').directive('dropdown',function(){
    return {
        link:function( scope, element){
            var toggle = element[0].querySelector('[dropdown-toggle]'),
                panel = element[0].querySelector('[dropdown-content]'),
                focusable_selector = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]";

            // SET ACCESSIBILITY ARIA ATTRIBUTES
            toggle.setAttribute('aria-haspopup', 'true');
            toggle.setAttribute('aria-expanded', 'false');

            if( !toggle.id ){
                toggle.id = 'DD_'+ (Math.random()+'').slice(2);
            }

            var closebutton = document.createElement("BUTTON");
            closebutton.className = "i-return dropdown-close i2";
            toggle.prepend(closebutton);
            closebutton.addEventListener('click', close);

            panel.setAttribute('aria-labelledby',toggle.id);
            panel.setAttribute('aria-hidden','true');

            // BIND EVENTS
            toggle.addEventListener('click', function(e){
                if( !element[0].classList.contains('opened') ){
                    open();
                }
            });

            function open(){
                element[0].classList.add('opened');
                var firstElement = panel.querySelector( focusable_selector );
                if(null !== firstElement){
                    firstElement.focus();
                }
                document.addEventListener('click', onclick, true );
                document.addEventListener('keyup', onkeyup, true );

                // ACCESSIBILITY ATTRIBUTES UPDATES
                toggle.setAttribute('aria-expanded', 'true');
                panel.setAttribute('aria-hidden','false');
            }

            function onkeyup(e){
                if( e.keyCode === 9 ){ // Tab or Maj+tab
                    var focusables = panel.querySelectorAll(focusable_selector);
                    var index = Array.prototype.indexOf.call(focusables, document.activeElement);

                    if( index === -1 && document.activeElement !== toggle ){
                        close();
                    }
                }
            }

            function onclick( e ){
                if( panel.contains(e.target) ){
                    var focusables = panel.querySelectorAll(focusable_selector);
                    if( Array.prototype.some.call(focusables,function(elt){ return elt === e.target || elt.contains(e.target);}) ){
                        close();
                        setTimeout(function(){
                            toggle.focus();
                        });
                    }
                }else{
                    close();
                }
            }

            function close(){
                setTimeout(function(){
                    element[0].classList.remove('opened');
                    document.removeEventListener('click', onclick, true);
                    document.removeEventListener('click', onkeyup, true);

                    // ACCESSIBILITY ATTRIBUTES UPDATES
                    toggle.setAttribute('aria-expanded', 'false');
                    panel.setAttribute('aria-hidden','true');
                });
            }
        },
        template:'<ng-transclude></ng-transclude>',
        transclude: true,
        restrict: 'A'
   };
});
