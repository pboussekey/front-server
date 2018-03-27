angular.module('users-import')
    .controller('users-import-controller',['$scope', 'community_service', '$parse', '$attrs',
        function ( $scope, community, $parse, $attrs ) {
        
            var ctrl = this;
            ctrl.labels = $scope.labels || { user :  'participant%s%', action : 'invite' };
            
            var email_regex = new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$');
            ctrl.show_import = false;
            ctrl.show_errors = false;
            ctrl.email_list = "";
            
            function  isEmail(source){
                return email_regex.test(source);
            }
            
            ctrl.countEmails = function(){
                var emails = ctrl.email_list.trim().split(/[\s\n,;]+/);
                return emails.filter(function(line, idx){
                        return line || (idx + 1) < emails.length;
                    }).length;
            };
            
            ctrl.processEmails = function(){
                    if(ctrl.loading){
                        return;
                    }
                    ctrl.errors = { 
                        ALREADY_EXIST : [],
                        DOESNT_EXIST : [],
                        INVALID : []
                    };
                    ctrl.imported = {
                        id : [],
                        email : []
                    };
                    var emails = ctrl.email_list.split(/[\s\n,;]+/).filter(function(email){
                        if(!isEmail(email)){
                            ctrl.errors.INVALID.push(email);
                            return false;
                        }
                        else{
                            return true;
                        }
                    });
                    
                    ctrl.lines_count = emails.length + ctrl.errors.INVALID.length;
                    if(!emails.length){
                        ctrl.loading = false;
                        return;
                    }
                    ctrl.loading = true;
                    community.checkEmails(emails).then(function(r){
                        ctrl.already_exists = 0;
                        angular.forEach(r,function(id, email){
                            if((($scope.exclude && $scope.exclude.id) || []).indexOf(id) === -1 
                                && (($scope.exclude && $scope.exclude.email)|| []).indexOf(email) === -1){
                                if(id && ctrl.imported.id.indexOf(id) === -1){
                                    ctrl.imported.id.push(id);
                                }
                                else if($scope.canCreateAccount && ctrl.imported.email.indexOf(email) === -1){
                                    ctrl.imported.email.push(email);
                                }
                                else if(ctrl.errors.DOESNT_EXIST.indexOf(email) === -1){
                                    ctrl.errors.DOESNT_EXIST.push(email);
                                }
                               
                            }
                            else if(ctrl.errors.ALREADY_EXIST.indexOf(id) === -1){
                                ctrl.errors.ALREADY_EXIST.push(id);
                            }
                        });
                        ctrl.email_list = '';
                        ctrl.email_processed = true;
                        ctrl.loading = false;
                        ctrl.show_error = (ctrl.imported.id.length + ctrl.imported.email.length) === 0;
                    }, function(){ ctrl.loading = false; });
                };
                ctrl.close = function(){
                    ctrl.show_import = false;
                    ctrl.show_error = false;
                    ctrl.email_processed = false;
                    ctrl.email_list = "";
                };
                if($parse($attrs.close).assign){
                    $scope.close = ctrl.close;
                }
                ctrl.callback = $scope.callback;
                
        }
    ]);