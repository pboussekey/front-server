
angular.module('elements')
    .factory('modal_service',['$rootScope',
        function( $rootScope ){

            var service = {
                opened: false,

                open: function( options ){
                    if( options.template && options.reference ){
                        service.template = options.template;
                        service.opened = true;
                        service.ref = options.reference;
                        service.scope = options.scope;
                        service.label = options.label;
                        service.is_alert = options.is_alert;
                        service.classes = options.classes;
                        service.onclose = options.onclose;
                        service.blocked = options.blocked;

                        service.scroll = window.scrollY;
                        // Add aria hidden on page content.
                        document.querySelector('#body').setAttribute('aria-hidden','true');
                    }
                },

                close: function(){
                    service.opened = false;

                    // Remove aria hidden
                    document.querySelector('#body').removeAttribute('aria-hidden');
                    // Focus opening modal element.
                    if( service.ref ){
                        service.ref.focus();
                    }
                    // Clean service
                    if(service.onclose){
                        service.onclose();
                    }
                    service.onclose = undefined;
                    service.template = undefined;
                    service.scope = undefined;
                    service.label = undefined;
                    service.is_alert = undefined;
                    service.ref = undefined;
                }
            };

            $rootScope.$on('$stateChangeSuccess', function(){
                if( service.opened ){
                    service.close();
                }
            });

            return service;
        }
    ]);
