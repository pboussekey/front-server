angular.module('HANGOUT').directive('tbstream',['fs_api',function(fs_api){
    return {
        scope: {
            stream: '=tbstream'
        },
        templateUrl:'app/shared/hangout/tpl/stream.html',
        link: function( scope, element, attrs, controller ){
            
            var video_container = element[0].querySelector('.video_content');
            function setContent(){
                scope.stream.toggleFullScreen = toggleFullScreen;
                scope.stream.element = element[0];
                video_container.innerHTML = "";
                if(scope.stream && scope.stream.data && scope.stream.data.element && scope.stream.data.video){    
                    video_container.append( scope.stream.data.element );
                }
            };
            
            setContent();

            function onFullScreenChange(event){
                if(document[fs_api.fullscreenElement] === null ){
                    scope.stream.toggleFullScreen();
                }
            };

            function toggleFullScreen(){
                
                if( !fs_api.is_available ){
                    return;
                }
                
                if( !scope.stream.expanded)
                {
                    scope.stream.expanded = true;
                    window.fse = element[0];
                    
                    scope.stream.element[fs_api.requestFullscreen]();
                    scope.stream.element.addEventListener( fs_api.fullscreenchange,onFullScreenChange);
                }
                else{
                    scope.stream.expanded = false;
                    scope.stream.element.removeEventListener( fs_api.fullscreenchange,onFullScreenChange);
                    document[fs_api.exitFullscreen]();
                }
                scope.$evalAsync();
            }
            
            scope.$watch('stream.id', setContent, true);
        }   
    };
}]);
