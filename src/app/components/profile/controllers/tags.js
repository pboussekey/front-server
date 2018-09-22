angular.module('profile').controller('tags_controller',
    ['session', 'user', 'user_model', 'page_model',  'languages',
        'filters_functions', '$state', 'profile', 'user_profile',
        'state_service', '$q', 'community_service', '$timeout',
        'global_search', 'tags_constants',
        function(session, user,  user_model, page_model, languages,
        filters_functions, $state, profile, user_profile,
        state_service, $q, community_service, $timeout,
        global_search, tags_constants){

        var ctrl = this;
        ctrl.user = user;
        ctrl.constants = tags_constants;
        ctrl.me = session.id;
        ctrl.user_model = user_model;
        ctrl.page_model = page_model;
        ctrl.editable = session.roles[1] || user.datum.id === session.id;
        ctrl.languages = languages;
        ctrl.profile = session.roles[1] ? user_profile : profile;
        state_service.parent_state =  'lms.community';
        ctrl.state = $state;
        ctrl.tmp_description = null;
        ctrl.profile.getDescription(ctrl.user.datum.id).then(function(description){
          ctrl.description = description;
        });
        document.title = 'TWIC - ' + filters_functions.username(user.datum);
        ctrl.breadcrumb =  [
            { text : 'Discover', href : "lms.community({ category : 'users' })" },
            { text : filters_functions.username(user.datum) }
        ] ;


        //TAGS
        user_model.queue([session.id]).then(function(){
            ctrl.tags = user_model.list[session.id].datum.tags.map(function(tag){ return tag.name; });
        });

        ctrl.getTags = function(category){
          return ctrl.user.datum.tags.filter(function(t){ return t.category === category;});
        };

        ctrl.tmp_tags = {};
        ctrl.editTags = {  };
        ctrl.setEditableTags = function(category){
            angular.forEach(tags_constants.categories, function( category, key ){
                ctrl.editTags[category] = false;
            });
            ctrl.editTags[category] = ctrl.editable;
            ctrl.tmp_tags = ctrl.user.datum.tags.filter(function(tag){ return tag.category === category; });
        };

        ctrl.removeTag = function(tag, category){
            ctrl.tmp_tags.splice( ctrl.tmp_tags.indexOf(tag), 1);
            ctrl.tags.splice( ctrl.tags.indexOf(tag), 1);
            ctrl.profile.removeTag(ctrl.user.datum.id, tag).finally(function(){
                ctrl.tags = user_model.list[session.id].datum.tags.map(function(tag){ return tag.name; });
            });
        };

        ctrl.input_tags = {};
        ctrl.tmp_tags = [];
        ctrl.addTag = function( $event, name, category){
            ctrl.tags.push(name);
            if( $event && $event.keyCode === 13 && !ctrl.tags_list.length){
                $event.stopPropagation();
                $event.preventDefault();
                tag = { name: ctrl.input_tags[category].search, category : category};

            }
            else if(!$event){
                  tag = { name : name, category : category  };
            }
            if( tag.name.length && ctrl.tmp_tags.every(function(t){ return areDifferent(t, tag); })){
                  $timeout(function(){
                      ctrl.input_tags[category].search = '';
                      ctrl.tmp_tags.push(tag);
                      ctrl.profile.addTag(ctrl.user.datum.id, tag.name, tag.category).finally(function(){
                          ctrl.tags = user_model.list[session.id].datum.tags.map(function(tag){ return tag.name; });
                      });
                  });
            }
        };

        ctrl.searchTag = function(tag){
            if(ctrl.editable) return;
            global_search.search =  tag;
            $state.go("lms.community", { category : 'users'});
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

        ctrl.search = {};
        ctrl.add = {};
        angular.forEach(tags_constants.categories, function( category, key ){
            ctrl.search[key] = function(search){
                return ctrl.searchTags(search, category);
            };
            ctrl.add[key] = function($event, tag){
                if(!$event || $event.keyCode === 13){
                    ctrl.addTag($event, tag ? (tag.name || tag.libelle) : null, category);
                }
            };
        });

        ctrl.search.LANGUAGE = languages.getList;


       function areDifferent(tag1, tag2){
          return tag1.category !== tag2.category
              || tag1.name.toLowerCase().replace(/\s/g, "") !== tag2.name.toLowerCase().replace(/\s/g, "");
       }


    }
]);
