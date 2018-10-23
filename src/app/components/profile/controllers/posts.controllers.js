angular.module('profile').controller('profile_posts_controller',
    ['user', 'users_posts',
        function( user, users_posts){

        var ctrl = this;

        ctrl.posts = users_posts.getPaginator(user.datum.id);
        ctrl.loadingPosts = true;

        ctrl.posts.get(true).then(function(){
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


    }
]);
