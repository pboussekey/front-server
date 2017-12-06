angular.module('elements').controller('datepicker_controller',
    ['$scope',  '$element', 'filters_functions', '$timeout', '$parse', '$attrs',
        function( scope, element, filters_functions, $timeout, $parse, $attrs){
            
            var input = element[0].querySelector('[datepicker-input]');
            var panel = element[0].querySelector('[datepicker-panel]');
            var focusable_selector = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]";
            var format = { 
                time : scope.datepickerFormat  ||  filters_functions.dateWithHour,
                day :  scope.datepickerFormat ||  filters_functions.dateWithoutHour,
                month : scope.datepickerFormat || filters_functions.dateWithoutDay,
                year : scope.datepickerFormat || filters_functions.dateWithoutDay
            };
            
            var line_size = {
                day : 7,
                month : 6,
                year : 5
            };
            
            var focusables_by_lines;
            // SET ACCESSIBILITY ARIA ATTRIBUTES
            input.setAttribute('aria-haspopup', 'true');
            input.setAttribute('aria-expanded', 'false');
          
            if( !element.id ){
                element.id = 'DP_'+ (Math.random()+'').slice(2);
            }
            scope.id = element.id;
            
            panel.setAttribute('aria-labelledby',input.id);
            panel.setAttribute('aria-hidden','true');
                    
            scope.current_date = new Date();
            scope.current_date.setHours(0);
            scope.current_date.setMinutes(0);
            scope.current_date.setSeconds(0);
            scope.current_date.setMilliseconds(0);
            scope.states = scope.datepickerStates || ['month', 'day', 'year'];
            
            init(); 
            element[0].addEventListener('keydown', onElementKeyDown, true );
           
            scope.days = ['Mo','Tu','We','Th','Fr','Sa','Su'];
            scope.months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBRER','DECEMBER'];
            scope.current_month = (scope.selected_date || scope.current_date).getMonth();
            scope.current_year = (scope.selected_date ||  scope.current_date).getFullYear();
            scope.current_decade = scope.current_year - scope.current_year % 10;
            
            
            function build(){
               
                $timeout(function(){
                    if(scope.state === 'day'){
                        scope.dates = [];
                        var date = new Date(scope.current_year, scope.current_month, 1, 0, 0, 0);
                        date.setDate(date.getDate()- (date.getDay() + 6) % 7);
                        var end = new Date(scope.current_year, scope.current_month + 1, 0, 0, 0, 0);
                        end.setDate(end.getDate() + (6 - (end.getDay() + 6) % 7));
                        while(date <= end){
                            scope.dates.push({ day : date.getDate(), date : new Date(date) });
                            date.setDate(date.getDate() + 1);
                        }  
                    }
                    else if(scope.state === 'year'){
                        scope.dates = [];
                        for(var i = 0; i < 10; i++){
                            scope.dates.push(scope.current_decade + i);
                        }
                    } 
                    else if(scope.state === 'time'){
                        scope.hours = [1,2,3,4,5,6,7,8,9,10,11,12];
                        scope.minutes = [0,5,10,15,20,25,30,35,40,45,50,55];
                        scope.current_hour = (scope.selected_date || scope.current_date).getHours() % 12 || 12;
                        scope.time_label = (scope.selected_date || scope.current_date).getHours() < 12 ? 'AM' : 'PM';
                        scope.current_minutes = (scope.selected_date || scope.current_date).getMinutes() - ((scope.selected_date || scope.current_date).getMinutes() % 5) ;
                
                        var datepicker_hour = new Hammer(element[0].querySelector('.datepicker_hours'));
                        datepicker_hour.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
                        datepicker_hour.on('swipe', function(ev) {
                            scope.selectHour(Math.min(12, Math.max(1, scope.current_hour - 1 * parseInt(ev.deltaY / 50))));
                        });
                        var datepicker_minutes = new Hammer(element[0].querySelector('.datepicker_minutes'));
                        datepicker_minutes.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
                        datepicker_minutes.on('swipe', function(ev) {
                            scope.selectMinutes(Math.min(55, Math.max(0, scope.current_minutes - 5 * parseInt(ev.deltaY / 50))));
                        });
                    }
                    scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                });
                //Sort focusables by lines for keyboard navigation
                $timeout(function(){
                    panel = element[0].querySelector('[datepicker-panel]');
                    var empty = element[0].querySelector(".empty");
                    focusables_by_lines = [
                        [input, empty],
                        Array.prototype.slice.call(panel.querySelectorAll(".decade_header > button:not([disabled])")),
                        Array.prototype.slice.call(panel.querySelectorAll(".year_header > button:not([disabled])")),
                        Array.prototype.slice.call(panel.querySelectorAll(".month_header > button:not([disabled])"))
                    ].filter(function(line){
                        return line.length;
                    });
                    var nb_lines = focusables_by_lines.length;
                    panel.querySelectorAll(".datepicker_content > button:not([disabled])").forEach(function(focusable, index){
                        var line = parseInt(index / line_size[scope.state]) + nb_lines;
                        if(!focusables_by_lines[line]){
                            focusables_by_lines.push([]);
                        }
                        focusables_by_lines[line].push(focusable);
                    });
                });
              
            };
            
            
            scope.changeState = function(state){
                if(scope.states.indexOf(state) !== -1){
                    scope.state = state;  
                    build();
                    return true;
                }
                else{
                    scope.close();
                    input.focus();
                    return false;
                }
            };
            
            scope.selectTime = function(label){
                if(label !== scope.time_label){
                    scope.time_label = label;
                    if(!scope.selected_date){
                        scope.selected_date = angular.copy(scope.current_date);
                    }
                    scope.selected_date.setHours(scope.selected_date.getHours() + (scope.selected_date.getHours() > 11 ? -12 : 12)); 
                    if(scope.mindate && scope.selected_date < scope.mindate){
                        scope.selected_date = new Date(scope.mindate); 
                    }
                    else if(scope.maxdate && scope.selected_date > scope.maxdate){
                        scope.selected_date = new Date(scope.maxdate);
                    }
                    scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";

                    if(scope.callback){
                       scope.callback(scope.selected_date); 
                    }
                }
            };
            
            scope.previousMonth = function(){
                scope.current_month--;
                if(scope.current_month < 0){
                    scope.current_year--;
                    scope.current_month = 11;
                    scope.current_decade = scope.current_year - scope.current_year % 10;
                }
                build();
            };
            
            scope.nextMonth = function(){
                scope.current_month++;
                if(scope.current_month > 11){
                    scope.current_year++;
                    scope.current_month = 0;
                    scope.current_decade = scope.current_year - scope.current_year % 10;
                }
                build();
            };
            
            scope.previousYear = function(){
                scope.current_year--;
                scope.current_decade = scope.current_year - scope.current_year % 10;
                build();
            };
            
            scope.nextYear = function(){
                scope.current_year++;
                scope.current_decade = scope.current_year - scope.current_year % 10;
                build();
            };
            
            
            scope.previousDecade = function(){
                scope.current_decade-= 10;
                build();
            };
            
            scope.nextDecade = function(){
                scope.current_decade+=10;
                build();
            };
            
            scope.previousDay = function(){
                scope.current_day-= 1;
                scope.selected_date.setDate(scope.current_day);
                scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
            };
            
            scope.nextDay = function(){
                scope.current_day+=1;
                scope.selected_date.setDate(scope.current_day);
                scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
            };
            
            
            
            // BIND EVENTS
            input.addEventListener('click', function(e){    
                if( !element[0].classList.contains('opened') ){
                    scope.open();
                }
            });
            input.addEventListener('focus', function(e){    
                if( !element[0].classList.contains('opened') ){
                    scope.initialValue = scope.selected_date;
                    scope.open();
                }
            });
                 
            function init(date){
                scope.$evalAsync();
                if(date){
                    scope.selected_date = date;
                }
                if(scope.selected_date !== null && scope.selected_date !== undefined && !(scope.selected_date instanceof Date)){
                    scope.selected_date = new Date(scope.selected_date);
                }
                scope.state = scope.states[0];
                scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                scope.current_month = (scope.selected_date || scope.current_date).getMonth();
                scope.current_year = (scope.selected_date || scope.current_date).getFullYear();
                scope.current_decade = scope.current_year - scope.current_year % 10;
                
                scope.$evalAsync();
                build();
            }           
           
            if($parse($attrs.datepickerBuild).assign){
                scope.datepickerBuild = init;
            }

            scope.open = function(){
                init();
                scope.opened = true;
                scope.initialValue = angular.copy(scope.selected_date);
                element[0].classList.add('opened');
                input.focus();
                document.addEventListener('click', onclick, true );
                if(!scope.selected_date){
                    scope.selected_date = new Date();
                }
               
                // ACCESSIBILITY ATTRIBUTES UPDATES
                input.setAttribute('aria-expanded', 'true');
                panel.setAttribute('aria-hidden','false');
            };
            
            scope.selectDay = function(date){
                scope.selected_date = date;
                scope.current_month = scope.selected_date.getMonth();
                scope.current_year = scope.selected_date.getFullYear();
                scope.current_decade = scope.current_year - scope.current_year % 10;
                scope.current_day = date.getDate();
                scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                build();
                if(scope.callback){
                    scope.callback(scope.selected_date); 
                }
                if(scope.states.indexOf('time') === -1){
                    scope.close();
                    input.focus();
                }
                else{
                    scope.state = 'time';
                }
            };
            
            scope.selectHour = function(hour){
                scope.selected_date.setHours((hour % 12) + (scope.time_label === 'PM' ? 12 : 0));
                scope.current_hour = (scope.selected_date || scope.current_date).getHours() % 12 || 12;
                scope.time_label = (scope.selected_date || scope.current_date).getHours() < 12 ? 'AM' : 'PM';
                scope.current_minutes = (scope.selected_date || scope.current_date).getMinutes() - ((scope.selected_date || scope.current_date).getMinutes() % 5) ;
                scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                scope.$evalAsync();
            };
            
            scope.selectMinutes = function(minutes){
                scope.selected_date.setMinutes(minutes);
                scope.current_hour = (scope.selected_date || scope.current_date).getHours() % 12 || 12;
                scope.time_label = (scope.selected_date || scope.current_date).getHours() < 12 ? 'AM' : 'PM';
                scope.current_minutes = (scope.selected_date || scope.current_date).getMinutes() - ((scope.selected_date || scope.current_date).getMinutes() % 5) ;
                scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                scope.$evalAsync();
            };
            
            
            scope.selectMonth = function(month){
               
                scope.current_month = month;
                if(!scope.changeState('day')){
                    if(!scope.selected_date){
                        scope.selected_date = new Date(scope.current_year, month, 1);
                    }
                    else{
                        scope.selected_date.setDate(1);
                        scope.selected_date.setYear(scope.current_year);
                        scope.selected_date.setMonth(month);
                    }
                    scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                    scope.current_year = scope.selected_date.getFullYear();
                    scope.current_decade = scope.current_year - scope.current_year % 10;
                    if(scope.callback){
                        scope.callback(scope.selected_date); 
                    }
                }
            };
            
            scope.selectYear = function(year){
                scope.current_year = year;
                if(!scope.changeState('month')){
                    if(!scope.selected_date){
                        scope.selected_date = new Date(year, 0, 1); 
                    }
                    else{
                        scope.selected_date.setYear(year);
                    }
                    scope.current_month = scope.selected_date.getMonth();
                    scope.current_decade = scope.current_year - scope.current_year % 10;
                    if(scope.callback){
                        scope.callback(scope.selected_date); 
                    }
                }
            };
            
            scope.cancel = function(){
                scope.selected_date = scope.initialValue;
                scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                scope.close();
            };
            
            scope.reset = function(){
                scope.selected_date = null;
                scope.formatted_date = "" ;
                scope.formatted_hour = "" ;
                scope.close();
            };
            
            scope.IsSelectable = function(date,year, month, day){
                if(!date){
                    date = new Date(year, month, day);
                }
                return   !(scope.mindate && scope.mindate instanceof Date &&
                    (
                        date.getFullYear() < scope.mindate.getFullYear() ||
                        (date.getFullYear() === scope.mindate.getFullYear() && date.getMonth() < scope.mindate.getMonth()) ||
                        (date.getFullYear() === scope.mindate.getFullYear() && date.getMonth() === scope.mindate.getMonth() && date.getDate() < scope.mindate.getDate())
                    ) 
                )
                &&
                !(scope.maxdate && scope.maxdate instanceof Date &&
                    (
                        date.getFullYear() > scope.maxdate.getFullYear() ||
                        (date.getFullYear() === scope.maxdate.getFullYear() && date.getMonth() > scope.maxdate.getMonth()) ||
                        (date.getFullYear() === scope.maxdate.getFullYear() && date.getMonth() === scope.maxdate.getMonth() && date.getDate() > scope.maxdate.getDate())
                    ) 
                );
            };
                  
            
            function onclick( e ){
                if(!panel.contains(e.target) && !input.contains(e.target) ){
                    scope.close();
                }
                else{
                    e.preventDefault();
                }
            }
                                    
            function focusedIndex(){
                var focusables = element[0].querySelectorAll(focusable_selector);
                return document.activeElement === input ? 0 : Array.prototype.indexOf.call(focusables, document.activeElement);
            }
        
            function onElementKeyDown(e){
                var focusables = element[0].querySelectorAll(focusable_selector);
                var index = focusedIndex();
                if(e.keyCode === 13 && document.activeElement === input){
                    scope.open();
                }
                else if(e.keyCode === 9){
                    scope.close();
                    if(e.shiftKey){
                        if(document.activeElement !== input){
                            getPreviousElement().focus();
                            scope.close();
                            e.preventDefault();
                        }
                    }
                    else{
                        getNextElement().focus();
                        e.preventDefault();
                    }
                }
                //LEFT
                else if(e.keyCode === 37){
                    focusables[Math.max(0, index - 1)].focus();
                    e.preventDefault();
                }
                //UP
                else if(e.keyCode === 38){
                    var focus = false;
                    focusables_by_lines.forEach(function(focusables, line){
                        if(!focus){
                            var index = focusables.indexOf(document.activeElement);
                            if(index !== -1 && focusables_by_lines[line - 1]){
                                (focusables_by_lines[line - 1][index] || focusables_by_lines[line - 1][0]).focus();
                                focus = true;
                            }      
                        }
                    });
                    if(!focus){
                        input.focus();
                    }
                    e.preventDefault();
                }
                //RIGHT
                else if(e.keyCode === 39){
                    focusables[Math.min(focusables.length - 1, index + 1)].focus();
                    e.preventDefault();
                }
                //DOWN
                else if(e.keyCode === 40){
                    var focus = false;
                    focusables_by_lines.forEach(function(focusables, line){
                        if(!focus){
                            var index = focusables.indexOf(document.activeElement);
                            if(index !== -1 && focusables_by_lines[line + 1]){
                                (focusables_by_lines[line + 1][index] || focusables_by_lines[line + 1][0]).focus();
                                focus = true;
                            } 
                        }
                       
                    });
                    if(!focus){
                        input.focus();
                    }
                    e.preventDefault();
                }
            }
            
            function getNextElement(){
                
                var focusables = document.querySelectorAll(focusable_selector);
                return focusables[Array.prototype.indexOf.call(focusables, input) + panel.querySelectorAll(focusable_selector).length + 2]; 
            }
            
            
            function getPreviousElement(){
                
                var focusables = document.querySelectorAll(focusable_selector);
                return focusables[Array.prototype.indexOf.call(focusables, input) - 1]; 
            }
            
            scope.close = function(){
                setTimeout(function(){
                    scope.opened = false;
                    scope.initialValue = null;
                    element[0].classList.remove('opened');
                    document.removeEventListener('click', onclick, true);                   
                    // ACCESSIBILITY ATTRIBUTES UPDATES
                    input.setAttribute('aria-expanded', 'false');
                    panel.setAttribute('aria-hidden','true');
                    scope.state = scope.selected_date ? scope.states[scope.states.length -1 ] : scope.states[0];
                });
            };
            
            
            
            
    }
]);