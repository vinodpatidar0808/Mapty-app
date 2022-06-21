'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map, mapEvent;
// geolocation API : browser API
// getCurrentPosition(success callback fxn, error callback fxn)]
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            console.log(position);
            const { latitude, longitude } = position.coords;
            console.log(latitude, longitude);
            // google maps :https://www.google.com/maps/@latitude,longitude
            // console.log(
            //     `https://www.google.com/maps/@${latitude},${longitude}`
            // );
            const coords = [latitude, longitude];
            // here map in L.map should be the id of html element which displays the map
            // setView(array[latitude, long], zoom level)
            map = L.map('map').setView(coords, 13);

            // tileLayer(link of map style: you can change it to have different look for your map)
            L.tileLayer(
                'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                {
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                }
            ).addTo(map);

            // handling clicks on a map
            map.on('click', function (mapE) {
                mapEvent = mapE;
                form.classList.remove('hidden');
                inputDistance.focus();
            });
            // L.marker(coords)
            //     .addTo(map)
            //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
            //     .openPopup();

            // console.log(map);
            // this on method is from leaflet library not from js
            // if you attach event handler to entire map element you won't be able to know where user clicked and so you will be unable to access location coordinates
            map.on('click', function (mapEvent) {});
        },
        function () {
            alert('Could not get your location');
        }
    );
}

form.addEventListener('submit', function (e) {
    e.preventDefault();
    // mapEvent will come from above
    // console.log(mapEvent);

    //clear input fields
    inputDistance.value =
        inputDuration.value =
        inputDuration.value =
        inputElevation.value =
            '';

    const { lat, lng } = mapEvent.latlng;
    // console.log(lat, lng);
    L.marker([lat, lng])
        .addTo(map)
        .bindPopup(
            L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: 'running-popup',
            })
        )
        .setPopupContent('Workout')
        .openPopup();
});

inputType.addEventListener('change', function (e) {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});
