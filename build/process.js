//Import the required modules
var turf = require( "turf" ),
    fs = require('fs'),
    path = require('path'),
    csv = require("fast-csv");



var hex = fs.readFileSync('../data/hexgrid.json');

hex = JSON.parse(hex);
console.log(hex);

var hexdt = [];

csv
 .fromPath("../data/hex-dt.csv", {headers: true})
 .on("data", function(data){
    console.log(data);
 })
 .on("end", function(){
    csv
        .fromPath("../data/key-count-all.csv", {headers: true})
        .on('data', function(data){
            //console.log(data);
        })
         .on("end", function(){
             //gatherDots(din);
         });
 });


function process(data) {
    
    console.log(data);
  
//   fs.writeFileSync('berlin-hex-with-data.json', JSON.stringify(hex));
//
//    console.log('done! happy mapping!');
  
}
