angular.module('API').factory('pages_posts',
    ['abstract_posts_paginator','service_garbage',
        function( abstract_posts_paginator, service_garbage ){    
        
        var service = {            
            paginators: {},
            
            // CLEAR SERVICES.
            clear: function(){
                service.paginators = {};
            },
            
            getPaginator: function( parent_post_id ){
                
                if( service.paginators[parent_post_id] ){
                    return service.paginators[parent_post_id];
                }
                
                return createPaginator( parent_post_id );
            }
        };
         
        service_garbage.declare(function(){
            service.clear();
        });
        
        return service;
            
        // CREATE A PAGINATOR SERVICE.            
        function createPaginator( id ){            
            service.paginators[ id ] = new abstract_posts_paginator({
                page_id: id,
                name:'pageposts'+id,
                outdated_timeout: 1000*60*25, // 25mn
                cache_size: 0,
                page_number: 5,
                _method_get:'post.getListId',

                _start_filter: 'id',
                _default_params: { page_id: id },
                _order_filter: { 'post$id': 'DESC' },
                _column_filter: { 'post$id': '<' }
            });
            
            return service.paginators[ id ];
        }
    }
]);
