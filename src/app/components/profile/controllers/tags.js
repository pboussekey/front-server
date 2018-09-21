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

                var tags = (ctrl.input_tags[category].search.toLowerCase()||'').match(new RegExp('[A-Za-z0-9_-]+','g'));
                ctrl.input_tags[category].search = '';
                if( tags && tags.length ){
                    tags.forEach(function(t){
                        if( ctrl.tmp_tags
                            .filter(function(tag){ return tag.category === category; })
                            .every(function(tag){ return tag.name !== t; }) ){
                              $timeout(function(){
                                  ctrl.tmp_tags.push({name:t, category : category});
                              });
                        }
                    });
                }
            }
            else if(!$event){

                  var tag = { name : (tag.libelle || tag.name).toLowerCase()  };
                  if(ctrl.tmp_tags
                      .filter(function(t){ return t.category === category; })
                      .every(function(t){ return tag.name.toLowerCase() !== t.name; }) ){
                        $timeout(function(){
                            ctrl.tmp_tags.push({name: tag.name, category : category });
                            ctrl.input_tags[category].search = '';
                        });
                  }
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
                return ctrl.addTag($event, tag, category);
            };
        });

        ctrl.search.LANGUAGE = languages.getList;

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

    }
]);
