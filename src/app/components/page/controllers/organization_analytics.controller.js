angular.module('page').controller('organization_analytics_controller', 
    [ 'filters_functions', 'stats_service', 'children', 'page', 'page_model',
        function(filters_functions, stats_service, children, page, page_model){
            var ctrl = this;
            ctrl.square_options= {
                tooltips : {
                    enabled: false
                },
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
            ctrl.page = page.datum.id;
            page_model.queue(children).then(function(){
                ctrl.children = children;
                ctrl.pages = page_model.list;
            });
            ctrl.stats.organization_id = children.concat(page.datum.id);
            
            ctrl.onstartchange = function(start){
                stats_service.start_date = start;
                ctrl.get();
            };
            ctrl.onendchange = function(end){
                stats_service.end_date = end;
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
                    chart.interval = interval;
                    stats_service.get(chart);
                });
            };
            
            ctrl.get();
        }
    ]
);

