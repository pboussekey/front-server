
angular.module('customElements')
    .directive('summaryBox',['user_model', 'page_model', 'session',
        'user_profile','page_modal_service','oadmin_model',
        'pages_config',
        function( user_model, page_model, session, user_profile, page_modal_service, oadmin_model, pages_config ){

            return {
                restrict:'E',
                scope:{

                },
                link: function( scope ){
                    var loadingStep = 2;

                    scope.loading = true;
                    scope.pages = page_model.list;
                    scope.pages_config = pages_config;
                    // Get user & school data
                    user_model.queue([session.id]).then(function(){
                        scope.user = user_model.list[session.id];
                        scope.isStudnetAdmin = !!session.roles[1];
                        if( user_model.list[session.id].datum.organization_id){
                            loadingStep++;
                            page_model.queue([user_model.list[session.id].datum.organization_id]).finally(load);
                        }
                    }).finally(load);
                    // Load user pages.
                    user_profile.getCounts().then(function(counts){
                        scope.counts = counts;
                    }).finally(load);

                    function load(){
                        loadingStep--;
                        if( !loadingStep ){
                            scope.loading = false;
                        }
                    }
                },
                transclude: true,
                templateUrl: 'app/shared/custom_elements/summary_box/summary_box.html'
            };
        }
    ]);
