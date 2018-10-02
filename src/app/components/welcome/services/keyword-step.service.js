angular.module('welcome')
  .factory('keyword_step',['WelcomeStep','user_model', 'session', 'user_tags', 'tags_constants', 'community_service', 'languages',
      function(WelcomeStep, user_model, session, user_tags, tags_constants, community_service, languages){


          return new WelcomeStep(
              "Tell your peers about yourself!",
              "Profile",
              null,
              "app/components/welcome/tpl/keywords.html",
              110,
              {
                  suggestions : {},
                  tags : {},
                  match : "",
                  toggleTag : function(name, category){
                      var index = this.tags[category].indexOf(name);
                      if(index === -1){
                          this.tags[category].push(name);
                      }
                      else{
                         this.tags[category].splice(index, 1);
                      }
                  },
                  isMatching : function(name, search){
                        return !search || name.toLowerCase().replace(/\s/g, "").indexOf(search.toLowerCase().replace(/\s/g, "")) !== -1;
                  },
                  hasTag : function(name, category){
                      return this.tags && this.tags[category]
                          .some(function(t){ return this.areEquals(t, name); }.bind(this));
                  },

                 areEquals : function(tag1, tag2){
                    return tag1.toLowerCase().replace(/\s/g, "") === tag2.toLowerCase().replace(/\s/g, "");
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
                      angular.forEach(tags_constants.categories, function( category ){
                          this.search[category] = function(search, filters){
                              return this.searchTags(search, category, filters);
                          }.bind(this);
                          this.add[category] = function($event, tag){
                              if(!$event || $event.keyCode === 13){
                                  this.addTag($event, tag ? (tag.name || tag.libelle) : null, category);
                              }
                          }.bind(this);
                          this.search[category](null, category, { n : 50, p : 1 }).then(function(tags){
                              this.suggestions[category] = tags.map(function(t){
                                return t.name;
                              }.bind(this)).concat(this.constants.suggestions[category]).filter((tag, i, tags) => tags.indexOf(tag) === i);
                          }.bind(this));
                      }.bind(this));
                      this.search.language = languages.getList;
                      return user_tags.getList(session.id).then(function(tags){
                          this.tags = angular.copy(tags);
                          return true;
                      }.bind(this));


                  },
                  searchTags : function(search, category, filters){
                    return community_service.tags(
                      search,
                      category,
                      filters ? filters.p : 1,
                      filters ? filters.n : 5,
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
