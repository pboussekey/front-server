angular.module('customElements').controller('item_panel_container_controller',
    ['$scope','$q','panel_service','items_model','items_view_childs_model','items_childs_model','course_view_sections_model','course_sections_model',
        function( $scope, $q, panel_service, items_model, items_view_childs_model, items_childs_model, course_view_sections_model, course_sections_model ){

            var ctrl = this;

            ctrl.loading = true;
            ctrl.view = $scope.datas.view || 'view';
            ctrl.isAdmin = $scope.datas.isAdmin;

            var childs_model = !ctrl.isAdmin ? items_view_childs_model: items_childs_model,
                course_sections = !ctrl.isAdmin ? course_view_sections_model: course_sections_model,
                availableStates = { available: 1, not_available: 2, available_on_date: 3};

            panel_service.datas.launchClose = function(){
                if( ctrl.launchClose ){
                    return ctrl.launchClose();
                }else{
                    return $q.resolve();
                }
            };

            ctrl.isAssignment = function(){
                return ctrl.item && ctrl.item.datum
                    && (['A','GA','DISC','QUIZ'].indexOf(ctrl.item.datum.type) !== -1 || ctrl.item.datum.points );
            };

            ctrl.switchMode = function( view, force ){
                if( ctrl.launchClose && !force ){
                    ctrl.launchClose().then(function(){ ctrl.view = view; });
                }else{
                    ctrl.view = view;
                }
            };

            ctrl.setViewMode = ctrl.switchMode.bind(this,'view');

            ctrl.setCurrent = function( item ){
                ctrl.item = item;
                if( ctrl.view === 'submissions' && !ctrl.isAssignment() ){
                    ctrl.view = 'view';
                }else if( ctrl.onChange ){
                    ctrl.onChange( ctrl.item.datum.id );
                }
            }

            ctrl.goPrevious = function(){
                if( ctrl.previous ){
                    if( ctrl.launchClose ){
                        ctrl.launchClose().then(go);
                    }else{
                        go();
                    }
                }

                function go(){
                    ctrl.next = ctrl.item;
                    ctrl.setCurrent( ctrl.previous );
                    var previousId = getPrevious();
                    ctrl.previous = previousId ? items_model.list[previousId]: undefined;
                }
            };

            ctrl.goNext = function(){
                if( ctrl.next ){
                    if( ctrl.launchClose ){
                        ctrl.launchClose().then(go);
                    }else{
                        go();
                    }
                }

                function go(){
                    ctrl.previous = ctrl.item;
                    ctrl.setCurrent( ctrl.next );
                    var nextId = getNext();
                    ctrl.next = nextId ? items_model.list[nextId]: undefined;
                }
            };

            // --- INIT --- //
            // If an item ID is provided -> Get item & try to get next & previous
            if( $scope.datas.id ){
                items_model.get([$scope.datas.id]).then(function(){
                    if( items_model.list[$scope.datas.id] && items_model.list[$scope.datas.id].datum ){
                        ctrl.item = items_model.list[$scope.datas.id];

                        var nextId = getNext();
                        var previousId = getPrevious();

                        if( nextId ){
                            ctrl.next = items_model.list[nextId];
                        }
                        if( previousId ){
                            ctrl.previous = items_model.list[previousId];
                        }

                        ctrl.loading = false;
                    }else{
                        close();
                    }
                });
            // Else -> the container is used for item creation...
            }else{
                ctrl.view = 'edition';
                ctrl.parent_id = $scope.datas.parent_id;
                ctrl.course_id = $scope.datas.course_id;
                ctrl.loading = false;
            }

            function close(){
                panel_service.directiveCloseFunction();
            }

            function getPrevSibling( id, list, index ){
                var idx = id ? list.indexOf( id ): index;
                if( idx ){
                    idx--;
                    for(;idx>-1;idx--){
                        if( ctrl.isAdmin || isItemAvailable( list[idx] ) ){
                            return list[idx];
                        }
                    }
                }
                return false;
            }

            function getPrevChild( id ){
                if( childs_model.list[id] && childs_model.list[id].datum ){
                    var list = childs_model.list[id].datum,
                        childID = getPrevSibling( null, list, list.length );

                    if( childID ){
                        return getPrevChild( childID ) || childID;
                    }
                }
                return false;
            }

            function getPrevious(){
                if( ctrl.item && childs_model.list[ctrl.item.datum.parent_id] ){
                    var prevSiblingID = getPrevSibling(ctrl.item.datum.id, childs_model.list[ctrl.item.datum.parent_id].datum );

                    if( prevSiblingID ){
                        return getPrevChild( prevSiblingID ) || prevSiblingID;
                    }else if( items_model.list[ctrl.item.datum.parent_id].datum.parent_id ){
                        return ctrl.item.datum.parent_id;
                    }else if( course_sections.list[ctrl.item.datum.page_id] && course_sections.list[ctrl.item.datum.page_id].datum ) {
                        var prevId,
                            list = course_sections.list[ctrl.item.datum.page_id].datum,
                            sdx = list.indexOf( ctrl.item.datum.parent_id ) - 1;

                        for(;sdx>-1;sdx--){
                            prevId = getPrevChild( list[sdx] );
                            if( prevId ){
                                return prevId;
                            }
                        }
                    }
                }
            }

            function getNextChild( id, start_id ){
                if( childs_model.list[id] && childs_model.list[id].datum ){
                    var i = start_id ? childs_model.list[id].datum.indexOf(start_id)+1: 0,
                        l = childs_model.list[id].datum.length;

                    for(; i < l; i++ ){
                        if( ctrl.isAdmin || isItemAvailable( childs_model.list[id].datum[i] ) ){
                            return childs_model.list[id].datum[i];
                        }
                    }
                }
                return false;
            }

            function getNextSiblingParent( id ){
                if( items_model.list[id] && items_model.list[id].datum ){
                    if( items_model.list[id].datum.parent_id ){
                        return getNextChild( items_model.list[id].datum.parent_id, id )
                            || getNextSiblingParent( items_model.list[id].datum.parent_id );
                    }else if( course_sections.list[items_model.list[id].datum.page_id] && course_sections.list[items_model.list[id].datum.page_id].datum ){
                        var nextId,
                            list = course_sections.list[items_model.list[id].datum.page_id].datum,
                            sdx = list.indexOf( id ) + 1;

                        for(;sdx<list.length;sdx++){
                            nextId = getNextChild( list[sdx] );
                            if( nextId ){
                                return nextId;
                            }
                        }
                    }
                }
                return false;
            }

            function getNext(){
                if( ctrl.item ){
                    return getNextChild( ctrl.item.datum.id ) || getNextSiblingParent( ctrl.item.datum.id );
                }
            }

            function isItemAvailable( id ){
                return items_model.list[id] && items_model.list[id].datum
                    && ( items_model.list[id].datum.is_available === availableStates.available
                        || items_model.list[id].datum.type === 'SCT'
                        || items_model.list[id].datum.is_grade_published
                        || ( items_model.list[id].datum.is_available === availableStates.available_on_date
                            && ( !items_model.list[id].datum.start_date || (new Date(items_model.list[id].datum.start_date)).getTime() < Date.now() )
                            && ( !items_model.list[id].datum.end_date || (new Date(items_model.list[id].datum.end_date)).getTime() > Date.now() ) ) )
                    && ( !items_model.list[id].datum.parent_id
                        || isItemAvailable(items_model.list[id].datum.parent_id) );
            }
        }
    ]);
