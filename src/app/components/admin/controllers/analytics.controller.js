angular.module('admin').controller('analytics_controller',
    ['stats_service', 'filters_functions',  'page_model', 'community_service',
        function(stats_service, filters_functions,  page_model, community_service){

            var ctrl = this;
            ctrl.dateFilter = filters_functions.textDate;
            ctrl.interval_label = 'Per Days';
            ctrl.pages = page_model.list;
            ctrl.stats = stats_service;
            
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
            
            ctrl.searchOrganization = function(search,filter){
                ctrl.loading = true;      
                return community_service.pages( search, filter.p, filter.n, 'organization').then(function(r){
                    ctrl.loading = false;
                    return page_model.queue(r.list).then(function(){
                        return r.list;
                    });
                });
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
    ]);
    