angular.module('API').factory('comments_posts',
    ['post_model','user_model','abstract_posts_paginator','service_garbage',
        function( post_model, user_model, abstract_posts_paginator, service_garbage ){    
        
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
            },
            
            addComment: function( parent_post_id, text ){
                return post_model.add({content:text, parent_id: parent_post_id}).then(function( id ){
                    if( service.paginators[parent_post_id] ){
                        return service.paginators[parent_post_id].refresh().then(function(){
                            return id;
                        });
                    }
                    return id;
                });
            }
        };
         
        service_garbage.declare(function(){
            service.clear();
        });
        
        return service;
            
        // CREATE A PAGINATOR SERVICE.
            
        function createPaginator( id ){            
            service.paginators[ id ] = new abstract_posts_paginator({
                parent_id: id,
                name:'cmts'+id,
                outdated_timeout: 1000*60*25, // 25mn
                cache_size: 0,
                page_number: 5,
                _method_get:'post.getListId',

                _start_filter: 'id',
                _default_params: { parent_id: id },
                _order_filter: { 'post$id': 'DESC' },
                _column_filter: { 'post$id': '<' },
                
                formatResult: formatResult,
                checkAndGetDatas: checkAndGetDatas
            });
            
            return service.paginators[ id ];
        }
        
        // PAGINATOR METHODS \\        
        function formatResult( d ){
            // UPDATE POST MODEL CMTS COUNT.
            if( post_model.list[this.parent_id] && post_model.list[this.parent_id].datum ){
                post_model.list[this.parent_id].datum.nbr_comments = d.count;
            }
            
            return abstract_posts_paginator.prototype.formatResult.call( this, d );
        }
       
        // COMMENT DATAS GETTER METHOD.        
        function checkAndGetDatas( post_ids, refresh ){
            return abstract_posts_paginator.prototype.checkAndGetDatas.call( this, post_ids, refresh )
                .then(function(){                    
                    var user_ids = [];
                
                    post_ids.forEach(function( pid ){
                        if( post_model.list[pid].datum && post_model.list[pid].datum.user_id ){
                            user_ids.push(post_model.list[pid].datum.user_id);
                        }
                    });
                
                    return user_model.queue(user_ids).then(function(){ return post_ids; });                    
                });
        }
            
    }
]);
