
angular.module('elements')
    .directive('dndDropzone',['events_service',
        function( events_service ){

            var dragZone = undefined;

            document.body.addEventListener('dragenter', onBodyDragEnter, true );
            document.body.addEventListener('dragleave', onBodyDragLeave, true );

            function onBodyDragEnter( event ){
                if( !dragZone ){
                    events_service.process('dnd.drag.start', event);
                }
                dragZone = event.target;
            }

            function onBodyDragLeave( event ){
                if( dragZone === event.target ){
                    dragZone = undefined;
                }
                if( !dragZone ){
                    events_service.process('dnd.drag.stop');
                }
            }

            return {
                restrict:'A',
                scope:{
                    options: '=dndDropzone'
                    /*
                        options = {
                            id: dropzoneID,
                            enabling_class: 'Default class to add when zone is enabled',
                            target_class: 'Default class to add on target element',
                            ondrop: function( event ){},
                            onchange: function( event, data ){},
                            onenter: function( event ){},
                            onleave: function( event ){},
                            checkdrag: function( event ){ return true/false; },
                            modes: {
                                modeName: {
                                    target_class: '',
                                    enabling_class: '',
                                    onstart: function(){ return promise; }, // TRIGGERED BY 'dnd.mode:MODENAME.start' event
                                    onstop: function(){ return promise; }, // TRIGGERED BY 'dnd.mode:MODENAME.stop' event
                                    ondrop: function( event ){} // TRIGGERED BY DROP IN ZONE if mode is started.
                                }, ...
                            },
                            after_selector: 'CSS_SELECTOR to set as target on after change event',
                            before_selector: 'CSS_SELECTOR to set as target on before change event',
                            insert_selector: 'CSS_SELECTOR to set as target on insert change event',
                        }
                    */
                },
                link: function( scope, element ){

                    var enabling_class = scope.options.enabling_class || 'dz-enabled',
                        target_class = scope.options.target_class || 'dz-target',
                        actives_modes = [],
                        events_stack = [],
                        target,
                        changePromise,
                        id = scope.options.id,

                        after_selector = scope.options.after_selector||'.drop_after',
                        before_selector = scope.options.before_selector||'.drop_before',
                        insert_selector = scope.options.insert_selector||'.drop_in';


                    element[0].addEventListener('drop', onDrop );
                    element[0].addEventListener('dragover', onDragOver );
                    element[0].addEventListener('dragenter', onDragEnter );
                    element[0].addEventListener('dragleave', onDragLeave );
                    element[0].addEventListener('dragexit', onDragExit );

                    // BIND EVENTS
                    events_stack.push( events_service.on('dnd.drag.start', launchZone ) );
                    events_stack.push( events_service.on('dnd.drag.stop', stopZone ) );
                    events_stack.push( events_service.on('dnd.dropzone:'+id+'.change',change) );

                    if( scope.options.modes && Object.keys( scope.options.modes ).length ){

                        Object.keys( scope.options.modes ).forEach(function(name){
                            // LISTEN TO MODE START EVENT
                            events_stack.push( events_service.on('dnd.mode:'+name+'.start', function( event ){
                                if( scope.options.modes[name].onstart ){
                                    scope.options.modes[name].onstart( event, element[0] ).then(function(){ launchMode(name); });
                                }else{
                                    launchMode(name);
                                }
                            }) );
                            // LISTEN TO MODE STOP EVENT
                            events_stack.push( events_service.on('dnd.mode:'+name+'.stop', function( event ){
                                if( scope.options.modes[name].onstop ){
                                    scope.options.modes[name].onstop( event, element[0] ).then(function(){ stopMode(name); });
                                }else{
                                    stopMode(name);
                                }
                            }) );
                        });
                    }

                    function launchMode( name ){
                        actives_modes.push( name );

                        if( dragZone ){
                            if( scope.options.modes[name] && scope.options.modes[name].enabling_class ){
                                element[0].classList.add( scope.options.modes[name].enabling_class );
                            }
                            setTargetEffect();
                        }
                    }

                    function stopMode( name ){
                        var idx = actives_modes.indexOf( name );
                        if( idx !== -1 ){
                            actives_modes.splice( idx, 1 );
                        }

                        if( scope.options.modes[name] && scope.options.modes[name].enabling_class ){
                            element[0].classList.remove( scope.options.modes[name].enabling_class );
                        }
                        if( target && target.classList && scope.options.modes[name] && scope.options.modes[name].target_class ){
                            target.classList.remove( scope.options.modes[name].target_class );
                        }
                    }

                    function launchZone(){
                        // ENABLE DROP ELEMENTS ( VIA CSS - DEFAULT CLASS )
                        element[0].classList.add( enabling_class );

                        // ADD ACTIVES MODES CLASSES
                        actives_modes.forEach(function(mode){
                            if( scope.options.modes[mode].enabling_class ){
                                element[0].classList.add( scope.options.modes[mode].enabling_class );
                            }
                        });

                        // BIND DND EVENTS
                        element[0].addEventListener('drop', onDrop );
                        element[0].addEventListener('dragover', onDragOver );
                        element[0].addEventListener('dragenter', onDragEnter );
                        element[0].addEventListener('dragleave', onDragLeave );
                        element[0].addEventListener('dragexit', onDragExit );
                    }

                    function stopZone(){
                        // UNBIND DND EVENTS
                        element[0].removeEventListener('drop', onDrop );
                        element[0].removeEventListener('dragover', onDragOver );
                        element[0].removeEventListener('dragenter', onDragEnter );
                        element[0].removeEventListener('dragleave', onDragLeave );
                        element[0].removeEventListener('dragexit', onDragExit );

                        // REMOVE ACTIVES MODES CLASSES
                        actives_modes.forEach(function(mode){
                            if( scope.options.modes[mode].enabling_class ){
                                element[0].classList.remove( scope.options.modes[mode].enabling_class );
                            }
                        });

                        // DISABLE DROP ELEMENTS ( VIA CSS )
                        removeTargetEffect();
                        element[0].classList.remove( enabling_class );
                    }

                    function setTargetEffect(){
                        if( target && target.classList ){
                            target.classList.add( target_class );

                            // REMOVE ACTIVES MODES CLASSES
                            actives_modes.forEach(function(mode){
                                if( scope.options.modes[mode].target_class ){
                                    target.classList.add( scope.options.modes[mode].target_class );
                                }
                            });
                        }
                    }

                    function removeTargetEffect( element ){
                        if( element && element.classList ){
                            element.classList.remove( target_class );

                            // REMOVE ACTIVES MODES CLASSES
                            actives_modes.forEach(function(mode){
                                if( scope.options.modes[mode].target_class ){
                                    element.classList.remove( scope.options.modes[mode].target_class );
                                }
                            });
                        }
                    }

                    function onDragOver( event ){
                        event.preventDefault();
                    }

                    function onDrop( event ){
                        event.preventDefault();
                        event.stopPropagation();

                        removeTargetEffect( target );
                        onBodyDragLeave( event );

                        // IF DRAG CHECK EXIST, CHECK BEFORE LAUNCH DROP.
                        if( !scope.options.checkdrag || scope.options.checkdrag(event) ){
                            if( scope.options.ondrop ){
                                scope.options.ondrop( event );
                            }

                            actives_modes.forEach(function( mode ){
                                if( scope.options.modes[mode].ondrop ){
                                    scope.options.modes[mode].ondrop( event );
                                }
                            });
                        }
                    }

                    function onDragEnter( event ){
                        removeTargetEffect( target );

                        if( event.target && event.target.classList ){
                            target = event.target;
                            document.querySelectorAll('.'+scope.options.target_class ).forEach(removeTargetEffect);

                            if( !scope.options.checkdrag || scope.options.checkdrag(event) ){
                                setTargetEffect();
                            }
                        }else{
                            console.log('Incorrect target', event );
                        }

                        if( scope.options.onenter && (!scope.options.checkdrag || scope.options.checkdrag(event) ) ){
                            scope.options.onenter( event );
                        }
                    }

                    function onDragLeave( event ){
                        removeTargetEffect( event.target );

                        if( scope.options.onleave && ( !scope.options.checkdrag || scope.options.checkdrag(event) ) ){
                            scope.options.onleave( event );
                        }
                    }

                    function onDragExit( event ){
                        removeTargetEffect( event.target );
                    }

                    scope.$on('$destroy',function(){
                        events_stack.forEach(function( listenerID ){
                            events_service.off( undefined, listenerID );
                        });
                    });

                    function change( event ){
                        var c = event.datas[0],
                            modes = event.datas[1],
                            data = event.datas[2];

                        if( changePromise ){
                            changePromise = changePromise.then(function(){
                                if( scope.options.onchange && !changePromise ){
                                    return scope.options.onchange( c, data ).then(function(){
                                        applyChange( c, modes );
                                    });
                                }else{
                                    applyChange( c, modes );
                                }
                            });
                        }
                        if( scope.options.onchange && !changePromise ){
                            changePromise = scope.options.onchange( c, data ).then(function(){
                                applyChange( c, modes );
                            });
                        }else{
                            applyChange( c, modes );
                        }

                        if( changePromise ){
                            var buffer = changePromise;
                            buffer.then(function(){
                                if( buffer === changePromise ){
                                    changePromise = undefined;
                                }
                            });
                        }
                    }

                    function applyChange( action, modes ){
                        if( action === 'before' ){
                            changeStart( before_selector, modes );
                        }else if( action === 'after' ){
                            changeStart( after_selector, modes );
                        }else if( action === 'insert'){
                            changeStart( insert_selector, modes );
                        }else if( action === 'leave' ){
                            element[0].classList.remove( enabling_class );
                            if( modes && modes.length ){
                                modes.forEach(function(name){
                                    if( scope.options.modes[name].enabling_class ){
                                        element[0].classList.remove( scope.options.modes[name].enabling_class );
                                    }
                                });
                            }
                            removeChangeTargetEffect( modes );
                        }
                    }

                    function changeStart( selector, modes ){
                        // SET ENABLING CLASSES
                        element[0].classList.add( enabling_class );
                        if( modes && modes.length ){
                            modes.forEach(function(name){
                                if( scope.options.modes[name].enabling_class ){
                                    element[0].classList.add( scope.options.modes[name].enabling_class );
                                }
                            });
                        }

                        // REMOVE CHANGE TARGET EFFECT
                        removeChangeTargetEffect( modes );

                        // ADD TARGET EFFECT
                        var di = element[0].querySelector(selector);
                        if( di ){
                            di.classList.add( target_class );
                            if( modes && modes.length ){
                                modes.forEach(function(name){
                                    if( scope.options.modes[name].target_class ){
                                        di.classList.add( scope.options.modes[name].target_class );
                                    }
                                });
                            }
                        }
                    }

                    function removeChangeTargetEffect( modes ){
                        var dts = element[0].querySelectorAll(after_selector+','+before_selector+','+insert_selector);
                        if( dts ){
                            dts.forEach(function(dt){
                                dt.classList.remove( target_class );
                                if( modes && modes.length ){
                                    modes.forEach(function(name){
                                        if( scope.options.modes[name].target_class ){
                                            dt.classList.remove( scope.options.modes[name].target_class );
                                        }
                                    });
                                }
                            });
                        }
                    }

                }
            };
        }
    ]);
