angular.module('elements').directive('docslider',
    ['$timeout', 'tracker_service',
        function( $timeout, tracker ){
            return {
                scope:{
                    sources: '=sources',
                    index: '=index',
                    close : "="
                },
                resrict:'E',
                templateUrl:'app/shared/elements/document-slider/directive.template.html',
                link: function( scope, element ) {
                    var docs = [];

                    if( scope.sources.images && scope.sources.images.length ){
                        Array.prototype.push.apply(docs, scope.sources.images );
                    }
                    if( scope.sources.docs && scope.sources.docs.length ){
                        Array.prototype.push.apply(docs, scope.sources.docs );
                    }
                    if( scope.sources.audios && scope.sources.audios.length ){
                        Array.prototype.push.apply(docs, scope.sources.audios );
                    }
                    if( scope.sources.videos && scope.sources.videos.length ){
                        Array.prototype.push.apply(docs, scope.sources.videos );
                    }
          

                    scope.setCurrent = function( index ){
                        if( index <= 0 ){
                            index = docs.length;
                        }
                        else if( index > docs.length ){
                            index = 1;
                        }

                        scope.current = docs[index - 1];
                        if(scope.current.type === 'link' && scope.current.text){
                            var properties = JSON.parse( scope.current.text );
                            if( properties ){
                                scope.current.link_desc = properties.link_desc;
                                scope.current.picture = properties.picture;
                            }
                        }
                        scope.currentIndex = index;
                        if(scope.current.id && !scope.current.opened){
                            scope.current.opened = true;
                            tracker.register([{
                               event:'document.open',
                               date:(new Date()).toISOString(),
                               object:{id:scope.current.id}
                           }]);
                        }

                    };
                    scope.downloadDoc = function(){
                        if(scope.current.id && !scope.current.downloaded){
                            scope.current.downloaded = true;
                            tracker.register([{
                               event:'document.download',
                               date:(new Date()).toISOString(),
                               object:{id:scope.current.id}
                           }]);
                        }
                    };
                    var timeout;
                    element[0].addEventListener('mousemove', function(){
                       element[0].classList.add('mousemove');
                       if(timeout){
                           $timeout.cancel(timeout);
                           timeout = null;
                       }
                       timeout = $timeout(function(){
                           element[0].classList.remove('mousemove');
                       }, 2000);
                    });
                    scope.isApp = (navigator.userAgent.indexOf('twicapp') !== -1);
                    scope.count = docs.length;
                    scope.setCurrent( scope.index );
                    scope.callbacks = {};
                    scope.$watch('callbacks', function(){
                        scope.$evalAsync();
                    }, true);
                }
            };

        }
    ]);
