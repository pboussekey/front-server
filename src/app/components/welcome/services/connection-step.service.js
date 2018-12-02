angular.module('welcome')
  .factory('ConnectionStep',['WelcomeStep','user_model', 'session', 'community_service', 'connections', '$q',
      function(WelcomeStep, user_model, session, community_service, connections, $q){


          var step = function(){};
          step.prototype = new WelcomeStep(
                  "Last but not least...",
                  "Network is key. Start building yours!<br/>Connect with your fellow peers, classmates and create more opportunities",
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
                              return connections.followings.length + connections.followings.length >= 5;
                          });
                      },
                      fill : function(){
                          this.completed = true;
                          return true;
                      },
                      getNextLabel : function(){
                          return "Finish";
                      }
              });

              return step;


      }]);
