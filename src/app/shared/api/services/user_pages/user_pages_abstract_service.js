angular.module('API').factory('user_pages_abstract_service',
    ['api_service','session','events_service','$q','pages_constants',
        function( api, session, events_service, $q, pages_constants ){
            
            
            function user_pages_abstract_service( type,upa_model,upi_model,upm_model ){
                this.type = type;
                
                // SET MODELS
                this.upa_model = upa_model;
                this.upi_model = upi_model;
                this.upm_model = upm_model;
                
                // INIT STATES ARRAYS
                this.memberof = [];
                this.invitedin = [];
                this.appliedin = [];
            };
            
            user_pages_abstract_service.prototype.states = pages_constants.pageStates;
            
            user_pages_abstract_service.prototype.clear = function(){
                this.memberof.splice(0,this.memberof.length);
                this.invitedin.splice(0,this.invitedin.length);
                this.appliedin.splice(0,this.appliedin.length);
            };
            
            user_pages_abstract_service.prototype.diff = function( oldc, olda, oldr ){                
                var buffer = {};
                    
                this.memberof.forEach(function( id ){
                    if( oldc[id] !== null ){
                        buffer[id] = null;
                    }else{
                        delete( oldc[id] );
                    }
                });
                    
                this.invitedin.forEach(function( id ){
                    if( olda[id] !== null ){
                        buffer[id] = null;
                    }else{
                        delete( olda[id] );
                    }
                });
                    
                this.appliedin.forEach(function( id ){
                    if( oldr[id] !== null ){
                        buffer[id] = null;
                    }else{
                        delete( oldr[id] );
                    }
                });

                for( var k in oldc ){
                    buffer[k] = null;
                }

                for( var k in oldr ){
                    buffer[k] = null;
                }

                for( var k in olda ){
                    buffer[k] = null;
                }
                    
                return Object.keys(buffer);
            };
            
            user_pages_abstract_service.prototype.load = function(force){
                if( this.loadPromise ){
                    return this.loadPromise;
                }else{
                    var deferred = $q.defer(),
                        step = 3,

                        oldc = this.memberof.reduce(function(o, id){ o[id]=null; return o; },{}),
                        oldr = this.appliedin.reduce(function(o, id){ o[id]=null; return o; },{}),
                        olda = this.invitedin.reduce(function(o, id){ o[id]=null; return o; },{}),

                        onload = function(){
                            step--;
                            
                            
                            if( !step ){                                    
                                var type = this.type,
                                    diff  = this.diff( oldc, olda, oldr );

                                diff.forEach(function(id){
                                    events_service.process('user'+type+'State#'+id);
                                });

                                events_service.process('user'+type+'State',diff);

                                this.loadPromise = undefined;
                                deferred.resolve();
                            }
                        }.bind(this);

                    if( session.id ){
                        this.loadPromise = deferred.promise;

                        this.upm_model.get([session.id], force).then(function(){                                
                            this.memberof.splice(0, this.memberof.length );
                            if(this.upm_model.list[session.id]){
                                Array.prototype.push.apply( this.memberof, this.upm_model.list[session.id].datum );
                            }
                            onload();
                        }.bind(this));

                        this.upa_model.get([session.id], force).then(function(){
                            this.appliedin.splice(0, this.appliedin.length );
                            if(this.upa_model.list[session.id]){
                                Array.prototype.push.apply( this.appliedin, this.upa_model.list[session.id].datum );
                            }
                            onload();
                        }.bind(this));

                        this.upi_model.get([session.id], force).then(function(){
                            this.invitedin.splice(0, this.invitedin.length );
                            if(this.upi_model.list[session.id]){
                                Array.prototype.push.apply( this.invitedin, this.upi_model.list[session.id].datum );
                            }
                            onload();
                        }.bind(this));
                        
                    }else{
                        deferred.resolve();
                    }

                    return deferred.promise;
                }                
            };
            
            user_pages_abstract_service.prototype.apply = function( id ){
                id = parseInt( id );
                
                return api.send('pageuser.add',{page_id:id, user_id:session.id, role:'user', state:'pending'}).then(function(d){
                    if( d ){
                        // ADD USER IN APPLICATIONS
                        if( this.upa_model.list[session.id] ){
                            var idx = this.upa_model.list[session.id].datum.indexOf( id );
                            if( idx === -1 ){
                                this.upa_model.list[session.id].datum.push( id );
                            }
                        }                        
                        var cdx = this.appliedin.indexOf( id );
                        if( cdx === -1 ){
                            this.appliedin.push( id );
                        }

                        events_service.process('user'+this.type+'State#'+id);
                        events_service.process('user'+this.type+'State',[id]);
                        events_service.process('pageUsers'+id);
                    }    
                }.bind(this),function(err){

                });
            };            
            
            user_pages_abstract_service.prototype.join = function( id ){
                id = parseInt( id );

                return api.send('pageuser.add',{page_id:id, user_id:session.id, role:'user', state:'member'}).then(function(d){
                        if( d ){
                            // ADD PAGE IN MEMBEROF
                            if( this.upm_model.list[session.id] ){
                                var idx = this.upm_model.list[session.id].datum.indexOf( id );
                                if( idx === -1 ){
                                    this.upm_model.list[session.id].datum.push( id );
                                }
                            }                        
                            var cdx = this.memberof.indexOf( id );
                            if( cdx === -1 ){
                                this.memberof.push( id );
                            }                            
                            events_service.process('user'+this.type+'State#'+id);
                            events_service.process('user'+this.type+'State',[id]);
                            events_service.process('pageUsers'+id);
                        }
                    }.bind(this),function(err){
                        
                    });
            };
            
            user_pages_abstract_service.prototype.accept = function( id ){
                id = parseInt( id );
                    
                return api.send('pageuser.update',{page_id:id, user_id:session.id, role:'user', state:'member'}).then(function(d){
                    if( d ){
                        // REMOVE PAGE FROM INVITATIONS
                        if( this.upi_model.list[session.id] ){
                            var idx = this.upi_model.list[session.id].datum.indexOf( id );
                            if( idx !== -1 ){
                                this.upi_model.list[session.id].datum.splice( idx, 1 );
                            }
                        }                        
                        var adx = this.invitedin.indexOf( id );
                        if( adx !== -1 ){
                            this.invitedin.splice( adx, 1);
                        }

                        // ADD PAGE IN MEMBEROF
                        if( this.upm_model.list[session.id] ){
                            var idx = this.upm_model.list[session.id].datum.indexOf( id );
                            if( idx === -1 ){
                                this.upm_model.list[session.id].datum.push( id );
                            }
                        }                        
                        var cdx = this.memberof.indexOf( id );
                        if( cdx === -1 ){
                            this.memberof.push( id );
                        }

                        events_service.process('user'+this.type+'State#'+id);
                        events_service.process('user'+this.type+'State',[id]);
                        events_service.process('pageUsers'+id);
                    }
                }.bind(this),function(err){
                    // TO DO => API IMPROVEMENTS  ( CRITICAL => IF AN REQUEST IS CANCELED & USER TRY TO ACCEPT IT ).                      
                }.bind(this));                    
            };
            
            user_pages_abstract_service.prototype.decline = function( id ){
                id = parseInt( id );

                return api.send('pageuser.delete',{user_id:session.id,page_id:id}).then(function(d){
                    // REMOVE PAGE FROM INVITATIONS
                    if( this.upi_model.list[session.id] ){
                        var idx = this.upi_model.list[session.id].datum.indexOf( id );
                        if( idx !== -1 ){
                            this.upi_model.list[session.id].datum.splice( idx, 1 );
                        }
                    }                        
                    var adx = this.invitedin.indexOf( id );
                    if( adx !== -1 ){
                        this.invitedin.splice( adx, 1);
                    }

                    events_service.process('user'+this.type+'State#'+id);
                    events_service.process('user'+this.type+'State',[id]);
                    events_service.process('pageUsers'+id);
                }.bind(this),function(err){
                    // TO DO => API IMPROVEMENTS
                }.bind(this));
            };
            
            user_pages_abstract_service.prototype.remove = function( id ){
                id = parseInt( id );

                return api.send('pageuser.delete',{user_id:session.id,page_id:id}).then(function(d){
                    // IF PAGE REMOVED WAS IN MEMBERS
                    if( this.upm_model.list[session.id] ){
                        var idx = this.upm_model.list[session.id].datum.indexOf( id );
                        if( idx !== -1 ){
                            this.upm_model.list[session.id].datum.splice( idx, 1 );
                        }
                    }                        
                    var cdx = this.memberof.indexOf( id );
                    if( cdx !== -1 ){
                        this.memberof.splice( cdx, 1);
                    }

                    // IF PAGE REMOVED WAS IN APPLICATIONS
                    if( this.upa_model.list[session.id] ){
                        var idx = this.upa_model.list[session.id].datum.indexOf( id );
                        if( idx !== -1 ){
                            this.upa_model.list[session.id].datum.splice( idx, 1 );
                        }
                    }                        
                    var rdx = this.appliedin.indexOf( id );
                    if( rdx !== -1 ){
                        this.appliedin.splice( rdx, 1);
                    }

                    // IF PAGE REMOVED WAS IN INVITATIONS
                    if( this.upi_model.list[session.id] ){
                        var idx = this.upi_model.list[session.id].datum.indexOf( id );
                        if( idx !== -1 ){
                            this.upi_model.list[session.id].datum.splice( idx, 1 );
                        }
                    }                        
                    var idx = this.invitedin.indexOf( id );
                    if( idx !== -1 ){
                        this.invitedin.splice( idx, 1);
                    }

                    events_service.process('user'+this.type+'State#'+id);
                    events_service.process('user'+this.type+'State',[id]);
                    events_service.process('pageUsers'+id);
                    
                }.bind(this),function(err){
                    // TO DO => API IMPROVEMENTS
                }.bind(this));                    
            };
            
            user_pages_abstract_service.prototype.getUserState = function( page_id ){
                page_id = parseInt( page_id );
                if(this.memberof.indexOf(page_id) !== -1){
                    return this.states.MEMBER;
                }
                
                if( this.appliedin.indexOf(page_id) !== -1 ){
                    return this.states.PENDING;
                }
                
                if( this.invitedin.indexOf(page_id) !== -1 ){
                    return this.states.INVITED;
                }
                
                return this.states.NONE;
            };
            
            return user_pages_abstract_service;
        }
    ]
);
