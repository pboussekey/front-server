angular.module('notifications_module',['EVENTS', 'WEBSOCKET'])
    .run(['websocket', 'session', 'events_service', 'notifications_service', 'events',
        function( websocket, session, events_service, notifications_service, events){

            events_service.on( events.logout_success, notifications_service.clearEvents);

            websocket.get().then(function(socket){
                socket.on('notification',function(ntf){
                    if( notifications_service.post_update_types.indexOf(ntf.event) !== -1
                        && ntf.source && (ntf.source.name !== 'user' || ntf.source.id !== session.id) ){
                        events_service.process( events.feed_updates, ntf );
                    }
                    if(notifications_service.page_users_updates_types.indefOf(ntf.event) !== -1){
                        events_service.on('pageUsers' + ntf.object.id);
                    }

                    if(ntf.source && (ntf.source.name !== 'user' || ntf.source.id !== session.id) && notifications_service.texts[ntf.event]){
                        ntf.date = new Date(ntf.date);
                        notifications_service.list.unshift(ntf);
                        notifications_service.unread_notifications++;
                        events_service.process(events.notification_received);
                    }

                    events_service.process(ntf.event, ntf);
                });
            },function(){
                // Can't get socket...
            });
    }]);

ANGULAR_MODULES.push('notifications_module');
