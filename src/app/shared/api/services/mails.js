angular.module('API')
    .factory('mails',['api_service',
        function(api_service){
            var service = {
                getList: function(){
                    return api_service.send('mail.getListTpl');
                },
                save : function(mail){
                    var toSave = { name : mail.name, from : mail.from, from_name : mail.from_name, subject : mail.subject, text : mail.storage[0].content, content : mail.storage[1].content};
                    return api_service.send('mail.addTpl', toSave);
                }
            };
            return service; 
        }
]);