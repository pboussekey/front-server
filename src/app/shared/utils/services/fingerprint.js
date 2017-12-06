angular.module('UTILS')
    .factory('fingerprint',['murmur_hash',function(murmur_hash){
        var key = Math.random(),
            screen = ['availHeight','availLeft','availTop','availWidth','colorDepth','height','pixelDepth','width'],
            screenorientation = ['angle','type'],
            navigator = ['appCodeName','appName','appVersion','language','platform','product','productSub','userAgent','vendor'];

        if( window.screen ){
            screen.forEach(function(k){ key+=k+window.screen[k]; });
        }
        if( window.screen.orientation ){
            screenorientation.forEach(function(k){ key+=k+window.screen.orientation[k]; });
        }
        if( window.navigator ){
            navigator.forEach(function(k){ key+=k+window.navigator[k]; });
        }
        return function( seed ){
            return murmur_hash( key, seed )+'';
        };
    }]);