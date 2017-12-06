angular.module('customElements')
    .directive('sectionPanel',function(){
        return {
            scope : {
                datas : "="
            },
            controller: 'section_panel_controller',
            controllerAs: 'ctrl',
            templateUrl:'app/shared/custom_elements/course/section_panel/section.template.html',
            restrict: 'E'
       };
    });
