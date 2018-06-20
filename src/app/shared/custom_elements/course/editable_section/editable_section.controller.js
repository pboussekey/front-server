angular.module('customElements').controller('editable_section_controller',
    ['$scope','$element','$translate','items_childs_model','items_model','section_panel_service',
        'panel_service','notifier_service','$q','course_sections_model','events_service','page_model',
        function( $scope, $element, $translate, items_childs_model, items_model, section_panel_service,
            panel_service, notifier_service, $q, course_sections_model, events_service, page_model ){

            var ctrl = this,
                id = $scope.id,
                loadsteps = 2,
                onload = function(){
                    loadsteps--;
                    if( !loadsteps ){
                        ctrl.item = items_model.list[id];

                        ctrl.dndDraggable = {
                            transfer_type: 'text/plain',
                            data: id,
                            drag_image: $element[0].querySelector('.dragimage'),
                            effect_allowed: 'move',
                            start_event: 'dnd.mode:section.start',
                            stop_event: 'dnd.mode:section.stop',
                            onkeydown: dragOnKeyDown,
                            onblur: dragOnBlur
                        };
                        // DND HACK ON CHILD LIST
                        items_childs_model.list[id].opened = ctrl.opened;
                        // LOADING DONE
                        ctrl.loading = false;
                        // OPEN AT START IF NEEDED
                        if( $scope.open ){
                            ctrl.switchOpen();
                        }
                    }
                };

            ctrl.loading = true;
            ctrl.opened = false;
            ctrl.childs = items_childs_model.list;

            ctrl.edited_title = '';
            ctrl.edited_description = '';

            // INITIALIZATION => GET SECTION ITEM MODEL / GET SECTION CHILDS
            items_model.queue([id]).then(onload);
            items_childs_model.queue([id]).then(onload);

            // OPEN/HIDE SECTION ITEMS.
            ctrl.switchOpen = function(){
                ctrl.opened = !ctrl.opened;
                // DND HACK ON CHILD LIST
                items_childs_model.list[id].opened = ctrl.opened;
            };


            ctrl.setPublishState = function( state ){
                if( !ctrl.updatingPublishState ){
                    ctrl.updatingPublishState = true;

                    items_model.update({ id: id, is_published: !!state }, !!state && ctrl.canNotify() )
                        .then(function(){
                            ctrl.updatingPublishState = false;

                            var translationId = state?'ntf.section_published':'ntf.section_unpublished';
                            $translate(translationId).then(function( translation ){
                                notifier_service.add({
                                    type:'message',
                                    message: translation
                                });
                            });
                        });
                }
            };

            ctrl.canNotify = function(){
                return ctrl.item.datum && ctrl.item.datum.page_id
                    && page_model.list[ctrl.item.datum.page_id].datum
                    && page_model.list[ctrl.item.datum.page_id].datum.is_published;
            }

            // EDIT FUNCTIONS
            ctrl.edit = function( $event ){
                section_panel_service.open( $event.target, id );
            };

            // ADD CHILD METHOD
            ctrl.addChild = function($event){
                //item_panel_service.open( $event.target, id );
                panel_service.open(
                    'app/shared/custom_elements/course/item_panel_container/panel.template.html',
                    $event.target,
                    { parent_id:id, course_id:ctrl.item.datum.page_id, view:'edition',isAdmin: true });
            };

            // DEFINE DROPZONE CONFIGS
            ctrl.dndDropZone = {
                id: id,
                after_selector:'.section > .drop_after',
                before_selector:'.section > .drop_before',
                insert_selector:'.section > .drop_in',
                onchange: onDndKeyboardChange,
                modes:{
                    section: {
                        enabling_class: 'drop-enable',
                        target_class: 'droptarget',
                        onstart: onDndSectionStart,
                        ondrop: onDndDrop
                    },
                    item:{
                        enabling_class: 'drop-enable',
                        target_class: 'droptarget',
                        onstart: onDndItemStart,
                        onstop: onDndItemStop,
                        ondrop: onDndItemDrop
                    }
                }
            };

            function onDndKeyboardChange( action, data ){
                var d = $q.defer();

                if( data === 'item' ){
                    ctrl.onlyDropIn = action !== 'leave' ? true: false;
                    $scope.$evalAsync(function(){
                        d.resolve();
                    });
                }else{
                    d.resolve();
                }
                return d.promise;
            }

            function onDndItemStart(){
                var d = $q.defer();

                if( ctrl.opened && ctrl.childs[id].datum.length ){
                    d.reject();
                }else{
                    ctrl.onlyDropIn = true;
                    $scope.$evalAsync(function(){
                        d.resolve();
                    });
                }

                return d.promise;
            }

            function onDndItemStop(){
                var d = $q.defer();
                d.resolve();

                ctrl.onlyDropIn = false;
                $scope.$evalAsync();

                return d.promise;
            }

            function onDndItemDrop( event ){
                ctrl.onlyDropIn = false;

                var data = JSON.parse( event.dataTransfer.getData("text/plain") ),
                    itmid = data.id;

                if( event.target.classList.contains('drop_in') ){
                    // SET ITEM PARENT WITH ID
                    items_model.move( itmid, undefined, id );
                }
            }

            function onDndDrop( event ){
                var sid = JSON.parse(event.dataTransfer.getData("text/plain"));

                // IF DROPPED IS A DIFFERENT SECTION.
                if( id != sid ){
                    if( event.target.classList.contains('drop_after') ){
                        items_model.move( sid, id );
                    }else{
                        var idx = course_sections_model.list[ctrl.item.datum.page_id].datum.indexOf(id);
                        items_model.move( sid, idx?course_sections_model.list[ctrl.item.datum.page_id].datum[idx-1]:0 );
                    }
                }
            };

            function onDndSectionStart(){
                var d = $q.defer();
                d.resolve();

                if( ctrl.opened ){
                    ctrl.switchOpen();
                }

                return d.promise;
            }

            var dropTargetId, dropIndex;

            function dragOnBlur(){
                if( dropIndex !== undefined ){
                    if( dropIndex === -1 ){
                        events_service.process('dnd.dropzone:'+course_sections_model.list[ctrl.item.datum.page_id].datum[0]+'.change', 'leave', ['section'] );
                    }else{
                        events_service.process('dnd.dropzone:'+dropTargetId+'.change', 'leave', ['section'] );
                    }
                    dropTargetId = undefined;
                    dropIndex = undefined;
                }
            }

            function dragOnKeyDown( event ){
                if( ctrl.opened ){
                    ctrl.switchOpen();
                }

                if( event.keyCode === 13 || event.keyCode === 32 && dropTargetId !== undefined ){

                    if( dropIndex === -1 ){
                        events_service.process('dnd.dropzone:'+course_sections_model.list[ctrl.item.datum.page_id].datum[0]+'.change', 'leave', ['section'] );
                    }else{
                        events_service.process('dnd.dropzone:'+dropTargetId+'.change', 'leave', ['section'] );
                    }

                    items_model.move( id, dropTargetId );
                    dropTargetId = undefined;
                    dropIndex = undefined;

                }else if( event.keyCode === 38 ){ // UP -> GET PREVIOUS
                    if( dropIndex === undefined ){
                        dropIndex = course_sections_model.list[ctrl.item.datum.page_id].datum.indexOf(id);
                    }else if( dropIndex !== -1 ){
                        events_service.process('dnd.dropzone:'+dropTargetId+'.change', 'leave', ['section'] );
                    }

                    dropIndex--;
                    if( dropIndex === -1 ){
                        dropTargetId = 0;
                        events_service.process('dnd.dropzone:'+course_sections_model.list[ctrl.item.datum.page_id].datum[0]+'.change', 'before', ['section'] );
                    }else{
                        dropTargetId = course_sections_model.list[ctrl.item.datum.page_id].datum[dropIndex];
                        events_service.process('dnd.dropzone:'+dropTargetId+'.change', 'after', ['section'] );
                    }

                }else if( event.keyCode === 40 ){ // DOWN -> GET NEXT
                    if( dropIndex === undefined ){
                        dropIndex = course_sections_model.list[ctrl.item.datum.page_id].datum.indexOf(id);
                    }else if( dropIndex !== course_sections_model.list[ctrl.item.datum.page_id].datum.length-1 ){
                        events_service.process('dnd.dropzone:'+dropTargetId+'.change', 'leave', ['section'] );
                        dropIndex++;
                    }

                    dropTargetId = course_sections_model.list[ctrl.item.datum.page_id].datum[dropIndex];
                    events_service.process('dnd.dropzone:'+dropTargetId+'.change', 'after', ['section'] );
                }
            }

            // ONDESTROY
            $scope.$on('$destroy', function(){
                if( items_childs_model.list[id] && items_childs_model.list[id].datum ){
                    delete(items_childs_model.list[id].opened);
                }
            });
        }
    ]);
