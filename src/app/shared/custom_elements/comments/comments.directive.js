
angular.module('customElements')
    .directive('comments',[
        function(){
            return {
                restrict:'A',
                scope:{
                    parent_id:'=comments',
                    reply: '=reply',
                    secondLvl : '=',
                    init : '=',
                    last: '=last',
                    admin:'=?admin',
                    stream:'=?stream',
                    unstream:'=?unstream',
                    showinput:'=?',
                    showlast:'=?',
                    showcomments:'=?',
                    showreplies:'=?',
                    highlight: '=?'
                },
                controller: 'comments_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/comments/comments.html'
            };
        }
    ]);
