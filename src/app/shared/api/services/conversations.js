
angular.module('API')
    .factory('conversations',['api_service','session','events_service','connections','service_garbage',
        function( api_service, session, events_service, connections, service_garbage ){

            var service = {
                types:{
                    channel:1,
                    conversation: 2
                },

                channel_unreads: [],
                conversation_unreads: [],
                connection_unreads: {},
                get: function(id){
                    return api_service.send('conversation.get', { id : id });
                },
                getToken: function(id){
                    return api_service.send('conversation.getToken', { id : id });
                },
                clear: function(){
                    service.channel_unreads = [];
                    service.conversation_unreads = [];
                    service.connection_unreads = {};
                },

                searchConversations: function( search, page, number ){
                    return api_service.queue('conversation.getList',
                        {search:search, filter:{p:page,n:number}, type:service.types.conversation });
                },
                searchChannels: function( search, page, number ){
                    return api_service.queue('conversation.getList',
                        {search:search, filter:{p:page,n:number}, type:service.types.channel });
                },

                getConnectionUnreads: function(){
                    return api_service.queue('conversation.getList',{contact:true, noread:true, type:service.types.conversation})
                        .then(function(d){
                            if( d && d.length ){
                                d.forEach(function( conversation ){
                                    var connection;

                                    conversation.users.some(function(uid){
                                        if( uid !== session.id ){
                                            connection = uid;
                                            return true;
                                        }
                                    });

                                    service.connection_unreads[ connection ] = conversation.id;
                                });
                            }
                        });
                },

                getChannelUnreads: function(){
                    return api_service.queue('conversation.getList',{noread:true, type:service.types.channel})
                        .then(function(d){
                            if( d && d.length ){
                                service.channel_unreads = [];
                                d.forEach(function( conversation ){
                                    service.channel_unreads.push( conversation.id );
                                });
                            }
                        });
                },

                getConversationUnreads: function(){
                    return api_service.queue('conversation.getList',{ noread:true, type:service.types.conversation})
                        .then(function(d){
                            if( d && d.length ){
                                service.conversation_unreads = [];
                                d.forEach(function( conversation ){
                                    service.conversation_unreads.push( conversation.id );
                                });
                            }
                        });
                },

                read: function( id ){
                    return api_service.send('conversation.read',{id:id}).then(function(){
                        var idx;
                        if( (idx=service.conversation_unreads.indexOf(id)) !== -1 ){
                            service.conversation_unreads.splice(idx,1);
                        }else if( (idx=service.channel_unreads.indexOf(id)) !== -1 ){
                            service.channel_unreads.splice(idx,1);
                        }else{
                            Object.keys(service.connection_unreads).some(function(k){
                                if( service.connection_unreads[k] === id ){
                                    delete( service.connection_unreads[k] );
                                    return true;
                                }
                            });
                        }
                    });
                },
                startRecord: function( id ){
                    return api_service.send('videoarchive.startRecord',{conversation_id:id});
                },
                stopRecord: function( id ){
                    return api_service.send('videoarchive.stopRecord',{conversation_id:id});
                }
            };

            events_service.on('conversation.unread', function(e){
                var conversation_id = e.datas[0],
                    type = e.datas[1],
                    users = e.datas[2],
                    connection_id;

                if( type === service.types.channel && service.channel_unreads.indexOf(conversation_id) === -1 ){
                    service.channel_unreads.push( conversation_id );
                    events_service.process('channel.newunread');
                }
                else if( type === service.types.conversation ){
                    if( users && users.length === 2
                        && users.some(function(uid){
                            if( connections.getUserState(uid) === connections.states.connected){
                                connection_id = uid;
                                return true;
                            }
                        }) ){
                        service.connection_unreads[ connection_id ] = conversation_id;
                        events_service.process('connection.newunread');
                    }else if( service.conversation_unreads.indexOf(conversation_id) === -1 ){
                        service.conversation_unreads.push( conversation_id );
                        events_service.process('conversation.newunread');
                    }
                }
            });

            service_garbage.declare( function(){
                service.clear();
            } );

            return service;
        }
    ]);
