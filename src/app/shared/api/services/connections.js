angular.module('API').factory('connections',
    ['api_service','session','user_model', 'events_service','$q','service_garbage', 'events',
        function( api, session, user_model,  events_service, $q, service_garbage, events){

            var service = {
                loadPromise: undefined,
                connecteds: [],
                followers: [],
                followings: [],

                states: {
                    notdefined: -1,
                    unconnected: 0,
                    following: 1,
                    follower : 2,
                    connected: 3
                },
                search: function(){
                    // TODO
                },
                follow: function( _id ){
                    var id = parseInt( _id );
                    user_model.list[id].datum.contact_state++;
                    return api.queue('contact.follow',{user:id}).then(function(d){
                        if( d ){
                            events_service.process('connectionState#'+id);
                            events_service.process('connectionState',[id]);
                        }
                    }.bind(this),function(err){
                        user_model.list[id].datum.contact_state--;
                    });
                },
                unfollow: function( _id ){
                    var id = parseInt( _id );
                    user_model.list[id].datum.contact_state--;
                    return api.queue('contact.unfollow',{user:id}).then(function(d){
                        events_service.process('connectionState#'+id);
                        events_service.process('connectionState',[id]);
                    }.bind(this),function(err){
                        user_model.list[id].datum.contact_state++;
                    }.bind(this));
                }

            };
            window.connections = service;

            return service;
        }
    ]
);
