angular.module('STORAGE',[])
    .factory('storage',[
        function(){            
            var storage, service;
            
            try{
                storage = window.localStorage;
            }catch( e ){}
            
            if( storage ){
                service = {
                    setItem: function( n, v, force ){
                        try{
                            return storage.setItem(n,v);
                        }catch( e ){
                            if( isFull(e) && force ){
                                service.clear();
                                return service.setItem( n, v );
                            }
                        }
                    },
                    getItem: function( n ){
                        return storage.getItem(n);
                    },
                    removeItem: function( n ){
                        return storage.removeItem(n);
                    },
                    clear: function(){
                        return storage.clear();
                    }
                };
            }else{
                service = {
                    setItem: function(){},
                    getItem: function(){},
                    removeItem: function(){},
                    clear: function(){}
                };
            }
            
            return service;
            
            function isFull(e){
                var full = false;
                if( e ){
                    if( e.code === 22 ){
                        full = true;
                    }else if( e.code === 1014 && e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ){
                        // Old Firefox
                        full = true;
                    } else if (e.number === -2147024882){
                        // Internet Explorer 8
                        full = true;
                    }
                }
                return full;
            }
        }
    ]);

ANGULAR_MODULES.push('STORAGE');