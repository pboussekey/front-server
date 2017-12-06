
angular.module('API')
    .factory('user_images',['abstract_paginator_model','$q','upload_service','api_service','session','service_garbage',
        function( abstract_paginator_model, $q, upload_service, api_service, session, service_garbage ){ 
            
            var service = {
                sendings: [],   
                users : {
                    
                },
                clear: function(){
                    this.users = {};
                },
                get: function( user_id ){
                    
                   if(this.users[user_id]){
                        return this.users[user_id];
                    }
                    
                    var apm = new abstract_paginator_model({                        
                        name:'uimg_'+user_id,
                        outdated_timeout: 1000*60*60*2,
                        cache_size: user_id === session.id ? 16:0,
                        page_number: 16,
                        _method_get:'library.getList',
                        _start_filter: 'id',
                        _order_filter: {'library$id':'DESC'},
                        _column_filter: {'library$id':'<'},
                        _default_params: {
                            user_id: user_id,
                            global: true,
                            folder_name: 'images',
                        },
                        formatResult: function( d ){
                            this.count = d.count;
                            return d.documents || [];
                        }
                    });
                    
                   
                    this.users[user_id] = apm;
                    return apm;
                },                
                remove: function(user_id, id){
                    return api_service.send('library.delete', {id: id}).then(function(){
                        var user_service = this.get(user_id);
                        user_service.unset(id); 
                        user_service.count--;
                    }.bind(this));
                },
                add: function( user_id, files, onerror ){
                    if( files.length ){                    
                        var upload = upload_service.upload('token', files[0], files[0].name);
                        var document = {
                            progression: 0,
                            file: files[0],
                            upload: upload,
                            name: files[0].name,
                            type: files[0].type,
                        }; 
                        var user_service = this.get(user_id);
                        user_service.list.unshift(document);
                        return upload.promise.then(function(d){
                            if(!d.token){       
                                var index = user_service.list.indexOf(document);
                                if(index !== -1){
                                    user_service.list.splice(index, 1);
                                }
                                if(onerror){
                                    onerror();
                                }
                            }
                            document.token = d.token;
                            return api_service.send('library.add',
                                { 
                                    name:document.name, 
                                    token:document.token, 
                                    type:document.type,
                                    global:true, 
                                    user_id : user_id,
                                    folder_name : 'images'
                                }).then(function(id){
                                    document.id = id;
                                    document.progression = 0;
                                    user_service.count++;
                                });

                        },function(){
                            var index = user_service.list.indexOf(document);
                            if(index !== -1){
                                user_service.list.splice(index, 1);
                            }
                            if(onerror){
                                onerror();
                            }
                            
                        },function( evt ){  
                            document.progression = 100 * evt.loaded / evt.total;
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