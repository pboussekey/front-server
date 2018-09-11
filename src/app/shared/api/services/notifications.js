
angular.module('API')
    .factory('notifications',['abstract_paginator_model','$q','api_service','service_garbage','storage',
        function( abstract_paginator_model, $q, api_service, service_garbage, storage ){

            var service = new abstract_paginator_model({
                name:'evt',
                cache_size: 20,
                page_number: 20,

                _start_filter: 'id',
                _order_filter: {'event.id':'DESC'},
                _column_filter: {'event.id':'<'},
                clear : function(){
                    this.list = [];
                    storage.removeItem('evt');
                },
                _method_get:'event.getList',
                _default_params: {
                    events: ["post.create","post.com", "page.member", "page.invited", "page.pending", "post.like", "post.tag"]
                },
                formatResult: function(n){
                    this.total = n.count;
                    n.list.forEach(function(notif){
                        notif.source = JSON.parse(notif.source);
                        notif.object = JSON.parse(notif.object);
                    });
                    return n.list;
                },
                getUnreadCount : function(){
                    return api_service.send('event.getList',
                        { events: ["post.create","post.com", "page.member", "page.invited", "page.pending", "post.like", "post.tag"],
                        unread : true,
                        filter : { n : 0, p : 1}
                    }).then(function(r){
                        return r.count;
                    });
                },
                read : function(event_id){
                    return api_service.send('event.read', { id : event_id });
                }
            });

            service_garbage.declare( service.clear );

            return service;
        }
    ]);
