
angular.module('customElements')
    .directive('submissionGrader',[ 'session', 'assignments', '$timeout', 'library_model', 'items_model', 'quiz_model', 'post_model',
        'docslider_service',
        function( session, assignments, $timeout, library_model, items_model, quiz_model, post_model,
        docslider_service){
            return {
                scope:{
                    submissions:'=submissions',
                    editable:'=admin',
                    submission: '=submissionGrader'
                },
                templateUrl: 'app/shared/custom_elements/submission/templates/submission_grader.html',
                link: function( scope ){
                    scope.session = session;
                    scope.documents = library_model.list;
                    function init(submission){
                        if(scope.submission.item_id){
                            items_model.queue([scope.submission.item_id]).then(function(){
                                if(items_model.list[scope.submission.item_id].datum.quiz_id){
                                    var quiz_id = items_model.list[scope.submission.item_id].datum.quiz_id;
                                    quiz_model.queue([quiz_id]).then(function(){
                                        items_model.list[scope.submission.item_id].datum.points = 0;
                                        quiz_model.list[quiz_id].datum.quiz_question.forEach(function(q){
                                            items_model.list[scope.submission.item_id].datum.points += q.point;
                                        });
                                    });
                                }
                                if(items_model.list[scope.submission.item_id].datum.type === 'A' ||
                                    items_model.list[scope.submission.item_id].datum.type === 'GA' ){
                                    assignments.getListLibrary(submission.item_id, !submission.group_id ? submission.users[0] : null, submission.group_id).then(function(documents){
                                        documents = Array.isArray(documents) ? documents : documents[submission.item_id];
                                        library_model.queue(documents);
                                        submission.documents = documents;
                                        console.log('SUBMISSION DOCS', submission.documents );
                                    });
                                }
                            });
                        }
                        if(!submission.post_id){
                            assignments.getPostId(submission.item_id, !submission.group_id ? submission.users[0] : null, submission.group_id).then(function(post_id){
                                submission.post_id =  post_id;
                                post_model.queue([submission.post_id]).then(function(){
                                    if(scope.callbacks.initComments){
                                        scope.callbacks.initComments();
                                    }
                                    if(scope.callbacks.initQuiz){
                                        scope.callbacks.initQuiz();
                                    }
                                });
                            });
                        }
                        else{
                            post_model.queue([submission.post_id]).then(function(){
                                if(scope.callbacks.initComments){
                                    scope.callbacks.initComments();
                                }
                                if(scope.callbacks.initQuiz){
                                    scope.callbacks.initQuiz();
                                }
                            });
                        }
                        watch();
                    }
                    scope.callbacks = {
                        initComments : null,
                        initQuiz : null,
                        reply : null
                    };

                    if(!scope.submission && scope.submissions && scope.submissions.length){
                        scope.submission = scope.submissions[0];
                    }
                    init(scope.submission);
                    scope.items = items_model.list;
                    scope.index = scope.submissions ? scope.submissions.indexOf(scope.submission) : 0;
                    scope.previousSubmission = function(){
                        if(watcher){
                            watcher();
                            watcher = null;
                        }
                        scope.index = Math.max(0, scope.index - 1);
                        scope.submission = scope.submissions[scope.index];
                        init(scope.submission);
                    };
                      scope.nextSubmission = function(){
                        if(watcher){
                            watcher();
                            watcher = null;
                        }
                        scope.index = Math.min(scope.submissions.length - 1, scope.index + 1);
                        scope.submission = scope.submissions[scope.index];
                        init(scope.submission);
                    };

                    var watcher;
                    function watch(){
                        watcher = scope.$watch('submission.rate',function(value, previous){
                            if( value && value !== previous){
                                value = parseInt(value);
                                var points = scope.items[scope.submission.item_id].datum.points || 100;
                                scope.submission.rate = isNaN(value) ? previous : (Math.max(Math.min(points, value), 0)+'');

                            }
                            else if(!value){
                                scope.submission.rate = null;
                            }
                            if(scope.submission.timeout){
                               $timeout.cancel(scope.submission.timeout);
                               scope.submission.timeout = null;
                            }
                            if(previous !==  scope.submission.rate){
                                 scope.submission.timeout = $timeout(function(submission){
                                    if(submission.group_id){
                                         assignments.grade(submission.item_id, null, submission.group_id, submission.rate || -1);
                                    }
                                    else{
                                        assignments.grade(submission.item_id, submission.users[0], null, submission.rate || -1);
                                    }
                                    submission.timeout = null;

                                }, 1000, true, scope.submission);
                            }

                        });
                    }

                    scope.openSlider = function( $event, index){

                        var documents = scope.submission.documents.map(function(lib_id){
                            return library_model.list[lib_id].datum;
                        });
                        if(index !== null){
                            docslider_service.open({ docs : documents }, '', $event.target, index + 1);
                        }

                        $event.preventDefault();
                    };

                }
            };
        }
    ]);
