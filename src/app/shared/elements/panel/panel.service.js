
angular.module('elements')
    .factory('panel_service',['$rootScope','$state',
        function( $rootScope, $state ){
            var service = {
                opened: false,

                declareDirectiveMethods: function( open, close ){
                    service.directiveOpenFunction = open;
                    service.directiveCloseFunction = close;
                    if( service.queued ){
                        service.directiveOpenFunction();
                    }
                },
                open: function( templateUrl, domRef, datas ){
                    service.template = templateUrl;
                    service.domRef = domRef;
                    service.datas = datas;

                    if( service.directiveOpenFunction ){
                        service.directiveOpenFunction();
                        service.queued = false;
                    }else{
                        service.queued = true;
                    }
                },
                clear: function(){
                    service.datas = undefined;
                    service.domRef = undefined;
                    service.template = undefined;
                },
                close: function(){
                    if( service.directiveCloseFunction ){
                        service.directiveCloseFunction();
                    }
                },
                launchClose: function(){
                    if( service.datas && service.datas.launchClose ){
                        service.datas.launchClose().then(function(){
                            service.close();
                        });
                    }else{
                        service.close();
                    }
                },
                getItemId : function(){
                    return service.datas && service.datas.id;
                }
            };

            $rootScope.$on('$stateChangeStart', function( event, toState, toParams ){
                if( service.opened ){
                    if( service.datas && service.datas.launchClose ){
                        event.preventDefault();
                        service.datas.launchClose().then(function(){
                            service.close();
                            $state.go(toState, toParams);
                        });
                    }else{
                        service.close();
                    }
                }
            });

            return service;
        }
    ]);
