angular.module('customElements')
    .directive('documentViewer',['library_service', '$parse', 'notifier_service', 'fs_api','$translate','tracker_service',
        function(library_service, $parse,notifier_service, fs_api, $translate, tracker_service ){
            return {
                restrict:'A',
                transclude : true,
                templateUrl: 'app/shared/custom_elements/library/document-viewer.html',
                scope:{
                    document:'=documentViewer',
                    goto : '=',
                    nextpage : '=',
                    previouspage : '=',
                    fullscreen : '='
                },
                link: function(scope, element, attr){
                    scope.uid = 'dv'+(Date.now()+(Math.random()+'').slice(2));
                   
                    function onLoad(){
                        scope.loading = true;
                        scope.nopreview = false;
                        if(scope.viewer){
                            unassign();
                        }
                        if(scope.document){
                            library_service.getSession(scope.document).then(function(data){
                                loadDocument( data.access_token, data.restricted_to[0].object.id );
                            }, onError);
                        }
                    }
                    
                    function unassign(){
                        if($parse(attr.goto).assign){
                            scope.goto = null;
                        }
                        if($parse(attr.nextpage).assign){
                            scope.nextpage = null;
                        }
                        if($parse(attr.previouspage).assign){
                            scope.previouspage = null;
                        }
                    }
                    
                    function onError(){
                        scope.nopreview = true;
                        scope.loading = false;
                        scope.$evalAsync();
                    }
                    
                    function loadDocument( boxAccessToken, boxFileId ) {
                        scope.loading = false;
                        scope.preview = new Box.Preview();
                        scope.preview.show( boxFileId, boxAccessToken, {
                            container: '#'+scope.uid,
                            showDownload: false,
                            logoUrl: 'assets/img/logo.png'
                        });

                        scope.preview.addListener('viewer', function(){
                            //console.log('VIEWER?', arguments );
                        });

                        scope.preview.addListener('load',function(){
                            //console.log('LOADED?',arguments);
                        });
                        scope.$evalAsync();
                    }

                    scope.download = function(){
                        if(scope.document.id && !scope.document.downloaded){
                            scope.document.downloaded = true;
                            tracker_service.register([{
                               event:'document.download',
                               date:(new Date()).toISOString(),
                               object:{id:scope.document.id}
                           }]);
                        }
                    };
                    
                    scope.$watch("document",onLoad, true);
                    scope.$on('$destroy',function(){
                        if(scope.preview){
                            scope.preview.removeAllListeners();
                        }
                        unassign();
                    });
                 
                }
            };
        }
    ]);