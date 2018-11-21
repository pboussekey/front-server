angular.module('notifications_module',['EVENTS', 'WEBSOCKET'])
    .run(['websocket', 'session', 'events_service', 'notifications_service', 'notifications', 'events',
        function( websocket, session, events_service, notifications_service, notifications, events){

            events_service.on( events.logout_success, notifications_service.clearEvents);

            websocket.get().then(function(socket){
                socket.on('notification',function(ntf){
                    if( notifications.events.post_update_types.indexOf(ntf.event) !== -1
                        && ntf.source && (ntf.source.name !== 'user' || ntf.source.id !== session.id) ){
                        events_service.process( events.feed_updates, ntf );
                    }
                    if(notifications.events.page_users_updates_types.indexOf(ntf.event) !== -1){
                        if(ntf.event !== 'pageuser.delete'){
                            events_service.process('pageUsers' +ntf.object.data.page.id);
                        }
                        else{
                            events_service.process('userState#' +ntf.data);
                            events_service.process('pageuserDeleted#' +ntf.data);
                            events_service.process('pageUsers' +ntf.data);
                        }
                    }
                    if(ntf.event === 'page.delete'){
                        events_service.process('pageDeleted#' + ntf.data);
                        events_service.process('pageuserDeleted#' +ntf.data);
                    }

                    if(ntf.source && (ntf.source.name !== 'user' || ntf.source.id !== session.id)
                      && notifications.events.displayed_types.indexOf(ntf.event) !== -1){
                        ntf.date = new Date(ntf.date);
                        ntf.text = ntf.object.text;
                        ntf.target_id = ntf.object.target;
                        ntf.picture = ntf.object.picture;
                        notifications_service.list.unshift(ntf);
                        notifications_service.unread_notifications++;
                        notifications_service.notify(ntf);
                        events_service.process(events.notification_received);
                    }

                    events_service.process(ntf.event, ntf);
                });
            },function(){
                // Can't get socket...
            });
    }]);

ANGULAR_MODULES.push('notifications_module');
