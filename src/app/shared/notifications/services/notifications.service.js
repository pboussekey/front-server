angular.module('notifications_module')
    .factory('notifications_service',['filters_functions', 'pages_config', 'modal_service', '$timeout', 'notifications',
        function(filters_functions, pages_config, modal_service, $timeout, notifications){

            var service = {
                post_update_types:['post.create', 'post.update', 'post.com', 'post.like', 'post.tag',
                    'page.member', 'connection.accept','connection.request', 'page.invited'],
                page_users_updates_types:['page.member', 'page.invited', 'page.pending', 'pageuser.delete'],
                unread_notifications: 0,
                list : [],
                texts: {
                    /*"user.update": function(notification){
                        return filters_functions.username(notification.source.data, true) + " has an updated profile";
                    },*/
                    "post.create": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> published a post";
                    },
                    "post.com": function(notification){
                        return "<b>" + filters_functions.username(notification.source.data, true) + "</b> >commented on a post";
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
                    }
                },
                notify : function(ntf){
                    if(service.texts[ntf.event]){
                        var icon = ntf.source.data.avatar ? filters_functions.dmsLink(ntf.source.data.avatar, [80,'m',80]) : "";
                        if(navigator.userAgent.indexOf('twicapp') === -1){
                            var n = new Notification(
                              filters_functions.stripTags(service.texts[ntf.event](ntf)),
                              { icon : icon }
                            );
                        }
                        n.onclick = function(e) {
                          service.notifAction(ntf);
                        };
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
