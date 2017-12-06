angular.module('page').controller('page_controller',
    ['$scope','session', 'page', 'conversation', 'pages_posts', 'users', 'library_service',
        'user_model', 'page_model',  'page_modal_service',  'pages', 'page_users', '$translate',
        'user_events', 'user_groups', 'user_courses', 'user_organizations', 'pages_constants',
        'notifier_service', 'page_library',  'social_service', 'modal_service',
        '$state', 'followers', 'parents', 'children', 'events_service', 'assignments', 'filters_functions', 'community_service','cvn_model', 'user_profile', 'pages_config',
        function($scope, session, page, conversation, pages_posts, users, library_service,
            user_model, page_model,  page_modal_service, pages, page_users, $translate,
            user_events, user_groups, user_courses, user_organizations, pages_constants,
            notifier_service, page_library, social_service, modal_service, $state, followers,
            parents, children, events_service, assignments, filters_functions, community, cvn_model, user_profile, pages_config){

            var ctrl = this;
            ctrl.$state = $state;
            document.title = 'TWIC - ' + page.datum.title;
             ctrl.breadcrumb =  [
                { text : page.datum.title }
            ] ;
            ctrl.page = page;
            ctrl.page_counts = {
                
                users : function(){
                    return ctrl.users.all.length;
                },
                membership : function(){
                    return ctrl.parents.length;
                },
                members : function(){
                    return ctrl.children.length;
                },
                community : function(){
                    return ctrl.followers_count;
                },
                resources : function(){
                    return ctrl.page_library.count || 0;
                },
                submissions : function(){
                    return ctrl.assignments.length || 0;
                }
            };
                  
            ctrl.deleteUser = function(uid){
                user_profile.delete(uid).then(function(){
                    events_service.process('pageUsers' + page.datum.id);
                });
            };
            ctrl.config = pages_config;
            ctrl.page_fields = pages_config[page.datum.type].fields;
            ctrl.page_users = page_users;
            ctrl.users = users;
            ctrl.users.all = ctrl.users.members.concat(ctrl.users.administrators).concat(ctrl.users.pending).concat(ctrl.users.invited).sort(function(u1,u2){ return u1 - u2;});
            ctrl.parents = parents;
            ctrl.children = children;
            ctrl.editable = (users.administrators.indexOf(session.id) !== -1 || session.roles[1]);
            ctrl.isStudnetAdmin = session.roles[1];
            ctrl.me = session.id;
            ctrl.user_model = user_model;
            ctrl.page_model = page_model;
            ctrl.api_key = CONFIG.mapsApiKey;
            ctrl.conversation = conversation;
            ctrl.isMember = (users.administrators.indexOf(session.id) !== -1
                || (users.members.indexOf(session.id) !== -1 && page.datum.type !== 'organization')
            );
            ctrl.isStudent = page.datum.type === 'course' && users.members.indexOf(session.id) !== -1;
            ctrl.isAdmin = ctrl.isStudnetAdmin || users.administrators.indexOf(session.id) !== -1;

            //CUSTOM
            if(ctrl.isStudnetAdmin){
                pages.getCustom(page.datum.id).then(function(custom){
                    ctrl.custom = custom;
                });
            }
            //SEND PASSWORD

            ctrl.sendPassword = function(user_id, page_id){
                page_users.sendPassword(user_id, page_id).then(function(nb){
                    if(user_id){
                        user_model.list[user_id].datum.email_sent = 1;
                    }
                    if(page_id){
                        users.members.concat(users.administrators).concat(users.pending).concat(users.invited).forEach(function(id){
                            if(user_model.list[id] && user_model.list[id].datum){
                                user_model.list[id].datum.email_sent = 1;
                            }
                        });
                    }

                    $translate('ntf.admin_pwd_emails',{number:nb}).then(function( translation ){
                        notifier_service.add({type:'message',title: translation});
                    });
                });
            };

            //POSTS
            ctrl.loadingPosts = true;
            ctrl.posts = pages_posts.getPaginator(page.datum.id);
            ctrl.posts.get().then(function(){
                ctrl.loadingPosts = false;
            });
            ctrl.nextPosts = function(){
                if(ctrl.loadingPosts){
                    return;
                }
                ctrl.loadingPosts = true;
                var posts_length = ctrl.posts.list.length;
                return ctrl.posts.next().then(function(){
                    ctrl.loadingPosts = posts_length === ctrl.posts.list.length;
                });
            };

            ctrl.onPostDeleted = function( postId ){
                ctrl.posts.unset( postId );
            };
            ctrl.onPostAdded = function( ){
                ctrl.posts.refresh();
            };
            //RESOURCES
            ctrl.loadingDocuments= true;
            ctrl.library_service = library_service;
            ctrl.page_library = page_library.get(page.datum.id);
            ctrl.page_library.get().then(function(){
               ctrl.loadingDocuments = false;
            });
            ctrl.nextDocuments = function(){
                if(ctrl.loadingDocuments){
                    return;
                }
                ctrl.loadingDocuments= true;
                var documents_length = ctrl.page_library.list.length;
                ctrl.page_library.next().then(function(){
                    ctrl.loadingDocuments = documents_length === ctrl.page_library.list.length;
                });
            };

            ctrl.addDocument = function(file){
                page_library.add(ctrl.page.datum.id, file, ctrl.onUploadError);
            };

            ctrl.deleteDocument = function(id){
                return page_library.remove(ctrl.page.datum.id, id);
            };

            ctrl.onUploadError = function(){
                $translate('ntf.err_file_upload').then(function( translation ){
                    notifier_service.add({type:'error',title: translation});
                });
            };


            //ADD MATERIAL
            ctrl.openResourceModal = function($event){
                modal_service.open({
                    reference: $event.target,
                    scope : {
                        save : ctrl.addDocument,
                        document : null,
                    },
                    template:'app/components/page/tpl/resource_modal.html'
                });
            };


           //EDITION
           ctrl.editDates = function(){
               ctrl.buildStart(page.datum.start_date);
               ctrl.buildEnd(page.datum.end_date);
               ctrl.editingDates = ctrl.editable;

           };


            ctrl.updateLogo = function(blob){
                return pages.updateLogo(ctrl.page.datum.id, blob);
            };

            ctrl.updateCover = function(blob){
                return pages.updateCover(ctrl.page.datum.id, blob);
            };

            ctrl.updateAddress = function(address){
                return pages.updateAddress(ctrl.page.datum.id, address);
            };

            ctrl.updateWebsite = function(website){
                return pages.updateWebsite(ctrl.page.datum.id, website).then(function(){
                    ctrl.editWebsite = false;
                });
            };

            ctrl.updateDescription = function(description){
                return pages.updateDescription(ctrl.page.datum.id, description).then(function(){
                    ctrl.editDescription = false;
                });
            };

            ctrl.updateDates = function(start, end){
                return pages.updateDates(ctrl.page.datum.id, start, end).then(function(){
                    ctrl.editingDates = false;
                });
            };

            ctrl.updateTitle = function(title){
                return pages.updateTitle(ctrl.page.datum.id, title).then(function(){
                    ctrl.editTitle = false;
                });
            };

            ctrl.switchPublishState = function(){
                if( !ctrl.switchingPubState ){
                    ctrl.switchingPubState = true;

                    pages.updatePublish(ctrl.page.datum.id, !ctrl.page.datum.is_published).then(function(){
                        ctrl.switchingPubState = false;

                        if( ctrl.page.datum.is_published ){
                            cvn_model.get([ctrl.page.datum.conversation_id]).then(function(){
                                ctrl.conversation = cvn_model.list[ctrl.page.datum.conversation_id];
                            });
                        }
                    });
                }
            };

            ctrl.updateCustom = function(libelle, custom){
                if(ctrl.isStudnetAdmin){
                    return pages.updateCustom(ctrl.page.datum.id, libelle, custom).then(function(){
                        $translate('ntf.admin_customfield_updated').then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });
                    });
                }
            };

            ctrl.removeTag = function(tag){
                pages.removeTag(ctrl.page.datum.id, tag);
            };

            ctrl.addTag = function(tag){
                pages.addTag(ctrl.page.datum.id, tag);
            };

            //IMPORT
            ctrl.openImportModal = function($event){
                modal_service.open({
                    reference: $event.target,
                    scope : {
                        import : function(users){
                            this.importing  = true;
                            return page_users.import(ctrl.page.datum.id, users).then(function(errors){
                                this.importing = false;
                                this.close();

                                $translate('ntf.user_import',{number:(users.length - errors.length)}).then(function( translation ){
                                    notifier_service.add({type:'message',title: translation});
                                });

                                errors.forEach(function(error){
                                    $translate('ntf.err_user_import',{error:error.message}).then(function( translation ){
                                        notifier_service.add({type:'error',title: translation});
                                    });
                                });
                            });
                        }
                    },
                    template:'app/shared/elements/import-csv/tpl/users-import-modal.html'
                });
            };


            ctrl.openPageModal =  page_modal_service.open;

            //STATE
            var pagetype;
            if( page.datum.type === pages_constants.pageTypes.COURSE ){
                ctrl.user_page_state_service = user_courses;
                pagetype = 'course';
            }else if( page.datum.type === pages_constants.pageTypes.EVENT ){
                ctrl.user_page_state_service = user_events;
                pagetype = 'event';
            }else if( page.datum.type === pages_constants.pageTypes.GROUP ){
                ctrl.user_page_state_service = user_groups;
                pagetype = 'group';
            }else if( page.datum.type === pages_constants.pageTypes.ORGANIZATION ){
                ctrl.user_page_state_service = user_organizations;
                pagetype = 'organization';
            }
            if(ctrl.user_page_state_service){
                ctrl.user_page_state_service.load(true).then(function(){
                    ctrl.state = ctrl.user_page_state_service.getUserState(page.datum.id);
                });
            }
            else{
                ctrl.state = pages_constants.pageStates.NONE;
            }

            ctrl.leave = function(){
                if( !ctrl.requesting ){
                    ctrl.requesting = true;
                    ctrl.user_page_state_service.remove( page.datum.id ).then(function(){
                        ctrl.state = ctrl.user_page_state_service.getUserState(page.datum.id);
                        ctrl.requesting = false;
                        page_users.load(page.datum.id, true);

                        $translate('ntf.page_cancel_apply',{pagetype:pagetype}).then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });
                    });
                }
            };

            ctrl.join = function(){
                if( !ctrl.requesting ){
                    ctrl.user_page_state_service.join( page.datum.id ).then(function(){
                        ctrl.state = ctrl.user_page_state_service.getUserState(page.datum.id);
                        ctrl.requesting = false;
                        page_users.load(page.datum.id, true);

                        $translate('ntf.page_join',{pagetype:pagetype}).then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });
                    });
                }
            };

            ctrl.apply = function(){
                if( !ctrl.requesting ){
                    ctrl.requesting = true;
                    ctrl.user_page_state_service.apply( page.datum.id ).then(function(){
                        ctrl.state = ctrl.user_page_state_service.getUserState(page.datum.id);
                        ctrl.requesting = false;
                        page_users.load(page.datum.id, true);

                        $translate('ntf.page_apply',{pagetype:pagetype}).then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });
                    });
                }
            };

            ctrl.accept = function(){
                if( !ctrl.requesting ){
                    ctrl.requesting = true;
                    ctrl.user_page_state_service.accept( page.datum.id ).then(function(){
                        ctrl.state = ctrl.user_page_state_service.getUserState(page.datum.id);
                        ctrl.requesting = false;
                        page_users.load(page.datum.id, true);
                        if(page.datum.type === pages_constants.pageTypes.EVENT){
                            user_events.load([session.id], true);
                        }
                        else if(page.datum.type === pages_constants.pageTypes.GROUP){
                            user_groups.load([session.id], true);
                        }
                        else if(page.datum.type === pages_constants.pageTypes.COURSE){
                            user_courses.load([session.id], true);
                        }
                        else if(page.datum.type === pages_constants.pageTypes.ORGANIZATION){
                            user_organizations.load([session.id], true);
                        }

                        $translate('ntf.page_join',{pagetype:pagetype}).then(function( translation ){
                            notifier_service.add({type:'message',title: translation});
                        });
                    });
                }
            };

            ctrl.edit = page_modal_service.open;

            //CONVERSATION
            ctrl.openConversation= function(user, conversation){
                social_service.openConversation(null, user ? [user] : null, conversation);
            };

            ctrl.viewConnections = function( $event, id ){
                 if( user_model.list[id].datum.contacts_count ){
                     modal_service.open( {
                         template: 'app/shared/custom_elements/user/user_connections/connections_modal.html',
                         reference: $event.target,
                         scope: {
                             user_id: id
                         },
                         label: filters_functions.username(user_model.list[id].datum) + "'s connection" + (user_model.list[id].datum.contacts_count > 1 ? "s" : "")
                     });
                 }
             };

             //COMMUNITY
            ctrl.followers_count = followers.count;
            ctrl.followers_page = 1;
            ctrl.followers = followers.list;
            ctrl.nextFollowers = function(){
                if(ctrl.loadingFollowers){
                    return;
                }
                ctrl.followers_page++;
                ctrl.loadingFollowers= true;
                community.subscriptions(ctrl.page.datum.id,  ctrl.followers_page, 24).then(function(r){
                    ctrl.followers = ctrl.followers.concat(r.list);
                    ctrl.loadingFollowers = ctrl.followers_count <= followers.length;
                });
            };

            events_service.on('pageUsers' + page.datum.id, function(){
                page_users.load(page.datum.id, true).then(function(){
                    ctrl.isMember = (users.administrators.indexOf(session.id) !== -1
                        || (users.members.indexOf(session.id) !== -1 && page.datum.type !== 'organization')
                    );
                });
            });

            $scope.$on('$destroy',function(){
                    events_service.off('page.'+page.datum.id+'.item.updated');
                    events_service.off('pageUsers' + page.datum.id);
            });

        }
    ]);
