angular.module('customElements').controller('editable_question_controller',
    ['$scope',
        function( $scope ){

            var ctrl = this,
                question_types = {
                    multiple:{
                        label: 'question.multiple_answers'
                    },
                    simple:{
                        label: 'question.multiple_choice'
                    },
                    text: {
                        label: 'question.fill_text'
                    }
                };

            ctrl.hidden = !$scope.displayed;

            ctrl.types = {
                multiple_choice: 'simple',
                multiple_answers: 'multiple',
                fill_text: 'text'
            };

            // INITIALIZATION => GET ANSWERS IF QUESTION EXIST.
            if( !$scope.question.answers ){
                $scope.question.answers = [];
            }

            if( !$scope.question.id ){
                $scope.question.hash = 'qhash'+(Math.random()+'').slice(2);
                $scope.question.type = ctrl.types.multiple_choice;
                $scope.question.point = 0;
            }

            ctrl.addAnswer = function(){
                var answer = {
                    hash:'ahash'+(Math.random()+'').slice(2),
                    is_correct: false
                };

                $scope.question.answers.push( answer );

                if( $scope.question.id ){
                    answer.quiz_question_id = $scope.question.id;
                    
                    if(!$scope.question.answers.createds){
                        $scope.question.answers.createds = [];
                    }
                    
                    $scope.question.answers.createds.push( answer );
                }
            };

            ctrl.deleteAnswer = function( answer ){
                var ax = $scope.question.answers.indexOf( answer );
                if( ax !== -1 ){
                    $scope.question.answers.splice( ax, 1 );

                    if( $scope.question.id ){
                        if( answer.id ){
                            if(!$scope.question.answers.removeds ){
                                $scope.question.answers.removeds = [];
                            }
                            $scope.question.answers.removeds.push( answer.id );
                        }else{
                            $scope.question.answers.createds.splice( $scope.question.answers.createds.indexOf(answer),1 );
                        }
                    }
                }
            };

            ctrl.setSimpleType = function(){
                $scope.question.type = ctrl.types.multiple_choice;
                
                if( $scope.question.answers.length ){
                    var has_correct = false;                    
                    $scope.question.answers.forEach(function(a){
                        if( has_correct ){
                            a.is_correct = false;
                        }else if( !has_correct && a.is_correct ){
                            has_correct = true;
                        }
                    });
                }
            };
            
            ctrl.setMultipleType = function(){
                $scope.question.type = ctrl.types.multiple_answers;
            };

            ctrl.setTextType = function(){
                $scope.question.type = ctrl.types.fill_text;
                
                while( $scope.question.answers.length && $scope.question.answers.length > 1 ){
                    ctrl.deleteAnswer($scope.question.answers[0]);  
                }
                
                if( !$scope.question.answers.length ){
                    ctrl.addAnswer();
                }
            };
            
            ctrl.isValid = function(){
                if( !$scope.question.text || !$scope.question.point ){
                    return false;
                }
                
                if( $scope.question.type === ctrl.types.fill_text ){
                    return !!$scope.question.answers[0].text;                    
                }else{
                    if( !$scope.question.answers || $scope.question.answers.length < 2 ){
                        return false;
                    }
                    
                    var l = $scope.question.answers.length, cl = 0, is_empty = false;
                    $scope.question.answers.forEach(function(a){
                        if( !a.text ){
                            is_empty = true;
                        }
                        if( a.is_correct ){
                            cl++;
                        }
                    });
                    
                    if( is_empty || cl === l || !cl ){
                        return false;
                    }
                }
                
                return true;
            };

            ctrl.getTypeLabel = function(){
                return question_types[ $scope.question.type ].label;
            };

            ctrl.deleteQuestion = function($event){
                if( $scope.delete )
                    $scope.delete( $scope.question, $event );
            };

            ctrl.toggle = function(){
                ctrl.hidden = !ctrl.hidden;
            };

            ctrl.show = function(){
                ctrl.hidden = false;
            };

            ctrl.correctStateChange = function( answer ){
                if( answer.is_correct && $scope.question.type === ctrl.types.multiple_choice ){
                    $scope.question.answers.forEach(function(a){
                        if( a !== answer && a.is_correct ){
                            a.is_correct = false;
                        }
                    });
                }
            };
        }
    ]);
