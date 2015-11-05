var map = map || {};

var myLatLng = {lat: -34.397, lng: 150.644}; 

var initMap = function() {

  // Create a map object and specify the DOM element for display.
  map = new google.maps.Map(document.getElementById('map'), {
    center: myLatLng,
    scrollwheel: false,
    zoom: 8,
    mapTypeControl: false,
    streetViewControl: false
  });
}

var addMarkerToMap = function(location) {
  
  var marker = new google.maps.Marker({
    position: myLatLng,
    map: map
  });
  
  var contentString = '<div id="content">'+
      '<div id="siteNotice">'+
      '</div>'+
      '<div id="bodyContent">'+
      '<p>' + location.caption + '</p>'+
      '</div>'+
      '</div>';
      
  var infowindow = new google.maps.InfoWindow({
      content: contentString
  });
  
  marker.addListener('click', function() {
    infowindow.open(map, marker);
  });
}

var locations = [
  new Location(55.615038, 37.741017, 'Home'),
  new Location(55.649885, 37.664546, 'Univercity'),
  new Location(55.721292, 37.651971, 'Work'),
  new Location(55.753090, 37.635206, 'Stay True bar'),
  new Location(55.612149, 37.733026, 'Kronverk cinema')
];

locations.forEach(function(location) {
  addMarkerToMap(location);
})