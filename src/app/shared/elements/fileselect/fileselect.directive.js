
angular.module('elements')
    .directive('fileselect',['notifier_service', '$timeout', '$translate', 
        function(notifier_service, $timeout, $translate ){
            return {
                scope: {
                    fileselect: '='
                },
                restrict: 'A',
                link: function( scope, element ){
                    element[0].addEventListener('change', function(e){
                        var size = Array.prototype.reduce.call(e.target.files,function(size,file){
                            return size + file.size;
                        },0);
                        if(CONFIG.dms.max_upload_size >= size){
                            scope.fileselect( e.target.files, element[0], e.target );
                        }
                        else{
                           $timeout(function(){ onError(); });
                        }
                    });

                    function onError(){                        
                        $translate('ntf.err_file_size',{maxsize:(CONFIG.dms.max_upload_size / 1024 / 1024)}).then(function( translation ){
                            notifier_service.add({type:'error',message: translation});
                        });
                        
                        element[0].value = null;
                    }
                }
            };
        }]);