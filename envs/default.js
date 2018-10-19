 module.exports = {
    // INFOS
    HTML_TITLE: 'TWIC',
    GUEST_ENTERPRISE_TITLE:'TWIC',
    GUEST_ENTERPRISE_LINK:'http://thestudnet.com/',
    // PLATFORM BASE HOSTNAME
    HOSTNAME_END: '.twic.com',
     // API
    API_DOMAIN:'local.api.com',
    API_AUTH_HEADER:'authorization',
    API_JSONRPC_PATH:'api.json-rpc',
    // DMS
    DMS_DOMAIN:'local.api.com',
    DMS_MAX_UPLOAD: 100 * 1024 * 1024,
    DMS_DATAS_PATH:'data',
    DMS_DOWNLOAD_PATH:'download',
    DMS_UPLOAD_PATH:'https://www.googleapis.com/upload/storage/v1/b/store.twicapp.io/o',
    DMS_COPY_PATH:'copy',
    DMS_USE_GOOGLE_SERVICES : true,
    DMS_BUCKET_URL : '',

    // VIDEOS PATH
    VIDEOS_PATH: "/videos",
    // IMAGES PATH
    IMAGES_PATH: 'assets/img/',
    // REAL TIME APP
    RT_DOMAIN:'local.events.com',
    RT_PORT:'8080',
    // SOCIAL NETWORK COMPANY URLS
    SOCIAL_FACEBOOK: 'https://www.facebook.com/TwicSLE/',
    SOCIAL_TWITTER:'https://twitter.com/TwicSLE',
    SOCIAL_LINKEDIN:'https://fr.linkedin.com/company/the-st-dnet',
    // CHROME WEBSTORE BASE URL
    CHROME_WEBSTORE_URL:'https://chrome.google.com/webstore/detail',
    // SENTRY RAVEN CONFIG URL
    SENTRY_RAVEN_URL: "https://8779d644e8554c35a965702c3bfb12dc@sentry.io/1200946",
    // DRIFT
    DRIFT_ID: 'phidz4yda8sh',
    // TOKBOX
    TOKBOX_SCRIPT_URL:'//static.opentok.com/v2/js/opentok.min.js',
    TOKBOX_API_KEY:'45635482',
    TOKBOX_CHROME_SS_ID:'iiknmdhhfchjlgibnekkkklpknaomnjn',
    // FIREBASE
    FIREBASE_SCRIPT_URL:'https://www.gstatic.com/firebasejs/4.2.0/firebase.js',
    FIREBASE_API_KEY : 'AIzaSyDAixtmz9QVIadOxOTuaKHAoc78EdEKMaw',
    FIREBASE_DOMAIN : 'studnet.firebaseapp.com',
    FIREBASE_DATABASE : 'https://studnet.firebaseio.com',
    FIREBASE_PROJECT : 'firebase-studnet',
    FIREBASE_STORAGE : 'firebase-studnet.appspot.com',
    FIREBASE_SENDER : '399722241216',
    // GOOGLE ANALYTICS
    ANALYTICS_ID: 'UA-71285581-1',
    // MAP BOX
    MAPBOX_TOKEN : 'pk.eyJ1IjoicGJvdXNzZWtleSIsImEiOiJjamR6c205aXYzN2dhMnd0M3p4M3VtNjc3In0.w-0Hn1Le-7XyJbnx1yFUQA',
    // MOBILE STORES URLS
    PLAY_STORE_URL_APP: 'https://play.google.com/store/apps/details?id=com.thestudnet.app',
    APP_STORE_URL_APP: 'https://itunes.apple.com/fr/app/twic-the-world-is-a-campus/id1165444530?l=en&mt=8',
    PLAY_STORE_URL_MESSENGER: 'https://play.google.com/store/apps/details?id=com.twic.messenger',
    APP_STORE_URL_MESSENGER: 'https://itunes.apple.com/fr/app/twic-messenger/id1354927415?l=en&mt=8',
    // SIGNIN
    LINKEDIN_SIGNIN_URL: 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&scope=r_basicprofile&state={STATE}&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}',
    LINKEDIN_CLIENT_ID: '77gpz90fnfvx72',
    // URL WHITELISTED.
    WHITELIST:[
        'https://www.youtube.com/**',
        'https://vimeo.com/**',
        'https://player.vimeo.com/**',
        'https://www.dailymotion.com/**',
        'https://dailymotion.com/**'
    ],
    // VIEW BOX URLS
    BOX_SCRIPT_URL:'https://cdn01.boxcdn.net/platform/preview/1.29.0/en-US/preview.js',
    BOX_STYLE_URL:'https://cdn01.boxcdn.net/platform/preview/1.29.0/en-US/preview.css',

    //ENVIRONMENT DEV OR PROD
    ENVIRONMENT : 'prod'
 };
