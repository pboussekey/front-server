angular.module('MAJ')
    .factory('maj_service',['websocket','modal_service','$rootScope',
        function( websocket, modal_service, $rootScope ){
            
            var service = {
                listen: function(){
                    websocket.get().then(function(socket){
                        socket.on('platform.update', service.displayReloadMessage );
                    });
                },
                displayReloadMessage: function(){
                    modal_service.open({
                        label: 'System update',
                        template: 'app/shared/maj/modal.html',
                        scope:{
                            reload: service.reload
                        },
                        reference: document.activeElement
                    });
                    
                    $rootScope.$evalAsync();
                },
                reload: function(){
                    window.location.reload();
                }
            };
            
            return service;
        }
    ]);
