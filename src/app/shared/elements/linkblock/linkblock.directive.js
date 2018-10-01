angular.module('elements')
    .directive('linkblock',[
        function(){

            var yRgx = /^(https?:\/\/)?((w{3}\.)?(youtube|youtu\.be))/,
                dRgx = /^(https?:\/\/)?((w{3}\.)?(dailymotion|dai\.ly))/,
                vRgx = /^(https?:\/\/)?((w{3}\.)?((player\.)?vimeo.com))/,
                globalRgx = new RegExp('^(https?://)?(youtu\.be|www\.youtube\.com|www\.dailymotion\.com|dai\.ly|(player\.)?vimeo\.com)+.*');

            function getIframeLink( url ,api, autoplay ){
                if( yRgx.test(url) ){
                    return '//www.youtube.com/embed/'
                        + url.match(/[a-zA-Z0-9-_]{11}/)[0]
                        +'?wmode=transparent&rel=0&modestbranding=1&feature=player_embedded'
                        +(api?'&enablejsapi=1':'')+(autoplay ? '&autoplay=1' : '');
                }else if( vRgx.test(url) ){
                    return '//player.vimeo.com/video/'
                        + url.match(/[0-9]+$/)[0]
                        +'?portrait=0&byline=0&badge=0&color=ffffff'
                        +(api?'&api=1':'');
                }else if( dRgx.test(url) ){
                    var arr = url.split('/');
                    return '//www.dailymotion.com/embed/video/'
                        +arr[arr.length-1]
                        +'?related=0&logo=0'
                        +(api?'&api=postMessage':'');
                }else
                    return url;
            }

            // Function to check if src is youtube/vimeo/daylimotion link.
            function isIframeLink( source ){
                return globalRgx.test(source);
            }

            return {
                scope:{
                    url: '=linkUrl',
                    title: '=linkTitle',
                    description: '=linkDesc',
                    picture: '=linkPicture',
                    remove:'=?',
                    autoplay:'=?'
                },
                link:function(scope){

                    scope.isIframeLink = false;
                    scope.isIframeVisible = false;
                    scope.iframeURL = undefined;

                    // SET IFRAME VISIBLE
                    scope.setIframeVisible = function(){
                        scope.isIframeVisible=true;
                    };

                    // LISTEN TO URL CHANGES.
                    var unbindRef = scope.$watch('url', function(){
                        if( scope.url ){
                            build();
                        }
                    });

                    // DESTROY LISTENER.
                    scope.$on('$destroy',function(){ unbindRef(); });

                    function build(){
                        // CHECK IF LINK BELONG TO YOUTUBE/VIMEO/DAILY
                        if( isIframeLink( scope.url ) ){
                            scope.isIframeLink = true;
                            scope.iframeURL = getIframeLink( scope.url, false, scope.autoplay );
                            if(scope.autoplay){
                                scope.setIframeVisible();
                            }
                        }
                    }

                    build();
                },
                templateUrl:'app/shared/elements/linkblock/linkblock.html',
                restrict: 'E'
           };
        }
    ]);
