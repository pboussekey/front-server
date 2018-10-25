angular.module('welcome')
  .factory('AvatarStep',['WelcomeStep','user_model', 'session', 'user_profile', '$timeout', 'filters_functions',
      function(WelcomeStep, user_model, session, profile, $timeout, filters_functions){
        var step = function(){};
        var that;
        step.prototype =  new  WelcomeStep(
                "Don't be a stranger",
                null,
                "app/components/welcome/tpl/avatar.html",
                {
                    isCompleted : function(){
                        return user_model.queue([session.id]).then(function(){
                            return user_model.list[session.id].datum.avatar;
                        });
                    },
                    fill : function(){
                        var that = this;
                        this.completed = true;
                        this.onAvatarFile = function( files, input ){
                            if( files && files.length ){
                                that.file = files[0];
                                that.avatar =  URL.createObjectURL(that.file);
                                $timeout(function(){
                                    that.loadCropper( that.avatar, false, true );
                                });

                            }
                            else{
                                $timeout(function(){
                                    that.avatar = null;
                                    that.loadCropper( null, false, true );
                                });
                            }
                            if(input){
                                input.value = null;
                            }
                        };

                        this.onComplete = function(){
                            if(that.avatar){
                                that.crop().then(function(blob){
                                    that.avatar = null;
                                    profile.updateAvatar(blob, session.id);
                                });
                            }
                            else{
                                profile.updateAvatar(null, session.id);
                            }
                            return true;
                        };
                        return user_model.queue([session.id]).then(function(){
                            if(user_model.list[session.id].datum.avatar){
                              this.default = user_model.list[session.id].datum.avatar;
                            }
                            return true;
                        }.bind(this));
                    },
            });

            return step;

  }]);
