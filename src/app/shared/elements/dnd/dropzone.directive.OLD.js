
angular.module('elements')
    .directive('dndOLDDropzone',['events_service',
        function( events_service ){
            
            return {
                restrict:'A',
                scope:{
                    options: '=dndDropzone'
                },
                link: function( scope, element ){     
                    var target = undefined, 
                        mode, 
                        changePromise,
                        listeners = [], 
                        id = scope.options.id,
                        after_selector = scope.options.after_selector||'.drop_after',
                        before_selector = scope.options.before_selector||'.drop_before',
                        insert_selector = scope.options.insert_selector||'.drop_in';
                    
                    scope.$on('$destroy',function(){
                        listeners.forEach(function( lid ){
                            events_service.off( undefined, lid );
                        });
                    });
                    
                    // ADD DIRECT CHANGE EVENT LISTENER.
                    listeners.push( events_service.on('dnd.dropzone#'+id+'.change',change) );
                    
                    if( scope.options && scope.options.events ){
                        // ITERATE ON EACH CONFIGURATIONS.
                        Object.keys(scope.options.events).forEach(function( key ){
                            var c = scope.options.events[key];
                            
                            if( c.start_event && c.stop_event ){
                                // BIND START EVENT
                                listeners.push( events_service.on( c.start_event, function( event ){
                                    mode = key;
                                    
                                    if( c.onstart ){
                                        c.onstart( event, element[0] ).then( start );
                                    }else{
                                        start();
                                    }                                    
                                }) );                                
                                // BIND STOP EVENT
                                listeners.push( events_service.on( c.stop_event, function( event ){
                                    if( c.onstop ){
                                        c.onstop( event, element[0] ).then( stop );
                                    }else{
                                        stop();
                                    }
                                }) );                                
                            }
                        });
                    }                    
                    
                    function start(){
                        // ENABLE DROP ELEMENTS ( VIA CSS )
                        element[0].classList.add('drop-enable');
                        
                        if( scope.options && scope.options.events && scope.options.events[mode].classList ){
                            scope.options.events[mode].classList.forEach(function( c ){
                                element[0].classList.add( c );
                            });
                        }
                        
                        // BIND DND EVENTS
                        element[0].addEventListener('drop', onDrop );
                        element[0].addEventListener('dragover', onDragOver );
                        element[0].addEventListener('dragenter', onDragEnter );
                        element[0].addEventListener('dragleave', onDragLeave );
                        element[0].addEventListener('dragexit', onDragExit );
                    }
                    
                    function stop(){
                        // UNBIND DND EVENTS
                        element[0].removeEventListener('drop', onDrop );
                        element[0].removeEventListener('dragover', onDragOver );
                        element[0].removeEventListener('dragenter', onDragEnter );
                        element[0].removeEventListener('dragleave', onDragLeave );
                        element[0].removeEventListener('dragexit', onDragExit );
                        // DISABLE DROP ELEMENTS ( VIA CSS )
                        if( scope.options && scope.options.events && scope.options.events[mode].classList ){
                            scope.options.events[mode].classList.forEach(function( c ){
                                element[0].classList.remove( c );
                            });
                        }
                        
                        removeDragEffect();                        
                        element[0].classList.remove('drop-enable');
                    }
                    
                    function change( event ){          
                        var c = event.datas[0],
                            data = event.datas[1];
                    
                        if( changePromise ){                            
                            var changePromise = changePromise.then(function(){                                
                                if( scope.options.onchange && !changePromise ){
                                    return scope.options.onchange( c, data ).then(function(){
                                        applyChange( c );
                                    });
                                }else{
                                    applyChange( c );
                                }
                            });
                        }
                        if( scope.options.onchange && !changePromise ){                            
                            changePromise = scope.options.onchange( c, data ).then(function(){
                                applyChange( c );
                            });                            
                        }else{
                            applyChange( c );
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
                    
                    function applyChange( action ){
                        
                        if( action === 'before' ){
                            changeStart( before_selector );                     
                        }else if( action === 'after' ){
                            changeStart( after_selector );  
                        }else if( action === 'insert'){
                            changeStart( insert_selector );
                        }else if( action === 'leave' ){
                            element[0].classList.remove('drop-enable');
                            removeKBDragEffect();
                        }
                    }
                    
                    function changeStart( selector ){
                        element[0].classList.add('drop-enable');
                        removeKBDragEffect();
                        var di = element[0].querySelector(selector);
                        if( di ){
                            di.classList.add('droptarget');
                        }
                    }
                    
                    function removeKBDragEffect(){
                        var dts = element[0].querySelectorAll(after_selector+','+before_selector+','+insert_selector);
                        if( dts ){
                            dts.forEach(function(dt){ dt.classList.remove('droptarget'); });
                        }
                    }
                    
                    function onDragOver( event ){
                        event.preventDefault();
                    }
                    
                    function onDrop( event ){                        
                        removeDragEffect();
                        event.preventDefault();
                        event.stopPropagation();
                        
                        if( scope.options && scope.options.events && scope.options.events[mode].ondrop ){
                            scope.options.events[mode].ondrop( event );
                        }
                    }
                    
                    function onDragEnter( event ){                        
                        removeDragEffect();
                        
                        if( event.target && event.target.classList ){                        
                            target = event.target;
                            document.querySelectorAll('.droptarget').forEach(function(elt){
                                elt.classList.remove('droptarget');
                            });
                            target.classList.add('droptarget');
                        }else{
                            console.log('Incorrect target', event );
                        }
                    }
                    
                    function onDragLeave( event ){
                        if( event.target && event.target.classList ){
                            event.target.classList.remove('droptarget');
                        }else{
                            console.log('Incorrect target', event );
                        }
                    }
                    
                    function onDragExit( event ){
                        if( event.target && event.target.classList ){
                            event.target.classList.remove('droptarget');
                        }else{
                            console.log('Incorrect target', event );
                        }
                    }
                    
                    function removeDragEffect(){
                        if( target && target.classList ){
                            target.classList.remove('droptarget');
                        }
                    }
                    
                }
            };            
        }
    ]);