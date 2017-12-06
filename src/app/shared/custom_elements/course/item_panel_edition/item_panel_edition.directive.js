angular.module('customElements')
    .directive('itemPanelEdition',function(){
        return {
            scope : {
                itemId: '=',
                courseId: '=?',
                parentId: '=?',
                adminView: '=',
                onChange: '=',
                onClose: '='
            },
            controller: 'item_panel_edition_controller',
            controllerAs: 'ctrl',
            templateUrl:'app/shared/custom_elements/course/item_panel_edition/item_panel_edition.template.html',
            restrict: 'E'
       };
    });
