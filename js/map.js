/*
    JavaScript written by Rich Donohue (@rgdonohue) for NCAA March Madness Fandom Map (March 2016)
    in Colloboration with Ate Poorthuis and Matt Zook
    for New Maps Plus and Floating Sheep
    Creative Commons Attribution-Noncommercial-Share Alike 3.0 Unported License.
*/

// deterimine approximate screen size and zoom map accordingly (roughly)
var w = window.innerWidth,
    zoomLevel;

switch (true) {
    case (w >= 1366):
        zoomLevel = 4.9;
        break;
    case (w >= 1280):
        zoomLevel = 4.6;
        break;
    case (w >= 1024):
        zoomLevel = 4.4;
        break;
    case (w >= 736):
        zoomLevel = 4;
        break;
    default:
        zoomLevel = 3;
        break;
}
// create initial map object and use CartoDB's projection to reproject
var map = L.map('map', {
    center: [40,-95],
    zoom: zoomLevel,
    minZoom: zoomLevel - .4,
    maxZoom: zoomLevel + .4,
    zoomControl: false,
    doubleClickZoom: false,
    attributionControl: false,
    crs: cartodb.proj('+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=37.5 +lon_0=-96 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs', '102003')
});

// load a graticule (thnx to Bjørn Sandvik)
L.graticule({
    interval: 5,
    style: {
        color: 'whitesmoke',
        opacity: .4,
        weight: 1
    }      
}).addTo(map);

// cheat'n global variables
var team1Att = 'Kentucky', 
    team2Att = 'Duke',
    hexgrid,
    stats = $(".stats"),
    breaks = [2.5,1.25,.8,.4],
    breakColors = ['#005daa','#1f80d1','#f1f1ca','#ea964c','#d1701a'],
    sumData,
    tagKey = {};

function calculateBreakColors(colorIn) {
    
    
}

d3.queue()
    .defer(d3.json, 'data/hexgrid.json')
    .defer(d3.csv, 'data/hex-dt.csv')
    .defer(d3.csv, 'data/key.csv')
    .defer(d3.json, 'data/states.json')
    .defer(d3.json, 'data/land.json')
    .await(processData);

function processData(e,hex,data,keys,states,land) {
   
    for(var i = 0; i < hex.features.length; i++){
        var hexId = hex.features[i].properties.hex;
        hex.features[i].properties.tweets = {};
        for(var j = 0; j < data.length; j++) {
           if(data[j].hex === hexId){
               hex.features[i].properties.tweets = data[j];
           }   
        } 
        
        for(var k = 0; k < keys.length; k++) {
            var original = keys[k]['ID'],
                schoolName = keys[k]['SCHOOL'];
            
            tagKey[schoolName] = keys[k]['Search'];
            
            hex.features[i].properties.tweets[schoolName] = Number(hex.features[i].properties.tweets[original]);
            
            hex.features[i].properties.tweets.random = 
                Number(hex.features[i].properties.tweets.random);

            delete hex.features[i].properties.tweets[original];
        
        }
    }
    
    playBall(hex, states, land);
    
}

