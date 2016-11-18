var map;
var infowindow;
var service;
var place_types = [];
var model = new MapViewModel();

var foursquare = {
    // properties for the API query
    client_id: "JM1HR302DJHO0EPPDKD25IINSQDNDTK2ASUFM4DSVXACCFS4",
    client_secret: "GEU1HGSQBDAM3JFJOABMLGCGL2IQH0RHY4HGITZMIIVZRMRS",
    ll: "39.9566,-75.1899",
    v: "20161118",
    radius: '1000',

    // Function to get query url
    get_url: function () {
        var url = "https://api.foursquare.com/v2/venues/search?";
        url += "ll=" + this.ll;
        url += "&client_id=" + this.client_id;
        url += "&client_secret=" + this.client_secret;
        url += "&v=" + this.v;
        url += "&radius=" + this.radius;
        return url;
    },

    // Make the request to foursquare asynchronously and add the venues to the model
    get_locations: function () {
        var url = this.get_url();
        console.log(url);
        $.ajax({
            url: url,
            success: function (data) {
                console.log(data);
                var venues = data.response.venues;
                for (i = 0; i < venues.length; i++) {
                    var venue = venues[i];

                    model.addPlace(venue);
                }
            },
            error: function(err) {
                $("#foursquareError").show();
            }
        });
    }
};

function MapViewModel() {
    var self = this;

    self.places = ko.observableArray([]);
    self.query = ko.observable('');

    self.query.subscribe(function (newValue) {
        var search = newValue.toLowerCase();
        for (i = 0; i < self.places().length; i++) {
            var match = search === '' || self.places()[i].name.toLowerCase().includes(search);
            self.places()[i].visible(match);
            self.places()[i].marker.setVisible(match);
        }
    });

    self.addPlace = function (place) {
        // Visibility
        place.visible = ko.observable(true);

        // Make marker
        var marker = new google.maps.Marker({
            map: map,
            position: {
                lat: place.location.lat,
                lng: place.location.lng
            },
            title: place.name
        });

        // Make infoContent
        var infoContent = "<div class=\"content\"><strong>" + place.name + "</strong><br>";
        if ((place.categories !== null) && (typeof place.categories !== "undefined")) {
            if (place.categories.length > 0) {
                infoContent += "Categories: " + place.categories[0].name;
                for (j = 1; j < place.categories.length; j++) {
                    infoContent += ", " + place.categories[j].name;
                }
                infoContent += "<br>";
            }
        }
        infoContent += "Check-in count: " + place.stats.checkinsCount + "<br>";
        var address = place.location.formattedAddress;
        for (j = 0; j < address.length - 1; j++) {
            infoContent += address[j] + "<br>";
        }
        if ((place.url !== null) && (typeof place.url !== "undefined")) {
            infoContent += "<strong>Website:</strong> <a href=\"" + place.url + "\">" + place.url + "</a><br>";
        }

        infoContent += "</div>";

        // Set click event for marker
        google.maps.event.addListener(marker, 'click', function () {
            infowindow.setContent(infoContent);
            map.setCenter(marker.getPosition());
            infowindow.open(map, this);
        });

        // Save the marker and infoContent
        place.marker = marker;
        place.infoContent = infoContent;

        // Push and sort
        self.places.push(place);
        self.places.sort(function (a, b) {
            if (a.name < b.name) return -1;
            else if (a.name > b.name) return 1;
            return 0;
        });
    };

    self.item_clicked = function (place) {
        var marker = place.marker;
        map.setCenter(marker.getPosition());
        infowindow.setContent(place.infoContent);
        infowindow.open(map, marker);
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            marker.setAnimation(null);
        }, 1500);
        $('html, body').animate({
            scrollTop: $("#map").offset().top
        }, 1500);
    };
}

function initMap() {
    $("#googleError").hide();
    $("#foursquareError").hide();
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 39.9566,
            lng: -75.1899
        },
        zoom: 18
    });

    infowindow = new google.maps.InfoWindow();
    service = new google.maps.places.PlacesService(map);

    foursquare.get_locations();
}

function googleError() {
    $("#googleError").show();
}

ko.applyBindings(model);