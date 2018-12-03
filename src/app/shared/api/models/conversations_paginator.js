
angular.module('API')
    .factory('conversations_paginator',['abstract_paginator_model',
        function( abstract_paginator_model ){

            var service = new abstract_paginator_model({
                name:'cvns',
                outdated_timeout: 1000*60*5, // 5mn
                cache_size: 20,
                page_number: 10,

                _start_filter: 'message.id',
                _order_filter: {'message.id':'DESC'},
                _column_filter: {'message.id':'<'},
                _default_params: {
                    type: 2
                },

                _method_get:'conversation.getList',
                formatResult: function(d){ return d.list; }
            });

            return service;
        }
    ]);
