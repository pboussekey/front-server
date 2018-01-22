angular.module('elements')
    .directive('dndScrollDown',['events_service',
        function( events_service ){
            return {
                restrict:'A',
                scope:{
                    events:'=dndScrollDown',
                },
                link: function( scope, element ){
                    var events = scope.events.split(' '),
                        clearId;

                    events_service.on( events[0], enable );
                    events_service.on( events[1], disable );

                    scope.$on('$destroy', function(){
                        events_service.off( events[0], enable );
                        events_service.off( events[1], disable );
                        element[0].removeEventListener('dragenter', onEnter );
                        element[0].removeEventListener('dragleave', onLeave );
                    });

                    function enable(){
                        element[0].classList.add('scrollable');
                        element[0].addEventListener('dragenter', onEnter );
                        element[0].addEventListener('dragleave', onLeave );
                    }

                    function disable(){
                        element[0].classList.remove('scrollable');
                        element[0].removeEventListener('dragenter', onEnter );
                        element[0].removeEventListener('dragleave', onLeave );
                    }

                    function onEnter(e){
                        var toadd=1;
                        clearId = setInterval(function(){
                            element[0].previousElementSibling.scrollTop = element[0].previousElementSibling.scrollTop + toadd;
                            toadd = Math.max(10, toadd+1);
                        },40);
                    }

                    function onLeave(){
                        clearInterval( clearId );
                    }
                }
            };
        }
    ]);