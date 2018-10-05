angular.module('welcome')
    .factory('WelcomeStep',['$q',
        function($q){


            var step = function( title, steptitle, hint, template, scope ){
                this.title = title;
                this.steptitle = steptitle;
                this.hint = hint;
                this.template = template;
                this.scope = scope;
            };

            step.prototype.isCompleted = function(){
                if(this.scope.isCompleted){
                    return this.scope.isCompleted();
                }
                else{
                    var defer =$q.defer();
                    defer.resolve(false);
                    return defer.promise;
                }
            };

            step.prototype.fill = function(){
                if(this.scope.fill){
                    return this.scope.fill();
                }
                else{
                    var defer =$q.defer();
                    defer.resolve(true);
                    return defer.promise;
                }
            };

            step.prototype.onComplete = function(){
                if(this.scope.onComplete){
                    return this.scope.onComplete();
                }
            };

            step.prototype.getNextLabel = function(){
                if(this.scope.getNextLabel){
                    return this.scope.getNextLabel();
                }
                else{
                    return "Next";
                }
            };

            return step;
        }
    ]);
