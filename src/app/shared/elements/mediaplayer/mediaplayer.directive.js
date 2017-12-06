angular.module('elements').directive('mediaplayer', ['filters_functions',
    function( filters_functions ){
        return {
            scope:{
                doc: '=?doc',
                sources: '=?sources',
                captions: '=?captions',
                options: '=?opt',
                title: '=?name'
            },
            resrict:'E',
            templateUrl:'app/shared/elements/audioplayer/audioplayer.html',
            link: function( scope, element ) {
                
                
            }
        };
    }
]);