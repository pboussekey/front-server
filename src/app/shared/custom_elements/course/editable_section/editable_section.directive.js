
angular.module('customElements')
    .directive('editableSection',[
        function(){
            return {
                restrict:'E',
                scope:{
                    id: '=itemid',
                    open: '=?'
                },
                controller: 'editable_section_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/course/editable_section/editable_section.html',
                link: function( scope, element, attrs ){}
            };
        }
    ]);