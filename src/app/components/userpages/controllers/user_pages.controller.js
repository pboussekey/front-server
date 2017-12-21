angular.module('userpages').controller('userpages_controller',
    ["pagetype", "user_pages_service","session",function( pagetype, user_pages_service, session ){

        var ctrl = this,
            page = 1,
            n = 12;

        ctrl.type = pagetype;
        ctrl.displayed_pages = [];

        if( pagetype === 'event' ){
            ctrl.title = 'My events';
        }else if ( pagetype === 'group' ) {
            ctrl.title = 'My groups';
        }else if ( pagetype === 'course' ) {
            ctrl.title = 'My courses';
        }

        // SET TITLE
        document.title = 'TWIC - '+ctrl.title;
        // GET PAGES
        user_pages_service.load([session.id],true).then(function(){
            ctrl.loadNextPages();
        });

        ctrl.loadNextPages = function(){
            Array.prototype.push.apply( ctrl.displayed_pages, user_pages_service.memberof.slice( n*(page-1), n*page) );
            page++;
        };
    }
]);
