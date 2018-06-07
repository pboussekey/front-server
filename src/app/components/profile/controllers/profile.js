angular.module('profile').controller('profile_controller',
    ['session', 'user', 'school', 'user_resumes_model', 'resume_model', 'countries',
        'user_connections', 'users_posts', 'user_model', 'page_model', 'social_service', 'languages',
        'filters_functions', '$state', 'profile', 'user_profile', 'user_images', 'docslider_service',
        'notifier_service', 'groups', 'events', 'page_modal_service', '$translate', 'modal_service',
        'state_service', '$q', 'community_service',
        function(session, user, school, user_resumes_model, resume_model, countries,
        user_connections, users_posts,  user_model, page_model, social_service, languages,
        filters_functions, $state, profile, user_profile, user_images, docslider_service,
        notifier_service, groups, events, page_modal_service, $translate, modal_service,
        state_service, $q, community_service){

        var ctrl = this;
        state_service.parent_state =  'lms.community';
        ctrl.state = $state;
        document.title = 'TWIC - ' + filters_functions.username(user.datum);
        ctrl.breadcrumb =  [
            { text : 'Explore', href : "lms.community({ category : 'users' })" },
            { text : filters_functions.username(user.datum) }
        ] ;
        ctrl.user = user;
        ctrl.school = school;
        ctrl.events = events;
        ctrl.groups = groups;
        ctrl.me = session.id;
        ctrl.connections = user_connections;
        ctrl.user_model = user_model;
        ctrl.page_model = page_model;
        ctrl.editable = session.roles[1] || user.datum.id === session.id;
        ctrl.page_list = page_model.list;
        ctrl.languages = languages;
        ctrl.countries = countries;
        ctrl.profile = session.roles[1] ? user_profile : profile;
        ctrl.posts = users_posts.getPaginator(user.datum.id);
        ctrl.loadingPosts = true;
        ctrl.posts.get(true).then(function(){
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


        //RESUME
        ctrl.resume_types = resume_model.types;
        ctrl.languageLevels = resume_model.languageLevels;
        ctrl.grade_stars = new Array(5);
        ctrl.filters_functions = filters_functions;

        ctrl.edition_tpl = {
            about : "app/components/profile/tpl/about-edition.html",
            xp : "app/components/profile/tpl/xp-edition.html",
            education : "app/components/profile/tpl/education-edition.html",
            language : "app/components/profile/tpl/language-edition.html",
            volunteer : "app/components/profile/tpl/volunteer-edition.html",
            publication : "app/components/profile/tpl/publication-edition.html",
            project : "app/components/profile/tpl/project-edition.html",
        };

        ctrl.buildResume = function(){
            ctrl.resume = { };
            user_resumes_model.get([user.datum.id]).then(function(){
                resume_model.get(user_resumes_model.list[user.datum.id].datum).then(function(){
                    user_resumes_model.list[user.datum.id].datum.map(function(id){
                        return resume_model.list[id];
                    }).forEach(function(r){
                        if(!ctrl.resume[r.datum.type]){
                            ctrl.resume[r.datum.type] = r.datum.type === 0 ? r : [];
                        }
                        if(r.datum.type !== 0){
                            ctrl.resume[r.datum.type].push(r);
                        }
                    });
                    if(ctrl.resume[1]){
                        ctrl.current_experience = ctrl.resume[1].sort(function(xp1, xp2){
                            if(xp2.datum.end_date === null){
                                return 1;
                            }
                            else if(xp1.datum.end_date === null){
                                return -1;
                            }
                            else{
                                return xp1.datum.end_date < xp2.datum.end_date ? -1 : 1;
                            }
                        })[0];
                    }
                    ctrl.has_no_resume = !Object.keys(ctrl.resume).length;
                });
            });
        };

        ctrl.saveResume = function(resume){
            if(!ctrl.loading){
                ctrl.loading = true;
                resume.start_date = resume.start_date ? filters_functions.dateLabel(resume.start_date) : null;
                resume.end_date = resume.end_date ? filters_functions.dateLabel(resume.end_date) : null;
                (resume.id ? ctrl.profile.updateResume(resume, user.datum.id) : ctrl.profile.addResume(resume, user.datum.id)).then(function(id){
                    ctrl.edited_resume = ctrl.edited_id = null;
                    if(!resume.id){
                        if(!ctrl.resume[resume.type]){
                            if(resume.type === 0){
                                ctrl.resume[resume.type] = resume_model.list[id];
                            }
                            else{
                                ctrl.resume[resume.type] = [];
                            }
                        }
                        if(resume.type !== 0){
                            ctrl.resume[resume.type].push(resume_model.list[id]);
                        }
                    }
                    ctrl.loading = false;

                }, function(){
                    ctrl.loading = false;
                });
            }

        };

        ctrl.deleteResume = function(resume){
            if(!resume.id){
                ctrl.edited_resume = ctrl.edited_id = null;
                return;
            }
            ctrl.profile.deleteResume(resume.id, user.datum.id).then(function(){
                ctrl.edited_resume = ctrl.edited_id = null;
                 if(resume.type === 0){
                    ctrl.resume[resume.type] = null;
                }
                else{
                    ctrl.resume[resume.type] = ctrl.resume[resume.type].filter(function(r){
                        return r.datum.id !== resume.id;
                    });
                }
            });

        };

        ctrl.editResume = function(resume){
            if(ctrl.editable && (resume.id !== ctrl.edited_id || !resume.id)){
                ctrl.edited_resume = angular.copy(resume);
                ctrl.edited_resume.current = !ctrl.edited_resume.end_date;
                ctrl.edited_id = resume.id;
            }
        };

        ctrl.setLanguage = function(language){
            ctrl.edited_resume.title = language.libelle;
            return language.libelle;
        };


        ctrl.searchOrigin = function(search){
            if(!search){
                ctrl.tmpOrigin = null;
                return [];
            }
            else{
                return countries.getList(search);
            }
        };

        ctrl.setOrigin = function(origin){
            ctrl.tmpOrigin = origin;
            return origin.short_name;
        };

           //RESOURCES
        ctrl.loadingDocuments= true;
        ctrl.user_images = user_images.get(user.datum.id);
        ctrl.user_images.get().then(function(){
           ctrl.loadingDocuments = false;
        });
        ctrl.nextDocuments = function(){
            if(ctrl.loadingDocuments){
                return;
            }
            ctrl.loadingDocuments= true;
            var documents_length = ctrl.user_images.list.length;
            return ctrl.user_images.next().then(function(){
                ctrl.loadingDocuments = documents_length === ctrl.user_images.list.length;
            });
        };

        ctrl.openSlider = function( $event, index, token){
            if(index !== null){
                docslider_service.open({ docs : ctrl.user_images.list }, '', $event.target, index + 1);
            }
            else if(token){
                docslider_service.open(
                    { docs : [
                        { name: filters_functions.username(user.datum)+ "'s picture", type : 'image/', token : token }]
                    },'', $event.target, 0);
            }
        };

        ctrl.addDocument = function(files, input){
            user_images.add(ctrl.user.datum.id, files, ctrl.onUploadError).then(function(){
                input.value = null;
            });
        };

        ctrl.deleteDocument = function(id){
            return user_images.remove(ctrl.user.datum.id, id);
        };

        ctrl.onUploadError = function(){
            $translate('ntf.err_file_upload').then(function( translation ){
                notifier_service.add({type:'error',message: translation});
            });
        };

        //EDITION
        ctrl.updateCover = function(blob){
            return ctrl.profile.updateCover(blob, ctrl.user.datum.id);
        };
        ctrl.updateAvatar = function(blob){
            return ctrl.profile.updateAvatar(blob, ctrl.user.datum.id);
        };

        ctrl.updateNickname = function(nickname){
            return ctrl.profile.updateNickname(nickname, ctrl.user.datum.id).then(function(){
                ctrl.editNickname = false;
            });
        };

        ctrl.updateAddress = function(address){
            return ctrl.profile.updateAddress(address, ctrl.user.datum.id).then(function(){
                ctrl.editAddress = false;
            });
        };

        ctrl.updateBirthdate = function(birthdate){
            return ctrl.profile.updateBirthdate(birthdate, user.datum.id).then(function(){
                ctrl.editBirthdate = false;
            });
        };

        ctrl.updateOrigin = function(origin){
            return ctrl.profile.updateOrigin(origin, user.datum.id).then(function(){
                ctrl.editOrigin = false;
            });
        };

        //CONVERSATION
        ctrl.openConversation= function(user){
            social_service.openConversation(null, [user]);
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



        ctrl.createPage = page_modal_service.open;

        ctrl.buildResume();

        //TAGS
        ctrl.setEditableTags = function(){
            ctrl.editTags = ctrl.editable;
            if(!ctrl.user.datum.tags){
              ctrl.user.datum.tags = [];
            }
            ctrl.tmp_tags = ctrl.user.datum.tags.concat();
            ctrl.deletedTag = [];
            ctrl.addedTag = [];
        };

        ctrl.removeTag = function(tag){
            ctrl.tmp_tags.splice( ctrl.tmp_tags.indexOf(tag), 1);
        };

        ctrl.addTag = function( $event, tag){
            if( $event && ($event.keyCode === 13 || $event.keyCode === 32 )){
                $event.stopPropagation();
                $event.preventDefault();

                var tags = (ctrl.input_tag.search||'').match(new RegExp('[A-Za-z0-9_-]+','g'));
                ctrl.input_tag.search = '';
                if( tags && tags.length ){
                    tags.forEach(function(name){
                        if( ctrl.tmp_tags.every(function(tag){ return tag.name!==name; }) ){
                            ctrl.tmp_tags.push({name:name.toLowerCase()});
                        }
                    });
                }
            }
            else if(tag && ctrl.tmp_tags.every(function(t){ return tag.name!==t.name; })){
                ctrl.tmp_tags.push(tag);
                ctrl.input_tag.search = '';
            }
        };

        ctrl.updateTags = function(){
            var deferred = $q.defer(),
                requesting = 1,
                done = function(){
                    requesting--;
                    if( !requesting ){
                        ctrl.editTags = false;
                        deferred.resolve();
                    }
                },
                removed = [], added = [];
            // Build removed tags array
            ctrl.user.datum.tags.forEach(function( tag ){
                if( ctrl.tmp_tags.every(function(t){ return t.name!==tag.name.toLowerCase(); }) ){
                    removed.push(tag);
                }
            });
            // Build added tags array
            ctrl.tmp_tags.forEach(function(tag){
                if( ctrl.user.datum.tags.every(function(t){ return t.name.toLowerCase()!==tag.name; }) ){
                    added.push(tag.name);
                }
            });
            added.forEach(function(name){
                requesting++;
                ctrl.profile.addTag(ctrl.user.datum.id, name).finally(done);
            });
            removed.forEach(function(tag){
                requesting++;
                ctrl.profile.removeTag(ctrl.user.datum.id, tag).finally(done);
            });

            done();
            return deferred.promise;
        };


        ctrl.searchTags = function(search){
            return community_service.tags(
              search,
              ctrl.tmp_tags.map(function(t){ return t.name;})
            );
        };

    }
]);
