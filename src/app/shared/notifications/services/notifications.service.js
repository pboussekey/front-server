angular.module('notifications_module')
    .factory('notifications_service',['filters_functions', 'pages_config', 'session', 'pages_config', 'events_service',
             'modal_service', '$timeout', 'notifications', '$state', '$q', 'user_model', 'page_model', 'post_model',
        function(filters_functions, pages_config, session, pages_config, events_service,
                modal_service, $timeout, notifications, $state, $q, user_model, page_model, post_model){

            function onNtfLoaded(){

            }

            var service = {
                unread_notifications: 0,
                list : [],
                notify : function(ntf){
                    events_service.on('ntfLoaded' + ntf.id, function(){
                        if(ntf.inited && ntf.text){
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
                        events_service.off('ntfLoaded' + ntf.id);
                    });

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
                    if(ntf.inited && notifications.events.post_update_types.indexOf(ntf.event) !== -1){
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
                    else if(ntf.inited && notifications.events.academic_types.indexOf(ntf.event) !== -1){
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
