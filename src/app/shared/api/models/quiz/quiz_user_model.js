
angular.module('API')
    .factory('quiz_user_model',['abstract_model_service','api_service',function(abstract_model_service, api_service){

        var service = new abstract_model_service({
            outdated_timeout: 1000*60*60*2,  // 2 hours.

            cache_size: 60,
            cache_model_prefix: 'qum.',
            cache_list_name: 'qum.ids',

            _method_get: 'quiz.getUserAnswer',

            add: function( question_id, answer_id, text ){
                return api_service.send('quiz.addUserAnswer',{quiz_question_id: question_id, quiz_answer_id: answer_id, text: text });
            },
            update: function( id, text, answer_id ){
                return api_service.send('quiz.updateUserAnswer',{id: id, text: text, quiz_answer_id: answer_id });
            },
            remove: function( id ){
                return api_service.send('quiz.removeUserAnswer',{id: id });
            },
            getUserAnswers: function( id, user_id ){
                return api_service.send('quiz.getUserAnswer',{ id: id, user_id : user_id });
            }
        });

        return service;
    }]);
