angular.module('customElements')
    .directive('itemPanelView',function(){
        return {
            scope : {
                itemId: '=',
                adminView: '=',
                onChange: '=',
                onClose: '='
            },
            controller: 'item_panel_view_controller',
            controllerAs: 'ctrl',
            templateUrl:'app/shared/custom_elements/course/item_panel_view/item_panel_view.template.html',
            restrict: 'E'
       };
    });
