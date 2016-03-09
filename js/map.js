/*
    JavaScript written by Rich Donohue (@rgdonohue) for Beer Tweets Map (July 2015)
    in Colloboration with Ate Poorthuis and Matt Zook
    for New Maps Plus and Floating Sheep
    Creative Commons Attribution-Noncommercial-Share Alike 3.0 Unported License.
*/

// deterimine approximate screen size and zoom map accordingly (roughly)
var w = window.innerWidth,
    zoomLevel;

switch (true) {
    case (w >= 1366):
        zoomLevel = 5.1;
        break;
    case (w >= 1280):
        zoomLevel = 4.9;
        break;
    case (w >= 1024):
        zoomLevel = 4.6;
        break;
    case (w >= 736):
        zoomLevel = 4.2;
        break;
    default:
        zoomLevel = 4;
        break;
}

// create initial map object and use CartoDB's projection to reproject
var map = L.map('map', {
    center: [40,-93],
    zoom: zoomLevel,
    minZoom: zoomLevel - .3,
    maxZoom: zoomLevel + .3,
    zoomControl: false,
    doubleClickZoom: false,
    attributionControl: false,
    crs: cartodb.proj('+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=37.5 +lon_0=-96 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs', '102003')
});

// load a graticule (thnx to Bjørn Sandvik)
L.graticule({
    interval: 5,
    style: {
        color: '#777',
        opacity: .3,
        weight: 2
    }      
}).addTo(map);

// initial global variables
var selectedAtt, 
    normAtt = 'rn0to10000', 
    normalized = 'norm',
    hexgrid,
    stats,
    breaks = {
        // breaks should be symmetrical 
        norm: [2.5,1.25,.8,.4], // encoded high to low
        compare: [2.5,1.25,.8,.4]
    },
    colorSchemes = {
        norm: ['#045a8d','#2b8cbe','#74a9cf','#bdc9e1','#f1eef6'],
        normLabels: ['highly likely','likely','about average','unlikely','highly unlikely'],
        compare: ['#2c7bb6','#abd9e9','#ffffbf','#fdae61','#d7191c'],
        compareLabels: ['highly likely','likely','about average','likely','highly likely']
    },
    displayNames = {
        ale: 'ale',
        amberandale: 'amber and ale',
        amstel: 'Amstel',
        beerandlightorlite: 'light or lite',
        beer: 'beer',
        belgianandale: 'belgian ale',
        bluemoon: 'Blue Moon',
        brooklynandlager: 'Brooklyn Lager',
        budorbudweiserandlightorlite: 'Budwieser (Bud) Light',
        budorbudweiser: 'Budweiser (Bud)',
        chimay: 'Chimay',
        coorsandlightorlite: 'Coors Light',
        coors: 'Coors',
        corona: 'Corona',
        dogfish: 'Dogfish',
        dosequis: 'Dos Equis',
        duvel: 'Duvel',
        fattire: 'Fat Tire',
        gooseisland: 'Goose Island',
        gose: 'Gose',
        grainbelt: 'Grain Belt',
        grolsch: 'Grolsch',
        guinness: 'Guinness',
        hefeweizen: 'Hefeweizen',
        heineken: 'Heineken',
        ipaorindiaandpaleandale: 'India Pale Ale (IPA)',
        lager: 'lager',
        leinenkugel: 'Leinenkugel',
        magichat: 'Magic Hat',
        millerandlightorlite: 'Miller Lite (Light)',
        miller: 'miller',
        modeloandbeerorespecial: 'Modelo Especial',
        naturallight: 'Natural Light',
        oktoberfest: 'Oktoberfest',
        ommegang: 'Ommegang',
        pabstblueribbonorpbr: 'Pabst Blue Ribbon (PBR)',
        paleandale: 'Pale Ale',
        pils: 'Pils',
        porter: 'porter',
        pumpkinandale: 'pumkin ale',
        redandale: 'red ale',
        saisonorfarmhouseandale: 'Saison Farmhouse Ale',
        samadams: 'Sam Adams',
        shinerbock: 'Shiner Bock',
        sierranevadaandaleoripa: 'Sierra Nevada',
        stellaandbeerorartois: 'Stella Artois',
        stout: 'stout',
        tribel: 'tribel', // typo in data pull, should be tripel
        weissbier: 'Weissbier',
        westvleteren: 'Westvleteren',
        wheatandale: 'wheat ale',
        witbier: 'Witbier',
        yuengling: 'Yuengling'    
    },
    sumData;

