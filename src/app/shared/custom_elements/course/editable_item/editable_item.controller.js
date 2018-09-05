angular.module('customElements').controller('editable_item_controller',
    ['$scope','$element','items_childs_model','course_sections_model','items_model',
        '$translate','notifier_service','$q','events_service','page_model','panel_service',
        function( $scope, $element, items_childs_model, course_sections_model, items_model,
            $translate, notifier_service, $q, events_service, page_model, panel_service ){

            var ctrl = this,
                id = $scope.id,
                availableNotifierLabels = {
                    1: 'ntf.element_now_available',
                    2: 'ntf.element_now_not_available',
                    3: 'ntf.element_now_available_on_date'
                },
                types = {
                    //SCT: {icon:'i-section',label:'', },
                    //FLD: {icon:'i-folder',label:'page.folder'},
                    //LC: {icon:'i-camera',label:'item_types.liveclass'},
                    A: {icon:'i-assignment',label:'item_types.assignment'},
                    GA: {icon:'i-assignment',label:'item_types.group_assignment'},
                    QUIZ: {icon:'i-quiz',label:'item_types.quiz'},
                    PG: {icon:'i-page',label:'item_types.page'},
                    DISC: {icon:'i-groups',label:'item_types.discussion'},
                    MEDIA: {icon:'i-media',label:'item_types.media'}
                };

            ctrl.availableStates = {
                available: 1,
                not_available: 2,
                available_on_date: 3
            };

            ctrl.loading = true;
            ctrl.childs = items_childs_model.list;

            // INITIALIZATION => GET ITEM MODEL.
            items_model.get([id]).then(function(){
                ctrl.item = items_model.list[id];
                ctrl.loading = false;

                maxDeep = ctrl.item.datum.type === 'MEDIA' ? 2 : 1;

                ctrl.dndDraggable = {
                    transfer_type: 'text/plain',
                    data: {id:id, type: ctrl.item.datum.type},
                    drag_image: $element[0].querySelector('.dragimage'),
                    effect_allowed: 'move',
                    start_event: 'dnd.mode:item.start',
                    stop_event: 'dnd.mode:item.stop',
                    onstart: function(){ ctrl.cantDropIn = true; ctrl.dragged = true;},
                    onstop: function(){ ctrl.cantDropIn = false; ctrl.dragged = false; },
                    onkeydown: dragOnKeyDown,
                    onblur: dragOnBlur
                };


                // GET CHILDS
                if( ctrl.item.type !== 'MEDIA' ){
                    ctrl.loadingchilds = true;
                    items_childs_model.queue([id]).then(function(){
                        ctrl.loadingchilds = false;
                    });
                }
            });

            ctrl.hasChild = function(){
                return false;//return ctrl.item && ctrl.item.datum && ctrl.item.datum.type !== 'MEDIA';
            };

            // Return icon class depending on item 'type'.
            ctrl.itemIconClass = function(){
                return types[ ctrl.item.datum.type ].icon;
            };

            ctrl.getTypeLabel = function(){
                return types[ ctrl.item.datum.type ].label;
            };

            // Check if user is not available
            ctrl.isNotAvailable = function(){
                return ctrl.item.datum.is_available === ctrl.availableStates.not_available;
            };

            // Check if item is available
            ctrl.isAvailable = function(){
                return ctrl.item.datum.is_available === ctrl.availableStates.available;
            };

            // Check if item is available on date
            ctrl.isAvailableOnDate = function(){
                return ctrl.item.datum.is_available === ctrl.availableStates.available_on_date;
            };

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

            // UPDATE METHODS
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

                            // TO DO NOTIFY!
                            /*var translationId = state?'ntf.element_published':'ntf.element_unpublished';
                            $translate(translationId).then(function( translation ){
                                notifier_service.add({
                                    type:'message',
                                    message: translation
                                });
                            });*/
                        });
                }
            };

            function canNTF( id ){
                return items_model.list[id] && items_model.list[id].datum && items_model.list[id].datum.is_published
                    && ( !items_model.list[id].datum.parent_id || canNTF(items_model.list[id].datum.parent_id) );
            }

            ctrl.canNotify = function(){
                return ctrl.item.datum.page_id
                    && page_model.list[ctrl.item.datum.page_id].datum
                    && page_model.list[ctrl.item.datum.page_id].datum.is_published
                    && ( !ctrl.item.datum.parent_id || canNTF(ctrl.item.datum.parent_id) );
            }

            // ADD CHILD METHOD
            ctrl.addChild = function( $event ){
                // DESACTIVATED FOR NOW...
                //item_panel_service.open( $event.target, id, undefined, ['MEDIA'] );
            };

            // UPDATE METHOD
            ctrl.update = function( $event ){
                panel_service.open(
                    'app/shared/custom_elements/course/item_panel_container/panel.template.html',
                    $event.target,
                    {id:id, view:'edition',isAdmin: true });
            };

            // DEFINE DROPZONE CONFIGS
            ctrl.dndDropZone = {
                id: id,
                after_selector:'#ctm'+id+' > .drop_after',
                before_selector:'#ctm'+id+' > .drop_before',
                insert_selector:'#ctm'+id+' > .drop_in',
                modes:{
                    item: {
                        enabling_class: 'drop-enable',
                        target_class: 'droptarget',
                        onstart: onDndStart,
                        onstop: onDndStop,
                        ondrop: onDndDrop
                    }
                }
            };

            // DND EVENTS
            //events_service.on('dnd.item.start', function(event){});

            // DND - METHODS
            function onDndStart( event ){
                var d = $q.defer();
                d.resolve();

                if( event.datas[0].type !== 'MEDIA' ){
                    ctrl.cantDropIn = true;
                }

                return d.promise;
            }

            function onDndStop(){
                var d = $q.defer();
                d.resolve();

                ctrl.cantDropIn = false;
                return d.promise;
            }

            function onDndDrop( event ){
                ctrl.cantDropIn = false;

                var data = JSON.parse( event.dataTransfer.getData("text/plain") ),
                    itmid = data.id;

                if( event.target.classList.contains('drop_in') ){
                    // SET ITEM PARENT WITH ID
                    items_model.move( itmid, undefined, id );
                }else if( event.target.classList.contains('drop_before') && itmid != id ){
                    var idx = items_childs_model.list[ctrl.item.datum.parent_id].datum.indexOf(id);
                    items_model.move( itmid, idx?items_childs_model.list[ctrl.item.datum.parent_id].datum[idx-1]:0, ctrl.item.datum.parent_id );
                }else if( event.target.classList.contains('drop_after') && itmid != id ){
                    items_model.move( itmid, id, ctrl.item.datum.parent_id );
                }
            }


            // MANAGEMENT OF KEYBOARD DND ...
            var maxDeep, position,
                dropParentId, dropAfterId, dropIndex;

            function getDeep( itemID ){
                if( items_model.list[itemID].datum.parent_id ){
                    return 1 + getDeep(items_model.list[itemID].datum.parent_id);
                }else{
                    return 0;
                }
            }

            function isBeforeElement(){
                return items_childs_model.list[dropParentId] && items_childs_model.list[dropParentId].datum
                    && items_childs_model.list[dropParentId].datum.length
                    && ( items_childs_model.list[dropParentId].opened || items_model.list[dropParentId].datum.parent_id )
                    && dropIndex < items_childs_model.list[dropParentId].datum.length-1;
            }

            function canInsertAfter(){
                return getDeep( dropParentId )+1 !== maxDeep
                    && items_model.list[items_childs_model.list[dropParentId].datum[dropIndex+1]].datum.type !== 'MEDIA';
            }

            function goDown(){
                // IF BEFORE AN ELEMENT
                if( isBeforeElement() ){
                    // TRY TO GO IN
                    if( canInsertAfter() ){
                        setInStartElement( items_childs_model.list[dropParentId].datum[dropIndex+1] );
                    }
                    // GO AFTER
                    else{
                        dropIndex++;
                        dropAfterId = items_childs_model.list[dropParentId].datum[dropIndex];
                        setPosition(dropAfterId, 'after');
                    }
                }
                // ELSE -> TRY TO GO AFTER PARENT ELEMENT
                else{
                    // IF PARENT ELEMENT IS NOT A SECTION
                    if( getDeep( dropParentId ) ){
                        dropAfterId = dropParentId;
                        dropParentId = items_model.list[dropAfterId].datum.parent_id;
                        dropIndex = items_childs_model.list[dropParentId].datum.indexOf( dropAfterId );
                        setPosition( dropAfterId, 'after');
                    // IF PARENT IS A SECTION TRY TO GO IN PREVIOUS SECTION.
                    }else{
                        var page_id = items_model.list[dropParentId].datum.page_id,
                            sectionIdx = course_sections_model.list[page_id].datum.indexOf( dropParentId );

                        if( sectionIdx < course_sections_model.list[page_id].datum.length-1 ){
                            // INSERT IN SECTION!
                            setInStartElement( course_sections_model.list[page_id].datum[sectionIdx+1] );
                        }
                    }
                }
            }

            function goUp(){
                // IF AFTER AN ELEMENT -> TRY TO GO IN
                if( dropAfterId && getDeep( dropAfterId ) !== maxDeep && items_model.list[dropAfterId].datum.type !== 'MEDIA' ){
                    setInEndElement( dropAfterId );
                }
                // IF AFTER AN ELEMENT BUT CANT GO IN -> TRY TO GO BEFORE AFTER ELEMENT .
                else if( dropAfterId && dropIndex !== -1 ){
                    setBeforeElement(dropAfterId);
                }
                // IF NOT AFTER AN ELEMENT, TRY TO GO BEFORE PARENT ELEMENT.
                else if( !dropAfterId ){
                    // IF PARENT ELEMENT IS NOT A SECTION
                    if( getDeep( dropParentId ) ){
                       setBeforeElement( dropParentId );
                    // IF PARENT IS A SECTION TRY TO GO IN PREVIOUS SECTION.
                    }else{
                        var page_id = items_model.list[dropParentId].datum.page_id,
                            sectionIdx = course_sections_model.list[page_id].datum.indexOf( dropParentId );

                        if( sectionIdx ){
                            // INSERT IN SECTION!
                            setInEndElement( course_sections_model.list[page_id].datum[sectionIdx-1] );
                        }
                    }
                }
            }

            function setPosition( newposition, action ){
                events_service.process('dnd.dropzone:'+position+'.change', 'leave', ['item'], 'item' );
                if( newposition ){
                    events_service.process('dnd.dropzone:'+newposition+'.change', action, ['item'], 'item' );
                    position = newposition;
                }else{
                    position = undefined;
                }
            }

            function setBeforeElement( elementID ){
                dropParentId = items_model.list[elementID].datum.parent_id;
                var edx = items_childs_model.list[dropParentId].datum.indexOf( elementID );

                if( edx ){
                    dropIndex = edx-1;
                    dropAfterId = items_childs_model.list[dropParentId].datum[dropIndex];
                    setPosition( dropAfterId, 'after');
                }else{
                    setPosition( elementID, 'before');
                    dropAfterId = 0;
                    dropIndex = -1;
                }
            }

            function setInEndElement( elementID ){
                dropParentId = elementID;
                // IF ELEMENT HAS CHILDS & ( IS OPENED OR NOT SECTION )
                if( items_childs_model.list[dropParentId]
                    && items_childs_model.list[dropParentId].datum
                    && items_childs_model.list[dropParentId].datum.length
                    && ( items_childs_model.list[dropParentId].opened || items_model.list[dropParentId].datum.parent_id ) ){

                    dropIndex = items_childs_model.list[dropParentId].datum.length-1;
                    dropAfterId = items_childs_model.list[dropParentId].datum[dropIndex];
                    // UPDATE UI
                    setPosition( dropAfterId, 'after');
                // ELSE
                }else{
                    dropIndex = -1;
                    dropAfterId = 0;
                    // UPDATE UI
                    setPosition( dropParentId, 'insert');
                }
            }

            function setInStartElement( elementID ){
                dropParentId = elementID;
                dropIndex = -1;
                dropAfterId = 0;

                // IF ELEMENT HAS CHILDS & ( IS OPENED OR NOT SECTION )
                if( items_childs_model.list[dropParentId]
                    && items_childs_model.list[dropParentId].datum
                    && items_childs_model.list[dropParentId].datum.length
                    && ( items_childs_model.list[dropParentId].opened || items_model.list[dropParentId].datum.parent_id ) ){
                    setPosition( items_childs_model.list[dropParentId].datum[0], 'before');
                // ELSE
                }else{
                    setPosition( dropParentId, 'insert');
                }
            }

            function dragOnKeyDown( event ){
                if( event.keyCode === 13 || event.keyCode === 32 && dropAfterId !== undefined ){
                    if( !dropAfterId && !getDeep(dropParentId) && !items_childs_model.list[dropParentId].opened ){
                        items_model.move( id, undefined, dropParentId );
                    }else{
                        items_model.move( id, dropAfterId, dropParentId );
                    }
                    dragOnBlur();
                }else if( event.keyCode === 38 ){ // UP -> GET PREVIOUS
                    if( dropIndex === undefined ){
                        dropParentId = items_model.list[id].datum.parent_id;
                        dropIndex = items_childs_model.list[dropParentId].datum.indexOf(id);
                        dropAfterId = id;
                    }
                    goUp();
                }else if( event.keyCode === 40 ){ // DOWN -> GET NEXT
                    if( dropIndex === undefined ){
                        dropParentId = items_model.list[id].datum.parent_id;
                        dropIndex = items_childs_model.list[dropParentId].datum.indexOf(id) - 1;
                        dropAfterId = dropIndex !== -1 ? items_childs_model.list[dropParentId].datum[dropIndex]:0;
                    }
                    goDown();
                }
            }

            function dragOnBlur(){
                setPosition();
                dropIndex = undefined;
                dropParentId = undefined;
                dropAfterId = undefined;
            }

        }
    ]);
