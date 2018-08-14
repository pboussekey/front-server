angular.module('profile').controller('profile_controller',
    ['session', 'user', 'school', 'countries',
        'user_connections', 'users_posts', 'user_model', 'page_model', 'social_service', 'languages',
        'filters_functions', '$state', 'profile', 'user_profile', 'user_images', 'docslider_service',
        'notifier_service', 'pages', 'events', 'page_modal_service', '$translate', 'modal_service',
        'state_service', '$q', 'community_service', '$timeout', 'global_search',
        function(session, user, school, countries,
        user_connections, users_posts,  user_model, page_model, social_service, languages,
        filters_functions, $state, profile, user_profile, user_images, docslider_service,
        notifier_service, pages, events, page_modal_service, $translate, modal_service,
        state_service, $q, community_service, $timeout, global_search){

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
        ctrl.pages = pages;
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
        ctrl.profile.getDescription(ctrl.user.datum.id).then(function(description){
          ctrl.description = description;
        });
        ctrl.tmp_description = null;
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

        //Description
        ctrl.saveDescription = function(){
          ctrl.profile.update({ id : ctrl.user.datum.id, description : ctrl.tmp_description}).then(function(){
            ctrl.description = ctrl.tmp_description;
            ctrl.tmp_description = null;
          });
        };
        //TAGS
        user_model.queue([session.id]).then(function(){
            ctrl.tags = user_model.list[session.id].datum.tags.map(function(tag){ return tag.name; });
        });

        ctrl.getTags = function(category){
          return ctrl.user.datum.tags.filter(function(t){ return t.category === category;});
        };

        ctrl.tmp_tags = {};
        ctrl.setEditableTags = function(category){
            ctrl.editTags = { expertise : false, interest : false, language : false };
            ctrl.editTags[category] = ctrl.editable;
            ctrl.tmp_tags = ctrl.user.datum.tags.filter(function(tag){ return tag.category === category; });
            ctrl.deletedTag = [];
            ctrl.addedTag = [];
        };

        ctrl.removeTag = function(tag){
            ctrl.tmp_tags.splice( ctrl.tmp_tags.indexOf(tag), 1);
        };
        ctrl.input_tags = {};
        ctrl.addTag = function( $event, tag, category){
            if( $event && ($event.keyCode === 13) && !ctrl.tags_list.length){
                $event.stopPropagation();
                $event.preventDefault();

                var tags = (ctrl.input_tags[category].search||'').match(new RegExp('[A-Za-z0-9_-]+','g'));
                ctrl.input_tags[category].search = '';
                if( tags && tags.length ){
                    tags.forEach(function(name){
                        if( ctrl.tmp_tags
                            .filter(function(tag){ return tag.category === category; })
                            .every(function(tag){ return tag.name!==name; }) ){
                              $timeout(function(){
                                ctrl.tmp_tags.push({name:name.toLowerCase(), category : category});
                              });
                        }
                    });
                }
            }
            else if(tag && ctrl.tmp_tags.every(function(t){ return tag.name!==t.name; })){
                tag.category = category;
                ctrl.tmp_tags.push(tag);
                ctrl.input_tags[category].search = '';
            }
        };
        ctrl.searchTag = function(tag){
            if(ctrl.editable) return;
            global_search.search = ((global_search.search || "") + " " + tag).trim();
            $state.go("lms.community", { category : 'users'});
        };

        ctrl.addExpertise = function($event, tag){
          ctrl.addTag($event, tag, 'expertise');
        };
        ctrl.addInterest = function($event, tag){
          ctrl.addTag($event, tag, 'interest');
        };
        ctrl.addLanguage = function($event, tag){
          tag = { name : tag.libelle.toLowerCase() };
          ctrl.addTag($event, tag, 'language');
        };

        ctrl.updateTags = function(category){
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
                if(tag.category === category &&  ctrl.tmp_tags.every(function(t){
                  return t.name!==tag.name.toLowerCase(); }) ){
                    removed.push(tag);
                }
            });
            // Build added tags array
            ctrl.tmp_tags.forEach(function(tag){
                if( ctrl.user.datum.tags.every(function(t){ return t.name.toLowerCase()!==tag.name; }) ){
                    added.push(tag);
                }
            });
            added.forEach(function(tag){
                requesting++;
                ctrl.profile.addTag(ctrl.user.datum.id, tag.name, tag.category).finally(done);
            });
            removed.forEach(function(tag){
                requesting++;
                ctrl.profile.removeTag(ctrl.user.datum.id, tag).finally(done);
            });

            done();
            return deferred.promise;
        };

        ctrl.searchTags = function(search, category){
            return community_service.tags(
              search,
              category,
              1,
              5,
              ctrl.tmp_tags.map(function(t){ return t.name;})
            );
        };

        ctrl.searchExpertise = function(search){
          return ctrl.searchTags(search, 'expertise');
        };

        ctrl.searchInterest = function(search){
          return ctrl.searchTags(search, 'interest');
        };

    }
]);
