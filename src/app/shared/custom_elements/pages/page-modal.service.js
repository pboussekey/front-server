angular.module('customElements')
    .factory('page_modal_service',['community_service', 'modal_service', 'pages', 'pages_constants', 'notifier_service',
             'user_model', 'session', '$state', 'page_users', 'oadmin_model', 'page_model', '$q',  '$translate', 
             'pages_config', 'filters_functions',
        function(community, modal_service, pages, constants, notifier_service, 
            user_model, session, $state, page_users, oadmin_model, page_model, $q, $translate, pages_config,
            filters_functions){
            var service = {
                users : user_model.list,
                creation_steps: {
                    INFOS :  {
                        type : ['event', 'course', 'group', 'organization'],
                        title : function(){ return 'Create your ' + service.label; },
                        isValid : function(){
                            return (!pages_config.isDisplayed(service.page_fields.title) || service.page.title);
                        }
                    },
                    LOCATION : {
                        type : ['event', 'organization'],
                        title : function(){ return 'Specify location'; },
                        isValid : function(){
                            return (!pages_config.isDisplayed(service.page_fields.start_date) || (service.page.start_date && service.page.end_date));
                        }
                    },
                    PRIVACY : {
                        type : ['event',  'group'],
                        title : function(){ return 'Select privacy'; },
                        isValid : function(){
                            return true;
                        }
                    },
                    USERS : {
                        type : ['event', 'course', 'group', 'organization'],
                        title : function(){ return (service.type === 'event' || service.type === 'group' ? 'Invite ' : 'Add ') 
                                + filters_functions.plural(service.page_fields.users.label, true); },
                        isValid : function(){
                            return true;
                        }
                    }
                },
                nextStep : function(){
                    if(service.current_step.isValid()){
                        service.current_step.is_valid = true;
                        if(service.step < service.steps.length - 1){
                            service.step++;
                            service.current_step = service.creation_steps[service.steps[service.step]];
                        }
                        else{
                            service.save();
                        }
                    }  
                },
                previousStep : function(){
                    if(service.step > 0){
                        service.step--;
                        service.current_step = service.creation_steps[service.steps[service.step]];
                    }
                },
                selectStep : function(step){
                    if(service.creation_steps[step].is_valid){
                        service.step = service.steps.indexOf(step);
                        service.current_step = service.creation_steps[service.steps[service.step]];
                    }  
                },
                isDisplayed : pages_config.isDisplayed,
                errors : {},
                error_types : {
                   ALREADY_EXIST : 'ALREADY_EXIST',
                   DOESNT_EXIST : 'DOESNT_EXIST',
                   INVALID : 'INVALID'
                },
                invitations : [],
                invitations_sent : [],
                open : function( $event, type, page, mode){
                    service.type = type || page.type;
                    service.page = Object.assign({}, pages_config.getPage(service.type), { type : service.type, tags : [] }, page);
                    service.page_fields = pages_config[service.type].fields;
                    service.current_date = new Date();
                    service.errors = [];
                    service.invitations = [];
                    service.invitations_sent = [];
                    service.email_list = '';
                    service.step = 0;
                    service.steps = [];
                    service.me = session.id;
                    service.users = {
                        id : service.userIds(),
                        email : service.userMails()
                    };
                    Object.keys(service.creation_steps).forEach(function(step){
                        service.creation_steps[step].is_valid = false;
                        if(service.creation_steps[step].type.indexOf(service.type) !== -1){
                             service.steps.push(step);
                         } 
                    });
                    service.current_step = service.creation_steps[service.steps[service.step]];
                    service.label = pages_config[type || page.type].label;
                    service.userslabels = {
                        user : pages_config[type || page.type].fields.users.label,
                        action : service.type === constants.pageTypes.EVENT || service.type === constants.pageTypes.GROUP ? 'invite' : 'add'
                    };
                    service.hints = {};
                    $translate('confidentiality.public_hint',{label:service.label}).then(function( translation ){
                        service.hints.public = translation;
                    });
                    $translate('confidentiality.closed_hint',{label:service.label}).then(function( translation ){
                        service.hints.closed = translation;
                    });
                    $translate('confidentiality.secret_hint',{label:service.label}).then(function( translation ){
                        service.hints.secret = translation;
                    });
                    if(service.page.type === 'course' && !service.page.page_id){
                        oadmin_model.queue([session.id]).then(function(){
                            page_model.queue(oadmin_model.list[session.id].datum).then(function(){
                            service.organizations =  oadmin_model.list[session.id].datum.map(function(id){
                                if(!service.page.page_id){
                                    service.page.page_id = id;
                                }
                                return page_model.list[id].datum;
                                });
                            });
                        });
                       
                    }
                    modal_service.open({
                        reference: $event.target,
                        label: service.label,
                        scope : service,
                        blocked : true,
                        template:'app/shared/custom_elements/pages/page-modal.html'
                    });
                },
                isAlreadyIn : function(user,email){
                    if(user){
                        return service.userIds().indexOf(user.id) !== -1;  
                    }
                    else if(email){
                        return service.page.users.map(function(user){
                            return user.user_email;
                        }).indexOf(email) !== -1;
                    }
                },
                addUser : function(id, email){
                    var state;
                    if(!id){
                        state = constants.pageStates.INVITED;
                    }
                    else{
                        state = [constants.pageTypes.EVENT, constants.pageTypes.GROUP]
                                .indexOf(service.page.type) !== -1  ?  constants.pageStates.INVITED : constants.pageStates.MEMBER
                    }
                    service.page.users.push({
                       user_id : id,
                       user_email : email, 
                       state : state,
                       role : constants.pageRoles.USER
                    });
                },
                deleteUser : function(id, email){
                    if(!!id){
                        service.page.users = service.page.users.filter(function(user){
                            return !!user.user_id && user.user_id !== id;
                        });
                    }
                    else if (!!email){
                        service.page.users = service.page.users.filter(function(user){
                            return !!user.user_email && user.user_email !== email;
                        });
                    }
                },
                addUsers : function(ids, emails){
                    if(!!ids){
                        ids = Array.isArray(ids) ? ids : [ids];
                        ids.forEach(function(id){
                           service.addUser(id);
                        }); 
                    }
                    if(!!emails){
                        emails = Array.isArray(emails) ? emails : [emails];
                        emails.forEach(function(emails){
                           service.addUser(null, emails);
                        }); 
                    }
                  
                },
                addTag : function(){
                    if(service.tag && service.page.tags.indexOf(service.tag) === -1){
                        service.page.tags.push(service.tag);
                        service.tag = "";
                    }
                    return false;
                },
                save : function(){
                    service.loading = true;
                    service.page.description = service.getDescription();
                    service.page.admission = 
                        service.page.confidentiality === 0 ? 'free' : 'open';
                    pages.save(service.page).then(function(id){ 
                        modal_service.close(); 
                        $state.go("lms.page.timeline", { id : id, type : service.type });
                        service.loading = false;
                     });
                  
                },
                pages : page_model.list,
                searchUsers : function(search, filter){
                  return community.users(search, filter.p, filter.n, null, null, null, null, null, { type : 'affinity' }).then(function(r){
                        return user_model.queue(r.list).then(function(){
                            return r.list.map(function(u){ return user_model.list[u].datum; }); 
                        });
                  });
                },
                userIds : function(){
                    var users = service.page.users.map(function(u){
                        return u.user_id;
                    });
                    if(service.page.id && page_users.pages[service.page.id]){
                       users = users 
                        .concat(page_users.pages[service.page.id].members)
                        .concat(page_users.pages[service.page.id].administrators)
                        .concat(page_users.pages[service.page.id].invited)
                        .concat(page_users.pages[service.page.id].pending);
                    }
                    return users.concat([session.id]);
                },
                userMails : function(){
                    return service.page.users.filter(function(u){
                       return u.email;          
                    }).map(function(u){
                        return u.email;
                    });
                }
            };
            
            return service;
        }
    ]);
