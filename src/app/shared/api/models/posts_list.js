
angular.module('API')
    .factory('feed',['abstract_posts_paginator',
        function( abstract_posts_paginator ){
            
            var service = new abstract_posts_paginator({
                name:'feed',
                outdated_timeout: 1000*60*5, // 5mn
                cache_size: 20,
                page_number: 5,
                
                _method_get:'post.getListId',                
                
                _start_filter: 'last_date',
                _order_filter: { 'post$last_date': 'DESC' },
                _column_filter: { 'post$last_date': '<' }
            });
            
            window._feed = service;
            
            return service;
        }
    ]);