angular.module('welcome')
  .factory('avatar_step',['WelcomeStep','user_model', 'session', 'profile',
      function(WelcomeStep, user_model, session, profile){


          return new WelcomeStep(
              "Set profile picture",
              null,
              "Don't be a stranger! Your photo will make it easier for your teamates to recognize you.",
              "app/components/welcome/tpl/avatar.html",
              10,
              {
                  isCompleted : function(){
                      return user_model.queue([session.id]).then(function(){
                          return user_model.list[session.id].datum.avatar;
                      });
                  },
                  onComplete : function(){
                      if(this.avatar){
                          this.crop().then(function(blob){
                              profile.updateAvatar(blob, session.id);
                          });
                      }
                      else{
                          profile.updateAvatar(null, session.id);
                      }
                      service.nextStep();
                  },
                  fill : function(){
                      return user_model.queue([session.id]).then(function(){
                          if(!this.avatar && user_model.list[session.id].datum.avatar){
                              this.avatar = filters_functions.dmsLink(user_model.list[session.id].datum.avatar);
                              this.loadCropper( this.avatar, false, true );
                          }
                          return true;
                      });
                  },
                  onAvatarFile : function( files, input ){
                      if( files && files.length ){
                          this.avatar =  URL.createObjectURL(files[0]);
                          $timeout(function(){
                              this.loadCropper( this.avatar, false, true );
                          });

                      }
                      else{
                          this.avatar =  null;
                          $timeout(function(){
                              this.loadCropper( null, false, true );
                          });
                      }
                      if(input){
                          input.value = null;
                      }
                  }
              }
          );


      }
  ]);
