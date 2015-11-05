var ApplicationViewModel = function() {
	var self = this;
	var map;
	var currentOpenedInfowindow;
	var currentMarkers = [];
	var defaultNeighborhood = "Moscow";
	var myLatLng = {lat: -34.397, lng: 150.644};
	
	self.neighborhood = ko.observable(defaultNeighborhood); 
	
	var initMap = function() {
		// Create a map object and specify the DOM element for display.
		map = new google.maps.Map(document.getElementById('map'), {
			center: myLatLng,
			zoom: 8,
			mapTypeControl: false,
			streetViewControl: false
		});
	}
	
	var addMarkerToMap = function(location) {
  
		var marker = new google.maps.Marker({
			position: { lat:location.lantitude , lng:location.longtitide },
			map: map
		});
		
		var img;
		if (location.thumbnail !== '')
			img = '<img src="' + location.thumbnail + '" class="thumbnail">';
		else
			img = '';
			
		var contentString = '<div id="content">'+
			'<div id="siteNotice">'+
			'</div>'+
			'<div id="bodyContent">'+
			'<h3>' + location.name + '</h3>' +
			img +
			'<p>' + location.caption + '</p>'+
			'</div>'+
			'</div>';
			
		var infowindow = new google.maps.InfoWindow({
			content: contentString
		});
		
		marker.addListener('click', (function(infWnd ) {
			return function() {
				if (currentOpenedInfowindow)
					currentOpenedInfowindow.close();
				infWnd.open(map, marker);
				currentOpenedInfowindow = infWnd;
			};
		})(infowindow));
		
		currentMarkers.push(marker);
	}
	initMap();
	
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
				var latitude = item.venue.location.lat;
				var longtitude = item.venue.location.lng;
				var name = item.venue.name;
				var caption;
				if (item.snippets.items.length > 0 && 
					item.snippets.items[0].hasOwnProperty('detail') &&
					item.snippets.items[0].detail.hasOwnProperty('object') &&
					item.snippets.items[0].detail.object.hasOwnProperty('text'))
					caption = item.snippets.items[0].detail.object.text;
				else
					caption = '';
				
				var photo;
				if (item.hasOwnProperty('photo'))
					photo = item.photo.prefix + '100x100' + item.photo.suffix;
				else
					photo = '';
				
	
				var loc = new Location(latitude, longtitude, name, caption, photo);
				addMarkerToMap(loc);
			});
		}
	} 
	
	var clearMarkers = function() {
		for ( var i = 0; i < currentMarkers.length; ++i ) {
			currentMarkers[i].setMap(null);
		}
		currentMarkers.length = 0;
	}
	
	self.computedMarkers = ko.computed(function() {
		if (self.neighborhood() !== '') {
			clearMarkers();
			var foursquareLink = 'https://api.foursquare.com/v2/search/recommendations?m=foursquare&near='+self.neighborhood()+'&oauth_token=MRX15WXU5C42TF0ZI12BNY4GFIFNBYFVMJWXITDDTOUFYIRL&v=20151103';
			//var foursquareLink = 'https://api.foursquare.com/v2/venues/explore?near='+encodeURIComponent(self.neighborhood())+'&oauth_token=5WJZ5GSQURT4YEG251H42KKKOWUNQXS5EORP2HGGVO4B14AB&v=20151103'; 
			$.getJSON(foursquareLink, foursquareRequestCompleted)
			.fail(function() {})
	    }
	});

	

}

// initialize the view model binding
$(function() {
  ko.applyBindings(new ApplicationViewModel());
});
