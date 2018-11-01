"use strict";

angular.module('app',['ui.router', 'pascalprecht.translate','ngSanitize'].concat(ANGULAR_MODULES))
    .config(['$urlRouterProvider', '$locationProvider', '$sceDelegateProvider', '$translateProvider', '$compileProvider', '$qProvider',
        function ($urlRouterProvider, $locationProvider, $sceDelegateProvider, $translateProvider, $compileProvider, $qProvider ) {

            $locationProvider.html5Mode({ enabled: true });

            $urlRouterProvider.otherwise(function ($injector) {
                var $state = $injector.get('$state');
                $state.go('login');
            });

            if(!CONFIG.environment === 'dev'){
                $compileProvider.debugInfoEnabled(false);
            }
            $compileProvider.commentDirectivesEnabled(false);
            $compileProvider.cssClassDirectivesEnabled(false);

            $sceDelegateProvider.resourceUrlWhitelist([
                // Allow same origin resource loads.
                'self',
                // Allow social video platforms
                'http://www.youtube.com/embed/**',
                'http://player.vimeo.com/video/**',
                'http://www.dailymotion.com/embed/video/**'
            ].concat(CONFIG.whitelist));

            $translateProvider.useStaticFilesLoader({
                prefix: 'assets/i18n/',
                suffix: '.json'
            });

            // Not setting Strategy because of special characters... they're escaped...
            $translateProvider.useSanitizeValueStrategy('escape');
            $translateProvider.preferredLanguage('en');
            $translateProvider.fallbackLanguage('en');

        }
    ])
    .run(['$rootScope', '$state','events_service', 'events', 'session','storage','fcm_service', 'state_service', 'global_loader',
        function ($rootScope, $state, events_service, events, session, storage, fcm_service, state_service, global_loader ) {
            var location, fcm_token, fcm_uid;

            if( !session.id ){
                location = window.location.pathname.slice(1);
                if( $state.current.name.indexOf('lms.') === 0){
                    storage.setItem('location', location);
                }else{
                  location = '';
                }
            }

            // Exposing CONFIG object in scope.
            $rootScope.CONFIG = CONFIG;

            // ON NAVIGATION ERROR => RETURN ON LOGIN PAGE.
            $rootScope.$on('$stateChangeError', function(e, toState, toParams, fromState, fromParams, err) {
                global_loader.done();
                e.preventDefault();
                if(fromState.name === '') {
                    $state.go('login');
                }
                throw err;
            });

            // ON NAVIGATION
            $rootScope.$on('$stateChangeStart',function( e, to, params, from){
                global_loader.reset();
                if( to.name === 'mobile' ){
                    storage.setItem('fcm',JSON.stringify({token:params.fcmtoken, uid: params.fcmuid}));
                    if( session.id ){
                        fcm_service.register(params.fcmtoken, params.fcmuid);
                    }
                }

                // IF NOT LOGGED => REDIRECT ON LOGIN PAGE
                if( !session.id && to.name.indexOf('lms.') === 0){
                    e.preventDefault();
                    $state.go('login');
                }else if( session.id && to.name.indexOf('lms.') === -1 ){
                    e.preventDefault();
                    $state.go('lms.dashboard');
                }
                else if (to.redirectTo) {
                  e.preventDefault();
                  $state.go(to.redirectTo, params);
                }
                else{
                    var global =  !from.name || from.name.indexOf('lms.') !== 0;
                    global_loader.loading('state_change',0 , global);
                    if(to.global_loading){
                        to.global_loading.forEach(function(elem){
                            global_loader.loading(elem, 0 , global);
                        });
                    }
                }
            });

            $rootScope.$on('$stateChangeSuccess', function(_,to ,old_params, from, new_params) {
                state_service.current_state = to.name;
                state_service.parent_state = to.parent_state || to.nested || to.name;
                if(!to.nested || to.nested !== from.nested ||
                    (to.nested === from.nested && JSON.stringify(old_params) !== JSON.stringify(new_params))){
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                }
                if(to.title){
                    state_service.setTitle(to.title);
                }
                global_loader.done('state_change',  !from.name  ? 500 : 0);
             });

            $rootScope.$on('$stateChangeError', function() {
                global_loader.reset();
             });

            function onLogged(){
                var fcm = storage.getItem('fcm');
                if( fcm ){
                    try{
                        fcm = JSON.parse(fcm);
                        fcm_service.register(fcm.token, fcm.uid).then( execLogged );
                    }catch(e){}
                }else{
                    execLogged();
                }
            }

            function execLogged(){
                location = location || storage.getItem('location');
                if( location ){
                    storage.setItem('redirect','1');
                    storage.removeItem('location');
                    window.location = window.location.origin+'/'+location;
                }else{
                    $state.go('lms.dashboard');
                }
            }

            // REDIRECT USER ON LOGIN PAGE WHEN THEY DISCONNECT.
            events_service.on( events.logout_success, function(){
                global_loader.reset();
                if( !$state.is('login') && !$state.is('confirm-email') ){
                    $state.go('login');
                }
            });

            events_service.on( events.logged, onLogged );

            // ACCESSIBILITY FOCUS MANAGEMENT.
            document.addEventListener('keydown',function(e){
                if( e.keyCode === 9 ){
                    document.body.classList.add('tabing');
                }
            },true);

            document.addEventListener('mousedown',function(e){
                document.body.classList.remove('tabing');
            },true);

            // CONFIGURING RAVEN
            events_service.on( events.logged, configureRaven );
            events_service.on( events.logout_success, configureRaven );
            configureRaven();

            function configureRaven(){
                Raven.setUserContext({
                    id: ''+session.id,
                    version: CONFIG.buildVersion
                });
            }
        }
    ]);
