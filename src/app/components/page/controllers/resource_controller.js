angular.module('page').controller('resource_controller',
    ['page','library_service', 'page_library',  'modal_service',
      '$stateParams', 'docslider_service', '$translate',
        function(page, library_service, page_library, modal_service,
          $stateParams, docslider_service, $translate){
            var ctrl = this;
            ctrl.page = page;
            //RESOURCES
            ctrl.loadingDocuments= true;
            ctrl.library_service = library_service;
            var pl = page_library.get(page.datum.id);
            pl.get().then(function(){
                ctrl.page_library = pl;
                ctrl.loadingDocuments = false;
                if($stateParams.library_id){
                    ctrl.page_library.list.forEach(function(library, index){
                        if(library.id == $stateParams.library_id){
                            ctrl.openSlider(null, index);
                        }
                    });

                }
            });
            ctrl.nextDocuments = function(){
                if(ctrl.loadingDocuments){
                    return;
                }
                ctrl.loadingDocuments= true;
                var documents_length = ctrl.page_library.list.length;
                ctrl.page_library.next().then(function(){
                    ctrl.loadingDocuments = documents_length === ctrl.page_library.list.length;
                });
            };

            ctrl.addDocument = function(file, notify){
                page_library.add(ctrl.page.datum.id, file, notify).then(function(){
                    ctrl.document = null;
                });
            };

            ctrl.deleteDocument = function(id){
                return page_library.remove(ctrl.page.datum.id, id);
            };

            ctrl.openSlider = function( $event, index){
                docslider_service.open({ docs : ctrl.page_library.list }, '', $event ? $event.target : document.activeElement , index + 1);
            };

            $translate('ntf.err_file_size',{maxsize:(CONFIG.dms.max_upload_size / 1024 / 1024)}).then(function( translation ){
                ctrl.error_message = translation;
            });

            //ADD MATERIAL
            ctrl.openResourceModal = function($event){
                modal_service.open({
                    reference: $event.target,
                    blocked : true,
                    scope : {
                        save : ctrl.addDocument,
                        uploadError : ctrl.error_message,
                        can_notify : page.datum.type === pages_constants.pageTypes.COURSE
                    },
                    template:'app/components/page/tpl/resource_modal.html'
                });
            };






        }
    ]);
