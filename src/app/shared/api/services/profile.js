
angular.module('API')
    .factory('profile',
        ['user_model','user_resumes_model', 'resume_model','session','api_service','upload_service','$q',
            function( user_model, user_resumes_model, resume_model, session, api_service, upload_service, $q){

                var service = {

                    update: function( datas ){
                        // HACK BECAUSE OF ORIGIN PARAM ....
                        var params = Object.assign({},datas);
                        if( datas.origin && datas.origin.id ){
                            params.origin = datas.origin.id;
                        }

                        return api_service.send('user.update', params).then(function(r){
                            Object.keys(datas).forEach(function(k){
                                if(k !== 'email'){
                                    user_model.list[session.id].datum[k] =  datas[k] === 'null' ? null : datas[k];
                                }
                            }.bind(this));

                            user_model._updateModelCache(session.id);
                            return r;
                        }, function(){
                            return r;
                        });

                    },

                    updateAvatar: function( blob ){
                        if(blob){
                            var deferred = $q.defer(),
                                u = upload_service.upload('avatar', blob, 'profile_'+session.id+'.png' );

                            u.promise.then(function(d){
                                if( d.avatar ){
                                    return api_service.send('user.update',{avatar:d.avatar}).then(function(){
                                        user_model.list[session.id].datum.avatar = d.avatar;
                                        user_model._updateModelCache(session.id);
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
                        }
                        else{
                            return api_service.send('user.update',{avatar:'null'}).then(function(){
                                user_model.list[session.id].datum.avatar = null;
                                user_model._updateModelCache(session.id);
                            });
                        }
                    },
                    updateCover: function( blob ){
                        var deferred = $q.defer();

                        upload_service.uploadImage('background', blob,'cover_'+session.id+'.png' ).then(function( upl ){
                            upl.promise.then(function(d){
                                if( d.background ){
                                    return api_service.send('user.update',{background:d.background}).then(function(){
                                        user_model.list[session.id].datum.background = d.background;
                                        user_model._updateModelCache(session.id);
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
                    updateAddress: function(address){
                        return api_service.send('user.update',{id : session.id, address: address || "null"}).then(function(){
                            user_model.list[session.id].datum.address = address;
                            user_model._updateModelCache(session.id);
                        });
                    },
                    updateWebsite: function(url){
                          return api_service.send('user.update',{id : session.id, linkedin_url: url || "null"}).then(function(){
                              user_model.list[session.id].datum.linkedin_url = url;
                              user_model._updateModelCache(session.id);
                          });
                    },
                    updateBirthdate: function(birthdate){
                        return api_service.send('user.update',{id : session.id, birth_date: birthdate || "null"}).then(function(){
                            user_model.list[session.id].datum.birth_date = birthdate;
                            user_model._updateModelCache(session.id);
                        });
                    },
                    updateOrigin: function(origin){
                        return api_service.send('user.update',{id : session.id, origin: origin ? origin.id : "null"}).then(function(){
                            user_model.list[session.id].datum.origin = origin;
                            user_model._updateModelCache(session.id);
                        });
                    },
                    closeWelcome : function(delay){
                        return api_service.send('user.closeWelcome', { delay : delay }).then(function(date){
                            user_model.list[session.id].datum.welcome_date = date;
                            user_model._updateModelCache(session.id);
                        });
                    },
                    sendEmailUpdateConf : function(){
                        return api_service.send('user.sendEmailUpdateConf');
                    },
                    confirmEmailUpdate : function(id, token){
                        return api_service.send('user.confirmEmailUpdate', { id : id, token : token });
                    },
                    cancelEmailUpdate : function(){
                        return api_service.send('user.cancelEmailUpdate', {});
                    },
                    addTag: function(user_id, tag, category ){
                        var tag = { name : tag, category : category };
                        user_model.list[user_id].datum.tags.push(tag);
                        return api_service.send('user.addTag',{id : user_id, tag:tag.name, category : tag.category}).then(function(id){
                            tag.id = id;
                            user_model._updateModelCache(user_id);
                        }, function(){
                            user_model.list[user_id].datum.tags.splice(user_model.list[user_id].datum.tags.indexOf(tag));
                        });
                    },
                    removeTag: function(user_id, tag ){
                        user_model.list[user_id].datum.tags = user_model.list[user_id].datum.tags.filter(function(t){
                            return t.id !== tag.id;
                        });
                        return api_service.send('user.removeTag',{id : user_id, tag_id:tag.id}).then(function(){
                            user_model._updateModelCache(user_id);
                        }, function(){
                            user_model.list[user_id].datum.tags.push(tag);
                        });
                    },
                    getDescription : function(id){
                      return api_service.send('user.getDescription', { id : id });
                    }
                };
                return service;
            }
        ]);
