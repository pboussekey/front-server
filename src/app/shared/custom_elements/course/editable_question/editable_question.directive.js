
angular.module('customElements')
    .directive('editableQuestion',[
        function(){
            return {
                restrict:'A',
                scope:{
                    order:'=',
                    question: '=editableQuestion',
                    delete: '=',
                    pointChange: '=',
                    change:'=',
                    displayed:'='
                },
                controller: 'editable_question_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/course/editable_question/editable_question.html',
                link: function( scope, element, attrs ){}
            };
        }
    ]);