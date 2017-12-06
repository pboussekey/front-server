angular.module('import-csv')
    .controller('import-controller',['$scope', 
        function ( $scope ) {
        
            var ctrl = this;
            
            this.errors = {fields:[],parsing:[],rows:{},rowcount:0};
            
            this.pagination = {
                items:[],
                page:[],
                itemcount:0,
                itemperpage:20,
                current:1,
                refresh: function( page ){
                    // Check itemsperpage
                    if( !parseInt(this.itemperpage) ){
                        this.itemperpage = 1;
                    }
                    
                    // Check & Set current page number.
                    if( page )
                        this.current = page;
                    if( this.current > this.total() ){
                        this.current = this.total();
                    }else if( !this.current )
                        this.current = 1;
                    
                    // Set current page items.
                    var i = (this.current-1)*this.itemperpage,
                        max = Math.min(this.itemcount, i+this.itemperpage);
                
                    this.page=[];
                    for(; i < max;i++){
                        
                        this.page.push( this.items[i] );
                    }
                },
                total: function(){
                    return Math.ceil(this.itemcount/this.itemperpage)||1;
                }
            };
            
            this.hasErrors = function(){
                return this.errors 
                    && ( this.errors.fields.length || this.errors.parsing.length || this.errors.rowcount ); 
            };
            
            this.onCSVLoaded = function( files ){
                if( files.length ){
                    // RESET DATAS
                    ctrl.pagination.items = [];
                    ctrl.pagination.page = [];
                    ctrl.pagination.current = 1;
                    ctrl.pagination.itemcount = 0;
                    ctrl.errors = {fields:[],parsing:[],rows:{},rowcount:0};
                    
                    ctrl.isParsing = true;
                    ctrl.isChecked = false;
                    
                    Papa.parse(files[0],{
                        header:true,
                        skipEmptyLines:true,
                        complete: function( results ){
                            ctrl.isParsing = false;
                            
                            checkFields( results.meta.fields );
                            
                            if( results.errors.length ){
                                results.errors.forEach(function(err){
                                    if( err.row !== undefined ){
                                        ctrl.errors.rows[err.row] = err;
                                        ctrl.errors.rowcount++;                                            
                                        results.data[err.row].error = true;
                                    }else{
                                        ctrl.errors.parsing.push(err);
                                    }
                                });
                            }
                            
                            if( !ctrl.errors.fields.length ){                                
                                ctrl.pagination.items = results.data;
                                ctrl.pagination.itemcount = results.data.length;
                                ctrl.pagination.refresh( 1 );
                                    
                                if( $scope.check ){
                                    ctrl.isChecking = true;
                                    $scope.check( results.data ).then(onCheck);
                                }else{
                                    ctrl.isChecked = true;
                                }
                            }
                            $scope.$apply();
                        }       
                    });
                }
            };
            
            this.submit = function(){
                
                if( $scope.import ){
                    $scope.import( this.pagination.items );
                }
            };
            
            function onCheck( row_errors ){
                row_errors.forEach(function(err){
                    ctrl.errors.rows[err.row] = err;
                    ctrl.errors.rowcount++;                              
                    ctrl.pagination.items[err.row].error = true;
                });
                
                ctrl.isChecking = false;
                ctrl.isChecked = true;
                
                $scope.$apply();
            };
            
            function onImport( results ){
               
            };
        
            function checkFields( fields ){
                
                var buffer = fields.concat();
                ctrl.fields = $scope.required.concat();
                
                $scope.required.forEach(function( required ){
                    var i = buffer.indexOf(required);
                    
                    if( i === -1 ){
                        ctrl.errors.fields.push({
                            code:'RequiredFieldName',
                            message:'"'+required+'" header field is missing.'
                        });
                    }else{
                        buffer.splice(i,1);
                    }
                });
                
                buffer.forEach(function( field ){
                    if(!$scope.optional || $scope.optional.indexOf( field ) === -1 ){                        
                        ctrl.errors.fields.push({
                            code:'WrongFieldName',
                            message:'"'+field+'" header field name is not allowed.'
                        });
                    }else{
                        ctrl.fields.push(field);
                    }
                });
            }
        
        }
    ]);