angular.module('notifications_module')
    .factory('notifications_service',['filters_functions', 'pages_config', 'session', 'pages_config',
             'modal_service', '$timeout', 'notifications', '$state', '$q', 'user_model', 'page_model', 'post_model',
        function(filters_functions, pages_config, session, pages_config,
                modal_service, $timeout, notifications, $state, $q, user_model, page_model, post_model){


            var service = {
                post_update_types:['post.create', 'post.update', 'post.com', 'post.like', 'post.tag', 'post.share',
                     'connection.accept','connection.request', 'page.invited'],
                academic_types:['page.member', 'item.publish', 'item.update', 'page.doc'],
                page_users_updates_types:['page.member', 'page.invited', 'page.pending', 'pageuser.delete'],
                unread_notifications: 0,
                list : [],
                notify : function(ntf){
                    if(ntf.text){
                        var icon = ntf.source.data.avatar ? filters_functions.dmsLink(ntf.source.data.avatar, [80,'m',80]) : "";
                        service.desktopNotification(
                            ntf.nid,
                            'TWIC',
                            ntf.text.split(":")[0],
                            icon,
                            function(e) {
                                service.notifAction(ntf);
                            }
                        );
                    }
                    if(!ntf.page && ntf.object.data.t_page_id){
                        page_model
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
                    if(ntf.inited && !ntf.read_date){
                        ntf.read_date = new Date();
                        service.unread_notifications--;
                        notifications.read(ntf.id);
                    }
                    if(ntf.inited && service.post_update_types.indexOf(ntf.event) !== -1){
                        var ref = document.activeElement;
                        if(!$event || ($event && document.querySelector('#dktp-header').contains( $event.target )) ){
                            ref = document.querySelector('#desktopntf');
                        }
                        $timeout(function(){
                            modal_service.open({
                                label: '',
                                template: 'app/shared/custom_elements/post/view_modal.html',
                                scope:{
                                    id:  (ntf.origin || ntf.initial).post.id,
                                    ntf: ntf,
                                    notifications: service
                                },
                                reference: ref
                            });
                        });
                    }
                    else if(ntf.inited && service.academic_types.indexOf(ntf.event) !== -1){
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
                },
                initNotif : function(ntf){

                }
            };
            service.init = function(){
                service.clearEvents();
                notifications.getUnreadCount().then(function(count){
                    service.unread_notifications = count;
                });
                notifications.get().then(function(){
                    notifications.list.forEach(service.initNotif);
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
                    notifications.list.forEach(service.initNotif);
                    loading = notif_length === notifications.list.length;
                });
            };
            return service;
    }]);
