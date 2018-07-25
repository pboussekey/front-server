
angular.module('API')
    .factory('subscribers_ids',['abstract_paginator_model','service_garbage',
        function( abstract_paginator_model, service_garbage ){

            var service = {
                paginators:{},
                clear: function(){
                    this.paginators = {};
                },
                get: function( page_id ){

                    if(this.paginators[page_id]){
                        return this.paginators[page_id];
                    }

                    var apm = new abstract_paginator_model({
                        name:'sub_'+page_id,
                        outdated_timeout: 1000*60*60*2,
                        cache_size: 0,
                        page_number: 10,
                        _method_get:'page.getListSuscribersId',

                        _column_filter:{ 'user.id': '<' },
                        _order_filter:{ 'user.id': 'DESC' },
                        _default_params:{ id: page_id },

                        formatResult: function( d ){
                            this.total = d.count;
                            return d.list.reduce(function(l,d){ l.push({id:d}); return l; },[]);
                        }
                    });

                    this.paginators[page_id] = apm;
                    return apm;
                }
            };

            service_garbage.declare(function(){
                service.clear();
            });

            return service;
        }
    ]);
