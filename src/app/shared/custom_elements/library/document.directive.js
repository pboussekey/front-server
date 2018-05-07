
angular.module('customElements')
    .directive('document',['docslider_service',
        function(docslider_service){
            return {
                restrict:'A',
                transclude : true,
                scope:{
                    document:'=',
                    list:'='
                },
                link: function(scope){
                    
                    var globalRgx = new RegExp('^(https?://)?(youtu\.be|www\.youtube\.com|www\.dailymotion\.com|dai\.ly|(player\.)?vimeo\.com)+.*');
                    // Function to check if src is youtube/vimeo/daylimotion link.
                    scope.isIframeLink = function(  ){
                        return globalRgx.test(scope.document.link);
                    };
                    
                    scope.openSlider = function( $event){
                        var index = scope.list && scope.list.indexOf(scope.document);
                        if( index !== -1 && scope.list ){
                            docslider_service.open({ docs : scope.list }, '', $event.target, index + 1);
                        }
                        else{
                            docslider_service.open({ docs : [ scope.document ]},'', $event.target, 0);
                        }
                        $event.preventDefault();
                    };
                    
                    if(scope.document.type === 'link' && scope.document.text){
                        var properties = JSON.parse( scope.document.text );
                        if( properties ){
                            scope.document.link_desc = properties.link_desc;
                            scope.document.picture = properties.picture;
                        }
                    }
                            
                },
                templateUrl: 'app/shared/custom_elements/library/document.html'
            };
        }
    ]);