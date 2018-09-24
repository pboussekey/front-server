angular.module('profile').controller('profile_controller',
    ['session', 'user', 'school', 'countries',
        'user_connections', 'users_posts', 'user_model', 'page_model', 'social_service', 'languages',
        'filters_functions', '$state', 'profile', 'user_profile', 'user_images', 'docslider_service',
        'notifier_service', 'pages', 'events', 'page_modal_service', '$translate', 'modal_service',
        'state_service', '$q', 'community_service', '$timeout', 'global_search', 'tags_constants',
        'global_loader',
        function(session, user, school, countries,
        user_connections, users_posts,  user_model, page_model, social_service, languages,
        filters_functions, $state, profile, user_profile, user_images, docslider_service,
        notifier_service, pages, events, page_modal_service, $translate, modal_service,
        state_service, $q, community_service, $timeout, global_search, tags_constants, global_loader){

        var ctrl = this;
        state_service.parent_state =  'lms.community';
        ctrl.state = $state;
        document.title = 'TWIC - ' + filters_functions.username(user.datum);
        ctrl.breadcrumb =  [
            { text : 'Discover', href : "lms.community({ category : 'users' })" },
            { text : filters_functions.username(user.datum) }
        ] ;
        ctrl.global_loader = global_loader;
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
        ctrl.current_year = new Date().getFullYear();

        global_loader.loading('profile_posts');
        ctrl.posts.get(true).then(function(){
            global_loader.done('profile_posts');
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
        global_loader.loading('profile_resources');
        ctrl.user_images.get().then(function(){
            global_loader.done('profile_resources');
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
            var previous = ctrl.user.datum.address;
            ctrl.user.datum.address = address;
            ctrl.editAddress = false;
            return ctrl.profile.updateAddress(address, ctrl.user.datum.id).catch(function(){
                ctrl.user.datum.address = previous;
            });
        };

        ctrl.updateGraduation = function(graduation_year){
            var previous = ctrl.user.datum.graduation_year;
            ctrl.user.datum.graduation_year = graduation_year;
            ctrl.editGraduation = false;
            return ctrl.profile.updateGraduation(graduation_year, ctrl.user.datum.id).catch(function(){
                ctrl.user.datum.graduation_year = previous;
            });
        };

        ctrl.updateWebsite = function(url){
              var previous = ctrl.user.datum.linkedin_url;
              ctrl.user.datum.linkedin_url = url;
                  ctrl.editWebsite = false;
              return ctrl.profile.updateWebsite(url, ctrl.user.datum.id).catch(function(){
                  ctrl.user.datum.linkedin_url = previous;
              });
        };

        ctrl.updateBirthdate = function(birthdate){
            var previous = ctrl.user.datum.birth_date;
            ctrl.user.datum.birth_date = birthdate;
            ctrl.editBirthdate = false;
            return ctrl.profile.updateBirthdate(birthdate, ctrl.user.datum.id).catch(function(){
                ctrl.user.datum.birth_date = previous;
            });
        };

        ctrl.updateOrigin = function(origin){
            var previous = ctrl.user.datum.origin;
            ctrl.user.datum.origin = origin;
            ctrl.editOrigin = false;
            return ctrl.profile.updateOrigin(origin , ctrl.user.datum.id).catch(function(){
                ctrl.user.datum.origin = previous;
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


    }
]);
