angular.module('elements').directive('docslider',
    ['$timeout', 'tracker_service', 'filters_functions',
        function( $timeout, tracker, filters_functions ){
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
                    scope.imageSize = [screen.width, 'm', screen.height];
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
                        $timeout(function(){
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
                            if(docs.length > 1){

                               var next = docs[index % docs.length];
                               if(next && next.type.indexOf('image') === 0){
                                  var nthumbnail = new Image();
                                  nthumbnail.src = filters_functions.dmsLink(next.token, [parseInt(screen.width / 5), 'm', parseInt(screen.height / 5)]);
                                  var nimg = new Image();
                                  nimg.src = filters_functions.dmsLink(next.token, scope.imageSize);
                               }
                            }
                            if(docs.length > 2){
                                var previousIdx =  index > 1 ? (index - 1) % docs.length  : docs.length;
                                var previous = docs[previousIdx - 1];
                                if(previous && previous.type.indexOf('image') === 0){
                                   var pthumbnail = new Image();
                                   pthumbnail.src = filters_functions.dmsLink(previous.token, [parseInt(screen.width / 5), 'm', parseInt(screen.height / 5)]);
                                   var pimg = new Image();
                                   pimg.src = filters_functions.dmsLink(previous.token, scope.imageSize);
                                }
                            }
                        });

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

                    var slider = new Hammer(element[0]);
                    slider.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
                    slider.on('swipe', function(ev) {
                        scope.setCurrent( scope.currentIndex + (ev.deltaX  > 0 ? 1 : -1));
                    });


                    scope.isApp = (navigator.userAgent.indexOf('twicapp') !== -1);
                    scope.count = docs.length;
                    scope.setCurrent( scope.index );
                }
            };

        }
    ]);
