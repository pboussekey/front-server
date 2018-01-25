
angular.module('customElements')
    .directive('page',['page_model', 'pages_config',
        function( page_model, pages_config ){
            return {
                restrict:'A',
                scope:{
                    id:'=page',
                    links: '=pageLinks',
                },
                link: function( scope ){
                    scope.model = page_model.list;
                    page_model.queue([scope.id]).then(function(){
                        scope.config = pages_config;
                        scope.page_fields = pages_config[page_model.list[scope.id].datum.type].fields;
                        scope.label = pages_config[page_model.list[scope.id].datum.type].label;
                        console.log("LABEL", scope.label);
                    });                                    
                },
                transclude: true,
                templateUrl: 'app/shared/custom_elements/pages/page.html'
            };
        }
    ]);