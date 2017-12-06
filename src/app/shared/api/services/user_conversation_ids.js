
angular.module('API')
    .factory('user_conversation_ids',['abstract_paginator_model','service_garbage',
        function( abstract_paginator_model, service_garbage ){ 
            
            var service = {  
                paginators:{},
                clear: function(){
                    this.paginators = {};
                },
                get: function( cvn_id ){                    
                    if(this.paginators[cvn_id]){
                        return this.paginators[cvn_id];
                    }
                    
                    var apm = new abstract_paginator_model({
                        name:'ucvn_'+cvn_id,
                        outdated_timeout: 1000*60*60*2,
                        cache_size: 0,
                        page_number: 15,
                        _method_get:'user.getListId',
                        
                        _column_filter:{ 'user.id': '<' },
                        _order_filter:{ 'user.id': 'DESC' },
                        _default_params:{ conversation_id: cvn_id },
                        
                        formatResult: function( d ){
                            this.total = d.count;
                            return d.list.reduce(function(l,d){ l.push({id:d}); return l; },[]);
                        }
                    });
                   
                    this.paginators[cvn_id] = apm;
                    return apm;
                }
            };
            
            service_garbage.declare(function(){
                service.clear();
            });
            
            return service;
        }
    ]);