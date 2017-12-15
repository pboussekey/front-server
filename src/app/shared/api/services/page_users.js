angular.module('API').factory('page_users',
    ['api_service','session','pum_model','pui_model','pua_model', 'puadmin_model', 'puunsent_model','pup_model', '$q','service_garbage',
        function( api, session, pum_model, pui_model, pua_model, puadmin_model, puunsent_model, pup_model, $q, service_garbage ){

            var service = {
                loadPromise: undefined,
                pages: {},

                clear: function(){
                    service.pages = {};
                    service.loadPromise = undefined;
                },
                load: function( id, force ){
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
                                pending : [],
                                invited : [],
                                unsent : [],
                                pinned: []
                            };
                        }
                        var step = 6,
                            onload = function(){
                                step--;
                                var users = service.pages[id];
                                users.all = users.members.concat(users.administrators).concat(users.pending).concat(users.invited).sort(function(u1,u2){ return u1 - u2;});
                                if( !step ){
                                    this.loadPromise = undefined;
                                    deferred.resolve();
                                }
                        }.bind(this);

                        pum_model.get([id], force).then(function(){
                            service.pages[id].members.splice(0, service.pages[id].members.length );
                            Array.prototype.push.apply( service.pages[id].members, pum_model.list[id].datum );
                            onload();
                        }.bind(this));

                        pup_model.get([id], force).then(function(){
                            service.pages[id].pinned.splice(0, service.pages[id].pinned.length );
                            Array.prototype.push.apply( service.pages[id].pinned, pup_model.list[id].datum );
                            onload();
                        }.bind(this));

                        puadmin_model.get([id], force).then(function(){
                            service.pages[id].administrators.splice(0, service.pages[id].administrators.length );
                            Array.prototype.push.apply( service.pages[id].administrators, puadmin_model.list[id].datum );
                            if(service.pages[id].administrators.indexOf(session.id) !== -1 || session.roles[1]){
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

                                puunsent_model.get([id], force).then(function(){
                                    service.pages[id].unsent.splice(0, service.pages[id].unsent.length );
                                    Array.prototype.push.apply( service.pages[id].unsent, puunsent_model.list[id].datum );
                                    onload();
                                }.bind(this));
                            }
                            else{
                                step -= 3;
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
                            service.load(id, true);
                        }
                    }.bind(this),function(err){

                    });
                },
                apply: function( id, user_id, email ){
                    id = parseInt( id );
                    return api.send('pageuser.add',{page_id:id, user_id:user_id, email : email, role:'user', state:'pending' }).then(function(d){
                        if( d ){
                            service.load(id, true);
                        }
                    }.bind(this),function(err){

                    });
                },
                invite: function( id, user_id){
                    id = parseInt( id );
                    return api.send('pageuser.add',{page_id:id, user_id:user_id, role:'user', state:'invited'}).then(function(d){
                        if( d ){
                            service.load(id, true);
                        }
                    }.bind(this),function(err){

                    });
                },
                accept: function( id, user_id ){
                    id = parseInt( id );
                    return api.send('pageuser.update',{page_id:id, user_id:user_id, role:'user', state:'member'}).then(function(d){
                        if( d ){
                            service.load(id, true);
                        }
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS  ( CRITICAL => IF AN REQUEST IS CANCELED & USER TRY TO ACCEPT IT ).
                    }.bind(this));
                },
                grantAdmin: function( id, user_id ){
                    id = parseInt( id );
                    return api.send('pageuser.update',{page_id:id, user_id:user_id, role:'admin', state:'member'}).then(function(d){
                        if( d ){
                            service.load(id, true);
                        }
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS  ( CRITICAL => IF AN REQUEST IS CANCELED & USER TRY TO ACCEPT IT ).
                    }.bind(this));
                },
                removeAdmin: function( id, user_id ){
                    id = parseInt( id );
                    return api.send('pageuser.update',{page_id:id, user_id:user_id, role:'user', state:'member'}).then(function(d){
                        if( d ){
                            service.load(id, true);
                        }
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS  ( CRITICAL => IF AN REQUEST IS CANCELED & USER TRY TO ACCEPT IT ).
                    }.bind(this));
                },
                decline: function( id, user_id ){
                    id = parseInt( id );
                    return api.send('pageuser.delete',{user_id:user_id,page_id:id}).then(function(d){
                        if( d ){
                            service.load(id, true);
                        }
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS
                    }.bind(this));
                },
                remove: function( id, user_id ){
                    id = parseInt( id );
                    return api.send('pageuser.delete',{user_id:user_id,page_id:id}).then(function(d){
                        if( d ){
                            service.load(id, true);
                        }
                    }.bind(this),function(err){
                        // TO DO => API IMPROVEMENTS
                    }.bind(this));
                },
                import : function(id, users){
                    if(users){
                        users = users.map(
                            function(u){ return { firstname : u.firstname, lastname : u.lastname, nickname : u.nickname, email : u.email }
                        });
                        return api.send("user.import",
                            { page_id : id, data : users}).then(function(errors){
                                this.load(id, true);
                                return errors;
                        }.bind(this));
                    }
                },
                sendPassword : function(user_id, page_id){
                    return api.send("user.sendPassword",{ page_id : page_id, id : user_id}).then(function(nb){
                        this.load(page_id, true);
                        return nb;
                    }.bind(this));
                },
                updatePinned: function( user_id, page_id, is_pinned ){
                    return api.send('pageuser.update', { page_id: page_id, user_id: user_id, is_pinned: is_pinned }).then(function(){
                        var idx = service.pages[page_id].pinned.indexOf(user_id);
                        if( is_pinned && idx === -1 ){
                            service.pages[page_id].pinned.push( user_id );
                        }else if( !is_pinned && idx !== -1 ){
                            service.pages[page_id].pinned.splice( idx, 1 );
                        }
                    });
                },
                search: function( page_id, search, role, state, sent, is_pinned ){
                    return api.send('pageuser.getListByPage', { page_id: page_id, search: search, role: role, state: state, sent:sent, is_pinned: is_pinned });
                }
            };

            service_garbage.declare(function(){
                service.clear();
            });

            return service;
        }
    ]
);
