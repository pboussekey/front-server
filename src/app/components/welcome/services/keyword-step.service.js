angular.module('welcome')
  .factory('KeywordStep',['WelcomeStep','user_model', 'session', 'user_tags', 'tags_constants', 'community_service', 'languages',
      function(WelcomeStep, user_model, session, user_tags, tags_constants, community_service, languages){
            var step = function(category){
                this.category = category;
            };

            step.prototype = new WelcomeStep(
                  "Tell your peers about yourself!",
                  "Profile",
                  null,
                  "app/components/welcome/tpl/keywords.html",
                  {
                      suggestions : [],
                      tags : [],
                      match : "",
                      constants : tags_constants,
                      tagsRequired : function(){
                          return this.category === tags_constants.categories.language ? 1 : 2;
                      },
                      toggleTag : function(name){
                          var index = this.tags.indexOf(name);
                          if(index === -1){
                              this.tags.push(name);
                              user_tags.add(session.id, name, this.category);

                          }
                          else{
                             this.tags.splice(index, 1);
                             user_tags.remove(session.id, name, this.category);
                           }
                           this.completed = this.tags.length >= this.tagsRequired();
                      },
                      isMatching : function(name, search){
                            return !search || name.toLowerCase().replace(/\s/g, "").indexOf(search.toLowerCase().replace(/\s/g, "")) !== -1;
                      },
                      hasTag : function(name){
                          return this.tags && this.tags
                              .some(function(t){ return this.areEquals(t, name); }.bind(this));
                      },
                      isSuggested : function(name){
                          return this.suggestions && this.suggestions
                              .some(function(t){ return this.areEquals(t, name); }.bind(this));
                      },
                     areEquals : function(tag1, tag2){
                        return tag1.toLowerCase().replace(/\s/g, "") === tag2.toLowerCase().replace(/\s/g, "");
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
                      addTag : function( $event, name){
                          if( $event && $event.keyCode === 13){
                              $event.stopPropagation();
                              $event.preventDefault();

                              if(!this.isSuggested(name)){
                                  this.suggestions.unshift(name);
                              }
                              this.tags.push(name);
                              user_tags.add(session.id, name, this.category);
                          }
                      },
                      getNextLabel : function(){
                          var tags_required = this.tagsRequired();
                          return  this.tags.length >= tags_required ? "Next" : this.tags.length + "/" + tags_required;
                      }
            });

            step.prototype.fill = function(){
                this.scope.category = this.category;
                return this.scope.searchTags(null, this.category, { n : 50, p : 1 }).then(function(tags){

                     this.scope.suggestions = tags.map(function(t){
                       return t.name;
                     }.bind(this)).concat(tags_constants.suggestions[this.category]).filter(function(tag, i, tags){ return tags.indexOf(tag) === i });

                     return user_tags.getList(session.id).then(function(tags){
                         this.scope.tags = angular.copy(tags[this.category]);
                         return true;
                     }.bind(this));

                 }.bind(this));

            };

            step.prototype.isCompleted = function(){
                 return user_tags.getList([session.id]).then(function(tags){
                       return tags[this.category].length >= this.scope.tagsRequired();
                 }.bind(this));
             }
            return step;


      }
  ]);