function playBall(hex, states, land) {
    
    // add background landmass layer
    L.geoJson(land, {
        style: function(feature) {
            return {                
                stroke: false,
                fill: true,
                fillColor: '#f4f4f4',
                weight: 2,
                fillOpacity: 1
            }
        }
    }).addTo(map);
    
    // draw states fills below our polygons
    L.geoJson(states, {
        style: function(feature) {
            return {                
                stroke: false,
                fill: true,
                color: '#dfdfdf',
                weight: 1,
                opacity: 1
            }
        }
    }).addTo(map);
      
    // create a new object from data to hold summed values for normalizing
    sumData = JSON.parse(JSON.stringify(hex.features[0].properties.tweets));
   
    // then ensure that all property values are zero
    for (var key in sumData) {
        sumData[key] = 0;   
    }
    
    // then loop through data and aggregate totals for each property
    hex.features.forEach(function(f) {
       for(var p in f.properties.tweets) {
           if(p != 'hex' && p != 'random') {
               sumData[p]+=f.properties.tweets[p]
           }
       }   
    });

    
    // draw initial geometries layer 
    hexgrid = L.geoJson(hex, {
        style: function(feature) {
            return {                
                stroke: true,
                fill: true,
                color: 'whitesmoke',
                fillColor: '#e0e0e0',
                weight: .5,
                fillOpacity: 1

            }
        },
        onEachFeature: function(feature,layer){
            // for each hex, determine the top 10 teams tweeted
            // and display on a mouseover event
            
            layer.on('mouseover', function() {                          

                var tweets = layer.feature.properties.tweets;

                // create an array of all tweets in that hexbin
                var sortArray = []
                for (var team in tweets ) {
                    var val = tweets[team]; 
                    if(team != 'hex' && team != 'random' & team != 'total') {
                        sortArray.push({'team': team, 'val': val});
                    }
                }
                
                // sort that array high to low
                sortArray = sortArray.sort(function (a, b) {
                    return b.val - a.val;
                });
                
                // remove the first two undefined
                //sortArray = sortArray.slice(2, sortArray.length)
                
                // build html to display in info window
                var html = '<h3>Top 10 Teams<br>Tweeted</h3><ul>';
                for(var i=0; i < 10; i++) {
                    html+='<li>'+(i+1)+": "+sortArray[i].team+'</li>';   
                }
                html+='</ul>';  
                
                // populate stats info window with 10 ten for this hex
                stats.html(html);
            });     

        }
    }).addTo(map);

    // draw states borders on top of our polygons
    L.geoJson(states, {
        style: function(feature) {
            return {                
                stroke: true,
                fill: false,
                color: '#adadad',
                weight: 1,
                opacity: 1
            }
        }
    }).addTo(map);
   
    // get a list of the available property variables
    var teams = Object.keys(hex.features[0].properties.tweets);
    teams.sort();
    // populate UI with team variables
    buildUI(teams);

    // initial call to symbolize map
    updateMap();

<<<<<<< 4e5efe2bd4e8d75e9fd88d97afdb026bf61d878a
    // sexy fadeins
=======
    // sexy fadeIns when data is ready
>>>>>>> changes
    $('.legend').fadeIn(1000);
    $('#team-1tags, #team-2tags').fadeIn(1000);
} // end ready

function updateMap() {       

    hexgrid.eachLayer(function(layer) {

        var tweets = layer.feature.properties.tweets;
    
        // calculate a value for each hex based on the selected beer attribute
        if(!tweets[team2Att]) { tweets[team2Att] = 1 }

        // fancy calculations to remove some of the noise at the extreme ends of the distribution
        var odds = (tweets[team1Att]/sumData[team1Att])/(tweets[team2Att]/sumData[team2Att]);
        var ciUpper = Math.exp(Math.log(odds)+1.96*Math.sqrt(1/tweets[team1Att]+1/sumData[team1Att]+1/tweets[team2Att]+1/sumData[team2Att])) 
        var ciLower = Math.exp(Math.log(odds)-1.96*Math.sqrt(1/tweets[team1Att]+1/sumData[team1Att]+1/tweets[team2Att]+1/sumData[team2Att])) 
        var ci = (ciUpper - ciLower) / odds
        var val = odds
        
        if(val != 0 & ci < 8){ // cutoff based on very scientific method
            // color the hex value based upon the current data value 
            layer.setStyle({
                fill: true,
                stroke: true,
                fillColor: getColor(val)
            });   
        } else {
            // don't display the ones with no data for this attribute
            layer.setStyle({
               fill: false,
               stroke: false
            });
        }

    });

    updateLegend();
    updateTags();

} 

function updateTags() {
    
    var team1List = $('#team-1tags').html(tagKey[team1Att]);
    var team2List = $('#team-2tags').html(tagKey[team2Att]);
    
}

