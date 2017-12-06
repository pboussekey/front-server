angular.module('elements')
    .factory('cropper_modal',['modal_service',  
        function( modal_service ){
            var service = {
                open : function( element, file, callback, labels, ratio){
                    service.save = callback;
                    service.labels = labels;
                    service.ratio = ratio || 1;
                    service.callback = callback;
                    service.file = file;
                    modal_service.open({
                        reference: element,
                        scope : service,
                        onclose : service.onClose,
                        blocked : true,
                        template:'app/shared/elements/cropper/modal.html?' + new  Date().getTime()
                    });
                },
                onSave : function(){
                    service.crop().then(function( blob ){   
                        document.querySelector("#modal_cropper").removeEventListener("keydown", service.onKeyDown);
                        modal_service.close();
                        service.callback(blob);
                    });
                },
                onClose : function(){
                    delete(service.loadCropper);
                    delete(service.crop);
                }, 
                uploadFile : function( files, input){
                    if(files.length){      
                        service.openCropper(window.URL.createObjectURL(files[0]));
                        input.value = null;
                        var cropper = document.querySelector("#modal_cropper");
                        cropper.addEventListener("keydown", service.onKeyDown);
                        cropper.focus();
                    }
                },
                openCropper : function(url){
                    document.querySelector("#modal_cropper").addEventListener("keydown", service.onKeyDown);
                    if(url){
                        service.loadCropper(url, true, true);
                    }
                },
                onKeyDown : function(e){
                    if(e.keyCode === 13){
                        service.onSave();
                    }
                },
                close : function(){
                    scope.openCropper = null; scope.crop = null;
                    modal_service.close();
                }
                
                
            };
            
            return service;
        }
    ]);