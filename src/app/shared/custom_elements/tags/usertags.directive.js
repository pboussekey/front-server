
angular.module('customElements')
    .directive('usertags',['user_model', 'tags_constants', 'session',
        function( user_model, tags_constants, session ){
            return {
                restrict:'A',
                scope:{
                    user:'=usertags'
                },
                link: function( scope ){

                    user_model.queue([scope.user, session.id]).then(function(){
                        var user = user_model.list[scope.user].datum;
                        scope.nbr_tags = user.tags.length;
                        scope.tags = {};
                        scope.my_tags = user_model.list[session.id].datum.tags.map(function(tag){
                            return tag.name;
                        });
                        scope.icons = tags_constants.icons;
                        angular.forEach(tags_constants.categories, function( category, key ){
                            var tags = user.tags.filter(function(tag){
                                return tag.category === category;
                            });
                            if(tags.length){
                              scope.tags[key] = tags;
                            }
                        });
                    });
                },
                transclude: true,
                templateUrl: 'app/shared/custom_elements/tags/usertags.html'
            };
        }
    ]);
