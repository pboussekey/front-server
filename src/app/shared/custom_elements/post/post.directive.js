
angular.module('customElements')
    .directive('post',[
        function(){
            return {
                restrict:'A',
                scope:{
                    id:'=post',
                    onremove:'=?onremove',
                    onshare:'=?onshare',
                    admin:'=?admin',
                    showinput:'=?',
                    showlast:'=?',
                    deployed:'=commentsDeployed',
                    inpage:'=?',
                    hideactions:'=',
                    highlightComments : '=?'
                },
                controller: 'post_controller',
                controllerAs: 'ctrl',
                templateUrl: 'app/shared/custom_elements/post/template.html'
            };
        }
    ]);
