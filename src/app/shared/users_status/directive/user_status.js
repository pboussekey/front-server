angular.module('USERS_STATUS').directive('ustatus',['events_service','statuses','users_status',
    function( events_service, statuses, users_status ){
        return {
            link:function( scope, element, attrs){
                var user = attrs.ustatus;
                
                if( user ){ 
                    
                    if(users_status.status[user] !== undefined ){
                        if( users_status.status[user] === statuses.disconnected ){
                            element[0].classList.add('offline');   
                        }else if( users_status.status[user] === statuses.connected ){
                            element[0].classList.add('online');
                        }
                    }

                    var listenerId = events_service.on( 'userStatus#'+user, function(){                        
                        element[0].classList.remove('offline');
                        element[0].classList.remove('online');
                        
                        if( users_status.status[user] === statuses.disconnected ){
                            element[0].classList.add('offline');   
                        }else if( users_status.status[user] === statuses.connected ){
                            element[0].classList.add('online');
                        }
                    });
                    
                    scope.$on('$destroy', function(){
                        events_service.off( 'userStatus#'+user, listenerId );
                    });
                }
            },
            restrict: 'A'
       };
    }
]);