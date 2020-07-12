export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaG9ybGFyOTk1IiwiYSI6ImNrYXNocmJzaTBibTAyeWwydjE4NWU4ZDkifQ.e_q9vdxonX3yJUvNeMJf5w';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/horlar995/ckasicwpx07th1iqvhbm9xplu',
        scrollZoom: false
    });

    // Creating Boundary for the Map(i.e specific locations the map is restricted to display)
    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        // Creating Marker(i.e specific locations on the map to be indicated with Map marker(i.e Map arrow))
        const el = document.createElement('div');
        el.className = 'marker';
        // Add Marker to the coordinates of the Tours::
        new mapboxgl.Marker({
                element: el,
                anchor: 'bottom'
            }).setLngLat(loc.coordinates).addTo(map)
            // POPUP(i.e creating Popup on the marker to show the name of the locations)::
        new mapboxgl.Popup({
                offset: 30
            }).setLngLat(loc.coordinates).setHTML(`<p>${loc.day}: ${loc.description}</p>`).addTo(map)
            //Extend map boundaries to include the location of the Tour under consideration::
        bounds.extend(loc.coordinates)
    })

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}