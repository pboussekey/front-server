angular.module('page').controller('organization_analytics_controller', 
    [ 'filters_functions', 'stats_service', 'children', 'page', 'page_model',
        '$location', '$anchorScroll', '$timeout',
        function(filters_functions, stats_service, children, page, page_model, 
        $location, $anchorScroll, $timeout){
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
            ctrl.dateFilter = filters_functions.textDate;
            ctrl.current_date = new Date();
            ctrl.interval_label = 'Per Days';
            ctrl.stats = stats_service;
            ctrl.page = page;
            ctrl.selectChart = function(chart, key){
                ctrl.chart = chart;
                if(key){
                    $timeout(function(){
                        $location.hash(key);
                        $anchorScroll();
                    });
                }
            };
            page_model.queue(children).then(function(){
                ctrl.children = children;
                ctrl.pages = page_model.list;
            });
            ctrl.stats.organization_id = children.concat(page.datum.id);
            
            ctrl.onstartchange = function(start){
                stats_service.start_date = start;
                stats_service.reset();
                ctrl.get();
            };
            ctrl.onendchange = function(end){
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
            
            ctrl.get();
        }
    ]
);

