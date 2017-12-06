angular.module('customElements')
    .directive('itemPanelContainer',function(){
        return {
            scope : {
                datas: '='
            },
            controller: 'item_panel_container_controller',
            controllerAs: 'ctrl',
            templateUrl:'app/shared/custom_elements/course/item_panel_container/container.template.html',
            restrict: 'E'
       };
    });
