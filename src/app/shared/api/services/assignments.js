angular.module('API')
    .factory('assignments',['api_service', '$q', 'session', 'items_info_model',
        function( api_service, $q, session, items_info_model ){
            var service = {
                grade : function(item_id, user_id, group_id, grade){
                    return api_service.send('item.grade', { item_id : item_id, user_id : user_id, rate : grade || -1, group_id : group_id }).then(function(){
                        return items_info_model.get([item_id], true); 
                    });
                },
                getListLibrary : function(item_id, user_id, group_id){
                    return api_service.send('submission.getListLibrary', { item_id : item_id, user_id : user_id, group_id : group_id });
                },
                getList : function(filter){
                    return api_service.send('item.getListAssignmentId', { filter : filter });
                },
                getTimeline : function(filter){
                    return api_service.send('item.getListTimeline', { filter : filter });
                },
                getPostId : function(item_id, user_id, group_id){
                    return api_service.send('submission.getPostId', { item_id : item_id, user_id : user_id, group_id : group_id });
                }
            };
           
            
            return service;
        }
    ]);