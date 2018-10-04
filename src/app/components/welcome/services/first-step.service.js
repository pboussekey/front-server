angular.module('welcome')
  .factory('first_step',['WelcomeStep','user_model', 'session',
      function(WelcomeStep, user_model, session){


          return new WelcomeStep(
              null,
              null,
              null,
              "app/components/welcome/tpl/welcome.html",
              1000000,
              {
                 onComplete : function(){
                      return true;
                  },
                  isCompleted : function(){
                      return user_model.queue([session.id]).then(function(){
                          return !!user_model.list[session.id].datum.welcome_date;
                      });
                  }
              }
          );


      }
  ]);
