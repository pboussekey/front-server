angular.module('STATS')
    .factory('stats_service',  ['activities_service', 'filters_functions',
        function(activities_service, filters_functions){
        
        
        var interval_substr = {
            D : 10,
            M : 7,
            Y : 4
        };
        
        function getDateLabel(label){
            var year = label.substring(0,4);
            var month = label.substring(5,7);
            var day = label.substring(8,10);
            label = month;
            if(day){
                label += '/' + day
            }
            if(service.start_date.getFullYear() !== service.end_date.getFullYear() || !day){
                label += (month ? "/" : "") + year;
            }
            return label;
        };
        
        function init(chart){
            
            chart.labels = [];
            chart.data = [];
            chart.count = 0;
            if(service.start_date && service.end_date){
                var interval = interval_substr[chart.interval];
                var start = new Date(service.start_date);
                var end = new Date(service.end_date);
                var ended = false;
                while(!ended){
                    var lastLabel = start.toISOString().substr(0, interval);
                    chart.labels.push(lastLabel);
                    switch(chart.interval){
                        case 'D' : 
                            start.setDate(start.getDate() + 1);
                            ended = start > end;
                            break;
                        case 'M' : 
                            start.setMonth(start.getMonth() + 1);
                            ended = start > end && parseInt(lastLabel.substring(-2)) > end.getMonth() + 1;
                            break;
                        case 'Y' : 
                            start.setFullYear(start.getFullYear() + 1);
                            ended = start > end && parseInt(lastLabel) > end.getFullYear();
                            break;
                    }
                }
                for(var i = 0; i < chart.series.length; i++){
                    var array = new Array(chart.labels.length);
                    array.fill(0);
                    chart.data.push(array);
                }

            }

        };
            
        
        var service = {
            start_date : new Date(),
            end_date : new Date(),
            organization_id : null,
            get : function(chart){
                init(chart);
                chart.loading = true;
                chart.method(service.start_date, service.end_date, chart.interval, service.organization_id).then(function(data){
                    chart.format(data);
                    chart.loading = false;
                });  
            },
            charts : {
                avgconnections : {
                    name : 'Average connections time',
                    method : activities_service.getConnections,
                    series : [ 'Average connection time'],
                    interval : 'D',
                    options : { 
                        tooltips : {
                            callbacks : {
                                label : function (label) {
                                    return ('00:' +  filters_functions.formatMediaTime(label.yLabel)).slice(-8);
                                }
                            }
                        },
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min : 0,
                                    callback: function(value) {
                                        return value === (value - value % 60) ? ('00:' +  filters_functions.formatMediaTime(value)).slice(-8) : null;
                                    }
                                }
                            }],
                            xAxes : [{
                                ticks : {
                                    step : 30,
                                    callback : getDateLabel
                                }
                            }]
                        }
                    },
                    format : function(data){
                        this.data[0].fill(0);
                        var count = 0;
                        angular.forEach(data, function(d, date){
                            count += d.count;
                            this.count += parseInt(d.avg) * d.count;
                            this.data[0][this.labels.indexOf(date)] = parseInt(d.avg);
                        }.bind(this));
                        this.count /= count;
                        this.count = ('00:' +  filters_functions.formatMediaTime(this.count)).slice(-8);
                    }
                },
                nbconnections : {
                    name : 'Connections number',
                    method : activities_service.getConnectionsCount,
                    series : ['Nb connections'],
                    interval : 'D',
                    options : { 
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min : 0,
                                    callback: function(value) {
                                        return value === parseInt(value) ? value : null;
                                    }
                                }
                            }],
                            xAxes : [{
                                ticks : {
                                    step : 30,
                                    callback : getDateLabel
                                }
                            }]
                        } 
                    },
                    format : function(data){
                        this.count = 0;
                        angular.forEach(data, function(d, date){
                            this.count +=  d.count;
                            this.data[0][this.labels.indexOf(date)] += d.count;
                        }.bind(this));
                    }
                },
                contactsreq : {
                    name : 'Contact requests',
                    method : activities_service.getRequestsCount,
                    series : [ 'Contact requests'],
                    interval : 'D',
                    options : { 
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min : 0,
                                    callback: function(value) {
                                        return value === parseInt(value) ? value : null;
                                    }
                                }
                            }],
                            xAxes : [{
                                ticks : {
                                    step : 30,
                                    callback : getDateLabel
                                }
                            }]
                        } 
                    },
                    format : function(data){
                        data.forEach(function(d){
                            this.count += parseInt(d.requested);
                            this.data[0][this.labels.indexOf(d.request_date)] = parseInt(d.requested);
                        }.bind(this));
                    }
                },
                contactsacc : {
                    name : 'Requests accepted',
                    method : activities_service.getAcceptedCount,
                    series : [ 'Request accepted'],
                    interval : 'D',
                    options : { 
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min : 0,
                                    callback: function(value) {
                                        return value === parseInt(value) ? value : null;
                                    }
                                }
                            }],
                            xAxes : [{
                                ticks : {
                                    step : 30,
                                    callback : getDateLabel
                                }
                            }]
                        } 
                    },
                    format : function(data){
                        data.forEach(function(d){
                            this.count += parseInt(d.accepted);
                            this.data[0][this.labels.indexOf(d.accepted_date)] = parseInt(d.accepted);
                        }.bind(this));
                    }
                },
                messages : {
                    name : 'Messages sent',
                    method : activities_service.getMessagesCount,
                    series : [ 'Channel', 'Chat'],
                    interval : 'D',
                    options : { 
                        legend: { display: true },
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min : 0,
                                    callback: function(value) {
                                        return value === parseInt(value) ? value : null;
                                    }
                                }
                            }],
                            xAxes : [{
                                ticks : {
                                    step : 30,
                                    callback : getDateLabel
                                }
                            }]
                        } 
                    },
                    format : function(data){
                        data.forEach(function(d){
                            this.count += d.count;
                            this.data[d.type - 1][this.labels.indexOf(d.created_date)] = d.count;
                        }.bind(this));
                    }
                },
                events : {
                    name : 'Events created',
                    method : activities_service.getEventsCount,
                    series : ['Events'],
                    interval : 'D',
                    options : { 
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min : 0,
                                    callback: function(value) {
                                        return value === parseInt(value) ? value : null;
                                    }
                                }
                            }],
                            xAxes : [{
                                ticks : {
                                    step : 30,
                                    callback : getDateLabel
                                }
                            }]
                        } 
                    },
                    format : function(data){
                        data.forEach(function(d){
                            this.count += d.count;
                            this.data[0][this.labels.indexOf(d.created_date)] = d.count;
                        }.bind(this));
                    }
                },
                courses : {
                    name : 'Courses created',
                    method : activities_service.getCoursesCount,
                    series : ['Groups'],
                    interval : 'D',
                    options : { 
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min : 0,
                                    callback: function(value) {
                                        return value === parseInt(value) ? value : null;
                                    }
                                }
                            }],
                            xAxes : [{
                                ticks : {
                                    step : 30,
                                    callback : getDateLabel
                                }
                            }]
                        } 
                    },
                    format : function(data){
                        data.forEach(function(d){
                            this.count += d.count;
                            this.data[0][this.labels.indexOf(d.created_date)] = d.count;
                        }.bind(this));
                    }
                },
                groups : {
                    name : 'Groups created',
                    method : activities_service.getGroupsCount,
                    series : ['Groups'],
                    interval : 'D',
                    options : { 
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min : 0,
                                    callback: function(value) {
                                        return value === parseInt(value) ? value : null;
                                    }
                                }
                            }],
                            xAxes : [{
                                ticks : {
                                    step : 30,
                                    callback : getDateLabel
                                }
                            }]
                        } 
                    },
                    format : function(data){
                        data.forEach(function(d){
                            this.count += d.count;
                            this.data[0][this.labels.indexOf(d.created_date)] = d.count;
                        }.bind(this));
                    }
                },
                posts : {
                    name : 'Posts published',
                    method : activities_service.getPostsCount,
                    series : [ 'Posts', 'Comments'],
                    interval : 'D',
                    options : { 
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min : 0,
                                    callback: function(value) {
                                        return value === parseInt(value) ? value : null;
                                    }
                                }
                            }],
                            xAxes : [{
                                ticks : {
                                    step : 30,
                                    callback : getDateLabel
                                }
                            }]
                        } 
                    },
                    format : function(data){
                        data.forEach(function(d){
                            if(!d.parent_id){
                                this.count += d.count;
                                this.data[0][this.labels.indexOf(d.created_date)] += d.count;
                            }
                            else{ 
                                this.count += d.count;
                                this.data[1][this.labels.indexOf(d.created_date)] += d.count;
                            }
                        }.bind(this));
                    }
                },
                likes : {
                    name : 'Posts liked',
                    method : activities_service.getLikesCount,
                    series :  ['Likes'],
                    interval : 'D',
                    options : { 
                        scales: {
                            yAxes: [{
                                ticks: {
                                    min : 0,
                                    callback: function(value) {
                                        return value === parseInt(value) ? value : null;
                                    }
                                }
                            }],
                            xAxes : [{
                                ticks : {
                                    step : 30,
                                    callback : getDateLabel
                                }
                            }]
                        } 
                    },
                    format : function(data){
                        data.forEach(function(d){
                            this.count += d.count;
                            this.data[0][this.labels.indexOf(d.created_date)] = d.count;
                        }.bind(this));
                    }
                }
                    
                
            }
        };
                
        service.start_date.setDate(service.start_date.getDate() - 7);

        return service;
    }]);
