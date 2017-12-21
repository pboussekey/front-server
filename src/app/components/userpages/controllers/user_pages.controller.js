angular.module('userpages').controller('userpages_controller',
    ['pagetype','user_pages_service','session','page_modal_service','oadmin_model','session',
    function( pagetype, user_pages_service, session, page_modal_service, oadmin_model, session ){

        var ctrl = this,
            page = 1,
            n = 12;

        ctrl.type = pagetype;
        ctrl.displayed_pages = [];
        ctrl.canCreate = false;

        if( pagetype === 'event' ){
            ctrl.title = 'My events';
            ctrl.linkCategory = 'events';
            ctrl.canCreate = true;
        }else if ( pagetype === 'group' ) {
            ctrl.title = 'My groups';
            ctrl.linkCategory = 'groups';
            ctrl.canCreate = true;
        }else if ( pagetype === 'course' ) {
            ctrl.title = 'My courses';

            oadmin_model.get([session.id]).then(function(){
                ctrl.canCreate = session.roles[1] || oadmin_model.list[session.id].datum.length;
            });
        }

        // SET TITLE
        document.title = 'TWIC - '+ctrl.title;
        // GET PAGES
        user_pages_service.load([session.id],true).then(function(){
            ctrl.loadNextPages();
        });

        ctrl.openPageModal = function($event){
            page_modal_service.open( $event, ctrl.type );
        };

        ctrl.loadNextPages = function(){
            Array.prototype.push.apply( ctrl.displayed_pages, user_pages_service.memberof.slice( n*(page-1), n*page) );
            page++;
        };
    }
]);
