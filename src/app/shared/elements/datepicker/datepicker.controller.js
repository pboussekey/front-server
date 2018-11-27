angular.module('elements').controller('datepicker_controller',
    ['$scope',  '$element', 'filters_functions', '$timeout', '$parse', '$attrs',
        function( scope, element, filters_functions, $timeout, $parse, $attrs){

            var input = element[0].querySelector('[datepicker-input]');
            var inputtime = element[0].querySelector('[timepicker-input]');
            var panel = element[0].querySelector('[datepicker-panel]');
            var focusable_selector = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]";
            var format = {
                time : scope.datepickerFormat  ||  filters_functions.dateWithoutHour,
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
            inputtime.setAttribute('aria-haspopup', 'true');
            inputtime.setAttribute('aria-expanded', 'false');

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
            scope.states = scope.datepickerStates || ['year', 'month', 'day'];
            scope.time = scope.states.indexOf('time') !== -1;
            scope.time_label = (scope.selected_date || scope.current_date).getHours() < 12 ? 'AM' : 'PM';

            init();
            element[0].addEventListener('keydown', onElementKeyDown, true );

            scope.days = ['Mo','Tu','We','Th','Fr','Sa','Su'];
            scope.months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBRER','DECEMBER'];
            scope.current_month = (scope.selected_date || scope.current_date).getMonth();
            scope.current_year = (scope.selected_date ||  scope.current_date).getFullYear();
            scope.current_decade = scope.current_year - scope.current_year % 10;


            function build(){
                $timeout(function(){
                    scope.dates = [];
                    scope.selectables = [];
                    if(scope.state === 'day'){
                        var date = new Date(scope.current_year, scope.current_month, 1, 0, 0, 0);
                        date.setDate(date.getDate() - (date.getDay() + 6) % 7);
                        var end = new Date(scope.current_year, scope.current_month + 1, 0, 0, 0, 0);
                        end.setDate(end.getDate() + (6 - (end.getDay() + 6) % 7));
                        scope.previous = scope.IsSelectable(null, scope.current_year, scope.current_month, date.getDate() - 1);
                        scope.next = scope.IsSelectable(null, scope.current_year, scope.current_month + 1);
                        while(date <= end){
                            scope.dates.push({ day : date.getDate(), date : new Date(date) });
                            scope.selectables.push(scope.IsSelectable(date));
                            date.setDate(date.getDate() + 1);
                        }
                    }
                    else if(scope.state === 'month'){
                        scope.previous = scope.IsSelectable(null, scope.current_year - 1, 12, 31);
                        scope.next = scope.IsSelectable(null, scope.current_year + 1, 0, 1);
                        for(var i = 0; i < 12; i++){
                            scope.selectables.push(scope.IsSelectable(null, scope.current_year, i));
                        }
                    }
                    else if(scope.state === 'year'){
                        scope.dates = [];
                        scope.previous = scope.IsSelectable(null, scope.current_decade - 1, 12, 31);
                        scope.next = scope.IsSelectable(null, scope.current_decade + 10, 0, 1);
                        for(var i = 0; i < 10; i++){
                            scope.dates.push(scope.current_decade + i);
                            scope.selectables.push(scope.IsSelectable(null, scope.current_decade + i));
                        }
                    }
                    else if(scope.state === 'decade'){
                        scope.previous = scope.IsSelectable(null, scope.current_decade - 1, 12, 31);
                        scope.next = scope.IsSelectable(null, scope.current_decade + 10, 0, 1);
                        for(var i = 0; i < 10; i++){
                            scope.selectables.push(scope.IsSelectable(null,  scope.current_decade + i));
                        }
                    }
                    else if(scope.state === 'time'){
                        scope.selectables = {};
                        for(var h = 1; h < 25; h++){
                          scope.selectables[h] = [];
                          for(var m = 0; m < 60; m = m + 5){
                            var date = new Date(scope.current_date);
                            var hour = (h === 12 || h === 24) ? (h - 12) : h
                            date.setHours(hour);
                            date.setMinutes(m);
                            date.setSeconds(0);
                            date.setMilliseconds(0);
                            scope.selectables[h].push((!scope.mindate || scope.mindate <= date) && (!scope.maxdate || scope.maxdate >= date));
                          }
                        }
                        scope.hours = [1,2,3,4,5,6,7,8,9,10,11,12];
                        scope.minutes = [0,5,10,15,20,25,30,35,40,45,50,55];
                        checkBounds();
                        scope.current_hour = (scope.current_date || scope.current_date).getHours() % 12 || 12;
                        scope.time_label = (scope.current_date || scope.current_date).getHours() < 12 ? 'AM' : 'PM';
                        scope.current_minutes = (scope.current_date || scope.current_date).getMinutes() - ((scope.current_date || scope.current_date).getMinutes() % 5) ;

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
                    scope.formatted_time = scope.selected_date ? (filters_functions.hour(scope.selected_date) + ' ' + scope.time_label) : "";
                });
                //Sort focusables by lines for keyboard navigation
                $timeout(function(){
                    panel = element[0].querySelector('[datepicker-panel]');
                    var empty = element[0].querySelector(".empty");
                    focusables_by_lines = [
                        [input, inputtime, empty],
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
                    if(state === 'time'){
                      input.setAttribute('aria-expanded', 'false');
                      inputtime.setAttribute('aria-expanded', 'true');
                    }
                    else{
                      inputtime.setAttribute('aria-expanded', 'false');
                      input.setAttribute('aria-expanded', 'true');
                    }
                    build();
                    return true;
                }
                else{
                    scope.close();
                    input.focus();
                    scope.selected_date = new Date(scope.current_date);
                    return false;
                }
            };

            scope.selectTime = function(label){
                if(label !== scope.time_label){
                    scope.time_label = label;
                    if(!scope.selected_date){
                        scope.selected_date = new Date(scope.current_date);
                    }
                    scope.selected_date.setHours(scope.selected_date.getHours() + (scope.selected_date.getHours() > 11 ? -12 : 12));
                    checkBounds();
                    scope.time_label = (scope.selected_date || scope.current_date).getHours() < 12 ? 'AM' : 'PM';
                    scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                    scope.formatted_time = scope.selected_date ? (filters_functions.hour(scope.selected_date) + ' ' + scope.time_label) : "";

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

            // BIND EVENTS
            input.addEventListener('click', function(e){
                if( !element[0].classList.contains('opened') || scope.state === 'time' ){
                    scope.open();
                }
            });
            inputtime.addEventListener('click', function(e){
                if( !element[0].classList.contains('opened') || scope.state !== 'time' ){
                    scope.open('time');
                }
            });
            input.addEventListener('focus', function(e){
                if( !element[0].classList.contains('opened') || scope.state === 'time' ){
                    scope.open();
                }
            });
            inputtime.addEventListener('focus', function(e){
                if( !element[0].classList.contains('opened') || scope.state !== 'time' ){
                    scope.open('time');
                }
            });

            function init(state){
                scope.$evalAsync();
                if(scope.selected_date){
                    scope.current_date = new Date(scope.selected_date);
                    scope.selected_date = new Date(scope.selected_date);
                    scope.formatted_date = format[scope.states[scope.states.length -1 ]](scope.selected_date);
                    scope.formatted_time = scope.selected_date ? (filters_functions.hour(scope.selected_date) + ' ' + scope.time_label) : "";
                }
                var states = scope.states.filter(function(state){ return state !== 'time';});
                scope.state = state || (scope.selected_date ? states[states.length -1 ] : states[0]);
                scope.current_month = (scope.current_date).getMonth();
                scope.current_year = (scope.current_date).getFullYear();
                scope.current_decade = scope.current_year - scope.current_year % 10;
                scope.$evalAsync();
                build();
            }

            if($parse($attrs.datepickerBuild).assign){
                scope.datepickerBuild = init;
            }

            scope.open = function(state){
                init(state || scope.initialState);

                if(!scope.opened){
                    scope.opened = true;
                    panel.setAttribute('aria-hidden','false');
                    document.addEventListener('click', onclick, true );
                    element[0].classList.add('opened');
                }
                scope.initialValue = angular.copy(scope.selected_date);
                if(scope.state !== 'time'){
                    input.focus();
                    input.setAttribute('aria-expanded', 'true');
                }
                else{
                    inputtime.focus();
                    inputtime.setAttribute('aria-expanded', 'true');
                }
                if(!scope.current_date){
                    scope.current_date = new Date();
                }

            };

            scope.selectDay = function(date){
                scope.current_date = date;
                scope.selected_date = new Date(scope.current_date);
                checkBounds();
                scope.current_month = scope.current_date.getMonth();
                scope.current_year = scope.current_date.getFullYear();
                scope.current_decade = scope.current_year - scope.current_year % 10;
                scope.current_day = date.getDate();
                scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                scope.formatted_time = scope.selected_date ? (filters_functions.hour(scope.selected_date) + ' ' + scope.time_label) : "";
                if(scope.callback){
                    scope.callback(scope.selected_date);
                }
                build();
                if(scope.states.indexOf('time') === -1){
                    scope.close();
                    input.focus();

                }
                else{
                    scope.state = 'time';
                }
            };

            scope.selectHour = function(hour){
                if(!scope.selected_date){
                    scope.selected_date = new Date(scope.current_date);
                }
                scope.selected_date.setHours((hour % 12) + (scope.time_label === 'PM' ? 12 : 0));
                checkBounds();
                scope.current_hour = (scope.selected_date || scope.current_date).getHours() % 12 || 12;
                scope.time_label = (scope.selected_date || scope.current_date).getHours() < 12 ? 'AM' : 'PM';
                scope.current_minutes = (scope.selected_date || scope.current_date).getMinutes() - ((scope.selected_date || scope.current_date).getMinutes() % 5) ;
                scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                scope.formatted_time = scope.selected_date ? (filters_functions.hour(scope.selected_date) + ' ' + scope.time_label) : "";
                scope.$evalAsync();
            };

            scope.previousMinutes = function(){
              scope.selectMinutes(Math.max(0, scope.current_minutes - 5 ));
            };
            scope.nextMinutes = function(){
              scope.selectMinutes(Math.min(55, scope.current_minutes + 5 ));
            };
            scope.previousHour = function(){
              scope.selectHour(Math.max(1, scope.current_hour - 1 ));
            };
            scope.nextHour = function(){
              scope.selectHour(Math.min(12, scope.current_hour + 1 ));
            };

            scope.selectMinutes = function(minutes){
                if(!scope.selected_date){
                    scope.selected_date = new Date(scope.current_date);
                }
                scope.selected_date.setMinutes(minutes);
                checkBounds();
                scope.current_hour = (scope.selected_date || scope.current_date).getHours() % 12 || 12;
                scope.time_label = (scope.selected_date || scope.current_date).getHours() < 12 ? 'AM' : 'PM';
                scope.current_minutes = (scope.selected_date || scope.current_date).getMinutes() - ((scope.selected_date || scope.current_date).getMinutes() % 5) ;
                scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                scope.formatted_time = scope.selected_date ? (filters_functions.hour(scope.selected_date) + ' ' + scope.time_label) : "";
                scope.$evalAsync();
            };


            scope.selectMonth = function(month){
                scope.current_month = month;
                if(!scope.changeState('day')){
                    if(!scope.current_date){
                        scope.current_date = new Date(scope.current_year, month, 1);
                    }
                    else{
                        scope.current_date.setDate(1);
                        scope.current_date.setYear(scope.current_year);
                        scope.current_date.setMonth(month);
                    }
                    scope.selected_date = new Date(scope.current_date);
                    scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                    scope.formatted_time = scope.selected_date ? (filters_functions.hour(scope.selected_date) + ' ' + scope.time_label) : "";
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
                    if(!scope.current_date){
                        scope.current_date = new Date(year, 0, 1);
                    }
                    else{
                        scope.current_date.setYear(year);
                    }
                    scope.selected_date = new Date(scope.current_date);
                    scope.formatted_date = scope.selected_date ? format[scope.states[scope.states.length -1 ]](scope.selected_date) : "";
                    scope.formatted_time = scope.selected_date ? (filters_functions.hour(scope.selected_date) + ' ' + scope.time_label) : "";
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
                scope.formatted_time = scope.selected_date ? (filters_functions.hour(scope.selected_date) + ' ' + scope.time_label) : "";
                scope.close();
            };

            scope.reset = function(){
                scope.selected_date = null;
                scope.formatted_date = "" ;
                scope.formatted_time =  "";
                scope.close();
            };

            scope.IsSelectable = function(date,year, month, day){
                if(date){
                    year = date.getFullYear();
                    month = date.getMonth();
                    day = date.getDate();
                }
                return  !(scope.mindate && scope.mindate instanceof Date &&
                    (
                        year < scope.mindate.getFullYear() ||
                        (month !== null && year === scope.mindate.getFullYear() && month < scope.mindate.getMonth()) ||
                        (day !== null && year === scope.mindate.getFullYear() && month === scope.mindate.getMonth() && day < scope.mindate.getDate())
                    )
                )
                &&
                !(scope.maxdate && scope.maxdate instanceof Date &&
                    (
                        year > scope.maxdate.getFullYear() ||
                        (month !== null && year === scope.maxdate.getFullYear() && month > scope.maxdate.getMonth()) ||
                        (day !== null && year === scope.maxdate.getFullYear() && month === scope.maxdate.getMonth() && day > scope.maxdate.getDate())
                    )
                );
            };

            function checkBounds(){
                if(scope.mindate && scope.selected_date < scope.mindate){
                    scope.current_date = new Date(scope.mindate);
                    scope.selected_date = new Date(scope.mindate);
                }
                else if(scope.maxdate && scope.selected_date > scope.maxdate){
                    scope.current_date = new Date(scope.maxdate);
                    scope.selected_date = new Date(scope.maxdate);
                }
            };

            function onclick( e ){
                if(!element[0].contains(e.target)){
                    scope.close();
                }
                else if(e.target.tagName === 'DIV'){
                  e.stopPropagation();
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
                    inputtime.setAttribute('aria-expanded', 'false');
                    panel.setAttribute('aria-hidden','true');
                    scope.state = scope.selected_date ? scope.states[scope.states.length -1 ] : scope.states[0];
                });
            };




    }
]);
