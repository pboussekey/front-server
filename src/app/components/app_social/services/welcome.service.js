angular.module('app_social')
    .factory('welcome_service',[ 'community_service', 
            'session', 'modal_service', 'user_model', 'user_resumes_model',
            'resume_model', 'connections', 'countries', 'profile',
        function( community_service, 
            session, modal_service, user_model, user_resumes_model,
            resume_model, connections, countries, profile){
 
            var service = {
                session : session,
                users : user_model.list,
                pagination : { n : 20, p : 1 },
                selected : {},
                available_steps : {
                    connections : {
                        title : "Start building your network!",
                        steptitle : "Add connections",
                        hint : "Invite people to join your network.",
                        priority : 100,
                        next : function(){
                            if(!service.loading && !service.ended){
                                service.loading = true;
                                service.pagination.p++;
                                return community_service.users( 
                                    null, 
                                    service.pagination.p, 
                                    service.pagination.n, 
                                    [session.id], null, null, null, null, { type : 'affinity' }, 
                                    0)
                                    .then(function(users){
                                        service.suggestions = service.suggestions.concat(users.list);
                                        service.loading = false;
                                        service.ended = users.list.length < service.pagination.n;
                                });
                            }
                        },
                        isCompleted : function(){
                            return connections.load().then(function(){
                                return connections.connecteds.length + connections.requesteds.length >= 10;
                            });
                        },
                        addConnection : function(user_id){
                            if(!service.selected[user_id]){
                                service.count++;
                                service.selected[user_id] = true;
                                connections.request( user_id );
                            }
                        },
                        fill : function(){
                            service.selected = {};
                            service.pagination = { n : 20, p : 1 };
                            service.count = connections.connecteds.length + connections.requesteds.length;
                            service.ended = false;
                            service.total = (connections.connecteds.length + connections.requesteds.length) > 10 ? 1 : 10;
                            return community_service.users( 
                                null, 
                                service.pagination.p, 
                                service.pagination.n, 
                                [session.id], null, null, null, null, { type : 'affinity' }, 
                                0)
                                .then(function(users){
                                    
                                service.suggestions = users.list;
                            });
                        }.bind(this)
                    },
                    avatar : {
                        title : "Set profile picture",
                        hint : "Don't be a stranger! Your photo will make it easier for your teamates to recognize you.",
                        priority : 99,
                        isCompleted : function(){
                            return user_model.queue([session.id]).then(function(){
                                return user_model.list[session.id].datum.avatar;
                            });
                        },
                        onComplete : function(){
                            if(service.hasAvatar){
                                service.available_steps.avatar.crop().then(function(blob){
                                    profile.updateAvatar(blob, session.id);
                                });
                            }
                            service.nextStep();
                        },
                        onAvatarFile : function( files ){
                            if( files.length ){
                                service.loadCropper( URL.createObjectURL(files[0]), false, true );
                                service.hasAvatar = true;
                            }
                        },
                        avatars : [
                            'assets/img/avatar1.svg',
                            'assets/img/avatar2.svg',
                            'assets/img/avatar3.svg',
                            'assets/img/avatar4.svg',
                            'assets/img/avatar5.svg',
                            'assets/img/avatar6.svg',
                            'assets/img/avatar7.svg',
                            'assets/img/avatar8.svg',
                            'assets/img/avatar9.svg',
                            'assets/img/avatar10.svg',
                            'assets/img/avatar11.svg',
                            'assets/img/avatar12.svg',
                            'assets/img/avatar13.svg',
                            'assets/img/avatar14.svg',
                            'assets/img/avatar15.svg',
                            'assets/img/avatar16.svg',
                            'assets/img/avatar17.svg',
                            'assets/img/avatar18.svg',
                            'assets/img/avatar19.svg',
                            'assets/img/avatar20.svg',
                            'assets/img/avatar21.svg',
                            'assets/img/avatar22.svg',
                            'assets/img/avatar23.svg',
                            'assets/img/avatar24.svg',
                        ]
                    },
                    address : {
                        title : "Tell your peers about yourself!",
                        steptitle : "About yourself",
                        hint : "Everyone has a story and it always starts with a journey!",
                        priority : 98,
                        isCompleted : function(){
                            return user_model.queue([session.id]).then(function(){
                                return user_model.list[session.id].datum.address || user_model.list[session.id].datum.origin;
                            });
                        },
                        onComplete : function(){
                            profile.updateAddress(service.available_steps.address.tmpAddress, session.id);
                            profile.updateOrigin(service.available_steps.address.tmpOrigin, session.id);
                            service.nextStep();
                        },
                        searchOrigin : function(search){
                            if(!search){
                                service.available_steps.address.tmpOrigin = null;
                                return [];
                            }
                            else{
                                return countries.getList(search);
                            }
                        },
                    }
                },
                steps : [],
                        
                changeState : function(index){
                    if(service.steps[index] && service.steps[index].fill){
                        service.current_index = index;
                        service.current_step = service.steps[index];
                        service.loading = true;
                        return service.steps[index].fill().then(function(){
                            service.loading = false;
                            if(!modal_service.opened){
                                modal_service.open( {
                                    template: 'app/components/app_social/tpl/welcome.template.html',
                                    scope: service,
                                    blocked : true,
                                    reference: document.activeElement
                                });
                            }
                        });
                    }
                    else if(service.steps[index]){
                        service.selected = {};
                        service.pagination = { n : 20, p : 1 };
                        service.count = 0;
                        service.ended = false;
                        service.total = 0;
                        service.current_index = index;
                        service.current_step = service.steps[index];
                        service.loading = false;
                            if(!modal_service.opened){
                               modal_service.open( {
                                   template: 'app/components/app_social/tpl/welcome.template.html',
                                   scope: service,
                                   blocked : true,
                                   reference: document.activeElement
                            });
                        }
                    }
                    else{
                        modal_service.close();
                    }
                },
                nextStep : function(){
                    service.changeState(service.current_index + 1);
                },
                init : function(){
                    var steps = Object.keys(service.available_steps).length;
                    angular.forEach(service.available_steps, function(step){
                        step.isCompleted().then(function(done){
                            if(!done){
                                service.steps.push(step);
                            }
                            onLoad();
                        });
                    });
                    function onLoad(){
                        steps--;
                        if((service.steps.length > 0 && steps === 0) || service.steps.length === 3){
                            service.steps.sort(function(s1, s2){
                               return s1.priority < s2.priority; 
                            });
                            service.changeState(0);
                        }
                    }
                    
           
                }
            };
    
            
          

            return service;
        }
    ]);
