angular.module('customElements')
    .directive('itemPanelSubmissions',function(){
        return {
            scope : {
                itemId: '=',
                adminView: '=',
                onChange: '=',
                onClose: '='
            },
            controller: 'item_panel_submissions_controller',
            controllerAs: 'ctrl',
            templateUrl:'app/shared/custom_elements/course/item_panel_submissions/item_panel_submissions.template.html',
            restrict: 'E'
       };
    });
