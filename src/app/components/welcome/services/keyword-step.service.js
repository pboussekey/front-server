angular.module('welcome')
  .factory('keyword_step',['WelcomeStep','user_model', 'session', 'user_tags', 'tags_constants', 'community_service', 'languages',
      function(WelcomeStep, user_model, session, user_tags, tags_constants, community_service, languages){


          return new WelcomeStep(
              "Tell your peers about yourself!",
              "Profile",
              null,
              "app/components/welcome/tpl/keywords.html",
              101,
              {
                  tags : {},
                  input_tags : {},
                  editTags : {},
                  hasTag : function(name, category){
                      return this.tags && this.tags[category]
                          .some(function(t){ return this.areEquals(t, name); });
                  },

                 areEquals : function(tag1, tag2){
                    return tag1.toLowerCase().replace(/\s/g, "") === tag2.toLowerCase().replace(/\s/g, "");
                 },
                 setEditableTags : function(category){
                     angular.forEach(tags_constants.categories, function( category, key ){
                         this.editTags[category] = false;
                     });
                     this.editTags[category] = true;
                 },
                 isCompleted : function(){
                      return user_model.queue([session.id]).then(function(){
                          return user_model.list[session.id].datum.tags.length > 4;
                      });
                    },
                 onComplete : function(){
                    var index = this.categories.indexOf(this.category) + 1;
                    if(index >= this.categories.length){
                        service.nextStep();
                    }
                    else{
                       this.category = this.categories[index];
                    }
                  },
                  fill : function(){
                      this.categories = Object.keys(tags_constants.categories);
                      this.category = this.categories[0];
                      this.constants = tags_constants;
                      this.search = {};
                      this.add = {};
                      this.tags_list = [];
                      angular.forEach(tags_constants.categories, function( category, key ){
                          this.search[key] = function(search){
                              return this.searchTags(search, category);
                          };
                          this.add[key] = function($event, tag){
                              if(!$event || $event.keyCode === 13){
                                  this.addTag($event, tag ? (tag.name || tag.libelle) : null, category);
                              }
                          };
                      }.bind(this));
                      this.search.LANGUAGE = languages.getList;
                      return user_tags.getList(session.id).then(function(tags){
                          this.tags = angular.copy(tags);
                          return true;
                      }.bind(this));


                  },
                  searchTags : function(search, category){
                    return community_service.tags(
                      search,
                      category,
                      1,
                      5,
                      this.tags[category]
                    );
                  },
                  searchLanguages : languages.getList,
                  addTag : function( $event, tag, category){
                      if( $event && $event.keyCode === 13 && !ctrl.tags_list.length){
                          $event.stopPropagation();
                          $event.preventDefault();
                          tag =  ctrl.input_tags[category].search;

                      }
                      if( tag.length && !this.tags.hasTag(name, category)){
                          $timeout(function(){
                              this.tags.input_tags[category].search = '';
                              this.tags[category].push(name);
                          });
                      }
                  },
                  removeTag : function(tag, category){
                      this.tags[category].splice( this.tags[category].indexOf(tag), 1);
                  }
              }
          );


      }
  ]);
