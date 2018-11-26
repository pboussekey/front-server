angular.module('customElements').controller('group_post_controller',
    ['$scope','user_model','page_model', 'items_model','session', '$q', 'social_service', 'users_status', 'tracker_service', '$state',
        function( $scope, user_model, page_model, items_model, session, $q, social_service, users_status, tracker_service, $state ){


            $scope.users = user_model.list;
            $scope.pages = page_model.list;
            $scope.items = items_model.list;
            $scope.me = session;
            $scope.users_status = users_status;

            var ctrl = this,post = $scope.p;
            ctrl.loaded = false;
            var watchuser= users_status.watch(post.datum.data.users);


            ctrl.openChat = function( user_ids ){
                ctrl.track(user_ids.length === post.datum.data.users ? 'group.chat' : 'usergroup.chat', user_ids);
                social_service.openConversation( undefined, angular.copy(user_ids) );
            };

            ctrl.view = function(){
                ctrl.track('group.view');
                $state.go('lms.page.content', {id:post.datum.page_id,type:'course',item_id:post.datum.data.item });
            };

            ctrl.track = function(type, data){
                tracker_service.register([{
                    event:type,
                    date:(new Date()).toISOString(),
                    object: Object.assign(post.datum.data, data)
                }]);
            };
            // --- BUILD --- \\
            function build(){
                var promises = [];
                promises.push(
                  user_model.queue(post.datum.data.users).then(function(){
                     var organizations = post.datum.data.users.map(function(uid){
                        return user_model.list[uid].datum.organization_id;
                     });
                     return page_model.queue(organizations);
                }));
                promises.push(page_model.queue([post.datum.t_page_id]));
                promises.push(items_model.queue([post.datum.data.item]));
                $q.all(promises).then(function(){
                  ctrl.loaded = true;
                });
            }

            build();
            $scope.$on('$destroy',function(){
                users_status.unwatch(watchuser);
            });

        }
    ]);
