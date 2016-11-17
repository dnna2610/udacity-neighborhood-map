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

function comparePlace(a, b) {
    if (a.name < b.name) return -1;
    else if (a.name > b.name) return 1;
    return 0;
}

function MapViewModel(placeVMs) {
    var self = this;
    self.places = ko.observableArray(placeVMs);
}

var data = {
    places: []
};

var octopus = {
    addPlace: function (place) {
        data.places.push(place);
        data.places.sort(function (a, b) {
            if (a.name < b.name) return -1;
            else if (a.name > b.name) return 1;
            return 0;
        });
        view.render();
    },

    search: function (query) {
        query = query.toLowerCase();
        for (i = 0; i < data.places.length; i++) {
            if (query != '') {
                if (!data.places[i].name.toLowerCase().includes(query)) {
                    data.places[i].visible = false;
                    data.places[i].marker.setVisible(false);
                } else {
                    data.places[i].visible = true;
                    data.places[i].marker.setVisible(true);
                }
            } else {
                data.places[i].visible = true;
                data.places[i].marker.setVisible(true);
            }
        };
        view.render();
    },

    getVisiblePlaces: function () {
        return data.places.filter(function (place) {
            return place.visible === true;
        });
    },

    getMarker: function (place_id) {
        for (i = 0; i < data.places.length; i++) {
            if (data.places[i].place_id === place_id) {
                return data.places[i].marker;
            };
        };
    },

    getInfoContent: function (place_id) {
        for (i = 0; i < data.places.length; i++) {
            if (data.places[i].place_id === place_id) {
                return data.places[i].infoContent;
            };
        };
    },

    init: function () {
        view.init();
    }
};

var view = {

    init: function () {
        this.$placeList = $('#place_list');
        this.placeTemplate = $('script[data-template="place"]').html();

        this.render();
    },

    render: function () {
        var $placeList = this.$placeList,
            placeTemplate = this.placeTemplate;

        $placeList.html('');
        octopus.getVisiblePlaces().forEach(function (place) {
            // Replace template markers with data
            var thisTemplate = placeTemplate.replace(/{{id}}/g, place.place_id).replace(/{{name}}/g, place.name);
            $placeList.append(thisTemplate);
            $("#" + place.place_id).click(function () {
                map.setCenter(place.marker.getPosition());
                infowindow.setContent(place.infoContent);
                infowindow.open(map, place.marker);
            });
        });
    }
};

octopus.init();

function processLocation(i) {
    service.getDetails({
        placeId: locations[i].placeID
    }, function (place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            place.visible = true;

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
            octopus.addPlace(place);
        } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            setTimeout(function (){
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

var SearchViewModel = {
    query: ko.observable('')
}

ko.applyBindings(SearchViewModel);

SearchViewModel.query.subscribe(function (newValue) {
    octopus.search(newValue);
});