angular.module('customElements').controller('view_item_controller',
    ['$scope','items_view_childs_model','items_childs_model','items_model','page_model','$element','events_service',
        '$state','notifier_service','$translate','item_submission_model','items_info_model','panel_service',
        function( $scope, items_view_childs_model, items_childs_model, items_model, page_model, $element, events_service,
            $state, notifier_service, $translate, item_submission_model, items_info_model, panel_service ){

            var ctrl = this,
                childs_model = $scope.isStudent ? items_view_childs_model: items_childs_model,
                id = $scope.id,
                availableNotifierLabels = {
                    1: 'page.item_now_available',
                    2: 'page.item_now_not_available',
                    3: 'page.item_now_available_on_date'
                },
                types = {
                    //SCT: {icon:'i-section',label:'', },
                    //FLD: {icon:'i-folder',label:'page.folder'},
                    LC: {icon:'i-camera',label:'item_types.liveclass'},
                    A: {icon:'i-assignment',label:'item_types.assignment'},
                    GA: {icon:'i-assignment',label:'item_types.group_assignment'},
                    QUIZ: {icon:'i-quiz',label:'item_types.quiz'},
                    PG: {icon:'i-page',label:'item_types.page'},
                    DISC: {icon:'i-groups',label:'item_types.discussion'},
                    MEDIA: {icon:'i-media',label:'item_types.media'}
                };

            ctrl.loading = true;
            ctrl.childs = childs_model.list;
            ctrl.availableStates = {
                available: 1,
                not_available: 2,
                available_on_date: 3
            };

            // Drag options
            ctrl.dragOptions = {
                transfer_type: 'course_element',
                data: {id: id },
                drag_image: $element[0].querySelector('.dragimage'),
                effect_allowed: 'move',
                onstart: function(){
                    window.draggedElement = true;
                },
                onstop: function(){
                    window.draggedElement = false;
                    onItemDropped();
                    $scope.$evalAsync();
                }
            };
            // Dropzone options
            ctrl.dropzoneOptions = {
                id: id,
                onenter: function( event ){
                    var after = event.target.classList.contains('drop_after'),
                        before = event.target.classList.contains('drop_before');

                    if( window._draggedData && window._draggedData.id !== id && (before||after) ){
                        var dgd_id = window._draggedData.id,
                            dz_tmp_datum = items_childs_model.list[ctrl.item.datum.parent_id].datum.concat(),
                            idx = dz_tmp_datum.indexOf( window._draggedData.id ), dzx;
                        // CLEAR PREVIOUS TEMP CHILDS ORDER.
                        items_childs_model.tmp = {};

                        if( items_model.list[dgd_id].datum.parent_id !== ctrl.item.datum.parent_id ){
                            var dgd_tmp_datum = items_childs_model.list[items_model.list[dgd_id].datum.parent_id].datum.concat();
                            dgd_tmp_datum.splice( dgd_tmp_datum.indexOf(dgd_id), 1 );
                            items_childs_model.tmp[items_model.list[dgd_id].datum.parent_id] = dgd_tmp_datum;
                        }

                        if( idx !== -1 ){
                            dz_tmp_datum.splice( idx, 1);
                        }

                        dzx = dz_tmp_datum.indexOf( id );
                        dz_tmp_datum.splice( before? dzx: dzx+1, 0, window._draggedData.id);
                        items_childs_model.tmp[ctrl.item.datum.parent_id] = dz_tmp_datum;

                        $scope.render();
                    }
                },
                checkdrag: function( event ){
                    return event.dataTransfer.items && event.dataTransfer.items[0] && event.dataTransfer.items[0].type === 'course_element';
                }
            };
            // OLD: Used when sub-items existed. ( TODO Clear old child system )
            ctrl.hasChild = function(){
                return false;//return ctrl.item && ctrl.item.datum && ctrl.item.datum.type !== 'MEDIA';
            };
            // Return true if item is an assignment ( instructor can grade/comment on user work )
            ctrl.isAssignment = function(){
                return ['A','GA','DISC','QUIZ'].indexOf(ctrl.item.datum.type) !== -1 || ctrl.item.datum.points;
            };
            // Return true if this item is submittable.
            ctrl.isSubmittable = function(){
                return ['A','GA','QUIZ'].indexOf(ctrl.item.datum.type) !== -1;
            };
            // Return icon class depending on item 'type'.
            ctrl.itemIconClass = function(){
                return types[ ctrl.item.datum.type ].icon;
            };
            // Return label depending on item type
            ctrl.getTypeLabel = function(){
                return types[ ctrl.item.datum.type ].label;
            };
            // Return status class ( color of status dropdown )
            ctrl.getStatusClass = function(){
                var sclass = 'not_available';

                if( !ctrl.item.datum.is_published ){
                    sclass = 'not_published';
                }else if( ctrl.item.datum.is_grade_published ){
                    sclass = 'closed';
                }else if( isAvailable( id, true) ){
                    sclass = 'ongoing';
                }
                return sclass;
            };
            //
            ctrl.viewDetail = function( $event ){
                if( $event.type === 'click' || ( $event.keyCode === 13 && $event.target.classList.contains('ctm-content') ) ){
                    panel_service.open(
                        'app/shared/custom_elements/course/item_panel_container/panel.template.html',
                        $event.target,
                        {id:id, view:'view',isAdmin: !$scope.isStudent });
                }
            };
            // Return true if item is currently dragged.
            ctrl.isDragged = function(){
                return window._draggedData && window._draggedData.id ===id;
            };
            // Check if user is not available
            ctrl.isNotAvailable = function(){
                return ctrl.item.datum.is_available === ctrl.availableStates.not_available;
            };
            // Check if item is available
            ctrl.isRawAvailable = function(){
                return ctrl.item.datum.is_available === ctrl.availableStates.available;
            };
            // Check if item is available on date
            ctrl.isAvailableOnDate = function(){
                return ctrl.item.datum.is_available === ctrl.availableStates.available_on_date;
            };
            // Return state label.
            ctrl.getStateLabel = function(){
                if( ctrl.item.datum.is_grade_published ){
                    return 'item.closed';
                }else if( ctrl.item.datum.is_published ){
                    if( ctrl.item.datum.is_available === ctrl.availableStates.available_on_date ){
                        return 'item.dd_auto_available';
                    }else if( ctrl.item.datum.is_available === ctrl.availableStates.available ){
                        return 'item.dd_available';
                    }else{
                        return 'item.dd_not_available';
                    }
                }else{
                    return 'item.unpublished';
                }
            };
            // Update element state.
            ctrl.setElementState = function( published, closed, availability ){
                if( !ctrl.updatingState ){
                    ctrl.updatingState = true;
                    items_model.update({
                            id:id,
                            is_available: availability!=undefined?availability: ctrl.item.datum.is_available,
                            is_published: published,
                            is_grade_published: closed
                        }, published===true && !ctrl.item.datum.is_published && ctrl.canNotify() ).then(function(){
                            ctrl.updatingState = false;
                        });
                }
            };
            // Return true if course & element parents are published.
            ctrl.canNotify = function(){
                return ctrl.item.datum.page_id
                    && page_model.list[ctrl.item.datum.page_id].datum
                    && page_model.list[ctrl.item.datum.page_id].datum.is_published
                    && ( !ctrl.item.datum.parent_id || canNTF(ctrl.item.datum.parent_id) );
            }

            // --- INIT --- //
            // Get item data
            items_model.queue([id]).then(function(){
                ctrl.item = items_model.list[id];
                // If item is an assignment get submission & infos data.
                if( ctrl.isAssignment() ){
                    var step = 1,
                        load = function(){
                            step--;
                            if( !step ){
                                ctrl.submission = item_submission_model.list[id];
                                ctrl.loading = false;
                            }
                        }

                    if( !$scope.isStudent ){
                        step++;
                        items_info_model.queue([id], ctrl.isDragged()?false:true).then(function(){
                            ctrl.infos = items_info_model.list[id];
                            load();
                        });
                    }
                    item_submission_model.queue([id], ctrl.isDragged()?false:true).then(load);
                }else{
                    ctrl.loading = false;
                }
                /* OLD: When sub-items existed, we had to get item's childs.
                if( ctrl.hasChild() ){
                    ctrl.loadingchilds = true;
                    childs_model.queue([id]).then(function(){
                        ctrl.loadingchilds = false;
                    });
                }*/
            });

            // --- FUNCTIONS --- //
            // Return true if item (from id) can be notified on update.
            function canNTF( id ){
                return items_model.list[id] && items_model.list[id].datum && items_model.list[id].datum.is_published
                    && ( !items_model.list[id].datum.parent_id || canNTF(items_model.list[id].datum.parent_id) );
            }
            // Return true if item is available
            function isAvailable( item_id, parentCheck ){
                return items_model.list[item_id] && items_model.list[item_id].datum
                    && ( items_model.list[item_id].datum.is_available === ctrl.availableStates.available
                        || items_model.list[item_id].datum.is_grade_published
                        || items_model.list[item_id].datum.type === 'SCT'
                        || ( items_model.list[item_id].datum.is_available === ctrl.availableStates.available_on_date
                            && ( !items_model.list[item_id].datum.start_date || (new Date(items_model.list[item_id].datum.start_date)).getTime() < Date.now() )
                            && ( !items_model.list[item_id].datum.end_date || (new Date(items_model.list[item_id].datum.end_date)).getTime() > Date.now() ) ) )
                    && ( !parentCheck
                        || ( !items_model.list[item_id].datum.parent_id || isAvailable( items_model.list[item_id].datum.parent_id, true) ) );
            }
            // On item stop drag -> Move it
            function onItemDropped(){
                if( window._draggedData && window._draggedData.id && items_childs_model.tmp ){
                    var dgd_id = window._draggedData.id, order_id, parent_id;

                    Object.keys(items_childs_model.tmp).some(function(pid){
                        parent_id = pid;

                        return items_childs_model.tmp[pid].some(function( item_id, index ){
                            if( !index ){
                                order_id = 0;
                            }
                            if( dgd_id === item_id ){
                                return true;
                            }else{
                                order_id = item_id;
                            }
                        });
                    });

                    items_model.move( dgd_id, order_id , parent_id ).then(function(){
                        delete(items_childs_model.tmp);
                    });
                }else {
                    delete(items_childs_model.tmp);
                }
            }
        }
    ]);
