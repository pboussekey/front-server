
angular.module('elements')
    .directive('dndDraggable',['events_service',
        function( events_service ){
            var codes = [13,32,38,40];
            return {
                restrict:'A',
                scope:{
                    options: '=dndDraggable'
                    /*
                        {
                            transfer_type: 'text/plain',
                            data: 'YOUR TRANSFER DATA', // WILL BE JSON ENCODED
                            drag_image: DATATRANSFER_DRAGIMAGE ( DOM ELEMENT, ... ),
                            drag_image_x: DRAGIMAGE X OFFSET,
                            drag_image_y: DRAGIMAGE Y OFFSET,
                            effect_allowed: 'move/copy/all ...',
                            start_event: 'EVENT NAME TO PROCESS',
                            stop_event: 'EVENT NAME TO PROCESS',
                            onkeydown: 'EVENT TO PROCESS WHEN ELT IS FOCUS & KEYDOWN',
                        }
                     */
                },
                link: function( scope, element, attrs ){
                    var destroyed = false, dragging = false;

                    // SET ELEMENT DRAGGABLE
                    element[0].setAttribute('draggable', true);
                    // DND EVENTS
                    element[0].addEventListener('dragstart', onDragStart );
                    element[0].addEventListener('dragend', onDragEnd );
                    // SET ELEMENT FOCUSABLE
                    element[0].setAttribute('tabindex', '0');
                    // WCAG KEYBOARD EVENTS
                    element[0].addEventListener('keydown', onKeyDown );
                    element[0].addEventListener('blur', onBlur );

                    scope.$on('$destroy', function(){
                        // Set destroyed at true.
                        destroyed = true;
                        // Try to clear.
                        clearAll();
                    });

                    function onBlur( event ){
                        if( scope.options.onblur ){
                            scope.options.onblur( event );
                        }
                    }

                    function onKeyDown( event ){
                        if( codes.indexOf( event.keyCode ) !== 1 && scope.options.onkeydown ){
                            scope.options.onkeydown( event );
                        }
                    }

                    function onDragStart( event ){
                        dragging = true;
                        if( scope.options.onstart ){
                            scope.options.onstart();
                        }
                        event.dataTransfer.setData( scope.options.transfer_type || 'text/plain', JSON.stringify(scope.options.data || '') );
                        event.dataTransfer.effectAllowed = scope.options.effect_allowed || "all";
                        event.dataTransfer.setDragImage( scope.options.drag_image || element[0] , scope.options.drag_image_x||0, scope.options.drag_image_y||0);
                        // Set global dragged value. ( Dirty, need to rewrite draggable + dropzone directive ).
                        window._draggedData = scope.options.data;
                        // Process drag start event if defined
                        if( scope.options.start_event ){
                            events_service.process( scope.options.start_event, scope.options.data, event );
                        }
                    }

                    function onDragEnd(){
                        if( scope.options.onstop ){
                            scope.options.onstop();
                        }
                        // Remove global dragged value.
                        window._draggedData = undefined;
                        // Process drag stop event if defined.
                        if( scope.options.stop_event ){
                            events_service.process( scope.options.stop_event, scope.options.data );
                        }
                        // Set dragging to false & try to clear.
                        dragging = false;
                        clearAll();
                    }
                    // Clear all listeners if element is not currently dragged.
                    function clearAll(){
                        if( !dragging && destroyed ){
                            element[0].removeEventListener('keydown', onKeyDown );
                            element[0].removeEventListener('blur', onBlur );
                            element[0].removeEventListener('dragstart', onDragStart );
                            element[0].removeEventListener('dragend', onDragEnd );
                        }
                    }
                }
            };
        }
    ]);
