
angular.module('customElements')
    .directive('pageBox',['page_model', 'user_model', 'puadmin_model', 'pages_config',
        function( page_model, user_model, puadmin_model, pages_config ){
            return {
                restrict:'A',
                scope:{
                    id:'=pageBox',
                },
                link: function( scope ){
                    scope.users = [];
                    page_model.queue([scope.id]).then(function(){                        
                        scope.model = page_model.list[scope.id];
                        scope.type = scope.model.datum.type === 'group' ?'club':scope.model.datum.type;
                        scope.icon = pages_config[scope.model.datum.type].fields.logo.icon;
                    });                   
                    puadmin_model.queue([scope.id]).then(function(){ 
                        user_model.queue(puadmin_model.list[scope.id].datum).then(function(){
                            scope.users = puadmin_model.list[scope.id].datum;
                        });
                    });
                    scope.user_model = user_model.list;
                },
                transclude: true,
                templateUrl: 'app/shared/custom_elements/pages/page-box.html'
            };
        }
    ]);