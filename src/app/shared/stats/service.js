angular.module('STATS')
    .factory('stats_service',  ['activities_service', 'filters_functions', 
'pages_constants', 
        function(activities_service, filters_functions, 
        pages_constants){
        var labels = {};
        
        var interval_substr = {
            D : 10,
            M : 7,
            Y : 4
        };
        var pageTypes = pages_constants.pageTypes;
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
        
        function getLabels(interval){
            if(service.start_date && service.end_date){
                if(!labels.start || !labels.end || labels.start !== service.start_date.getTime() || labels.end !== service.end_date.getTime()){
                    labels = {
                        start : service.start_date.getTime(),
                        end : service.end_date.getTime()
                    };
                }
                if(!labels[interval]){
                    labels[interval] = [];
                    var length = interval_substr[interval];
                    var start = new Date(service.start_date);
                    var end = new Date(service.end_date);
                    var ended = false;
                    var lastLabel = (start.getFullYear() +'-'+ ('0' + (start.getMonth() + 1)).substr(-2)+'-' + ('0' + start.getDate()).substr(-2)).substr(0, length);
                    while(!ended){
                        labels[interval].push(lastLabel);
                        switch(interval){
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
                        lastLabel = (start.getFullYear() +'-'+ ('0' + (start.getMonth() + 1)).substr(-2)+'-' + ('0' + start.getDate()).substr(-2)).substr(0, length);
                    }
                    var endLabel = (end.getFullYear() +'-'+ ('0' + (end.getMonth() + 1)).substr(-2)+'-' + ('0' + end.getDate()).substr(-2)).substr(0, length);
                    if(labels[interval].indexOf(endLabel) === -1){
                        labels[interval].push(endLabel);
                    }

                }
            }
            return labels[interval];
        }
        
        function init(chart){
            
            chart.labels = getLabels(chart.interval);
            chart.data = [];
            chart.count = 0;
            if(chart.type === 'curve'){
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
            reset : function(){
                labels = {};
            },
            get : function(chart){
                if(chart.type === 'curve'){
                    init(chart);
                }
                this.data = [];
                this.series = [];
                if(chart.method){
                    chart.loading = true;
                    chart.method(service.start_date, service.end_date, chart.interval, service.organization_id).then(function(data){
                        chart.format(data);
                        chart.loading = false;
                    }); 
                }
            },
            charts : {  
                visits : {
                    name : 'Visits',
                    method : activities_service.getVisitsCount,
                    series : [ 'Visit nb'],
                    type : 'curve',
                    types : [pageTypes.COURSE],
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
                        data.forEach(function(d){
                            this.count += parseInt(d.count);
                            this.data[0][this.labels.indexOf(d.date)] = Math.round(parseFloat(d.count));
                        }.bind(this));
                        this.sentence = filters_functions.plural("This course page has been visited  <b>" + this.count + " time%s%</b> (by the course attendees for the selected time period).",this.count);
                    },
                    charts : {
                        visitors : {
                            name : 'Attendance',
                            method : activities_service.getVisitsPrc,
                            labels : [],
                            interval : 'D',
                            type : 'pie',
                            data : [0,0],
                            class : 'wide',
                            options : {
                                tooltips : {
                                    enabled: false
                                },
                                hover: {mode: null}
                            },
                            format : function(data){
                                this.count = 0;
                                var total = 0;
                                data.forEach(function(d){
                                    this.count += parseInt(d.object_data.visitors);
                                    total = d.object_data.total;

                                }.bind(this));
                                 this.data[0] = this.count;
                                 this.data[1] = total - this.count;
                                var prc = Math.round(parseFloat(100 * this.count / total));
                                this.sentence =  "<b>" + prc + "% </b> of the course attendees (" + this.count + "/" + total + ") have visited this course page (for the selected time period).";
                                this.count = prc  + "% (" + this.count + "/" + total + ")";
                            }
                        }
                    }
                },
                documents : {
                    name : 'Openings',
                    subname : 'Detail per document',
                    method : activities_service.getDocumentsOpeningCount,
                    series : [ 'Opening nb'],
                    types : [pageTypes.COURSE],
                    interval : 'D',
                    type : 'curve',
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
                        this.charts = {};
                        this.docs = [];
                        data.forEach(function(d){
                            this.count += d.count;
                            this.data[0][this.labels.indexOf(d.date)] += d.count;
                        }.bind(this));
                        this.sentence = filters_functions.plural("The course documents (materials and media) have been opened  <b>" + this.count + " time%s%</b> (by the course attendees for the selected time period).", this.count);
                        this.colors = ['#5083C0', '#47B15E','#EA4F4F', '#ec7d1f', '#4778B4', '#f7f367'];
                        activities_service.getDocumentsOpeningPrc(
                            service.start_date, 
                            service.end_date, 
                            this.interval ,
                            service.organization_id).then(function(docs){
                                docs.forEach(function(doc){
                                    doc.prc = Math.round(parseFloat(100 * doc.object_data.visitors / doc.object_data.total)); 
                                    var index = this.docs.indexOf(doc.id);
                                    if(index === -1){
                                        index = this.docs.length;
                                        this.docs.push(doc.id);
                                        this.charts["doc" + doc.id] = {
                                            name : doc.object_name + " (" + doc.target_name + ")",
                                            type : 'pie',
                                            count : doc.prc,
                                            class : 'small',
                                            options : {
                                                tooltips : {
                                                    enabled: false
                                                },
                                                hover: {mode: null}
                                            },
                                            colors : [this.colors[index % this.colors.length], '#DCDCDC'],
                                            labels : ['Distinct students', 'Missing students'],
                                            data : [doc.object_data.visitors, doc.object_data.total - doc.object_data.visitors],
                                            sentence : " <b>" + doc.prc + "% </b> of the course attendees ("+doc.object_data.visitors+"/"+doc.object_data.total +") have opened this document (for the selected time period)."
                                        };
                                    }
                                }.bind(this));
                        }.bind(this));
                    }
                },
                avgconnections : {
                    name : 'Average connections time',
                    method : activities_service.getConnections,
                    series : [ 'Average connection time'],
                    interval : 'D',
                    types : [pageTypes.ORGANIZATION],
                    type : 'curve',
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
                    name : 'Number of connections',
                    method : activities_service.getConnectionsCount,
                    series : ['Nb connections'],
                    types : [pageTypes.ORGANIZATION],
                    interval : 'D',
                    type : 'curve',
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
                    types : [pageTypes.ORGANIZATION],
                    interval : 'D',
                    type : 'curve',
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
                    types : [pageTypes.ORGANIZATION],
                    interval : 'D',
                    type : 'curve',
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
                    name : 'Messages',
                    method : activities_service.getMessagesCount,
                    series : [ 'Channel', 'Chat'],
                    types : [pageTypes.ORGANIZATION],
                    interval : 'D',
                    type : 'curve',
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
                channel : {
                    name : 'Messages in channel',
                    method : activities_service.getMessagesCount,
                    series : [ 'Channel'],
                    types : [pageTypes.COURSE],
                    interval : 'D',
                    type : 'curve',
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
                    types : [pageTypes.ORGANIZATION],
                    interval : 'D',
                    type : 'curve',
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
                    types : [pageTypes.ORGANIZATION],
                    interval : 'D',
                    type : 'curve',
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
                    types : [pageTypes.ORGANIZATION],
                    interval : 'D',
                    type : 'curve',
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
                    name : 'Publications',
                    method : activities_service.getPostsCount,
                    series : [ 'Posts', 'Comments'],
                    interval : 'D',
                    types : [pageTypes.ORGANIZATION, pageTypes.COURSE],
                    type : 'curve',
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
                    name : 'Likes',
                    method : activities_service.getLikesCount,
                    series :  ['Likes'],
                    types : [pageTypes.ORGANIZATION, pageTypes.COURSE],
                    interval : 'D',
                    type : 'curve',
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
