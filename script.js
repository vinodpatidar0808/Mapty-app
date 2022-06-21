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

class App {
    #map;
    #mapEvent;
    constructor() {
        this._getPosition();
        form.addEventListener('submit', this._newWorkout.bind(this));

        inputType.addEventListener('change', this._toggleElevationField);
    }
    _getPosition() {
        if (navigator.geolocation) {
            // without bind this _loadMap will be called as a regular function
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert('Could not get your location');
                }
            );
        }
    }

    _loadMap(position) {
        // console.log(position);
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];
        // here map in L.map should be the id of html element which displays the map
        // setView(array[latitude, long], zoom level)
        this.#map = L.map('map').setView(coords, 13);

        // tileLayer(link of map style: you can change it to have different look for your map)
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        // handling clicks on a map
        // this on method is from leaflet library not from js
        // if you attach event handler to entire map element you won't be able to know where user clicked and so you will be unable to access location coordinates
        this.#map.on('click', this._showForm.bind(this));

    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    
    _toggleElevationField() {
        inputElevation
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
        inputCadence
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        e.preventDefault();
        // mapEvent will come from above
        // console.log(mapEvent);

        //clear input fields
        inputDistance.value =
            inputDuration.value =
            inputDuration.value =
            inputElevation.value =
                '';

        const { lat, lng } = this.#mapEvent.latlng;
        // console.log(lat, lng);
        L.marker([lat, lng])
            .addTo(this.#map)
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
    }
}

const app = new App();
// to avoid this we have a method in class that gets executed immediately when object is created, constructor method.
// app._getPosition()

class Workout {
    constructor(id, distance, duration, coords) {
        this.distance = distance;
        this.duration = duration;
        this.coords = coords;
    }
}

class Running extends Workout {
    constructor() {
        super();
    }
}
// geolocation API : browser API
// getCurrentPosition(success callback fxn, error callback fxn)]
