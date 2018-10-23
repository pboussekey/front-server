angular.module('page').controller('page_feed_controller',
    ['$scope','session', 'page', 'pages_posts', 'showContent',
        function($scope, session, page, pages_posts, showContent){
            var ctrl = this;

            //POSTS
            ctrl.loadingPosts = true;
            ctrl.posts = pages_posts.getPaginator(page.datum.id);
            ctrl.posts.get().then(function(){
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

            ctrl.onPostDeleted = function( postId ){
                ctrl.posts.unset( postId );
            };
            ctrl.onPostAdded = function( ){
                ctrl.posts.refresh();
            };

        }
    ]);
