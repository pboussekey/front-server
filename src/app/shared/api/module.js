angular.module('API',['EVENTS','UPLOAD','SESSION','STORAGE'])
    .run(['api_service','events_service','events','session','API_ERRORS','service_garbage', 'user_model','post_model','feed','storage',
        function( api_service, events_service, events, session, API_ERRORS, service_garbage, user_model, post_model, feed, storage ){

            // BUILD CHECK TO SEE IF STORAGE NEED TO BE CLEAR.
            if( storage.getItem('buildVersion') !== CONFIG.buildVersion+'' ){
                storage.clear();
                session.set(session);
                storage.setItem('buildVersion', CONFIG.buildVersion );
            }

            events_service.on( events.logged, function(){
                var c = {headers:{}};
                c.headers[CONFIG.api.authorization_header] = session.token;
                api_service.configure(c);
            },null,0);

            events_service.on( events.logout_success, function(){
                var c = {headers:{}};
                c.headers[CONFIG.api.authorization_header] = '';
                api_service.configure(c);
                service_garbage.clear();
            },null,0);

            // UPDATING MODELS ON NOTIFICATIONS
            events_service.on(events.user_updated, function(args){
                user_model.get([args.datas[0].data], true);
            });
            events_service.on( events.post_updated, outdatePost);
            events_service.on( events.post_liked, outdatePost );
            events_service.on( events.post_commented, outdatePost );

            if( session.id ){
                var c = {headers:{}};
                c.headers[CONFIG.api.authorization_header] = session.token;
                api_service.configure(c);
            }

            api_service.onError( API_ERRORS.NOT_CONNECTED, function(){
                events_service.process( events.logout_success );
            },null,0);

            function outdatePost( event ){
                // OUTDATE POST MODEL.
                var post_id = event.datas[0].object.id,
                    parent_id = event.datas[0].object.parent_id,
                    origin_id = event.datas[0].object.origin_id;

                post_model._outdateModel( post_id );

                if( origin_id ){
                    post_model._outdateModel( origin_id );
                }
                if( parent_id ){
                    post_model._outdateModel( parent_id );
                }

                // OUTDATE MAIN FEED PAGINATOR.
                feed.outdate();
            }
        }
    ]);

ANGULAR_MODULES.push('API');
