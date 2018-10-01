
angular.module('API')
    .factory('page_library',['abstract_paginator_model', 'upload_service','api_service','service_garbage',
        function( abstract_paginator_model,  upload_service, api_service,  service_garbage ){

            var service = {
                pages : {

                },
                clear : function(){
                    this.pages = {};
                },
                get: function( page_id ){
                    if(this.pages[page_id]){
                        return this.pages[page_id];
                    }
                    var apm = new abstract_paginator_model({
                        name:'plib_'+page_id,
                        page_id : page_id,
                        outdated_timeout: 1000*60*60*2,
                        cache_size: 16,
                        page_number: 16,
                        _start_filter: 'id',
                        _order_filter: {'library$id':'DESC'},
                        _column_filter: {'library$id':'<'},
                        _default_params: {
                            id: page_id,
                            global: true
                        },
                        _method_get:'page.getListDocument',
                        formatResult: function( d ){
                            this.count = d.count;
                            return d.documents || [];
                        }
                    });
                    this.pages[page_id] = apm;
                    return apm;
                },
                remove: function(page_id, id ){
                    return api_service.send('page.deleteDocument', {id : page_id, library_id: id}).then(function(){
                        var page_service = this.get(page_id);
                        page_service.unset(id);
                        page_service.count--;
                    }.bind(this));
                },
                add: function( page_id, file, notify ){
                    if( file ){
                        var page_service = this.get(page_id);
                        page_service.list.unshift(file);
                        return api_service.send('page.addDocument',
                            { library : file, id : page_id, notify : notify}).then(function(id){
                                file.id = id;
                                page_service.count++;
                                page_service.indexes.unshift(id);
                        });
                    }
                }

            };

            service_garbage.declare(function(){
                service.clear();
            });

            return service;
        }
    ]);
