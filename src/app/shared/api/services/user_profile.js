
angular.module('API')
    .factory('user_profile',
        ['user_model','user_resumes_model', 'resume_model','api_service','upload_service','$q', 'session',
            function( user_model, user_resumes_model, resume_model, api_service, upload_service, $q, session){

                var service = {

                    delete : function(uid){
                        return api_service.send('user.delete',{id: uid});
                    },
                    update: function( datas, uid ){
                        uid = uid || session.id;
                        // HACK BECAUSE OF ORIGIN PARAM ....
                        var params = Object.assign({},datas);
                        if( datas.origin && datas.origin.id ){
                            params.origin = datas.origin.id;
                        }

                        return api_service.send('user.update', params).then(function(){
                            Object.keys(datas).forEach(function(k){
                                user_model.list[uid].datum[k] = datas[k];
                            }.bind(this));

                            user_model._updateModelCache(uid);
                        });

                    },
                    updateAvatar: function( blob, uid ){
                        uid = uid || session.id;
                        if(blob){
                            var deferred = $q.defer(),
                                u = upload_service.upload('avatar', blob, 'profile_'+uid+'.png' );

                            u.promise.then(function(d){
                                if( d.avatar ){
                                    return api_service.send('user.update',{avatar:d.avatar}).then(function(){
                                        user_model.list[uid].datum.avatar = d.avatar;
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
                                user_model.list[uid].datum.avatar = null;
                                user_model._updateModelCache(session.id);
                            });
                        }
                    },
                    updateCover: function( blob, uid ){
                        var deferred = $q.defer();
                        uid = uid || session.id;

                        upload_service.uploadImage('background', blob,'cover_'+uid+'.png' ).then(function( upl ){
                            upl.promise.then(function(d){
                                if( d.background ){
                                    return api_service.send('user.update',{background:d.background, id : uid}).then(function(){
                                        user_model.list[uid].datum.background = d.background;
                                        user_model._updateModelCache(uid);
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
                    updateAddress: function(address, uid ){
                        uid = uid || session.id;
                        return api_service.send('user.update',{id : uid, address: address || "null"}).then(function(){
                            user_model.list[uid].datum.address = address;
                            user_model._updateModelCache(uid);
                        });
                    },
                    updateBirthdate: function(birthdate, uid){
                        uid = uid || session.id;
                        return api_service.send('user.update',{id : uid, birth_date: birthdate || "null"}).then(function(){
                            user_model.list[uid].datum.birth_date = birthdate;
                            user_model._updateModelCache(uid);
                        });
                    },
                    updateOrigin: function(origin, uid){
                        uid = uid || session.id;
                        return api_service.send('user.update',{id : uid, origin: origin ? origin.id : "null"}).then(function(){
                            user_model.list[uid].datum.origin = origin;
                            user_model._updateModelCache(uid);
                        });
                    },
                    updateProgram: function(program_name, uid){
                        uid = uid || session.id;
                        return api_service.send('user.update',{id : uid, page_program_name: program_name ? program_name : "null"}).then(function(){
                            user_model.list[uid].datum.program = [program_name];
                            user_model._updateModelCache(uid);
                        });
                    },
                    updateGraduation: function(graduation_year, uid){
                        uid = uid || session.id;
                        return api_service.send('user.update',{id : uid, graduation_year: graduation_year ? graduation_year : "null"}).then(function(){
                            user_model.list[uid].datum.graduation_year = graduation_year;
                            user_model._updateModelCache(uid);
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
                    confirmEmailUpdate : function(uid, token){
                        uid = uid || session.id;
                        return api_service.send('user.confirmEmailUpdate', { id : uid, token : token });
                    },
                    cancelEmailUpdate : function(){
                        return api_service.send('user.cancelEmailUpdate', {});
                    },
                    getDescription : function(uid){
                        uid = uid || session.id;
                      return api_service.send('user.getDescription', { id : uid });
                    },
                    getCounts : function(){
                        return api_service.send('user.getCounts');
                    }

                };
                return service;
            }
        ]);
