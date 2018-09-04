
angular.module('API')
    .factory('user_sharing_ids',['abstract_paginator_model','service_garbage',
        function( abstract_paginator_model, service_garbage ){

            var service = {
                paginators:{},
                clear: function(){
                    this.paginators = {};
                },
                get: function( post_id ){

                    if(this.paginators[post_id]){
                        return this.paginators[post_id];
                    }

                    var apm = new abstract_paginator_model({
                        name:'ups_'+post_id,
                        outdated_timeout: 1000*60*60*2,
                        cache_size: 0,
                        page_number: 10,
                        _method_get:'user.getListId',

                        _column_filter:{ 'user.id': '<' },
                        _order_filter:{ 'user.id': 'DESC' },
                        _default_params:{ shared_id: post_id },

                        formatResult: function( d ){
                            this.total = d.count;
                            return d.list.reduce(function(l,d){ l.push({id:d}); return l; },[]);
                        }
                    });

                    this.paginators[post_id] = apm;
                    return apm;
                }
            };

            service_garbage.declare(function(){
                service.clear();
            });

            return service;
        }
    ]);
