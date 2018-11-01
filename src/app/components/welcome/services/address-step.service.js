angular.module('welcome')
  .factory('AddressStep',['WelcomeStep','user_model', 'session', 'user_profile', 'countries', 'filters_functions', 'programs_service', '$q',
      function(WelcomeStep, user_model, session, profile, countries, filters_functions, programs_service, $q){

          var step = function(){};
          step.prototype = new WelcomeStep(
                "Congratulations, you are in!",
                "Just a few more steps and you are good to go!",
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
                        if(this.program_search){
                            profile.updateProgram(this.program_search.search, session.id);
                        }
                        profile.updateGraduation(this.tmpGraduationYear, session.id);
                        return true;
                    },
                    fill : function(){
                        this.completed = true;
                        return user_model.queue([session.id]).then(function(){
                            var me = user_model.list[session.id].datum;
                            if(me.origin){
                                this.tmpOrigin = me.origin.short_name;
                            }
                            if(me.address && me.address.id){
                                this.tmpAddress = filters_functions.address(me.address);
                            }
                            if(me.graduation_year){
                                this.tmpGraduationYear = me.graduation_year;
                            }
                            if(me.programs && me.programs.length){
                                this.program = me.programs[0];
                            }
                            var that = this;
                            this.previousPrograms = [];
                            this.searchPrograms = function(search, filter){
                                if(search !== that.previousSearch){
                                    that.ended_programs = false;
                                }
                                that.previousSearch = search;
                                if(!that.loading_programs && !that.ended_programs){
                                    that.loading_programs = true;
                                    return programs_service.getList(me.organization_id, search, filter).then(function(programs){
                                        that.loading_programs = false;
                                        that.previousPrograms = programs.list;
                                        that.ended_programs = programs.list.length < 10;
                                        return programs.list;
                                    });
                                }
                                else{
                                   var q = $q.defer();
                                   q.resolve(that.previousPrograms);
                                   return q.promise;
                                }
                            };
                            return true;
                        }.bind(this));
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
