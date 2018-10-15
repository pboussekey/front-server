
angular.module('customElements')
    .directive('usercard',['user_model', 'page_model', 'user_tags', 'session', 'tags_constants',
        function( user_model, page_model, user_tags, session, tags_constants ){
            return {
                restrict:'A',
                scope:{
                    id:'=usercard',
                    links: '=userLinks', // user-links
                    graduation: '='
                },
                link: function( scope ){
                    scope.icons = tags_constants.icons;
                    user_model.queue([scope.id, session.id]).then(function(){
                        scope.model = user_model.list[scope.id];
                        scope.me = user_model.list[session.id];
                        scope.tags = scope.model.datum.tags.sort(function(tag1, tag2){
                            console.log(tag1.name, tag1.name, scope.me.datum.tags.map(function(t){ return t.name; }));
                            return scope.me.datum.tags.map(function(t){ return t.name; }).indexOf(tag1.name) <
                                   scope.me.datum.tags.map(function(t){ return t.name; }).indexOf(tag2.name);
                        });
                        console.log(scope.model.datum.tags, scope.me.datum.tags);
                        var organization = user_model.list[scope.id].datum.organization_id;
                        if(organization){
                            page_model.queue([organization]).then(function(){
                                scope.organization = page_model.list[organization];
                            });
                        }
                    });
                },
                transclude: true,
                templateUrl: 'app/shared/custom_elements/user/user.html'
            };
        }
    ]);
