angular.module('USERS_STATUS').directive('ustatus',['events_service','statuses','users_status',
    function( events_service, statuses, users_status ){
        return {
            link:function( scope, element, attrs){
                var user_id = attrs.ustatus;

                if( user_id ){
                    var watchID = users_status.watch([user_id]);

                    if( users_status.status[user_id].state === statuses.disconnected ){
                        element[0].classList.add('offline');
                    }else if( users_status.status[user_id].state === statuses.connected ){
                        element[0].classList.add('online');
                    }

                    var listenerId = events_service.on( 'userStatus#'+user_id, function(){
                        element[0].classList.remove('offline');
                        element[0].classList.remove('online');

                        if( users_status.status[user_id].state === statuses.disconnected ){
                            element[0].classList.add('offline');
                        }else if( users_status.status[user_id].state === statuses.connected ){
                            element[0].classList.add('online');
                        }
                    });

                    scope.$on('$destroy', function(){
                        users_status.unwatch( watchID );
                        events_service.off( 'userStatus#'+user_id, listenerId );
                    });
                }
            },
            restrict: 'A'
       };
    }
]);
