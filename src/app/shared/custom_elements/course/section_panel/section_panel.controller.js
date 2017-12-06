angular.module('customElements').controller('section_panel_controller',
    ['$scope','$element','course_sections_model','items_model','panel_service','$translate','notifier_service','modal_service','page_model',
        function( $scope, $element, course_sections_model, items_model, panel_service, $translate, notifier_service, modal_service, page_model ){

            var ctrl = this,
                sectiontype = 'SCT',
                page_id = $scope.datas.page_id,
                item_id = $scope.datas.id;

            // --- Expose datas & methods --- //
            ctrl.loading = true;
            ctrl.editedSection = {};
            // Create section
            ctrl.create = function(){
                if( !ctrl.requesting ){
                    ctrl.requesting = items_model.create(ctrl.editedSection).then(function(){
                        course_sections_model.get([page_id],true).then(function(){
                            ctrl.requesting = false;
                            // Display success notification
                            $translate('ntf.section_created').then(function( translation ){
                                notifier_service.add({
                                    type:'message',
                                    title: translation
                                });
                            });
                            // Close panel
                            panel_service.close();
                        });
                    });
                }
            };
            // Update course section
            ctrl.update = function( must_notify ){
                if( !ctrl.requesting ){
                    ctrl.requesting = items_model.update(ctrl.editedSection, must_notify).then(function(){
                        ctrl.requesting = false;
                        // Display success notification
                        $translate('ntf.section_updated').then(function( translation ){
                            notifier_service.add({
                                type:'message',
                                title: translation
                            });
                        });
                        // Close panel
                        panel_service.close();
                    });
                }
            };
            // Return true if user can notify attendees about section update.
            ctrl.canNotify = function(){
                return ctrl.editedSection.id && ctrl.editedSection.is_published
                    && ctrl.editedSection.page_id
                    && page_model.list[ctrl.editedSection.page_id].datum
                    && page_model.list[ctrl.editedSection.page_id].datum.is_published;
            }
            // Ask user to confirm section delete.
            ctrl.delete = function( $event ){
                modal_service.open({
                    reference: $event.target,
                    label: 'Delete this section',
                    template:'app/shared/custom_elements/course/section_panel/delete_modal.html',
                    is_alert: true,
                    scope: {
                        cancel: function(){
                            modal_service.close();
                            deleteSection();
                        }
                    }
                });
            };
            // Close section edition panel
            ctrl.close = function(){
                panel_service.close();
            };

            // --- INIT --- //
            // If user is editing an existing section
            if( item_id ){
                ctrl.headlabel = 'section_panel.update_head_label';
                items_model.get([item_id]).then(function(){
                    Object.keys( items_model.list[item_id].datum ).forEach(function(k){
                        ctrl.editedSection[k] = items_model.list[item_id].datum[k];
                    });
                    console.log( ctrl.editedSection );
                    ctrl.loading = false;
                });
            // If user is creating a section.
            }else{
                ctrl.headlabel = 'section_panel.create_head_label';
                ctrl.editedSection = {
                    title:'',
                    description:'',
                    type: sectiontype,
                    page_id: page_id
                };
                ctrl.loading = false;
            }

            // Delete section from course.
            function deleteSection(){
                items_model.remove( ctrl.editedSection.id ).then(function(){
                    // Notify that section was successfully deleted.
                    $translate('ntf.section_deleted').then(function( translation ){
                        notifier_service.add({
                            type:'message',
                            title: translation
                        });
                    });
                    // Close panel
                    panel_service.close();
                });
            }
        }
    ]);
