angular.module('USERS_STATUS').directive('ustatus',['events_service','statuses','users_status',
    function( events_service, statuses, users_status ){
        return {
            link:function( scope, element, attrs){
                var user_id, watchID, listenerID;
                // Expose set method.
                if( attrs.ustatusSet ){
                    var setOptions = attrs.ustatusSet.split(','),
                        key = setOptions[1],
                        ref = setOptions[0].split('.').reduce(function( ref, key ){
                            if( ref === undefined ) 
                                return;
                            return ref[key];
                        }, scope );

                    if( key && ref ){
                        ref[key] = set;
                    }
                }

                // Watch current user.
                set( attrs.ustatus );
                // Listen to destroy for clearing listeners.
                scope.$on('$destroy', function(){
                    if( watchID ){
                        users_status.unwatch( watchID );
                    }
                    if( listenerID ){
                        events_service.off( 'userStatus#'+user_id, listenerID );
                    }
                });

                function set( newId ){
                    if( listenerID ){
                        events_service.off( 'userStatus#'+user_id, listenerID );
                        listenerID = undefined;
                    }
                    if( watchID ){
                        users_status.unwatch( watchID );
                        watchID = undefined;
                    }

                    if( newId ){
                        user_id = newId;
                        watchID = users_status.watch([user_id]);
                        listenerID = events_service.on( 'userStatus#'+user_id, function(){
                            element[0].classList.remove('offline');
                            element[0].classList.remove('online');        
                            updateElement();
                        });

                        updateElement();                  
                    }
                }

                function updateElement(){
                    if( users_status.status[user_id].state === statuses.disconnected ){
                        element[0].classList.add('offline');
                    }else if( users_status.status[user_id].state === statuses.connected ){
                        element[0].classList.add('online');
                    }  
                }
            },
            restrict: 'A'
       };
    }
]);
