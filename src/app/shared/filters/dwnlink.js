angular.module('filters')
    .filter('dwnlink', [function(){
            
        return function(token, size, ext) {            
            if( token ){
                var resize = '';
                if( size && size.length ){
                    /*if( sizes[size[0]] ){
                        size[0] = sizes[size[0]]();
                    }
                    if( sizes[size[2]] ){
                        size[2] = sizes[size[2]]();
                    }*/
                    
                    resize = '-'+( window.devicePixelRatio * size[0] )
                        + (size[1]||'') + ( size[2]? window.devicePixelRatio * size[2]:'' );                        
                }
                return (token.indexOf('img/')!==-1||token.indexOf('http')===0)?token:CONFIG.dms.base_url+CONFIG.dms.paths.download+'/'+token+resize+(ext||'');
            }
            return undefined;
        };
    }]);