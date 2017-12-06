
angular.module('customElements')
    .directive('documentUpload',['urlmetas_service', 'upload_service',
        function(urlmetas_service, upload_service){
            return {
                restrict:'A',
                transclude : true,
                scope:{
                    document:'=documentUpload',
                    onfileadd:'='
                },
                link: function(scope){
                    
                    var urlRgx = new RegExp(/(https?:\/\/[^ ]+)/g);       
                    scope.itemFileDropZone = {
                        checkdrag: function( event ){
                            return event && event.dataTransfer && event.dataTransfer.items
                                && event.dataTransfer.items.length
                                && event.dataTransfer.items[0].kind === 'file';
                        },
                        ondrop: function( event ){
                            scope.addFile( event.dataTransfer.files[0] );
                        }
                    };
                    scope.document = {};
                    scope.addFile = function( files ){
                        var file = files[0];
                        var upload = upload_service.upload('token', file, file.name);
                        scope.document = {};

                        scope.document.progression = 0;
                        scope.document.file = file;
                        scope.document.upload = upload;
                        scope.document.name = file.name;
                        scope.document.type = file.type;

                        upload.promise.then(function(d){
                            scope.document.token = d.token;
                        },function(){
                            scope.document.upload_error = true;
                        },function( evt ){
                            scope.document.progression = Math.round(1000 * evt.loaded / evt.total) / 10;
                        });

                        if(scope.onfileadd){
                            scope.onfileadd(file);
                        }
                        scope.isUpdated = true;
                        scope.$evalAsync();
                    };
                    scope.checkFileLink = function(){
                        if( !scope.checkingLink ){
                            var text = scope.document.link,
                                matches = urlRgx.exec( text );

                            urlRgx.lastIndex = 0;
                            scope.isUpdated = true;

                            if( matches ){
                                scope.checkingLink = true;

                                urlmetas_service.get( matches[0] ).then(function(meta){
                                    scope.checkingLink = false;

                                    if( meta.title || meta.description || meta.picture ){
                                        scope.document.link = matches[0];
                                        scope.document.name = meta.title || matches[0];
                                        scope.document.text = JSON.stringify({link_desc: meta.description,picture:meta.picture});
                                        scope.document.type = 'link';
                                        scope.document.link_desc = meta.description;
                                        scope.document.picture = meta.picture;
                                        scope.isUpdated = true;
                                    }

                                    scope.$evalAsync();

                                    if( scope.queueCheckLink ){
                                        scope.queueCheckLink = false;
                                        scope.checkFileLink();
                                    }
                                }.bind(this),function(){
                                    scope.checkingLink = false;
                                    if( scope.queueCheckLink ){
                                        scope.queueCheckLink = false;
                                        scope.checkFileLink();
                                    }
                                    scope.$evalAsync();
                                }.bind(this));
                            }
                        }else{
                            scope.queueCheckLink = true;
                        }
                    };
                    
                    scope.removeFileLink = function(){
                        scope.document = {};
                        scope.checkingLink = false;
                        urlRgx.lastIndex = 0;
                        scope.isUpdated = true;
                    };
                            
                },
                templateUrl: 'app/shared/custom_elements/library/document-upload.html'
            };
        }
    ]);