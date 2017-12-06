angular.module('customElements').controller('quiz_view_controller',
    ['$scope','$element','quiz_user_model','quiz_model',
        '$translate','notifier_service','$q','events_service',
        function( $scope, $element, quiz_user_model, quiz_model,
            $translate, notifier_service, $q, events_service ){

            var ctrl = this,
                quiz_id = $scope.quiz_id;

            ctrl.loading = true;

            ctrl.quiz_questions = undefined;
            ctrl.questions = {};
            ctrl.userAnswers = {};
            ctrl.hasToSave = {};
            ctrl.radio_loading = {};

            ctrl.types = {
                multiple_choice: 'simple',
                multiple_answers: 'multiple',
                fill_text: 'text'
            };

            // INIT FOR INLINED QUESTIONS
            quiz_model.get([quiz_id]).then(function(){
                quiz_user_model.get([quiz_id], true).then(function(){

                    if( quiz_user_model.list[quiz_id] && quiz_user_model.list[quiz_id].datum ){
                        quiz_user_model.list[quiz_id].datum.forEach(function(qa){
                            if( !ctrl.userAnswers[qa.quiz_question_id] ){
                                ctrl.userAnswers[qa.quiz_question_id] = [];
                            }
                            ctrl.userAnswers[qa.quiz_question_id].push({ id:qa.id, text:qa.text, answer_id:qa.quiz_answer_id });
                        });
                    }

                    quiz_model.list[quiz_id].datum.quiz_question.forEach(function(question){
                        ctrl.questions[question.id] = {};

                        if( question.type === ctrl.types.fill_text ){
                            ctrl.questions[question.id].text = ctrl.userAnswers[question.id]&&
                                ctrl.userAnswers[question.id][0]?ctrl.userAnswers[question.id][0].text:'';

                        }else if( question.type === ctrl.types.multiple_answers ){

                            ctrl.questions[question.id].answers = {};
                            ctrl.questions[question.id].loading = {};
                            ctrl.questions[question.id].ids = {};

                            if( ctrl.userAnswers[question.id] ){
                                ctrl.userAnswers[question.id].forEach(function(ua){
                                    ctrl.questions[question.id].answers[ua.answer_id] = true;
                                    ctrl.questions[question.id].ids[ua.answer_id] = ua.id;
                                });
                            }else{
                                ctrl.userAnswers[question.id] = [];
                            }
                        }else if( question.type === ctrl.types.multiple_choice ){
                            ctrl.questions[question.id].answer = undefined;

                            if( ctrl.userAnswers[question.id] && ctrl.userAnswers[question.id].length ){
                                ctrl.questions[question.id].answer = ctrl.userAnswers[question.id][0].answer_id;
                            }
                        }
                    });

                    ctrl.quiz_questions = quiz_model.list[quiz_id].datum.quiz_question;
                    ctrl.loading = false;
                });
            });

            ctrl.checkboxChange = function( question, answer ){
                if( !$scope.admin ){
                    // UPDATE USER ANSWERS
                    ctrl.questions[question.id].loading[answer.id] = true;

                    if( ctrl.questions[question.id].answers[answer.id] ){
                        ctrl.userAnswers[question.id].push({answer_id: answer.id});
                        quiz_user_model.add( question.id, answer.id ).then(function( uaid ){
                            // TO DO
                            ctrl.questions[question.id].loading[answer.id] = false;
                            ctrl.questions[question.id].ids[answer.id] = uaid;
                        });

                    }else{
                        ctrl.userAnswers[question.id].some(function(ua, idx){
                            if( ua.answer_id === answer.id ){
                                ctrl.userAnswers[question.id].splice( idx, 1 );
                                return true;
                            }
                        });

                        quiz_user_model.remove( answer.id ).then(function(){
                            // TO DO
                            ctrl.questions[question.id].loading[answer.id] = false;
                            delete( ctrl.questions[question.id].ids[answer.id] );
                        });
                    }
                }
            };

            ctrl.radioChange = function( question, answer ){
                if( !$scope.admin ){
                    var qid = question.id;

                    ctrl.radio_loading[qid] = answer.id;

                    if( ctrl.userAnswers[qid] && ctrl.userAnswers[qid][0] ){
                        ctrl.userAnswers[qid][0].answer_id = answer.id;

                        quiz_user_model.update( ctrl.userAnswers[qid][0].id , undefined, answer.id ).then(function(){
                            ctrl.radio_loading[qid] = false;
                        },function(){
                            ctrl.radio_loading[qid] = false;
                        });

                    }else{
                        quiz_user_model.add( qid, answer.id ).then(function( uaid ){
                            ctrl.userAnswers[qid] = [{id: uaid, answer_id: answer.id}];
                            ctrl.radio_loading[qid] = false;
                        },function(){
                            ctrl.radio_loading[qid] = false;
                        });
                    }
                }
            };

            ctrl.textChange = function( question, force, question_id ){
                if( !$scope.admin ){
                    var qid = question_id || question.id;

                    if( !force ){
                        ctrl.hasToSave[qid] = ctrl.questions[qid].text;
                    }

                    if( !ctrl.hasToSave[qid].saving || force ){
                        ctrl.hasToSave[qid].saving = true;

                        if( ctrl.userAnswers[qid] && ctrl.userAnswers[qid][0] ){
                            ctrl.userAnswers[qid][0].text = ctrl.hasToSave[qid];
                            quiz_user_model.update( ctrl.userAnswers[qid][0].id , ctrl.hasToSave[qid] ).then(function(){
                                if( ctrl.hasToSave[qid].waiting ){
                                    ctrl.textChange( true, qid);
                                }else{
                                    ctrl.hasToSave[qid].saving = false;
                                    ctrl.hasToSave[qid].waiting = false;
                                }
                            },function(){
                                ctrl.hasToSave[qid].saving = false;
                                ctrl.hasToSave[qid].waiting = false;
                            });
                        }else{
                            ctrl.userAnswers[qid] = [{text: ctrl.hasToSave[qid]}];
                            quiz_user_model.add( qid, undefined, ctrl.hasToSave[qid] ).then(function( uaid ){
                                ctrl.userAnswers[qid][0].id = uaid;

                                if( ctrl.hasToSave[qid].waiting ){
                                    ctrl.textChange( undefined, true, qid);
                                }else{
                                    ctrl.hasToSave[qid].saving = false;
                                    ctrl.hasToSave[qid].waiting = false;
                                }
                            },function(){
                                ctrl.hasToSave[qid].saving = false;
                                ctrl.hasToSave[qid].waiting = false;
                            });
                        }

                    }else{
                        ctrl.hasToSave[qid].waiting = true;
                    }
                }
            };


            /*

            // INIT
            quiz_model.get([quiz_id]).then(function(){
                quiz_user_model.get([quiz_id], true).then(function(){

                    if( quiz_user_model.list[quiz_id] && quiz_user_model.list[quiz_id].datum ){
                        quiz_user_model.list[quiz_id].datum.forEach(function(qa){
                            if( !ctrl.userAnswers[qa.quiz_question_id] ){
                                ctrl.userAnswers[qa.quiz_question_id] = [];
                            }
                            ctrl.userAnswers[qa.quiz_question_id].push({ id:qa.id, text:qa.text, answer_id:qa.quiz_answer_id });
                        });
                    }

                    initCurrent();
                    ctrl.loading = false;
                });
            });

            function initCurrent(){
                if(
                    !quiz_model.list[quiz_id].datum.quiz_question.some(function( question, index ){
                        if( !ctrl.userAnswers[question.id] ){
                            setCurrent( question, index );
                            return true;
                        }
                    }) ){
                    setCurrent( quiz_model.list[quiz_id].datum.quiz_question[0], 0 );
                }
            }

            function setCurrent( question, index ){
                ctrl.current = question;
                ctrl.index = index+1;

                if( ctrl.current.type === ctrl.types.fill_text ){
                    ctrl.text_answer = ctrl.userAnswers[question.id]&&
                        ctrl.userAnswers[question.id][0]?ctrl.userAnswers[question.id][0].text:'';
                }else if( ctrl.current.type === ctrl.types.multiple_answers ){
                    ctrl.checkbox_answers = {};
                    ctrl.checkbox_loading = {};
                    ctrl.checkbox_ids = {};

                    if( ctrl.userAnswers[question.id] ){
                        ctrl.userAnswers[question.id].forEach(function(ua){
                            ctrl.checkbox_answers[ua.answer_id] = true;
                            ctrl.checkbox_ids[ua.answer_id] = ua.id;
                        });
                    }else{
                        ctrl.userAnswers[question.id] = [];
                    }
                }else if( ctrl.current.type === ctrl.types.multiple_choice ){

                    ctrl.radio_answer = undefined;
                    if( ctrl.userAnswers[question.id] && ctrl.userAnswers[question.id].length ){
                        ctrl.radio_answer = ctrl.userAnswers[question.id][0].answer_id;
                    }
                }
            }


            ctrl.hasNext = function(){
                return !ctrl.loading && quiz_model.list[quiz_id].datum.quiz_question && quiz_model.list[quiz_id].datum.quiz_question.length > ctrl.index;
            };

            ctrl.hasPrevious = function(){
                return ctrl.index > 1;
            };

            ctrl.goNext = function(){
                setCurrent( quiz_model.list[quiz_id].datum.quiz_question[ctrl.index], ctrl.index );
            };

            ctrl.goPrevious = function(){
                setCurrent( quiz_model.list[quiz_id].datum.quiz_question[ctrl.index-2], ctrl.index-2 );
            };

            ctrl.checkboxChange = function( answer ){
                if( !$scope.admin ){
                    // UPDATE USER ANSWERS
                    ctrl.checkbox_loading[answer.id] = true;

                    if( ctrl.checkbox_answers[answer.id] ){
                        ctrl.userAnswers[ctrl.current.id].push({answer_id: answer.id});
                        quiz_user_model.add( ctrl.current.id, answer.id ).then(function( uaid ){
                            // TO DO
                            ctrl.checkbox_loading[answer.id] = false;
                            ctrl.checkbox_ids[answer.id] = uaid;
                        });

                    }else{
                        ctrl.userAnswers[ctrl.current.id].some(function(ua, idx){
                            if( ua.answer_id === answer.id ){
                                ctrl.userAnswers[ctrl.current.id].splice( idx, 1 );
                                return true;
                            }
                        });

                        quiz_user_model.remove( ctrl.current.id, answer.id ).then(function(){
                            // TO DO
                            ctrl.checkbox_loading[answer.id] = false;
                            delete( ctrl.checkbox_ids[answer.id] );
                        });
                    }
                }
            };

            ctrl.radioChange = function( answer ){
                if( !$scope.admin ){
                    var qid = ctrl.current.id;

                    ctrl.radio_loading[qid] = answer.id;

                    if( ctrl.userAnswers[qid] && ctrl.userAnswers[qid][0] ){
                        ctrl.userAnswers[qid][0].answer_id = answer.id;

                        quiz_user_model.update( ctrl.userAnswers[qid][0].id , undefined, answer.id ).then(function(){
                            ctrl.radio_loading[qid] = false;
                        },function(){
                            ctrl.radio_loading[qid] = false;
                        });

                    }else{
                        quiz_user_model.add( qid, answer.id ).then(function( uaid ){
                            ctrl.userAnswers[qid] = [{id: uaid, answer_id: answer.id}];
                            ctrl.radio_loading[qid] = false;
                        },function(){
                            ctrl.radio_loading[qid] = false;
                        });
                    }
                }
            };

            ctrl.textChange = function( force, question_id ){
                if( !$scope.admin ){
                    var qid = question_id || ctrl.current.id;

                    if( !force ){
                        ctrl.hasToSave[qid] = ctrl.text_answer;
                    }

                    if( !ctrl.hasToSave[qid].saving || force ){
                        ctrl.hasToSave[qid].saving = true;

                        if( ctrl.userAnswers[qid] && ctrl.userAnswers[qid][0] ){
                            ctrl.userAnswers[qid][0].text = ctrl.hasToSave[qid];
                            quiz_user_model.update( ctrl.userAnswers[qid][0].id , ctrl.hasToSave[qid] ).then(function(){
                                if( ctrl.hasToSave[qid].waiting ){
                                    ctrl.textChange( true, qid);
                                }else{
                                    ctrl.hasToSave[qid].saving = false;
                                    ctrl.hasToSave[qid].waiting = false;
                                }
                            },function(){
                                ctrl.hasToSave[qid].saving = false;
                                ctrl.hasToSave[qid].waiting = false;
                            });
                        }else{
                            ctrl.userAnswers[qid] = [{text: ctrl.hasToSave[qid]}];
                            quiz_user_model.add( qid, undefined, ctrl.hasToSave[qid] ).then(function( uaid ){
                                ctrl.userAnswers[qid][0].id = uaid;

                                if( ctrl.hasToSave[qid].waiting ){
                                    ctrl.textChange( true, qid);
                                }else{
                                    ctrl.hasToSave[qid].saving = false;
                                    ctrl.hasToSave[qid].waiting = false;
                                }
                            },function(){
                                ctrl.hasToSave[qid].saving = false;
                                ctrl.hasToSave[qid].waiting = false;
                            });
                        }

                    }else{
                        ctrl.hasToSave[qid].waiting = true;
                    }
                }
            };*/

            ctrl.submit = function(event){
                if( $scope.submit ){
                    $scope.submit(event);
                }
            };
        }
    ]);
