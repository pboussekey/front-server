angular.module('customElements')
    .directive('suggestionsBox',['user_model', 'connections', '$translate', 'notifier_service', 'community_service',
            function(user_model, connections, $translate, notifier_service, community_service){

            return {
                restrict:'E',
                scope:{

                },
                link: function( scope, element ){
                      scope.ew = 109;
                      scope.list = [];
                      scope.loaded = 0;
                      scope.added = [];
                      scope.random = [parseInt(Math.random() * 12), parseInt(Math.random() * 12), parseInt(Math.random() * 12), parseInt(Math.random() * 12), parseInt(Math.random() * 12), parseInt(Math.random() * 12), parseInt(Math.random() * 12)]
                      scope.users = user_model.list;
                      user_model.queue(scope.list);
                      scope.page = 0;
                      scope.padding = 0;
                      function checkWidth(){
                          scope.width = element[0].clientWidth;
                          scope.nb_element = parseInt(scope.width / scope.ew);
                      }

                      function loadPage(page){
                          if(scope.loaded < scope.nb_element * (page + 2)){
                              community_service.users(null, page + 1, scope.nb_element * 2, null, null, null, null, null, { type : 'affinity' }, 0).then(function(users){
                                  scope.list_width = users.count;
                                  users.list.forEach(function(uid, index){
                                      scope.list.splice(page * scope.nb_element + index, 1, uid);
                                  });
                                  user_model.queue(users.list);
                                  scope.max_page = parseInt(scope.list_width / scope.nb_element);
                                  scope.loaded = scope.nb_element * (page + 1);
                              });
                          }

                      }

                      scope.nextPage = function(){
                          scope.page = Math.min(scope.max_page, scope.page + 1);
                          scope.padding = scope.page > 0 ? 10 : 0;
                          checkWidth();
                          loadPage(scope.page);
                      };

                      scope.previousPage = function(){
                          checkWidth();
                          scope.padding = scope.page > 0 ? 10 : 0;
                          scope.page = Math.max(0, scope.page - 1);
                      };

                      scope.add = function(id){
                          scope.added.push(id);
                          checkWidth();
                          connections.request(id).then(function(){
                              loadPage(scope.page);
                              $translate('ntf.co_req_sent').then(function( translation ){
                                  notifier_service.add({type:"message",message: translation});
                              });
                          }, function(){
                              scope.added.splice(scope.added.indexOf(id), 1,);
                          });
                      };

                      checkWidth();
                      loadPage(0);
                },
                transclude: true,
                templateUrl: 'app/shared/custom_elements/suggestions-box/suggestions_box.html'
            };
        }
    ]);
