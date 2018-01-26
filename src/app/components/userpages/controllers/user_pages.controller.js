angular.module('userpages').controller('userpages_controller',
    ['pagetype','user_pages_service','session','page_modal_service','oadmin_model','session', 'pages_config',
    function( pagetype, user_pages_service, session, page_modal_service, oadmin_model, session, pages_config ){

        var ctrl = this,
            page = 1,
            n = 12;

        ctrl.type = pagetype;
        ctrl.displayed_pages = [];
        ctrl.canCreate = false;
        ctrl.label = pages_config[pagetype].label;
        ctrl.title = 'My '+ ctrl.label +'s';
        ctrl.linkCategory = ctrl.label +'s';
        ctrl.canCreate = true;
        if ( pagetype === 'course' ) {

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
            var total = user_pages_service.memberof.length,
                minRange = Math.max(0,total-n*page),
                maxRange = Math.max(0,total-n*(page-1));

            Array.prototype.push.apply( ctrl.displayed_pages, 
                user_pages_service.memberof.slice( minRange, maxRange ).reverse() 
            );
            
            page++;
        };
    }
]);
