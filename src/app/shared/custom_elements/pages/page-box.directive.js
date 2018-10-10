
angular.module('customElements')
    .directive('pageBox',['page_model', 'user_model', 'puadmin_model', 'pages_config', 'session',
        function( page_model, user_model, puadmin_model, pages_config, session ){
            return {
                restrict:'A',
                scope:{
                    id:'=pageBox',
                },
                link: function( scope ){
                    scope.users = [];
                    page_model.queue([scope.id]).then(function(){
                        scope.model = page_model.list[scope.id];
                        scope.type = scope.model.datum.type === 'group' ?'page':scope.model.datum.type;
                        scope.icon = pages_config[scope.model.datum.type].fields.logo.icon;
                    });
                    console.log("PUADMIN GET", angular.copy(scope.id));
                    puadmin_model.queue([scope.id]).then(function(){
                        user_model.queue(puadmin_model.list[scope.id].datum).then(function(){
                            scope.users = puadmin_model.list[scope.id].datum;
                            var index = scope.users.indexOf(session.id);
                            scope.nb_others = scope.users.length - 1;
                            if(index >= 0){
                               scope.you = true;
                            }
                        });
                    });
                    scope.user_model = user_model.list;
                },
                transclude: true,
                templateUrl: 'app/shared/custom_elements/pages/page-box.html'
            };
        }
    ]);
