
angular.module('API')
    .factory('quiz_model',['abstract_model_service','api_service',function(abstract_model_service, api_service){

        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.

            cache_size: 60,
            cache_model_prefix: 'quiz.',
            cache_list_name: 'quiz.ids',

            _method_get: 'quiz.get',

            // CREATE A QUIZ: questions = [{ text, points, type, answers:[{ text,is_correct},...]},...]
            create: function( item_id, questions ){
                return api_service.send('quiz.add', {item_id: item_id, questions: questions, name:'TEST' })
                    .then(function( quiz_id ){
                        return service.get([quiz_id]);
                    });
            },
            // REMOVE QUESTIONS: question_ids = [id1, id2, ...]
            removeQuestions: function( question_ids ){
                return api_service.send('quiz.removeQuestions', { quiz_question_id: question_ids });
            },
            // CREATE QUESTIONS: questions = [{ quiz_id, text, points, type },...]
            addQuestions: function( id, questions ){
                return api_service.send('quiz.addQuestions', {id: id, questions: questions });
            },
            // UPDATE QUESTIONS: questions = [{ quiz_id, question_id, text, points, type },...]
            updateQuestions: function( questions ){
                return api_service.send('quiz.updateQuestions', { questions: questions });
            },
            // REMOVE ANSWERS: answer_ids = [ id1, id2, ...]
            removeAnswers: function( answer_ids ){
                return api_service.send('quiz.removeAnswers', {quiz_answer_id:answer_ids});
            },
            // CREATE QUIZ ANSWERS: answers = [ { is_correct, text, question_id}, ... ]
            addAnswers: function( answers ){
                return api_service.send('quiz.addAnswers', {answers: answers});
            },
            // UPDATE QUIZ ANSWERS: answers = [ {id, is_correct, text, question_id}, ... ]
            updateAnswers: function( answers ){
                return api_service.send('quiz.updateAnswers', {answers: answers});
            }

        });
        
        window.quiz_model = service;

        return service;
    }]);
