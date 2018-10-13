
angular.module('customElements')
    .directive('user',['user_model', 'page_model',
        function( user_model, page_model ){
            return {
                restrict:'A',
                scope:{
                    id:'=user',
                    links: '=userLinks', // user-links
                    graduation: '='
                },
                link: function( scope ){
                    scope.model = user_model.list;
                    scope.organizations = page_model.list;
                    user_model.queue([scope.id]).then(function(){
                        if(user_model.list[scope.id].datum.organization_id){
                            page_model.queue([user_model.list[scope.id].datum.organization_id]);
                        }
                    });
                },
                transclude: true,
                templateUrl: 'app/shared/custom_elements/user/template.html'
            };
        }
    ]);
