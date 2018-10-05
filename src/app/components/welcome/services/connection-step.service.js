angular.module('welcome')
  .factory('ConnectionStep',['WelcomeStep','user_model', 'session', 'community_service', 'connections',
      function(WelcomeStep, user_model, session, community_service, connections){


          var step = function(){};
          step.prototype = new WelcomeStep(
                  "Start building your network!",
                  "Add connections",
                  "Invite people to join your network.",
                  "app/components/welcome/tpl/suggestions.html",
                  {
                      count : 0,
                      total : 0,
                      pagination : { n : 20, p : 1 },
                      selected : {},
                      next : function(){
                          if(!this.loading && !this.ended){
                              this.loading = true;
                              this.pagination.p++;
                              return community_service.users(
                                  null,
                                  this.pagination.p,
                                  this.pagination.n,
                                  [session.id], null, null, null, null, { type : 'affinity' },
                                  0)
                                  .then(function(users){
                                      this.suggestions = this.suggestions.concat(users.list);
                                      this.loading = false;
                                      this.ended = users.list.length < this.pagination.n;
                              });
                          }
                      },
                     onComplete : function(){
                          return true;
                      },
                      isCompleted : function(){
                          return connections.load().then(function(){
                              return connections.connecteds.length + connections.requesteds.length >= 10;
                          });
                      },
                      addConnection : function(user_id){
                          if(!this.selected[user_id]){
                              this.count++;
                              this.selected[user_id] = true;
                              connections.request( user_id );
                          }
                          else{
                              this.count--;
                              this.selected[user_id] = false;
                              connections.remove( user_id );
                          }
                      },
                      fill : function(){
                          this.count = connections.connecteds.length + connections.requesteds.length;
                          this.total = (connections.connecteds.length + connections.requesteds.length) > 10 ? 1 : 10;
                          if(!this.initialized){
                              return community_service.users(
                                  null,
                                  this.pagination.p,
                                  this.pagination.n,
                                  [session.id], null, null, null, null, { type : 'affinity' },
                                  0)
                                  .then(function(users){
                                    this.suggestions = users.list;
                              }.bind(this));
                          }
                          else{
                              var deferred = $q.defer();
                              deferred.resolve(true);
                              return deferred.promise;
                          }
                      }
              });

              return step;


      }]);