// load all our data using JQuery's AJAX requests
var data = {};

//$.when(
//      $.getJSON("data/land.json", function(land) {
//        // draw the land layer so user can see a map while data loads
//        L.geoJson(land, {
//            style: function(feature) {
//                return {                
//                    stroke: false,
//                    fill: true,
//                    color: '#313030',
//                    weight: 1,
//                    fillOpacity: 1
//                }
//            }
//        }).addTo(map);
//      }),
//      $.getJSON("data/states.json", function(states) {
//         data.states =  states;
//      }),
//      $.getJSON("data/hexgrid.json", function(hexgrids) {
//         data.hexgrids =  hexgrids;
//      })
//).then(function() {
//      ready(data.hexgrids, data.states)
//});

d3.queue()
    .defer(d3.json, 'data/hexgrid.json')
    .defer(d3.csv, 'data/hex-dt.csv')
    .defer(d3.csv, 'data/key-count-all.csv')
    .await(boom);

function boom(e,hex,data,key) {
    console.log(data);
    for(var i = 0; i < key.length; i++) {
       var original = key[i]['original '];
        console.log('here i am baby', original);
        for (var j = 0; j < data.length; j++) {
            for(var n in data[j]) {
                console.log(data[j]);
                break;
            }
            break;
        }
    }    
//    for(var i = 0; i < hex.features.length; i++) {
//        console.log(hex.features[i].properties.hex.split('ID')[1]);
//    }
}




