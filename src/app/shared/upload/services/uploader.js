
angular.module('UPLOAD')
    .factory('upload_service',['$q', '$http', function($q, $http){

        var service = {
            max_img_height: 1080,
            max_img_width: 1080,
            audioToBlob: function( audio ){
                var deferred = $q.defer();

                var xhr = new XMLHttpRequest();
                xhr.open('GET', audio.fullPath );
                xhr.responseType = 'blob';

                xhr.onload = function(){
                    if ( this.status === 0 ){
                        deferred.resolve( new Blob([this.response], {type: audio.type }) );
                    }
                };

                xhr.onerror = function(e){ deferred.reject(e); };
                xhr.send();

                return deferred.promise;
            },
            imageToBlob: function( src ){
                var deferred = $q.defer(),
                    canvas = document.createElement('canvas'),
                    ctx = canvas.getContext('2d'),
                    image = new Image();

                image.onload = function(){
                    var w, h;

                    if( image.naturalWidth <= image.naturalHeight && image.naturalHeight > service.max_img_height ){
                        h = service.max_img_height;
                        w = Math.round(image.naturalWidth * h / image.naturalHeight);
                    }else if( image.naturalWidth >= image.naturalHeight && image.naturalWidth > service.max_img_width ){
                        w = service.max_img_width;
                        h = Math.round(image.naturalHeight * w / image.naturalWidth);
                    }

                    canvas.width = w || image.naturalWidth;
                    canvas.height = h || image.naturalHeight;
                    ctx.drawImage( image, 0, 0, w || image.naturalWidth, h || image.naturalHeight);

                    canvas.toBlob( function(blob){
                        deferred.resolve( blob );
                    });
                };

                image.src = src;
                return deferred.promise;
            },
            upload: function( name, fileOrBlob, filename ){

                var xhr = new XMLHttpRequest(),
                    deferred = $q.defer(),
                    formData = new FormData();


               console.log("FILE ?", fileOrBlob, fileOrBlob instanceof Blob);
                // Init request.
                var time = Date.now();
                var path = (CONFIG.dms.use_gs) ? (CONFIG.dms.paths.upload + '?uploadType=media' + '&name=' + time + '-' + filename) : (CONFIG.dms.base_url+CONFIG.dms.paths.upload);
                xhr.open('POST', path );
                //xhr.responseType = 'json';

                xhr.upload.addEventListener('progress', function(evt){
                    deferred.notify(evt);
                });

                xhr.addEventListener('abort',function(evt){
                    deferred.reject(evt);
                });

                xhr.addEventListener('error',function(evt){
                    deferred.reject(evt);
                });

                xhr.addEventListener('load',function(evt){
                    var responseObject = {};
                    try{
                        responseObject = JSON.parse( xhr.response );
                    }catch( e ){
                        deferred.reject(evt);
                        console.log('XHR RESPONSE IS NOT CORRECT JSON', e);
                    }
                    if(CONFIG.dms.use_gs) {
                        $http({
                            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                            method: 'POST',
                            url: (CONFIG.dms.base_url+CONFIG.dms.paths.copy) ,
                            transformRequest: function(obj) {
                                var str = [];
                                for(var p in obj) str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                                return str.join("&");
                            },
                            data: { name: filename, object: time + '-' + filename, type: responseObject.contentType, size: responseObject.size}}).then(
                        function(res){
                            console.log(res);
                            var r = {};
                            r[name] = res.data.id;
                            deferred.resolve( r );
                        },
                        function(){}
                        );
                    } else {
                        deferred.resolve( responseObject )
                    };
                });

                // Send request
                if(!CONFIG.dms.use_gs){
                    // Set formData file
                    if( filename ){
                        formData.append( name, fileOrBlob, filename);
                    }else{
                        formData.append( name, fileOrBlob);
                    }
                    xhr.send(formData);
                }
                else{
                    xhr.send(fileOrBlob);
                }

                return {xhr:xhr, promise: deferred.promise};
            },
            uploadImage : function(name, blob, filename){
                return service.imageToBlob(window.URL.createObjectURL(blob)).then(function(resizedBlob){
                    return service.upload(name, resizedBlob, filename);
                });
            },
            dataUrlToBlob: function( dataurl ){
                var arr = dataurl.split(','),
                    mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]),
                    n = bstr.length,
                    u8arr = new Uint8Array(n);

                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }

                return new window.Blob([u8arr], {type: mime});
            }
        };

        return service;
    }]);
