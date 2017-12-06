angular.module('notifications_module')
    .factory('notifications_service',['filters_functions',
        function(filters_functions){            
         
            var service = {
                post_update_types:['post.create', 'post.update', 'post.com', 'post.like', 
                    'page.member', 'connection.accept','connection.request', 'page.invited'],
                unread_notifications: 0,
                list : [],
                texts: {
                    /*"user.update": function(notification){
                        return filters_functions.username(notification.source.data, true) + " has an updated profile";
                    },*/
                    "post.create": function(notification){ 
                        return filters_functions.username(notification.source.data, true) + " <b>published</b> a post";
                    },
                    "post.com": function(notification){ 
                        return filters_functions.username(notification.source.data, true) + " <b>commented</b> on a post";
                    },
                    "page.member":
                    function(notification){
                        return "You are now member of a new group.";
                    },
                    "page.invited":
                    function(notification){
                        return filters_functions.username(notification.source.data, true) + " <b>invited</b> you to join an event.";
                    },
                    "post.like":
                    function(notification){ 
                        return filters_functions.username(notification.source.data, true) + " <b>liked</b> a post";
                    }
                },
          
                clearEvents : function(){
                    service.list = [];
                    service.unread_notifications = 0;
                }
            };
            return service;
    }]);