function ready(data, states) {
    
    // store this selection as we make it frequently
    stats = $(".stats").hide();   

    // set initial map view with 'beer' variable
    selectedAtt =  'beer';
    $("#brew").val('beer')

    // create a new object from data to hold summed values for normalizing
    sumData = JSON.parse(JSON.stringify(data.features[0].properties));

    // then ensure that all property values are zero
    for (var key in sumData) {
        sumData[key] = 0;   
    }

    // then loop through data and aggregate totals for each property
    data.features.forEach(function(f) {
       for(var p in f.properties) {
           sumData[p]+=f.properties[p]
       }   
    });

    // draw initial geometries layer 
    hexgrid = L.geoJson(data, {
        style: function(feature) {
            return {                
                stroke: true,
                fill: true,
                color: '#3f3f3f',
                weight: 1,
                fillOpacity: 1

            }
        },
        filter: function(feature) {
              // don't create the polygons with no data
              for(var prop in feature.properties){
                  if(feature.properties[prop] > 0) {
                    return feature;   
                  }
              }         
        },
        onEachFeature: function(feature,layer){
            // for each hex, determine the top 10 beers tweeted
            // and display on a mouseover event
            
            layer.on('mouseover', function() {                          

                var props = layer.feature.properties;

                // create an array of all beer tweets in that hexbin
                var sortArray = []
                for (var beer in props ) {
                    var val = props[beer]; 
                    if(beer != normAtt) {
                        sortArray.push({'beer': beer, 'val': val});
                    }
                }
                
                // sort that array high to low
                sortArray = sortArray.sort(function (a, b) {
                    return b.val - a.val;
                });

                // build html to display in info window
                var html = '<h3>Top 10 Beer Tweets</h3><ul>';
                for(var i=0; i < 10; i++) {
                    html+='<li>'+(i+1)+": "+displayNames[sortArray[i].beer]+'</li>';   
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
                color: 'whitesmoke',
                weight: 1,
                opacity: .3
            }
        }
    }).addTo(map);
    
    // get a list of the available property variables
    var beerTypes = Object.keys(data.features[0].properties);

    // populate UI with beer type variables (using pretty display names)
    buildUI(beerTypes);

   // initial call to symbolize map
   updateMap();

    // create the legend
    drawLegend();
} // end ready

function updateMap() {       

    hexgrid.eachLayer(function(layer) {

        var props = layer.feature.properties;

        // calculate a value for each hex based on the selected beer attribute
        if(!props[normAtt]) props[normAtt] = 1

        // fancy calculations to remove some of the noise at the extreme ends of the distribution
        var odds = (props[selectedAtt]/sumData[selectedAtt])/(props[normAtt]/sumData[normAtt]);
        var ciUpper = Math.exp(Math.log(odds)+1.96*Math.sqrt(1/props[selectedAtt]+1/sumData[selectedAtt]+1/props[normAtt]+1/sumData[normAtt])) 
        var ciLower = Math.exp(Math.log(odds)-1.96*Math.sqrt(1/props[selectedAtt]+1/sumData[selectedAtt]+1/props[normAtt]+1/sumData[normAtt])) 
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

    // really only changes if the normalizing value has 
    // changed from tweet pop to a beer (or visa versa)
    updateLegend();

} 

function getColor(val){
    
    // determine if normalizd by tweet pop or other beer
    if(normAtt == 'rn0to10000'){
        normalized = 'norm';
    } else {
        normalized = 'compare';
    }
    // loop through the appropriate break values, high to low
    for (var i=0; i < breaks[normalized].length; i++) {
        if(val >= breaks[normalized][i]){
            return colorSchemes[normalized][i];
        }
        // add final color to the lowest value (or any values below it)
        if(val < breaks[normalized][breaks[normalized].length-1]){
             return colorSchemes[normalized][colorSchemes[normalized].length - 1]; 
        }
    } 
}

function buildUI(vars) {
    
    // populate the form options with all our data values
    var select = $("#brew");
    var normalize = $("#normalize").append("<option value='rn0to10000'>Tweet Population (normalized) </option>");
    vars.forEach(function(v) {
        if(v != 'rn0to10000') {
            select.append("<option value="+v+">"+displayNames[v]+"</option>");
            normalize.append("<option value="+v+">"+displayNames[v]+"</option>");
        }
    });
    
    // if user changes the selected attribute or normalized value, update the map
    select.change(function(e) {
        selectedAtt = select.val();
        updateMap();
    });  
    normalize.change(function(e) {
        normAtt = normalize.val();
        updateMap();
    });
    
    // sexy fadeIn of UI (why not?)
    $('#ui').fadeIn(2000);
    
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
                console.log('hes');
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

function drawLegend() {

    // create a legend control and add to bottom right
    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'legend');
        return div;
    };
    legend.addTo(map);
    updateLegend();
    
    // sexy fadeIn
    $('.legend').fadeIn(2000);

}

function updateLegend(){
    
    // populate legend with currently selected beer (and normalized beer if comparing)
    var currentBeer = $("#brew").val();
    
    if(normAtt == 'rn0to10000') { 
        $('.legend').html('<h3>Probability of tweets<br> containing <span style="color:#005daa; background: rgb(245,245,245); padding: 1px 3px; margin: 0 2px; border-radius: 2px;">"'+displayNames[currentBeer]+'"</span></h3><ul>');
        var labels = colorSchemes.normLabels;
    } else {
        $('.legend').html('<h3>Probability of tweets<br> containing <span style="color:#2c7bb6; background: rgb(245,245,245); padding: 1px 3px; margin: 0 2px; border-radius: 2px;">"'+displayNames[currentBeer]+'"</span>  vs <span style="color:#d7191c; background: rgb(245,245,245); padding: 1px 3px; margin: 0 2px; border-radius: 2px;">"'+displayNames[normAtt]+'"</span></h3><ul>');
        var labels = colorSchemes.compareLabels;
    }

    for(var i=0; i<=colorSchemes[normalized].length-1;i++){
        $('.legend ul').append('<li><span style="background: '+colorSchemes[normalized][i]+'"></span>'+labels[i]+'</li>');
    }

    $('.legend ul').append('</ul>');

}