angular.module('customElements').controller('page_picture_controller',
    ['$scope',  '$element', 'cropper_modal', 'notifier_service', '$translate', 'docslider_service', 'modal_service',
        function( scope, element, cropper_modal, notifier_service, $translate, docslider_service, modal_service){
            scope.cropper_modal = cropper_modal;
            scope.openCropper = function(url){
                scope.cropping = true;
                element[0].classList.add("cropping");
                var cropper = element[0].querySelector("[cropper]");
                cropper.addEventListener("keydown", onKeyDown);
                cropper.focus();  
                if(url){
                    scope.loadCropper(url, true, true);
                }
                scope.$evalAsync();
            };
            
            scope.onError = function(){
                scope.cropping = false;
                element[0].classList.remove("cropping");
                scope.progression = 0;
                scope.saving = false;
                $translate('ntf.err_img_loading').then(function( translation ){
                    notifier_service.add({
                        type:"error",
                        message: translation
                    }); 
                });
            };

            function onKeyDown(e){
                if(e.keyCode === 13){
                    scope.onSave();
                }
            }
            
            scope.openModal = function(files, input , target){
                if(files.length){
                    cropper_modal.open(target,window.URL.createObjectURL(files[0]), scope.save, { title : scope.cropperTitle || 'Change logo', aria : 'Submit logo edition', cancel : 'Cancel logo edition' });
                    input.value = null;
                    scope.$apply();
                }
            };

            scope.onProgress = function(evt){
                scope.progression = 100 * evt.loaded / evt.total;
            };

            scope.uploadFile = function( files, input){
                modal_service.close();
                if( files.length ){    
                    element[0].querySelector("[cropper]").removeEventListener("keydown", onKeyDown, true);
                    scope.openCropper(window.URL.createObjectURL(files[0]));
                    input.value = null;
                }
              
            };

            scope.edit = function($e){
                element[0].querySelector(".edit").click();
            };

            scope.onSave = function(){
                element[0].querySelector("[cropper]").removeEventListener("keydown", onKeyDown, true);
                scope.crop().then(function( blob ){   
                   scope.save(blob);
                });
            };
            
            scope.save = function(blob){
                scope.progression = 0;
                scope.saving = true;
                scope.callback(blob).then(function(){
                    scope.cropping = false;
                    element[0].classList.remove("cropping");
                    scope.progression = 0;
                    scope.saving = false;
                }, scope.onError , scope.onProgress);
            };

            scope.cancel = function(){
                scope.cropping = false;
                element[0].classList.remove("cropping");
                scope.loadCropper("");
                element[0].querySelector("[cropper]").removeEventListener("keydown", onKeyDown, true);
            };
            
            scope.openSlider = function( $event ){
                docslider_service.open(
                    { docs : [
                        {  type : 'image/', token : scope.picture }] 
                    },'', $event.target, 0);
            };
            
                 //ADD MATERIAL
            scope.openMenuModal = function($event, title, onedit){
                modal_service.open({
                    reference: $event.target,
                    scope : {
                        view : scope.openSlider,
                        edit : onedit,
                        picture : scope.picture,
                        name : scope.name + '_modal',
                        onError : scope.onError,
                        title : title
                    },
                    template:'app/shared/custom_elements/pages/picture_modal.html'
                });
            };
    }
]);