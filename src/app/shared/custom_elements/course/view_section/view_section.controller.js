angular.module('customElements').controller('view_section_controller',
    ['$scope','items_view_childs_model','items_childs_model','items_model','page_model','panel_service',
    'storage','notifier_service','$translate','$element','events_service','course_sections_model',
        function( $scope,  items_view_childs_model, items_childs_model, items_model, page_model, panel_service,
            storage, notifier_service, $translate, $element, events_service, course_sections_model ){

            var ctrl = this,
                id = $scope.id,
                loadsteps = 2,
                childs_model = $scope.isStudent ? items_view_childs_model: items_childs_model;
                onload = function(){
                    loadsteps--;
                    if( !loadsteps ){
                        ctrl.item = items_model.list[id];

                        // LOADING DONE
                        ctrl.loading = false;
                        ctrl.opened = $scope.open;

                        try{
                            var openeds = JSON.parse( storage.getItem('s.o.'+ctrl.item.datum.page_id) );
                            if( openeds && openeds.length && openeds[openeds.length-1] === id ){
                                ctrl.opened = true;
                            }
                        }catch(e){}
                    }
                };
            // Drag options
            ctrl.dragOptions = {
                transfer_type: 'course_section',
                data: {id: id },
                drag_image: $element[0].querySelector('.dragimage'),
                effect_allowed: 'move',
                onstop: function(){
                    onSectionDropped();
                }
            };
            // Dropzone options
            ctrl.dropzoneOptions = {
                id: id,
                onenter: function( event ){
                    var after = event.target.classList.contains('drop_after'),
                        before = event.target.classList.contains('drop_before'),
                        inside = event.target.classList.contains('drop_in');

                    if( event.dataTransfer.items[0].type === 'course_section' &&
                        window._draggedData && window._draggedData.id !== id && (before||after) ){

                        var dgd_id = window._draggedData.id,
                            dz_tmp_datum = course_sections_model.list[ctrl.item.datum.page_id].datum.concat(),
                            idx = dz_tmp_datum.indexOf( window._draggedData.id ), dzx;

                        // CLEAR PREVIOUS TEMP CHILDS ORDER.
                        course_sections_model.tmp = {};

                        if( idx !== -1 ){
                            dz_tmp_datum.splice( idx, 1);
                        }

                        dzx = dz_tmp_datum.indexOf( id );
                        dz_tmp_datum.splice( before? dzx: dzx+1, 0, window._draggedData.id);
                        course_sections_model.tmp[ctrl.item.datum.page_id] = dz_tmp_datum;

                        $scope.render();
                    }else if( event.dataTransfer.items[0].type === 'course_element' &&
                        window._draggedData && window._draggedData.id !== id && inside ){

                        var dgd_id = window._draggedData.id,
                            dz_tmp_datum = items_childs_model.list[ctrl.item.datum.id].datum.concat(),
                            idx = dz_tmp_datum.indexOf( window._draggedData.id ), dzx;
                        // CLEAR PREVIOUS TEMP CHILDS ORDER.
                        items_childs_model.tmp = {};

                        if( items_model.list[dgd_id].datum.parent_id !== ctrl.item.datum.id ){
                            var dgd_tmp_datum = items_childs_model.list[items_model.list[dgd_id].datum.parent_id].datum.concat();
                            dgd_tmp_datum.splice( dgd_tmp_datum.indexOf(dgd_id), 1 );
                            items_childs_model.tmp[items_model.list[dgd_id].datum.parent_id] = dgd_tmp_datum;
                        }

                        if( idx !== -1 ){
                            dz_tmp_datum.splice( idx, 1);
                        }

                        dz_tmp_datum.push(window._draggedData.id);
                        items_childs_model.tmp[ctrl.item.datum.id] = dz_tmp_datum;

                        ctrl.opened = true;
                        $scope.render();
                    }
                },
                checkdrag: checkSectionDrag
            };

            ctrl.loading = true;
            ctrl.opened = false;
            ctrl.childs = childs_model;

            // INITIALIZATION => GET SECTION ITEM MODEL / GET SECTION CHILDS
            items_model.queue([id]).then(onload);
            childs_model.queue([id]).then(onload);

            // Check if element is dragged
            ctrl.isDraggingElement = function(){
                return window.draggedElement;
            };
            // Open & edit section
            ctrl.edit = function( $event ){
                panel_service.open(
                    'app/shared/custom_elements/course/section_panel/panel.template.html',
                    $event.target,
                    {id:id});
            };
            // Add section element.
            ctrl.addChild = function($event){
                panel_service.open(
                    'app/shared/custom_elements/course/item_panel_container/panel.template.html',
                    $event.target,
                    { parent_id:id, course_id:ctrl.item.datum.page_id, view:'edition',isAdmin: true });
            };
            // OPEN/HIDE SECTION ITEMS.
            ctrl.switchOpen = function(){
                ctrl.opened = !ctrl.opened;

                if( ctrl.item ){
                    var openeds = JSON.parse( storage.getItem('s.o.'+ctrl.item.datum.page_id) || '[]' ),
                        idx = openeds.indexOf( id );

                    if( idx !== -1 ){
                        openeds.splice( idx, 1 );
                    }

                    if( ctrl.opened ){
                        openeds.push( id );
                    }

                    storage.setItem('s.o.'+ctrl.item.datum.page_id, JSON.stringify(openeds) );
                }
            };

            // --- ONLY FOR NOT STUDENT --- //
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
                return ctrl.item && ctrl.item.datum && ctrl.item.datum.page_id
                    && page_model.list[ctrl.item.datum.page_id].datum
                    && page_model.list[ctrl.item.datum.page_id].datum.is_published;
            }

            ctrl.render = function(){
                $scope.render();
                $scope.$evalAsync();
            }

            // EVENTS
            events_service.on('dnd.drag.start', onDragStart );

            $scope.$on('$destroy', function(){
                events_service.off('dnd.drag.start', onDragStart )
            });

            function onDragStart( event ){
                if( checkSectionDrag(event.datas[0]) && ctrl.opened
                    && event.datas[0].dataTransfer.items[0].type === 'course_section' ){
                    ctrl.switchOpen();
                }
            }

            function checkSectionDrag( event ){
                return event.dataTransfer.items && event.dataTransfer.items[0]
                    && ( event.dataTransfer.items[0].type === 'course_section' || event.dataTransfer.items[0].type === 'course_element' );
            }

            function onSectionDropped(){
                if( window._draggedData && window._draggedData.id && course_sections_model.tmp ){
                    var dgd_id = window._draggedData.id, order_id = 0;

                    course_sections_model.tmp[ctrl.item.datum.page_id].some(function( item_id ){
                        if( dgd_id === item_id ){
                            return true;
                        }else{
                            order_id = item_id;
                        }
                    });

                    items_model.move( dgd_id, order_id ).then(function(){
                        delete(course_sections_model.tmp);
                    });
                }
            }
        }
    ]);
