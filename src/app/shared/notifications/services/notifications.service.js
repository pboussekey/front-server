angular.module('notifications_module')
    .factory('notifications_service',['filters_functions', 'pages_config',
        function(filters_functions, pages_config){            
         
            var service = {
                post_update_types:['post.create', 'post.update', 'post.com', 'post.like', 
                    'page.member', 'connection.accept','connection.request', 'page.invited'],
                page_users_updates_types:['page.member', 'page.invited', 'page.pending'],
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
                        var label = pages_config[notification.object.data.page.type].label;
                        return filters_functions.username(notification.source.data, true) + " <b>enrolled</b> you in a new " + label;
                    },
                    "page.invited":
                    function(notification){
                        var label = pages_config[notification.object.data.page.type].label;
                        return filters_functions.username(notification.source.data, true) + " <b>invited</b> you to join " + (label === 'event' ? "an " : "a ") + label;
                    },
                    "page.pending":
                    function(notification){
                        var label = pages_config[notification.object.data.page.type].label;
                        return filters_functions.username(notification.source.data, true) + " <b>requested</b> to join your " + label;
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
