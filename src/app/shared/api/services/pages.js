angular.module('API')
    .factory('pages',
        ['page_model', 'api_service', '$q', 'upload_service', 'cvn_model', 'pchildren_model',
            function( page_model, api_service, $q, upload_service, cvn_model, pchildren_model){
                var service = {
                    save : function(page){
                        return api_service.send(page.id ? 'page.update' : 'page.add',page).then(function(id){
                            if(page.page_id){
                                pchildren_model.get([page.page_id], true);
                            }
                            page_model.get([page.id ? page.id : id], true);
                            return id;
                        });
                    },
                    getCustom : function(page_id){
                        return api_service.send('page.getCustom', { id : page_id});
                    },
                    delete : function(page_id){
                        return api_service.send('page.delete',{ id : page_id }).then(function(){
                            page_model._deleteModel(page_id);
                        });
                    },
                    updateLogo: function(page_id, blob ){
                        var deferred = $q.defer(),
                            u = upload_service.upload('logo', blob, 'page_'+page_id+'.png' );

                        u.promise.then(function(d){
                            if( d.logo ){
                                return api_service.send('page.update',{id : page_id, logo:d.logo}).then(function(){
                                    page_model.list[page_id].datum.logo = d.logo;
                                    page_model._updateModelCache(page_id);
                                    deferred.resolve();
                                });
                            }else{
                                deferred.reject();
                            }
                        }, function(){
                            deferred.reject();
                        }, function( evt ){
                            deferred.notify( evt);
                        });

                        return deferred.promise;
                    },
                    updateCover: function(page_id, blob ){
                        var deferred = $q.defer();

                        upload_service.uploadImage('background',  blob, 'cover_'+page_id+'.png' ).then(function( upl ){
                            upl.promise.then(function(d){
                                if( d.background ){
                                    return api_service.send('page.update',{id : page_id, background:d.background}).then(function(){
                                        page_model.list[page_id].datum.background = d.background;
                                        page_model._updateModelCache(page_id);
                                        deferred.resolve();
                                    });
                                }else{
                                    deferred.reject();
                                }
                            }, function(){
                                deferred.reject();
                            }, function( evt ){
                                deferred.notify( evt);
                            });
                        });

                        return deferred.promise;
                    },
                    updatePublish: function( page_id, is_published ){
                        return api_service.send('page.update',{id : page_id, is_published:is_published}).then(function(){
                            page_model.list[page_id].datum.is_published = is_published;
                            page_model._updateModelCache(page_id);
                        });
                    },
                    updateAddress: function(page_id, address ){
                        return api_service.send('page.update',{id : page_id, address:address}).then(function(){
                            page_model.list[page_id].datum.address = address;
                            page_model._updateModelCache(page_id);
                        });
                    },
                    updateDescription: function(page_id, description ){
                        return api_service.send('page.update',{id : page_id, description:description}).then(function(){
                            page_model.list[page_id].datum.description = description;
                            page_model._updateModelCache(page_id);
                        });
                    },
                    updateWebsite: function(page_id, website ){
                        return api_service.send('page.update',{id : page_id, website:website}).then(function(){
                            page_model.list[page_id].datum.website = website;
                            page_model._updateModelCache(page_id);
                        });
                    },
                    updateTitle: function(page_id, title ){
                        return api_service.send('page.update',{id : page_id, title:title}).then(function(){
                            var page =  page_model.list[page_id].datum;
                            page.title = title;
                            if(page.conversation_id){
                                cvn_model.get([page.conversation_id], true);
                                cvn_model._updateModelCache(page.conversation_id);
                            }
                            page_model._updateModelCache(page_id);
                        });
                    },
                    updateDates: function(page_id, start_date, end_date ){
                        return api_service.send('page.update',{id : page_id, start_date:start_date, end_date : end_date}).then(function(){
                            var page =  page_model.list[page_id].datum;
                            page.start_date = start_date;
                            page.end_date = end_date;
                            page_model._updateModelCache(page_id);
                        });
                    },
                    updateCustom: function(page_id, libelle, custom ){
                        return api_service.send('page.update',{id : page_id, libelle:libelle, custom : custom });
                    },
                    addTag: function(page_id, tag ){
                        var tag = { name : tag };
                        page_model.list[page_id].datum.tags.push(tag);
                        return api_service.send('page.addTag',{id : page_id, tag:tag.name}).then(function(id){
                            tag.id = id;
                            page_model._updateModelCache(page_id);
                        }, function(){
                            page_model.list[page_id].datum.tags.splice(page_model.list[page_id].datum.tags.indexOf(tag));
                        });
                    },
                    removeTag: function(page_id, tag ){
                        page_model.list[page_id].datum.tags.splice(page_model.list[page_id].datum.tags.indexOf(tag),1);
                        return api_service.send('page.removeTag',{id : page_id, tag_id:tag.id}).then(function(){
                            page_model._updateModelCache(page_id);
                        }, function(){
                            page_model.list[page_id].datum.tags.push(tag);
                        });
                    }
                };
                return service;
            }
]);
