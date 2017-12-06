
angular.module('customElements')
    .directive('quizCorrection',[
        function(){
            return {
                restrict:'A',
                scope:{
                    quiz_id:'=quizCorrection',
                    user_id: '=',
                    submission: '=',
                    init : '='
                },
                controller: 'quiz_correction_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/course/quiz_view/quiz_correction.html',
                link: function( scope, element, attrs ){}
            };
        }
    ]);