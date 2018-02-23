angular.module('userpages').controller('userpages_controller',
    ['pagetype','user_pages_service','session','page_modal_service','oadmin_model','session', 'pages_config','$scope',
    function( pagetype, user_pages_service, session, page_modal_service, oadmin_model, session, pages_config, $scope ){

        var ctrl = this,
            page = 0,
            n = 12;

        ctrl.type = pagetype;
        ctrl.displayed_pages = [];
        ctrl.canCreate = false;
        ctrl.label = pages_config[pagetype].label;
        ctrl.title = 'My '+ ctrl.label +'s';
        ctrl.linkCategory = ctrl.label +'s';
        ctrl.canCreate = true;
        if ( pagetype === 'course' ) {
            ctrl.linkCategory = false;
            oadmin_model.get([session.id]).then(function(){
                ctrl.canCreate = session.roles[1] || oadmin_model.list[session.id].datum.length;
            });
        }

        // SET TITLE
        document.title = 'TWIC - '+ctrl.title;
        // GET PAGES
        ctrl.loading = true;
        user_pages_service.load([session.id],true).then(function(){
            ctrl.loading = false;
            ctrl.memberof = user_pages_service.memberof.length;
            ctrl.loadNextPages();
        });

        ctrl.openPageModal = function($event){
            page_modal_service.open( $event, ctrl.type );
        };

        ctrl.loadNextPages = function(){
            var total = ctrl.memberof,
                minRange = Math.max(0,n*page),
                maxRange = Math.min(n * (page + 1),total),
                toAdd = user_pages_service.memberof.slice( minRange, maxRange );
            if( toAdd.length ){
                Array.prototype.push.apply( ctrl.displayed_pages, toAdd );
                page++;
                $scope.$evalAsync();
            }
        };
    }
]);
