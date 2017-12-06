angular.module('customElements')
    .directive('documentViewer',['library_service', '$parse', 'notifier_service', 'fs_api','$translate',
        function(library_service, $parse,notifier_service, fs_api, $translate){
            return {
                restrict:'A',
                transclude : true,
                template : "<div class='document' ng-class='{ expanded : expanded }'></div><div loader ng-if='loading'></div>",
                scope:{
                    document:'=documentViewer',
                    goto : '=',
                    nextpage : '=',
                    previouspage : '=',
                    zoomin : '=',
                    zoomout : '=',
                    fullscreen : '='
                },
                link: function(scope, element, attr){
                 
                   
                    function onLoad(){
                        scope.loading = true;
                        if(scope.viewer){
                            unassign();
                        }
                        if(scope.document){
                            if(scope.document.urls){
                                loadDocument(element[0].querySelector(".document"), scope.document.urls);
                            }
                            else{
                                library_service.getSession(scope.document).then(function(r){
                                    scope.document.urls = r.urls;
                                    loadDocument(element[0].querySelector(".document"), r.urls);
                                }, onError);
                            }
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
;
                        }
                        if($parse(attr.zoomin).assign){
                            scope.zoomin = null;
                        }
                        if($parse(attr.zoomout).assign){
                            scope.zoomout = null;
                        }
                    }
                    
                    function onError(){
                        scope.loading = false;
                        $translate('ntf.err_doc_loading').then(function( translation ){
                            notifier_service.add({
                                type:"error",
                                message: translation
                            });
                        });
                    }
                    
                    /**
                    * fn container: HTMLDOMElement | string, url: string => CrocodocViewer
                    *
                    * @link: https://github.com/box/viewer.js#user-content-library-methods
                    *
                    * Create a Crocodoc viewer in element, with provided assets URL
                    */
                    function loadDocument(container, urls) {
                        
                        function onFullScreenChange(event){
                            if(!document[fs_api.fullscreenElement] && scope.fullscreen){
                                scope.fullscreen();
                            }
                        };
                        scope.viewer = Crocodoc.createViewer(container, {
                            url: urls.assets,
                            plugins: {
                                realtime: { url: urls.realtime },
                            },
                            zoom : Crocodoc.ZOOM_FIT_WIDTH,
                        });
                        scope.viewer.on('ready', function() {
                            scope.loading = false;
                            if($parse(attr.goto).assign){
                                scope.goto = function(p) {
                                   scope.viewer && scope.viewer.scrollTo(p);
                                };
                            }
                            if($parse(attr.nextpage).assign){
                                scope.nextpage = function() {
                                    scope.viewer.scrollTo(Crocodoc.SCROLL_NEXT);
                                };
                            }
                            if($parse(attr.previouspage).assign){
                                scope.previouspage = function() {
                                    scope.viewer.scrollTo(Crocodoc.SCROLL_PREVIOUS);
                                };
                            }
                            if($parse(attr.zoomin).assign){
                                scope.zoomin = function() {
                                    scope.viewer.zoom(Crocodoc.ZOOM_IN);
                                };
                            }
                            if($parse(attr.zoomout).assign){
                                scope.zoomout = function() {
                                    scope.viewer.zoom(Crocodoc.ZOOM_OUT);
                                };
                            }
                            if($parse(attr.fullscreen).assign){
                                scope.fullscreen = function(){
                                    if( !fs_api.is_available ){
                                        return;
                                    }
                                    scope.expanded = !scope.expanded ;
                                    if(scope.expanded)
                                    {
                                        container[fs_api.requestFullscreen]();
                                        document.addEventListener( fs_api.fullscreenchange,onFullScreenChange);
                                    }
                                    else{
                                        document.removeEventListener( fs_api.fullscreenchange,onFullScreenChange);
                                    }
                                    scope.$evalAsync();
                                };
                            }
                            scope.$evalAsync();
                        });
                        scope.viewer.on('fail',onError);
                        scope.viewer.on('asseterror', onError);
                        scope.viewer.load();
                       

                    }
                    
                   
                    
                    scope.$watch("document",onLoad, true);
                    scope.$on('$destroy',function(){
                        if( scope.viewer && scope.viewer.destroy){
                            scope.viewer.destroy();
                        }
                        unassign();
                    });
                 
                }
            };
        }
    ]);