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
                            var icon = ntf.picture ? filters_functions.dmsLink(ntf.picture, [80,'m',80]) : "";
                            service.desktopNotification(
                                ntf.nid,
                                'TWIC',
                                filters_functions.stripTags(ntf.text),
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
                                    id:  (ntf.object.origin_id || ntf.object.id)
                                },
                                reference: ref
                            });
                        });
                    }
                    else if(ntf.event === 'connection.accept'){
                        $state.go('lms.profile', { id : ntf.object.user });

                    }
                    else if(ntf.inited && notifications.events.academic_types.indexOf(ntf.event) !== -1){
                        var states = {
                            'item.publish' : 'lms.page.content',
                            'section.publish' : 'lms.page.content',
                            'item.update' : 'lms.page.content',
                            'page.doc' : 'lms.page.resources',
                            'page.member' : 'lms.page.users',
                            'page.invited' : 'lms.page.users',
                            'page.pending' : 'lms.page.users'
                        };
                        var type = ntf.object.page_type;
                        var id = ntf.object.page ;
                        var item_id = ntf.object.item;
                        var library_id = ntf.object.library;

                        $state.go(states[ntf.event] || 'lms.page', { id : id, type : type,  item_id : item_id, library_id : library_id });
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
