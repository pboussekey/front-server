angular.module('dashboard').controller('dashboard_controller',
    ['$scope','feed', 'session', 'user_courses', 'user_groups', 'user_events',
        'puadmin_model', 'events_service', 'events','post_model', 'oadmin_model', '$timeout',
        'assignments', 'items_model', 'item_submission_model', '$state', 'page_model', 'state_service',
        function( $scope, feed, session,  user_courses, user_groups, user_events,
        puadmin_model, events_service, events, post_model, oadmin_model, $timeout,
        assignments, items_model, item_submission_model, $state, page_model, state_service ){
            var ctrl = this;
            document.title = 'TWIC - Dashboard';
            ctrl.admins = puadmin_model;
            this.tpl = {
                left_column: 'app/components/app_layout/tpl/aside.html',
                center_column: 'app/components/app_layout/tpl/header.html'
            };

            state_service.parent_state =  'lms.dashboard';
            ctrl.user_events = user_events;
            ctrl.user_courses = user_courses;
            ctrl.user_groups = user_groups;

            user_courses.load([session.id], true).then(function(){
                ctrl.courses =  angular.copy(user_courses.memberof).sort(function() { return 0.5 - Math.random() }).slice(0,2);
            });
            user_events.load([session.id], true).then(function(){
                ctrl.events =  angular.copy(user_events.memberof).sort(function() { return 0.5 - Math.random() }).slice(0,2);
            });
            user_groups.load([session.id], true).then(function(){
                ctrl.groups =  angular.copy(user_groups.memberof).sort(function() { return 0.5 - Math.random() }).slice(0,2);
            });


            oadmin_model.queue([session.id]).then(function(){
                ctrl.organizations =  oadmin_model.list[session.id].datum;
            });

            // GET FEED POSTS
            feed.get(true);
            this.post_ids = feed.indexes;

            this.newPost = {
                content: '',
                files: []
            };

            this.onPostAdded = function(){
                ctrl.refresh();
            };

            this.onPostRemoved = function( postId ){
                feed.unset( postId );
            };

            // ON SCROLL => LOAD NEXT FEED POSTS
            ctrl.loadNext = function(){
                if( !ctrl.nomorefeed && !ctrl.loadingNext ){
                    ctrl.loadingNext = true;
                    feed.next().then(function( list ){
                        ctrl.loadingNext = false;

                        if( !list || list.length === 0 ){
                            ctrl.nomorefeed = true;
                        }
                    });
                }
            };

            ctrl.refresh = function( last ){
                ctrl.hasUpdates = 0;
                ctrl.refreshing = true;

                post_model.queue([feed.indexes[0]]);

                feed.refresh().then(function(){
                    ctrl.refreshing = false;
                });
            };

            ctrl.hasUpdates = 0;
            var lfu = events_service.on( events.feed_updates, function(){
                ctrl.hasUpdates++;
                $scope.$evalAsync();
            });

            ctrl.goToAssignment = function(item){
                if(item.type === 'LC'){
                    var url = $state.href('liveclass', { id : item.id });
                    window.open(url).focus();
                }
                else{
                    $state.go('lms.page.content' , { id : item.page_id, type : 'course', item_id : item.id });
                }
            };


            $scope.$on('$destroy', function(){
                events_service.off( events.feed_updates, lfu );
            });

            ctrl.getStickyTop = function(){
                var distance = Math.min( 120, document.querySelector('#body').clientHeight - document.querySelector('.sticky').clientHeight - 80 );
                return {top: distance +'px' };
            };
        }
    ]);
