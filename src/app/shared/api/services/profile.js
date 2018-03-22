
angular.module('API')
    .factory('profile',
        ['user_model','user_resumes_model', 'resume_model','session','api_service','upload_service','$q',
            function( user_model, user_resumes_model, resume_model, session, api_service, upload_service, $q){
        
                var service = {
                    
                    deleteResume: function( resumeId ){
                        
                        return api_service.send('resume.delete',{id: resumeId}).then(function(){
                            var uid = session.id;
                            
                            if( user_resumes_model.list[uid].datum ){
                                var rdx = user_resumes_model.list[uid].datum.indexOf(resumeId);
                                if( rdx !== -1 ){
                                    user_resumes_model.list[uid].datum.splice(rdx,1);
                                    user_resumes_model._updateModelCache(uid);
                                }
                            }
                            
                            if( resume_model.list[resumeId].datum ){
                                resume_model._deleteModel( resumeId );
                            }
                        });
                        
                    },                    
                    addResume: function( resume ){
                        
                        return api_service.send('resume.add', resume).then(function( id ){
                            id = parseInt(id);
                            var uid = session.id;
                            
                            if( user_resumes_model.list[uid].datum ){
                                user_resumes_model.list[uid].datum.push(id);
                                user_resumes_model._updateModelCache(uid);
                            }
                            
                            return resume_model.get([id]).then(function(){
                                return id;
                            });
                        });
                        
                    },
                    updateResume: function( resume ){
                        return api_service.send('resume.update',resume).then(function(){
                            return resume_model.get([resume.id], true);
                        });
                        
                    },        
                    
                    update: function( datas ){
                        // HACK BECAUSE OF ORIGIN PARAM ....
                        var params = Object.assign({},datas);
                        if( datas.origin && datas.origin.id ){
                            params.origin = datas.origin.id;
                        }
                        
                        return api_service.send('user.update', params).then(function(){
                            Object.keys(datas).forEach(function(k){
                                user_model.list[session.id].datum[k] = datas[k];
                            }.bind(this));
                            
                            user_model._updateModelCache(session.id);
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
                    } ,
                    updateNickname: function(nickname){
                        return api_service.send('user.update',{id : session.id, nickname: nickname}).then(function(){
                            user_model.list[session.id].datum.nickname = nickname;
                            user_model._updateModelCache(session.id);
                        });                                
                    }   ,
                    updateAddress: function(address){
                        return api_service.send('user.update',{id : session.id, address: address || "null"}).then(function(){
                            user_model.list[session.id].datum.address = address;
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
                    }
                };
                return service;
            }
        ]);