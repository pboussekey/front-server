
angular.module('API')
    .factory('messages',['abstract_paginator_model','$q','api_service','service_garbage','storage',
        function( abstract_paginator_model, $q, api_service, service_garbage, storage ){ 
            
            var service = {
                list:{},
                cached: JSON.parse( storage.getItem('cml') ||'[]' ),
                
                clear: function(){
                    service.list = {};
                    storage.removeItem('cml');
                },
                
                get: function( conversation_id ){
                    if( !this.list[conversation_id] ){                        
                        this.list[conversation_id] = new abstract_paginator_model({
                            name:'cvn'+conversation_id,
                            cache_size: 20,
                            page_number: 20,

                            _start_filter: 'id',
                            _order_filter: {'message.id':'DESC'},
                            _column_filter: {'message.id':'<'},
                            _default_params: {
                                conversation_id: conversation_id
                            },
                            
                            _method_get:'message.getList',
                            formatResult: function(d){ 
                                this.total = d.count;
                                return d.list; 
                            }
                        });
                        
                        // MANAGE CACHE...
                        this.cached.push( conversation_id );
                        if( this.cached.length > this.cache_size ){
                            var remId = this.cached.shift();
                            
                            if( this.list[remId] ){
                                this.list[remId].cache_size = 0;                                
                            }
                            storage.removeItem('cvn'+conversation_id);
                        }
                        storage.setItem('cml',JSON.stringify(this.cached));
                    }
                    return this.list[conversation_id];
                },                
                send: function( message ){
                    return api_service.send('message.send', message );
                }
            };
            
            service_garbage.declare( service.clear );
            
            return service;            
        }
    ]);