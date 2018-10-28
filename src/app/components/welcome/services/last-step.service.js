angular.module('welcome')
  .factory('LastStep',['WelcomeStep','user_model', 'session',
      function(WelcomeStep, user_model, session){


        var step = function(){};
        step.prototype = new WelcomeStep(
            null,
            null,
            "app/components/welcome/tpl/congrats.html",
            {
               onComplete : function(){
                    return true;
                },
                isCompleted : function(){
                    return user_model.queue([session.id]).then(function(){
                        return !!user_model.list[session.id].datum.welcome_date;
                    }.bind(this));
                }
              }
        );

        return step;
      }
  ]);
