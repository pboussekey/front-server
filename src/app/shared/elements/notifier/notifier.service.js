angular.module('elements').factory('notifier_service',
    ['$timeout',
    function($timeout){
        var service = {
            index: 0,
            default_timeout: 4000,
            icons : {
                message : 'i-undocheck',
                error : 'i-x',
                warning : 'i-alert'
            },
            notifications: {
                default:[
                    /*{
                        index:1,
                        type:"warning",
                        message:"Awesome title !",message: "It's a fuckin test to see how i can make notifier responsive"
                    },
                    {
                        index:2,
                        type:"message",
                        message:"Awesome title !",message: "An error has occured. We didn't find any TWIC account related to your linkedin account."
                    }*/
                ],
                speedgrader:[],
                hangout: []
            },
            add: function( notification, queue ){
                if( !queue ){ queue = 'default'; }
                notification.icon =  service.icons[notification.type];
                if( service.notifications[queue].length > 4 ){
                    service.notifications[queue].shift();
                }

                if( !notification.index )
                    notification.index = 'ntf_'+service.index++;

                service.notifications[queue].push(notification);
                if( notification.time !== 0 ) {
                    $timeout( service.remove.bind(this,notification,queue), notification.time||service.default_timeout );
                }
            },
            remove: function( notification, queue ){
                if( !queue ){ queue = 'default'; }
                
                notification.type= notification.type+" closed";

                $timeout(function(){
                    var i = service.notifications[queue].indexOf(notification);
                    if(i >-1){
                        service.notifications[queue].splice(i,1);
                    }
                },400);
            }
        };
        return service;
    }
]);
