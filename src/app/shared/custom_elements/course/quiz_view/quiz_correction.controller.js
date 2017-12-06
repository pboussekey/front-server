angular.module('customElements').controller('quiz_correction_controller',
    ['$scope','quiz_user_model','quiz_model', '$attrs', '$parse',
        function( $scope,  quiz_user_model, quiz_model, $attrs, $parse ){
            
            var ctrl = this,
                quiz_id = $scope.quiz_id;
        
            
            
            ctrl.types = {
                multiple_choice: 'simple',
                multiple_answers: 'multiple',
                fill_text: 'text'
            };
            
            ctrl.isCorrect = function(question){
                if(!ctrl.userAnswers[ctrl.user_id][question.id]){
                    return false;
                }
                var answer = ctrl.userAnswers[ctrl.user_id][question.id];
                if(question.type === ctrl.types.multiple_choice || question.type === ctrl.types.multiple_answers){
                    return answer.answer_id.length 
                            === answer.answer_id.filter(function(answer_id){
                            return question.quiz_answer.some(function(answer){
                                return answer.id === answer_id && answer.is_correct;
                            });
                        }).length;
                }
                else{
                    return question.quiz_answer.filter(function(a){
                        return a.text === answer.text;
                    }).length;
                }
            };
            
            ctrl.calculatePoints = function(){
                $scope.submission.rate = 0;
                ctrl.quiz.datum.quiz_question.forEach(function(q){
                    if(q.is_correct){ 
                        $scope.submission.rate += q.point;
                    }
                });
            };
            
            ctrl.userAnswers = {};
            // INIT
            ctrl.init = function(){
                ctrl.loading = true;
                if($scope.submission && $scope.submission.users.length){
                    quiz_model.get([quiz_id]).then(function(){
                        ctrl.quiz = quiz_model.list[$scope.quiz_id];
                        ctrl.user_id = $scope.submission.users[0];
                        ctrl.userAnswers[ctrl.user_id] = {};
                        quiz_user_model.getUserAnswers(quiz_id, ctrl.user_id).then(function(answers){
                            answers[quiz_id].forEach(function(qa){
                                if(!ctrl.userAnswers[ctrl.user_id][qa.quiz_question_id]){
                                    ctrl.userAnswers[ctrl.user_id][qa.quiz_question_id] = { id:qa.id, text:qa.text, answer_id:[qa.quiz_answer_id] };
                                }
                                else if(qa.quiz_answer_id){
                                    ctrl.userAnswers[ctrl.user_id][qa.quiz_question_id].answer_id.push(qa.quiz_answer_id);
                                }
                            });  
                           ctrl.quiz.datum.quiz_question.forEach(function(question){
                               question.is_correct = ctrl.isCorrect(question);
                           });
                           ctrl.loading = false;
                       });

                   });
               }
            };
            if($parse($attrs.init).assign){
                $scope.init = ctrl.init; 
            }  
        }
    ]);