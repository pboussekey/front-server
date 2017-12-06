angular.module('HANGOUT').factory('hgt_stream',['session', 'events_service', 'hgt_events',
    function(session, events_service, hgt_events){

        var stream = function( stm ){
            this.id = stm.id;
            this.data = stm;
            this.user_id = !stm.connection ? session.id : JSON.parse( stm.connection.data ).id;
            this.volume = 100;
            this.expanded = false;
            this.previousVolume = 100;
        };
        
        stream.prototype.getUserId = function(){
            return !this.connection ? session.id : JSON.encode( this.connection.data ).id;
        };
        
        stream.prototype.toggleSound = function(){
            this.data.audio = !this.data.audio;
            this.data.hasAudio = this.data.audio;
            if(this.data.publisher){
                this.data.publisher.publishAudio(this.data.audio );
            }
            else if(this.data.subscriber){
                this.data.subscriber.subscribeToAudio(this.data.audio);                 
            }
        };
        
        stream.prototype.toggleVideo = function(){
            this.data.video = !this.data.video;
            this.data.hasVideo = this.data.video;
            if(this.data.publisher){
                this.data.publisher.publishVideo(this.data.video );
            }
            else if(this.data.subscriber){
                this.data.subscriber.subscribeToVideo(this.data.video); 
            }
        };

        stream.prototype.destroy = function(value){
             if(this.data.publisher){
                events_service.process( hgt_events.tb_stream_destroyed, this );
                 this.data.publisher.destroy();
             }
        };
       
        return stream;
    }
]);
