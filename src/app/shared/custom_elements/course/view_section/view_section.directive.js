
angular.module('customElements')
    .directive('viewSection',[
        function(){
            return {
                restrict:'E',
                scope:{
                    id: '=itemid',
                    open: '=?',
                    isStudent: '=',
                    render: '=?'
                },
                controller: 'view_section_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/course/view_section/view_section.html',
                link: function( scope, element, attrs ){}
            };
        }
    ]);
