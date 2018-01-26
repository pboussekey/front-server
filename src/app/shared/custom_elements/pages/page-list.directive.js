
angular.module('customElements')
    .directive('pageList',['page_model', 'user_model', 'puadmin_model', 'page_modal_service', 'pages_config',
        function( page_model, user_model, puadmin_model, page_modal_service, pages_config ){
            return {
                restrict:'A',
                scope:{
                    service: '=plService',
                    pages:'=pageList',
                    type : '@pageType',
                    user : '=userId',
                    pageCreate : '='
                },
                link: function( scope ){
                    scope.loading = 2;
                    scope.label = pages_config[scope.type].label;
                    scope.icon = pages_config[scope.type].fields.logo.icon;
                    page_model.queue(scope.pages).then(function(){
                        scope.loading--;
                    });
                    puadmin_model.queue(scope.pages).then(function(){
                        user_model.queue(scope.pages.reduce( function(users, page){
                            return users.concat(puadmin_model.list[page].datum);
                        }, [])).then(function(){
                            scope.loading--;
                        });
                    });
                    scope.openPageModal = function($event, type, page){
                        page_modal_service.open( $event, type, page);
                    };
                    scope.user_model = user_model.list;
                    scope.puadmin_model = puadmin_model.list;
                    scope.page_model = page_model.list;
                },
                transclude: true,
                templateUrl: 'app/shared/custom_elements/pages/page-list.html'
            };
        }
    ]);
