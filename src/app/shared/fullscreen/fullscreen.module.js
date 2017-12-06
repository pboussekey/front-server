angular.module('fs_module',[])
    .factory('fs_api',[function(){
        
        var fs = {},
            fullscreenAPI = [
                ['requestFullscreen','exitFullscreen','fullscreenElement','fullscreenEnabled','fullscreenchange','fullscreenerror'], // Real specifications
                ['webkitRequestFullscreen','webkitExitFullscreen','webkitFullscreenElement','webkitFullscreenEnabled','webkitfullscreenchange','webkitfullscreenerror'], // Webkit
                ['webkitRequestFullScreen','webkitCancelFullScreen','webkitCurrentFullScreenElement','webkitCancelFullScreen','webkitfullscreenchange','webkitfullscreenerror'], // Old webkit - safari
                ['mozRequestFullScreen','mozCancelFullScreen','mozFullScreenElement','mozFullScreenEnabled','mozfullscreenchange','mozfullscreenerror'], // Mozilla
                ['msRequestFullscreen','msExitFullscreen','msFullscreenElement','msFullscreenEnabled','MSFullscreenChange','MSFullscreenError'] // Microsoft
            ];
    
        fs.is_available = fullscreenAPI.some(function( api ){
            if( document.documentElement[ api[0] ] ){
                api.forEach(function(method, idx){
                    fs[ fullscreenAPI[0][idx] ] = method;
                });
                return true;
            }
        });
        
        return fs;
    }]);
    
ANGULAR_MODULES.push('fs_module');