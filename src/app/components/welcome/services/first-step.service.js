angular.module('welcome')
  .factory('FirstStep',['WelcomeStep','user_model', 'session',
      function(WelcomeStep, user_model, session){


        var step = function(){};
        step.prototype = new WelcomeStep(
            null,
            null,
            null,
            "app/components/welcome/tpl/welcome.html",
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

        return step;
      }
  ]);
