var map;
var infowindow;
var service;
var locations = [{
    placeID: "ChIJKcBHSE7GxokR8DA8BOQt8w4"
}, {
    placeID: "ChIJwcw7f1rGxokRlP7WsqKm6gk"
}, {
    placeID: "ChIJ05tdhjTGxokReHRD0wXejyE"
}, {
    placeID: "ChIJvzKmO1vGxokRJm5brUPctFE"
}, {
    placeID: "ChIJL1AEC4PIxokRI--B-1PgOc4"
}, {
    placeID: "ChIJzRoSa4PIxokRahK6-FrchEA"
}, {
    placeID: "ChIJDzmJJf-3xokR3i50d5pyWAU"
}, {
    placeID: "ChIJUb63eirGxokRU2Xvim5o3wQ"
}, {
    placeID: "ChIJ7_9G01HGxokRuYyDgJwwKdA"
}, {
    placeID: "ChIJ0wM-8uDm5okRfpab3kp7wzI"
}, {
    placeID: "ChIJSdey207GxokR6usM52xUdWA"
}, {
    placeID: "ChIJdUqToUHGxokRDZqg10tA46g"
}, {
    placeID: "ChIJaXuGBbbHxokRT7nV1dNbLHo"
}, {
    placeID: "ChIJS2d8qkXGxokRzE_k29GbF3s"
}, {
    placeID: "ChIJ3aHAuDfGxokR4Uzgw4H35rg"
}];

function MapViewModel() {
    var self = this;

    self.places = ko.observableArray([]);
    self.query = ko.observable('');

    self.query.subscribe(function (newValue) {
        search = newValue.toLowerCase();
        for (i = 0; i < self.places().length; i++) {
            if (search != '') {
                if (!self.places()[i].name.toLowerCase().includes(search)) {
                    self.places()[i].visible(false)
                    self.places()[i].marker.setVisible(false);
                } else {
                    self.places()[i].visible(true);
                    self.places()[i].marker.setVisible(true);
                }
            } else {
                self.places()[i].visible(true);
                self.places()[i].marker.setVisible(true);
            }
        };
    });

    self.addPlace = function (place) {
        place.visible = ko.observable(true);
        self.places.push(place);
        self.places.sort(function(a, b) {
            if (a.name < b.name) return -1;
            else if (a.name > b.name) return 1;
            return 0;
        });
    }

    self.item_clicked = function (place) {
        map.setCenter(place.marker.getPosition());
        infowindow.setContent(place.infoContent);
        infowindow.open(map, place.marker);
    }
}

var model = new MapViewModel();
ko.applyBindings(model);

function processLocation(i) {
    service.getDetails({
        placeId: locations[i].placeID
    }, function (place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            var marker = new google.maps.Marker({
                map: map,
                position: place.geometry.location,
                title: place.name
            });

            var infoContent = "<div><strong>" + place.name + "</strong><br>" +
                place.formatted_address;

            if (place.photos != null) {
                infoContent += "<br><figure class=\"image\"><img src=\"" + place.photos[0].getUrl({
                    'maxWidth': 400,
                    'maxHeight': 400
                }) + "\"/></figure>";
            }

            if (place.website != null) {
                infoContent += "<br><strong>Website: </strong> <a href=\"" + place.website + "\">" + place.website + "</a>";
            }

            infoContent += "</div>";

            google.maps.event.addListener(marker, 'click', function () {
                infowindow.setContent(infoContent);
                map.setCenter(marker.getPosition());
                infowindow.open(map, this);
            });

            place.marker = marker;
            place.infoContent = infoContent;
            model.addPlace(place);
        } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            setTimeout(function () {
                processLocation(i);
            }, 1000);
        } else {
            console.log("Status is " + status + " with location number " + i);
        }
    });
};

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 39.9566,
            lng: -75.1899
        },
        zoom: 14
    });

    infowindow = new google.maps.InfoWindow();
    service = new google.maps.places.PlacesService(map);

    for (i = 0; i < locations.length; i++) {
        processLocation(i);
    };
}