angular.module('page').controller('course_content_controller',
    ['$stateParams','course_view_sections_model','course_sections_model','panel_service',
    '$scope','storage','items_model', '$state',
        function( $stateParams, course_view_sections_model, course_sections_model, panel_service,
            $scope, storage, items_model, $state ){

            var ctrl = this, course_id = $stateParams.id,
                sections_model = $scope.PageCtrl.editable? course_sections_model: course_view_sections_model;

            // --- EXPOSE METHODS & VARIABLES --- //
            ctrl.courseid = $stateParams.id;
            // Open panel with section-panel directive to show section creation.
            ctrl.addSection = function( $event ){
                panel_service.open(
                    'app/shared/custom_elements/course/section_panel/panel.template.html',
                    $event.target,
                    { page_id: ctrl.courseid });
            };
            // Open panel with item-panel-container directive to show item details.
            ctrl.viewItemDetail = function( item_id ){
                panel_service.open(
                    'app/shared/custom_elements/course/item_panel_container/panel.template.html',
                    document.activeElement,
                    {id: item_id, view:'view',isAdmin: $scope.PageCtrl.editable });
            };
            // Change view mode ( 1 for instructor, 2 for student )
            ctrl.switchMode = function( mode ){
                ctrl.viewing = mode;
            };
            // Render function binded in section directives (Used by DragNDrop to refresh UI)
            ctrl.render = function(){
                $scope.$evalAsync();
            };

            // --- INIT --- //
            // Set view mode to "intructor" if user is admin of this page.
            ctrl.viewing = $scope.PageCtrl.editable? 1: 2;
            // Get list of course sections
            sections_model.get([course_id]).then(function(){
                ctrl.sections_model = sections_model;
            });
            // Try to get in localStorage sections previously opened.
            try{
                var sectionOpeneds = JSON.parse( storage.getItem('s.o.'+ctrl.courseid) );
                ctrl.hasSectionOpeneds = sectionOpeneds && sectionOpeneds.length;
            }catch(e){}
            // If called state contains an item id => Open item details OR open liveclass.
            if( $stateParams.item_id ){
                items_model.get([$stateParams.item_id]).then(function(){
                    if(items_model.list[$stateParams.item_id].datum.type === "LC" ){
                        var url = $state.href('liveclass', { id : $stateParams.item_id });
                        window.open(url).focus();
                    }else{
                        ctrl.viewItemDetail( $stateParams.item_id );
                    }
                });
            };
        }
    ]);
