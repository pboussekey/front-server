
angular.module('customElements')
    .directive('pageBox',['page_model', 'user_model', 'puadmin_model',
        function( page_model, user_model, puadmin_model ){
            return {
                restrict:'A',
                scope:{
                    id:'=pageBox',
                },
                link: function( scope ){
                    scope.users = [];
                    page_model.queue([scope.id]).then(function(){                        
                        scope.model = page_model.list[scope.id];
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