angular.module('API').factory('pages_grades',
    ['abstract_paginator_model','service_garbage',
        function( abstract_paginator_model, service_garbage ){    
        
        var service = {            
            paginators: {},
            
            // CLEAR SERVICES.
            clear: function(){
                service.paginators = {};
            },
            
            getPaginator: function( parent_page_id ){
                
                if( service.paginators[parent_page_id] ){
                    return service.paginators[parent_page_id];
                }
                
                return createPaginator( parent_page_id );
            }
        };
         
        service_garbage.declare(function(){
            service.clear();
        });
        
        return service;
            
        // CREATE A PAGINATOR SERVICE.            
        function createPaginator( page_id ){            
            service.paginators[ page_id ] = new abstract_paginator_model({
                page_id: page_id,
                name:'pagegrades'+page_id,
                outdated_timeout: 0, // 25mn
                cache_size: 0,
                page_number: 1,
                page_size: 36,
                _method_get:'page.getUsersGrades',
                _start_filter: 'average',
                _idx_name : 'user_id',
                _default_params: { id: page_id },
                _buildGetParams : function(){
                    return angular.merge({}, this._default_params, {
                        filter:{
                            n: this.page_size,
                            p: this.page_number,
                            o : { 'page$average' : 'DESC' }
                        }
                    });
                },
                _buildNextParams : function(){
                    return angular.merge({}, this._default_params, {
                        filter:{
                            n: this.page_size,
                            p: this.page_number,
                            o : { 'page$average' : 'DESC' }
                        }
                    });
                },
                _column_filter: {'page$average':'<'},
                formatResult : function(d){
                    this.count = d.count;
                    return d.list;
                }
            });
            
            return service.paginators[ page_id ];
        }
    }
]);
