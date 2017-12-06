
angular.module('customElements')
    .directive('quizView',[
        function(){
            return {
                restrict:'A',
                scope:{
                    quiz_id:'=quizView',
                    submit:'=',
                    admin:'='
                },
                controller: 'quiz_view_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/course/quiz_view/quiz_view.html',
                link: function( scope, element, attrs ){}
            };
        }
    ]);