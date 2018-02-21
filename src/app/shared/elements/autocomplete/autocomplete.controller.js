angular.module('elements').controller('autocomplete_controller',
    ['$scope', '$element', '$q',  '$parse', '$attrs',
        function( scope,  element, $q, $parse, $attrs){
        scope.ended = false;
        scope.onScroll = function(){
             if (scope.loading) {
                 return;
            }
            scope.loading = true;
            if(scope.pagination && scope.pagination.p){
                scope.pagination.p++;
            }
            $q.when(scope.provider.apply(null,[scope.autocomplete.search].concat(scope.pagination)), function (result) {
                scope.items = (scope.items || []).concat(result);
                scope.ended = !result.length;
                scope.loading = false;
                close = element[0].querySelector('[autocomplete-close]:not([disabled]) > button');
                empty = element[0].querySelector('[autocomplete-empty]:not([disabled]) > button');

            }, function(){               
                scope.loading = false;
            });
        };
        
        
        scope.autocomplete = scope.autocompleteSearch || { search : scope.initialValue || "" };
        var content = element[0].querySelector('[autocomplete-content]'), input = element[0].querySelector('[autocomplete-input]'),
            focusable_selector = "[autocomplete-result]:not([disabled])", close, empty;
        scope.id = scope.autocompleteId || 'ACPL_'+ (Math.random()+'').slice(2);
        // SET ACCESSIBILITY ARIA ATTRIBUTES
        input.setAttribute('aria-haspopup', 'true');
        input.setAttribute('aria-expanded', 'false');
        content.setAttribute('aria-labelledby',element[0].id);
        content.setAttribute('aria-hidden','true');
        var timeout;
        scope.onChange= function(){
            if(null !== timeout){
                clearTimeout(timeout);
            }
            timeout = setTimeout(function(){
                scope.ended = false;
                scope.pagination = { n : scope.autocompletePagination, p : 1 };
                input.setCustomValidity( !scope.exactMatch || !scope.autocomplete.search || scope.autocomplete.search === scope.initialValue ? '' : scope.exactMatch);
                var search = scope.autocomplete.search;
                if( !element[0].classList.contains('opened') ){
                    open();
                }
                scope.items = [];
                if(!scope.minLength || (scope.autocomplete.search && scope.autocomplete.search.length >= scope.minLength)){
                    scope.loading = true;
                    scope.provider(scope.autocomplete.search, scope.pagination ).then(function (result) {
                        if(search !== scope.autocomplete.search){
                            return;
                        }
                        scope.items = result;
                        scope.loading = false;
                        close = element[0].querySelector('[autocomplete-close]:not([disabled]) > button');
                        empty = element[0].querySelector('[autocomplete-empty]:not([disabled]) > button');
                    }, function(){ 
                        scope.items = [];
                        scope.loading = false;
                    });
                }
                else{
                    return [];
                }
            },500);
          
        };
        
        

        function focusedIndex(){
            var focusables = content.querySelectorAll(focusable_selector);
            return document.activeElement === input ? -1 : Array.prototype.indexOf.call(focusables, document.activeElement);
        }
        
        function onkeydown(e){
            if([38, 40].indexOf(e.keyCode) !== -1 || (e.keyCode === 13 && document.activeElement === input)){
                e.preventDefault();
            }
        }
        
        function onkeyup(e){
            if( e.keyCode === 9 ){ // Tab or Maj+tab   
                if( focusedIndex() === -1 
                        && document.activeElement !== input 
                        && document.activeElement !== close){
                    scope.close();
                    if(close){
                        input.focus();
                    }
                }
            }
            var focusables = content.querySelectorAll(focusable_selector);            
            if( e.keyCode === 13 && document.activeElement === input){
                if(focusables.length){
                    focusables[0].click();
                    e.preventDefault();
                }
            }
            if (e.keyCode === 40) {
                var index = (focusedIndex() + 1) % focusables.length;
                if(index >= focusables.length){
                    scope.close();
                }
                else{
                    focusables[index].focus();
                }
            } else if (e.keyCode === 38) {
                var index = focusedIndex() - 1;
                if(index < 0){
                    input.focus();
                }
                else{
                    focusables[index].focus();
                }
            }
        }

        function onclick( e ){
            if(scope.exactMatch){
                var focusables = content.querySelectorAll(focusable_selector); 
                if(focusables.length && Array.prototype.some.call(focusables,function(focusable){
                    return focusable.contains(e.target);
                })){
                    input.setCustomValidity("");
                }
            }
            if(e.target !== input && e.target !== empty){
                scope.close();
            }
        }

        function open(){
            if(!scope.minLength || 
                (scope.autocomplete.search && scope.autocomplete.search.length >= scope.minLength)){
                scope.opened = true;
                element[0].classList.add('opened');
                document.addEventListener('click', onclick, true );
                document.addEventListener('keyup', onkeyup, true );
                document.addEventListener('keydown', onkeydown, true ); 
                // ACCESSIBILITY ATTRIBUTES UPDATES
                input.setAttribute('aria-expanded', 'true');
                content.setAttribute('aria-hidden','false');
            }
        }
      
        scope.close = function(){
            setTimeout(function(){
                scope.opened = false;
                element[0].classList.remove('opened');
                document.removeEventListener('click', onclick, true);
                document.removeEventListener('keyup', onkeyup, true );
                document.removeEventListener('keydown', onkeydown, true );
                // ACCESSIBILITY ATTRIBUTES UPDATES
                input.setAttribute('aria-expanded', 'false');
                content.setAttribute('aria-hidden','true');
                scope.items = [];
                
            });
        };
        
        if($parse($attrs.autocompleteSearch).assign){
            scope.search = scope.autocomplete;
        }
        
        
        scope.$watch('initialValue', function(){
            scope.autocomplete.search = scope.initialValue || "";
        });
        scope.$on('$destroy', function(){
            document.removeEventListener('click', onclick, true);
            document.removeEventListener('keyup', onkeyup, true );
            document.removeEventListener('keydown', onkeydown, true );
        });
    }
]);