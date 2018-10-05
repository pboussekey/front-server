angular.module('page').controller('organization_analytics_controller',
    [ 'filters_functions', 'stats_service',  'page', 'page_model', 'pchildren_model',
        function(filters_functions, stats_service, page, page_model, pchildren_model){
            var ctrl = this;
            ctrl.square_options= {
                responsive: true,
                tooltips : {
                    enabled: false
                },
                hover: {mode: null},
                scales: {
                    xAxes: [{
                      display: false
                    }],
                    yAxes: [{
                      display: false
                    }],
                  }
              };
            ctrl.dateFilter = filters_functions.dateWithHour;
            ctrl.current_date = new Date();
            ctrl.current_date.setHours(24);
            ctrl.current_date.setMinutes(0);
            ctrl.current_date.setSeconds(0);
            ctrl.interval_label = 'Per Days';
            ctrl.stats = stats_service;
            ctrl.page = page;
            ctrl.selectChart = function(chart){
                ctrl.chart = chart;
            };
            pchildren_model.queue([page.datum.id]).then(function(){
                ctrl.children = pchildren_model.list[page.datum.id].datum;
                page_model.queue(ctrl.children).then(function(){
                    ctrl.pages = page_model.list;
                });
                ctrl.stats.organization_id = ctrl.children.concat(page.datum.id);
                ctrl.get();
            });

            ctrl.onstartchange = function(start){
                start.setHours(0);
                start.setMinutes(0);
                start.setSeconds(0);
                stats_service.start_date = start;
                stats_service.reset();
                ctrl.get();
            };
            ctrl.onendchange = function(end){
                end.setHours(23);
                end.setMinutes(59);
                end.setSeconds(59);
                stats_service.end_date = end;
                stats_service.reset();
                ctrl.get();
            };
            ctrl.get = function(){
                var diff = ctrl.stats.end_date.getTime() - ctrl.stats.start_date.getTime();
                var interval = 'D';
                if(diff >  1000 * 60 * 60 * 24 * 30 * 24){
                    interval = 'Y';
                }
                else if(diff > 1000 * 60 * 60 * 24 * 30 * 2){
                    interval = 'M';
                }

                angular.forEach(ctrl.stats.charts, function(chart){
                    if(chart.types.indexOf(page.datum.type) !== -1){
                        chart.interval = interval;
                        stats_service.get(chart);
                        if(chart.charts){
                            angular.forEach(chart.charts, function(ch){
                                ch.interval = interval;
                                stats_service.get(ch);
                            })
                        }
                    }
                });
            };

        }
    ]
);
