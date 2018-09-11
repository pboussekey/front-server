angular.module('API').factory('page_users',
    ['api_service','session','pum_model', 'pual_model',  'pui_model','pua_model', 'puadmin_model', 'puunsent_model','pup_model', 'puall_model', '$q','service_garbage', 'user_model', 'events_service',
        function( api, session, pum_model, pual_model, pui_model, pua_model, puadmin_model, puunsent_model, pup_model, puall_model, $q, service_garbage, user_model, events_service ){

            var service = {
                loadPromise: undefined,
                pages: {},

                clear: function(){
                    angular.forEach(service.pages, function(page,id){
                        events_service.off('pageUsers'+id, service.pages[id].onUpdate);
                    });
                    service.pages = {};
                    service.loadPromise = undefined;

                },
                load: function( id, force, alumni){
                   if( this.loadPromise ){
                        return this.loadPromise;
                    }else{
                        var deferred = $q.defer();
                        this.loadPromise = deferred.promise;
                        if(!service.pages[id]){
                            service.pages[id] = {
                                all : [],
                                members : [],
                                administrators : [],
                                alumni : [],
                                pending : [],
                                invited : [],
                                unsent : [],
                                pinned: []
                            };
                            service.pages[id].onUpdate = function(e){
                                if(!e.datas[0]){
                                    service.load(id, true);
                                }
                            };
                            events_service.on('pageUsers'+id, service.pages[id].onUpdate);
                        }
                        var step = 8,
                            onload = function(){
                                step--;
                                if( !step ){
                                    this.loadPromise = undefined;
                                    deferred.resolve();
                                }
                        }.bind(this);

                        puall_model.get([id], force).then(function(){
                            service.pages[id].all.splice(0, service.pages[id].all.length );
                            Array.prototype.push.apply( service.pages[id].all, puall_model.list[id].datum );
                            onload();
                        });

                        pum_model.get([id], force).then(function(){
                            service.pages[id].members.splice(0, service.pages[id].members.length );
                            Array.prototype.push.apply( service.pages[id].members, pum_model.list[id].datum );
                            onload();
                        }.bind(this));

                        pual_model.get([id], force).then(function(){
                            service.pages[id].alumni.splice(0, service.pages[id].alumni.length );
                            Array.prototype.push.apply( service.pages[id].alumni, pual_model.list[id].datum );
                            onload();
                        }.bind(this));

                        pup_model.get([id], force).then(function(){
                            service.pages[id].pinned.splice(0, service.pages[id].pinned.length );
                            Array.prototype.push.apply( service.pages[id].pinned, pup_model.list[id].datum );
                            onload();
                        }.bind(this));

                        pua_model.get([id], force).then(function(){
                            service.pages[id].pending.splice(0, service.pages[id].pending.length );
                            Array.prototype.push.apply( service.pages[id].pending, pua_model.list[id].datum );
                           onload();
                        }.bind(this));

                        pui_model.get([id], force).then(function(){
                            service.pages[id].invited.splice(0, service.pages[id].invited.length );
                            Array.prototype.push.apply( service.pages[id].invited, pui_model.list[id].datum );
                            onload();
                        }.bind(this));

                        puadmin_model.get([id], force).then(function(){
                            service.pages[id].administrators.splice(0, service.pages[id].administrators.length );
                            Array.prototype.push.apply( service.pages[id].administrators, puadmin_model.list[id].datum );
                            if(service.pages[id].administrators.indexOf(session.id) !== -1 || session.roles[1]){
                                puunsent_model.get([id], force).then(function(){
                                    service.pages[id].unsent.splice(0, service.pages[id].unsent.length );
                                    Array.prototype.push.apply( service.pages[id].unsent, puunsent_model.list[id].datum );
                                    onload();
                                }.bind(this));
                            }
                            else{
                                step -= 1;
                            }
                            onload();
                        }.bind(this));

                        return deferred.promise;
                    }

                },
                add: function( id, user_id ){
                    id = parseInt( id );
                    return api.send('pageuser.add',{page_id:id, user_id:user_id, role:'user', state:'member'}).then(function(d){
                        if( d ){
                            user_id = Array.isArray(user_id) ? user_id : [user_id];
                            if(service.pages[id]){
                                service.pages[id].all = user_id.concat(service.pages[id].all);
                                service.pages[id].members = user_id.concat(service.pages[id].members);
                            }
                            events_service.process('pageUsers'+id, true);
                        }
                    }.bind(this),function(err){

                    });
                },
                apply: function( id, user_id, email ){
                    id = parseInt( id );
                    return api.send('pageuser.add',{page_id:id, user_id:user_id, email : email, role:'user', state:'pending' }).then(function(d){
                        if( d ){
                            user_id = Array.isArray(user_id) ? user_id : [user_id];
                            if(service.pages[id]){
                                service.pages[id].pending = user_id.concat(service.pages[id].pending);
                            }
                            events_service.process('pageUsers'+id, true);
                        }
                    }.bind(this),function(err){

                    });
                },
                invite: function( id, user_id, email){
                    id = parseInt( id );
                    return api.send('pageuser.add',{page_id:id, user_id:user_id, email : email, role:'user', state:'invited'}).then(function(d){
                        if( d ){
                            user_id = Array.isArray(user_id) ? user_id : [user_id];
                            if(service.pages[id]){
                                service.pages[id].invited = user_id.concat(service.pages[id].invited);
                            }
                            events_service.process('pageUsers'+id, email === null);
                        }
                    }.bind(this),function(err){

                    });
                },
                accept: function( id, user_id ){
                    id = parseInt( id );
                    return api.send('pageuser.update',{page_id:id, user_id:user_id, role:'user', state:'member'}).then(function(d){
                        if( d ){
                            user_id = Array.isArray(user_id) ? user_id : [user_id];
                            user_id.forEach(function(uid){
                                var idx =  service.pages[id].pending.indexOf(uid);
                                if(idx !== -1){
                                     service.pages[id].pending.splice( idx, 1 );
                                }
                            });
                            if(service.pages[id]){
                                service.pages[id].all = user_id.concat(service.pages[id].all);
                                service.pages[id].members = user_id.concat(service.pages[id].members);
                            }
                            events_service.process('pageUsers'+id, true);
                        }
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS  ( CRITICAL => IF AN REQUEST IS CANCELED & USER TRY TO ACCEPT IT ).
                    }.bind(this));
                },
                grantAdmin: function( id, user_id ){
                    id = parseInt( id );
                    return api.send('pageuser.update',{page_id:id, user_id:user_id, role:'admin', state:'member'}).then(function(d){
                        if( d ){
                            user_id = Array.isArray(user_id) ? user_id : [user_id];
                            user_id.forEach(function(uid){
                                var idx =  service.pages[id].members.indexOf(uid);
                                if(idx !== -1){
                                     service.pages[id].members.splice( idx, 1 );
                                }
                            });
                            if(service.pages[id]){
                                service.pages[id].administrators = user_id.concat(service.pages[id].administrators);
                            }
                            events_service.process('pageUsers'+id, true);
                        }
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS  ( CRITICAL => IF AN REQUEST IS CANCELED & USER TRY TO ACCEPT IT ).
                    }.bind(this));
                },
                removeAdmin: function( id, user_id ){
                    id = parseInt( id );
                    return api.send('pageuser.update',{page_id:id, user_id:user_id, role:'user', state:'member'}).then(function(d){
                        if( d ){
                            user_id = Array.isArray(user_id) ? user_id : [user_id];
                            user_id.forEach(function(uid){
                                var idx =  service.pages[id].administrators.indexOf(uid);
                                if(idx !== -1){
                                     service.pages[id].administrators.splice( idx, 1 );
                                }
                            });
                            if(service.pages[id]){
                                service.pages[id].members = user_id.concat(service.pages[id].members);
                            }
                            events_service.process('pageUsers'+id, true);
                        }
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS  ( CRITICAL => IF AN REQUEST IS CANCELED & USER TRY TO ACCEPT IT ).
                    }.bind(this));
                },
                decline: function( id, user_id ){
                    id = parseInt( id );
                    return api.send('pageuser.delete',{user_id:user_id,page_id:id}).then(function(d){
                        if( d ){
                            user_id = Array.isArray(user_id) ? user_id : [user_id];

                            if(service.pages[id]){
                                user_id.forEach(function(uid){
                                    var idx =  service.pages[id].all.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].all.splice( idx, 1 );
                                    }
                                    var idx =  service.pages[id].members.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].members.splice( idx, 1 );
                                    }
                                    var idx =  service.pages[id].pending.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].pending.splice( idx, 1 );
                                    }
                                    var idx =  service.pages[id].invited.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].invited.splice( idx, 1 );
                                    }
                                    var idx =  service.pages[id].administrators.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].administrators.splice( idx, 1 );
                                    }
                                    var idx =  service.pages[id].unsent.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].unsent.splice( idx, 1 );
                                    }
                                    var idx =  service.pages[id].pinned.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].pinned.splice( idx, 1 );
                                    }
                                });
                            }
                            events_service.process('pageUsers'+id, true);
                        }
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS
                    }.bind(this));
                },
                remove: function( id, user_id ){
                    id = parseInt( id );
                    return api.send('pageuser.delete',{user_id:user_id,page_id:id}).then(function(d){
                        if( d ){
                            user_id = Array.isArray(user_id) ? user_id : [user_id];
                            if(service.pages[id]){
                                user_id.forEach(function(uid){
                                    var idx =  service.pages[id].all.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].all.splice( idx, 1 );
                                    }
                                    var idx =  service.pages[id].members.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].members.splice( idx, 1 );
                                    }
                                    var idx =  service.pages[id].pending.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].pending.splice( idx, 1 );
                                    }
                                    var idx =  service.pages[id].invited.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].invited.splice( idx, 1 );
                                    }
                                    var idx =  service.pages[id].administrators.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].administrators.splice( idx, 1 );
                                    }
                                    var idx =  service.pages[id].unsent.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].unsent.splice( idx, 1 );
                                    }
                                    var idx =  service.pages[id].pinned.indexOf(uid);
                                    if(idx !== -1){
                                         service.pages[id].pinned.splice( idx, 1 );
                                    }
                                });
                            }
                            events_service.process('pageUsers'+id, true);
                        }
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS
                    }.bind(this));
                },
                sendPassword : function(user_id, page_id, unsent){
                    return api.send("user.sendPassword",{ page_id : page_id, id : user_id, unsent : unsent}).then(function(nb){
                        if(!!page_id){
                            events_service.process('pageUsers'+page_id);
                        }
                        else if(!!user_id){
                            user_model.get([user_id]).then(function(){
                                var user = user_model.list[user_id].datum;
                                if(!!user.organization_id){
                                    events_service.process('pageUsers'+user.organization_id);
                                }
                            }.bind(this));
                        }
                        return nb;
                    }.bind(this));
                },
                updatePinned: function( user_id, page_id, is_pinned ){
                    return api.send('pageuser.update', { page_id: page_id, user_id: user_id, is_pinned: is_pinned }).then(function(){
                        if(service.pages[page_id]){
                            var idx = service.pages[page_id].pinned.indexOf(user_id);
                            if( is_pinned && idx === -1 ){
                                service.pages[page_id].pinned.push( user_id );
                            }else if( !is_pinned && idx !== -1 ){
                                service.pages[page_id].pinned.splice( idx, 1 );
                            }
                        }
                        events_service.process('pageUsers'+page_id, true);
                    });
                },
                search: function( page_id, search, role, state, sent, is_pinned, order, alumni ){
                    return api.queue('pageuser.getListByPage', { page_id: page_id, search: search, role: role, state: state, sent:sent, is_pinned: is_pinned, order : order, alumni : alumni });
                },
                getCreatedDates: function( page_id, user_id ){
                    return api.queue('pageuser.getCreatedDates', { page_id: page_id,  user_id : user_id });
                }
            };

            service_garbage.declare(function(){
                service.clear();
            });

            return service;
        }
    ]
);
