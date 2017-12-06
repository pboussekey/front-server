
angular.module('elements').factory('docslider_service',
    ['modal_service',
        function( modal_service ){
        
            var service = {
                template: 'app/shared/elements/document-slider/template.html',
                
                open: function( documents, label, reference, index, template ){
                    var options = {
                        reference: reference,
                        template: template || service.template,
                        label: label,
                        classes: 'docslidermodal',
                        scope: {
                            documents: documents,
                            index: index
                        }
                    };
                    modal_service.open( options );
                },
                
            };
            
            return service;
        }
    ]);