angular.module('welcome')
  .factory('AddressStep',['WelcomeStep','user_model', 'session', 'profile', 'countries', 'filters_functions',
      function(WelcomeStep, user_model, session, profile, countries, filters_functions){

          var step = function(){};
          step.prototype = new WelcomeStep(
                "Tell your peers<br/> about yourself!",
                "About yourself",
                "Everyone has a story and it always starts with a journey!",
                "app/components/welcome/tpl/address.html",
                {
                  isCompleted : function(){
                      return user_model.queue([session.id]).then(function(){
                          return user_model.list[session.id].datum.address || user_model.list[session.id].datum.origin;
                      });
                  },
                  onComplete : function(){
                      profile.updateAddress(this.tmpAddress, session.id);
                      profile.updateOrigin(this.tmpOrigin, session.id);
                      return true;
                  },
                  fill : function(){
                      return user_model.queue([session.id]).then(function(){
                          var me = user_model.list[session.id].datum;
                          if(me.origin){
                              this.tmpOrigin = me.origin.short_name;
                          }
                          if(me.address && me.address.id){
                              this.tmpAddress = filters_functions.address(me.address);
                          }
                          return true;
                      });
                  },
                  searchOrigin : function(search){
                      if(!search){
                          this.tmpOrigin = null;
                          return [];
                      }
                      else{
                          return countries.getList(search);
                      }
              }
          });

          return step;
      }]);
