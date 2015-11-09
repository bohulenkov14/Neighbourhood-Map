var ApplicationViewModel = function() {
  var self = this;
  var map;
  var currentOpenedInfowindow;
  var currentOpenedMarker;
  var currentMarkers = [];
  var defaultNeighborhood = 'Moscow';
  var myLatLng = {lat: 55.751244, lng: 37.618423};
  var places = [];

  self.filterInput = ko.observable('');
  self.errorsHappened = ko.observable(false);
  self.neighborhood = ko.observable(defaultNeighborhood);
  self.interestingPlaces = ko.observableArray([]);
  self.availableNeighborhoods = ko.observableArray([
    'Moscow',
    'New York',
    'Tokyo',
    'San Francisco',
    'St. Petersburg',
    'Paris',
    'Hong Kong',
    'Pekin',
    'Berlin'
  ]);

  /**
  * @description This method is used for pushing array of values to observable array, taken from http://stackoverflow.com/questions/23606541/observable-array-push-multiple-objects-in-knockout-js
  * @param {array} valuesToPush - Array of values to push to observable array
  */
  ko.observableArray.fn.pushAll = function(valuesToPush) {
    var underlyingArray = this();
    this.valueWillMutate();
    ko.utils.arrayPushAll(underlyingArray, valuesToPush);
    this.valueHasMutated();
    return this;  //optional
  };


  /**
  * @description Google maps initializer
  */
  self.initMap = function() {
    // Create a map object and specify the DOM element for display.
    map = new google.maps.Map(document.getElementById('map'), {
      center: myLatLng,
      zoom: 8,
      mapTypeControl: false,
      streetViewControl: false
    });
  };

  /**
  * @description Construction of InfoWindow content from location object and adding corresponding marker to map
  * @param {Location} location - Location object, containing necessary info about place
  */
  var addMarkerToMap = function(location) {

    var marker = new google.maps.Marker({
      position: { lat:location.lantitude , lng:location.longtitide },
      map: map
    });

    //When thumbnail image is present in response - show it in InfoWindow
    var img;
    if (location.thumbnail !== '')
      img = '<img src="' + location.thumbnail + '" class="thumb">';
    else
      img = '';

    //Template for InfoWindow
    var contentString =
    '<div id="content">'+
      '<h2 class="bold-header">' + location.name + '</h2>' +
      '<div class="img-contacts">'+
        '<div class="img">' + img + '</div>' +
        '<div class="contacts">' +
          '<div>' +
            '<span class="bold-header">Address: </span>' +
            '<span class="text">' + location.formattedAddress + '</span>' +
          '</div>' +
          '<div>' +
            '<span class="bold-header">Rating: </span>' +
            '<span class="text">' + location.rating + '</span>' +
          '</div>' +
          '<div><a class="fa fa-foursquare" href="'+ location.foursquareLink + '"></a></div>' +
        '</div>' +
      '</div>' +
      '<p class="text">' + location.caption + '</p>'+
    '</div>';

    var infowindow = new google.maps.InfoWindow({
      content: contentString
    });


    google.maps.event.addListener(infowindow, 'closeclick', function() {
      for (var i = 0; i < currentMarkers.length; ++i)
          currentMarkers[i].setAnimation(null);
    });

    //Callback function for click event for list items and markers
    var openFunc = (function(infWnd, marker) {
      return function() {

        for (var i = 0; i < currentMarkers.length; ++i)
          currentMarkers[i].setAnimation(null);

        if (currentOpenedInfowindow && currentMarkers !== null)
          currentOpenedInfowindow.close();
          infWnd.open(map, marker);

          currentOpenedInfowindow = infWnd;
          currentOpenedMarker = marker;

          var anim = marker.getAnimation();
          if (anim) {
            marker.setAnimation(null);
          } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
          }

          var latLng = marker.getPosition();
          map.setCenter(latLng);
      };
    })(infowindow, marker);

    marker.addListener('click', openFunc);

    //save callback function to location object for further usage with list of places
    location.openAssociatedInfoWindow = openFunc;

    currentMarkers.push(marker);
  };

  /**
  * @description Construction of Location object from JSON response from Foursquare
  * @param {object} data - JSON from Foursquare's response
  */
  var getLocationFromRequestData = function( data ) {
    var latitude = data.venue.location.lat;
    var longtitude = data.venue.location.lng;
    var name = data.venue.name;
    var caption;
    if (data.snippets.items.length > 0 &&
      data.snippets.items[0].hasOwnProperty('detail') &&
      data.snippets.items[0].detail.hasOwnProperty('object') &&
      data.snippets.items[0].detail.object.hasOwnProperty('text'))
      caption = data.snippets.items[0].detail.object.text;
    else
      caption = '';

    var photo;
    if (data.hasOwnProperty('photo'))
      photo = data.photo.prefix + '100x100' + data.photo.suffix;
    else
      photo = '';

    var formattedAddress = data.venue.location.formattedAddress[0];
    var address = data.venue.location.address;
    var rating = data.venue.rating;
    var url = data.venue.canonicalUrl;

    var loc = new Location(latitude, longtitude, name, caption, photo, formattedAddress, address, rating, url);

    return loc;
  };

  /**
  * @description Callback for AJAX request to Foursquare
  * @param {object} data - JSON from Foursquare's response
  */
  var foursquareRequestCompleted = function( data ) {

    var results = data.response.group.results;
    if (results) {
      if (results.length > 0) {
        var targetIndex = Math.floor(results.length/2);
        var target = results[targetIndex];
        var mapZoom = { lat: target.venue.location.lat, lng: target.venue.location.lng };
        map.setZoom(10);
        map.panTo(mapZoom);
      }

      results.forEach(function( item ) {
        var loc = getLocationFromRequestData( item );
        places.push(loc);
        addMarkerToMap(loc);
      });

      self.interestingPlaces.removeAll();
      self.interestingPlaces.pushAll(places);
    }
  };

  /**
  * @description Clear all markers from map
  */
  var clearMarkers = function() {
    for ( var i = 0; i < currentMarkers.length; ++i ) {
      currentMarkers[i].setMap(null);
    }
    currentMarkers.length = 0;
  };


  /**
  * @description Event callback for clearing filter on neighborhood change event
  */
  self.changeNeighborhood = function() {
    self.filterInput("");
  };

  /**
  * @description Create AJAX request to Foursquare to fetch interesting location for current neighborhood
  */
  self.processNewNeighborhood = function() {
    clearMarkers();
    places = [];

    var foursquareLink = 'https://api.foursquare.com/v2/search/recommendations?m=foursquare&near='+self.neighborhood()+'&oauth_token=MRX15WXU5C42TF0ZI12BNY4GFIFNBYFVMJWXITDDTOUFYIRL&v=20151103';

    $.getJSON(foursquareLink, foursquareRequestCompleted)
    .fail(function() {
      self.errorsHappened(true)
    });
  };

  /**
  * @description Computed property for getting interesting places for new neighborhood
  */
  self.computedMarkers = ko.computed(function() {
    if (self.neighborhood() !== '') {
      self.processNewNeighborhood();
    }
  });


  /**
  * @description Computed property for filtering locations for current neighborhood
  */
  self.filter = ko.computed(function() {

    var filteredPlaces = [{}];
    var inp = self.filterInput();

    //If filter string is empty - show all places for current neighborhood
    if (self.filterInput() === "") {
      filteredPlaces = places;
      self.interestingPlaces.removeAll();
      self.interestingPlaces.pushAll(places);

    } else {

      for (var i = 0; i < places.length; i++) {
        var lowercaseName = places[i].name.toLowerCase();
        var lowercaseFilter = self.filterInput().toLowerCase();
        if (lowercaseName.search(lowercaseFilter) !== -1) {
          filteredPlaces.push(places[i]);
        }
      }
    }

    self.interestingPlaces.removeAll();
    self.interestingPlaces.pushAll(filteredPlaces);

    clearMarkers();
    for (var i = 1; i < filteredPlaces.length; ++i) {
      addMarkerToMap(filteredPlaces[i]);
    }
  });
};

// initialize the view model binding
var viewModel = new ApplicationViewModel();
ko.applyBindings(viewModel);


$("#menu-toggle").click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
});
