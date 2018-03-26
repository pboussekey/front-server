angular.module('customElements')
    .factory('page_modal_service',['community_service', 'modal_service', 'pages', 'pages_constants', 'notifier_service',
             'user_model', 'session', '$state', 'page_users', 'oadmin_model', 'page_model', '$q',  '$translate', 
             'pages_config', 'filters_functions',
        function(community, modal_service, pages, constants, notifier_service, 
            user_model, session, $state, page_users, oadmin_model, page_model, $q, $translate, pages_config,
            filters_functions){
            var email_regex = new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$');
            var service = {
                users : user_model.list,
                user_modes : {
                   SIMPLE : 'SIMPLE',
                   MULTIPLE : 'MULTIPLE'
                },
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
                        title : function(){ return 'Specify the location'; },
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
                user_mode : 'SIMPLE',
                invitations : [],
                invitations_sent : [],
                isEmail : function(source){
                    return email_regex.test(source);
                },
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
                    Object.keys(service.creation_steps).forEach(function(step){
                        service.creation_steps[step].is_valid = false;
                        if(service.creation_steps[step].type.indexOf(service.type) !== -1){
                             service.steps.push(step);
                         } 
                    });
                    service.current_step = service.creation_steps[service.steps[service.step]];
                    service.label = pages_config[type || page.type].label;
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
                    service.user_mode = mode ? mode : service.user_modes.SIMPLE;
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
                addUsers : function(users){
                    users = Array.isArray(users) ? users : [users];
                    service.page.users = service.page.users.concat(users.map(function(user){
                        return user.id ? { 
                            user_id : user.id, 
                            //You add participants in institutions/courses and you invite them in clubs/events
                            state : [constants.pageTypes.EVENT, constants.pageTypes.GROUP]
                                .indexOf(service.page.type) !== -1  ?  constants.pageStates.INVITED : constants.pageStates.MEMBER, 
                            role : constants.pageRoles.USER }
                        : { 
                            email : user, 
                            state :  constants.pageStates.PENDING, 
                            role : constants.pageRoles.USER };
                    }));  
                  
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
                  return community.users(search, filter.p, filter.n, service.page.id ? null : [session.id], null, null, null, null, { type : 'affinity' }).then(function(r){
                        return user_model.queue(r.list).then(function(){
                           
                            return r.list.map(function(u){ return user_model.list[u].datum; }); 
                        });
                  });
                },
                countEmails : function(){
                    var emails = service.email_list.trim().split(/[\s\n,;]+/);
                    return emails.filter(function(line, idx){
                            return line || (idx + 1) < emails.length;
                        }).length;
                },
                processEmails : function(){
                    if(service.loading){
                        return;
                    }
                    service.errors = { 
                        ALREADY_EXIST : [],
                        DOESNT_EXIST : [],
                        INVALID : []
                    };
                    service.tmp_users = [];
                    var emails = service.email_list.split(/[\s\n,;]+/).filter(function(email){
                        if(!service.isEmail(email)){
                            service.errors.INVALID.push(email);
                            return false;
                        }
                        else{
                            return true;
                        }
                    });
                    
                    service.lines_count = emails.length + service.errors.INVALID.length;
                    if(!emails.length){
                        return;
                    }
                    service.loading = true;
                    community.checkEmails(emails).then(function(r){
                        var emails = service.page.users.map(function(u){ return u.email; });
                        service.already_exists = 0;
                        angular.forEach(r,function(id, email){
                            if(service.userIds().indexOf(id) === -1 && emails.indexOf(email) === -1){
                                if(id){
                                    service.tmp_users.push({ 
                                        user_id : id, 
                                        email : email,
                                        state : service.page.type === constants.pageTypes.EVENT || service.page.type === constants.pageTypes.GROUP ?  constants.pageStates.INVITED : constants.pageStates.MEMBER, 
                                        role : constants.pageRoles.USER }
                                    );
                                }
                                else if(service.page.type === constants.pageTypes.ORGANIZATION){
                                    service.tmp_users.push({ 
                                        email : email, 
                                        state :  constants.pageStates.PENDING, 
                                        role : constants.pageRoles.USER }
                                    );
                                }
                                else{
                                    service.errors.DOESNT_EXIST.push(email);
                                }
                               
                            }
                            else{
                                service.errors.ALREADY_EXIST.push(id);
                            }
                        });
                        service.email_list = '';
                        service.email_processed = true;
                        service.loading = false;
                    }, function(){ service.loading = false; });
                },
                addTmpUsers : function(){
                    service.page.users = service.page.users.concat(service.tmp_users);
                    service.tmp_users = [];
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
                    return users;
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
