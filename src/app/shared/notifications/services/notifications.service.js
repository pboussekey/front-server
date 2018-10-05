angular.module('notifications_module')
    .factory('notifications_service',['filters_functions', 'pages_config', 'modal_service', '$timeout', 'notifications', '$state',
        function(filters_functions, pages_config, modal_service, $timeout, notifications, $state){

            var service = {
                post_update_types:['post.create', 'post.update', 'post.com', 'post.like', 'post.tag',
                     'connection.accept','connection.request', 'page.invited'],
                academic_types:['page.member', 'item.publish', 'item.update', 'page.doc'],
                page_users_updates_types:['page.member', 'page.invited', 'page.pending', 'pageuser.delete'],
                unread_notifications: 0,
                list : [],
                texts: {
                    /*"user.update": function(notification){
                        return filters_functions.username(notification.source.data, true) + " has an updated profile";
                    },*/
                    "connection.accept" : function(notification){
                          return "<b>" + filters_functions.username(notification.source.data, true) + "</b> is now connected to you";
                    },
                    "post.create": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> published a post";
                    },
                    "post.com": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> commented on a post";
                    },
                    "post.share": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> shared on a post";
                    },
                    "page.member":
                    function(notification){
                        var label = pages_config[notification.object.data.page.type].label;
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> enrolled you in a new " + label;
                    },
                    "page.invited":
                    function(notification){
                        var label = pages_config[notification.object.data.page.type].label;
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> invited you to join " + (label === 'event' ? "an " : "a ") + label;
                    },
                    "page.pending":
                    function(notification){
                        var label = pages_config[notification.object.data.page.type].label;
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> requested to join your " + label;
                    },
                    "post.like":
                    function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> liked a post";
                    },
                    "post.tag":
                    function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> mentionned you in a post";
                    },
                    "item.publish": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> published a new item in one of your course";
                    },
                    "item.update": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> updated an item in one of your course";
                    },
                    "page.doc": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> added a new material in one of your course";
                    }
                },
                notify : function(ntf){
                    if(service.texts[ntf.event]){
                        var icon = ntf.source.data.avatar ? filters_functions.dmsLink(ntf.source.data.avatar, [80,'m',80]) : "";
                        service.desktopNotification(
                            ntf.nid,
                            'TWIC',
                            service.texts[ntf.event](ntf),
                            icon,
                            function(e) {
                                service.notifAction(ntf);
                            }
                        );
                    }
                },
                clearEvents : function(){
                    service.list = [];
                    service.unread_notifications = 0;
                },
                read : function(){
                    notifications.read();
                    service.unread_notifications = 0;
                    service.list.forEach(function(ntf){
                        ntf.read_date = new Date();
                    });
                },
                notifAction : function( ntf, $event ){
                    if($event){
                      $event.stopPropagation();
                    }
                    if(!ntf.read_date){
                        ntf.read_date = new Date();
                        service.unread_notifications--;
                        notifications.read(ntf.id);
                    }
                    if(service.post_update_types.indexOf(ntf.event) !== -1){
                        var ref = document.activeElement;
                        if(!$event || ($event && document.querySelector('#dktp-header').contains( $event.target )) ){
                            ref = document.querySelector('#desktopntf');
                        }

                        $timeout(function(){
                            modal_service.open({
                                label: '',
                                template: 'app/shared/custom_elements/post/view_modal.html',
                                scope:{
                                    id: ntf.object.origin_id || ntf.object.id,
                                    ntf: ntf,
                                    notifications: service
                                },
                                reference: ref
                            });
                        });
                    }
                    else if(service.academic_types.indexOf(ntf.event) !== -1){
                        var states = {
                            'item.publish' : 'lms.page.content',
                            'item.update' : 'lms.page.content',
                            'page.doc' : 'lms.page.resources'
                        };
                        var type = 'course';
                        var id = ntf.object.page_id;
                        if(ntf.object.data.page){
                            type = ntf.object.data.page.type;
                            id = ntf.object.data.page.id;
                        }
                        $state.go(states[ntf.event] || 'lms.page', { type : type, id : id, item_id : ntf.object.item_id, library_id : ntf.object.library_id });
                    }
                },
                desktopNotification : function(id, text, body, icon, onclick){
                  if ("Notification" in window) {
                        var n = new Notification(
                          text || '',
                          { icon : icon, tag : id, body : body || '' }
                        );
                        if(onclick){
                            n.onclick = onclick;
                        }
                    }
                },
                requestPermission : function(){
                    if ("Notification" in window) {
                        Notification.requestPermission(function (status) {
                             if (Notification.permission !== status) {
                                Notification.permission = status;
                             }
                        });
                    }
                },
                notificationsStatus : function(){
                    if (!("Notification" in window)) {
                        return 'denied';
                    }
                    else{
                        return Notification.permission;
                    }
                }
            };
            service.init = function(){
                service.clearEvents();
                notifications.getUnreadCount().then(function(count){
                    service.unread_notifications = count;
                });
                notifications.get().then(function(){
                    service.list = notifications.list;
                    service.count = notifications.count;
                });
            };

            var loading;
            service.next = function(){
                if(loading){
                    return;
                }
                loading= true;
                var notif_length = notifications.list.length;
                notifications.next().then(function(){
                    loading = notif_length === notifications.list.length;
                });
            };
            return service;
    }]);