function getColor(val){
    
    // determine if normalizd by tweet pop or other beer
    if(team2Att == 'rn0to10000'){
        normalized = 'norm';
    } else {
        normalized = 'compare';
    }
    // loop through the appropriate break values, high to low
    for (var i=0; i < breaks.length; i++) {
        if(val >= breaks[i]){
            return breakColors[i];
        }
        // add final color to the lowest value (or any values below it)
        if(val < breaks[breaks.length-1]){
             return breakColors[breakColors.length - 1]; 
        }
    } 
}


function buildUI(vars) {
    
    var team1 = $('.team-1 ul');
    var team2 = $('.team-2 ul');
    
    vars.forEach(function(v) {
        if(v != 'random' && v != 'hex' && v != 'total') {
            team1.append('<li><a "href="#">'+v+'<span class="value">'+v+'</span></a></li>')
            team2.append('<li><a "href="#">'+v+'<span class="value">'+v+'</span></a></li>')
        }
    });
    
    // make visible once populated
    $('#ui-controls').fadeIn(500);

    $(".team-1 dt a").click(function(e) {
        $(".team-1 dd ul").toggle();
    });
    
    $(".team-1 dt a span").html(team1Att);
    $(".team-2 dt a span").html(team2Att);

    $(".team-1 dd ul li a").click(function() {
        var text = $(this).html();
        $(".team-1 dt a span").html(text);
        $(".dropdown dd ul").hide();
        team1Att = getSelectedValue('team-1');
        updateMap();
        $(".team-1 dt a span").html(team1Att);
    });
    
    $(".team-2 dt a").click(function(e) {
        $(".team-2 dd ul").toggle();
    });

    $(".team-2 dd ul li a").click(function() {
        var text = $(this).html();
        $(".team-2 dt a span").html(text);
        $(".dropdown dd ul").hide();
        team2Att = getSelectedValue('team-2');
        updateMap();
        $(".team-2 dt a span").html(team2Att);
    });


    $(document).bind('click', function(e) {
        var $clicked = $(e.target);
        if (! $clicked.parents().hasClass("dropdown"))
            $(".dropdown dd ul").hide();
    });
    
    function getSelectedValue(classId) {
        return $("." + classId).find("a span.value").html();
    }
    
    
    // only show the info window when hovering over our hexgrid
    hexgrid.on('click mouseover', function(e){
        stats.show();
        // info window UI functionality
        $(document).mousemove(function(e){
            // first offset from the mouse position of the info window
            stats.css({"left": e.pageX + 6, "top": e.pageY - stats.height() - 15}); 

            // if it crashes into the top, flip it lower right
            if(stats.offset().top < 4) {
                stats.css({"top": e.pageY + 15});
            }
            // do the same for crashing into the right
            if(stats.offset().left + stats.width() >= $(document).width() - 40) {

                stats.css({"left": e.pageX - stats.width() - 30});
            }
        });
    });
    // hide it when off the hexbins
    hexgrid.on('click mouseout', function(e){
        stats.hide();
    });

    // if use clicks 'about' show it
    $('#huh').on('click tap', function(){
        $('#about').fadeIn(400);
        $('#cover').fadeIn(400);
    });
    
    // clicking anywhere removes the 'about'
    $('#cover, #about').on('click tap', function(){
        $('#about').fadeOut(400);
        $('#cover').fadeOut(400);
    });
}


function updateLegend(){
    
    $('.legend').html('<h3><span style="color:'+breakColors[0]+' ">'+team1Att+'</span><span style="color:'+breakColors[4]+'">'+team2Att+'</span></h3><ul>');
  

    for(var i=0; i<=breakColors.length-1;i++){
        $('.legend ul').append('<li><span style="background: '+breakColors[i]+'"></span></li>');

    }

    $('.legend ul').append('</ul>');

}