'use strict';

// NOTE: when you converts and object to a string and convert it back to object then prototype chain is lost.
// they become regular objects, and does not inherit methods, problem with local storage. to solve this you can restore the objects you get from localStorage to new object

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    // in real life we generally use to create ids , its not a good idea to create our own ids
    id = (Date.now() + '').slice(-10);
    clicks = 0;
    constructor(coords, distance, duration) {
        this.coords = coords; // array of latitude and longitude --> [lat, long]
        this.distance = distance; // in km
        this.duration = duration; // in minutes
    }
    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(
            1
        )} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
    click() {
        this.clicks++;
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        // minutes /km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    // this will be available on all the instances of cycling
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        // km/h
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

// const run = new Running([59, -12], 5.2, 24, 170);
// const cyc = new Cycling([39, -12], 26, 90, 560);

// console.log(run);
// console.log(cyc);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Application architecture
class App {
    #map;
    #mapEvent;
    #mapZoomLevel = 13;
    #workouts = [];
    constructor() {
        // get user's position
        this._getPosition();

        // get data from localStorage
        this._getLocalStorage();

        // attach event handlers when app loads
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener(
            'click',
            this._moveToPopup.bind(this)
        );
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
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        // tileLayer(link of map style: you can change it to have different look for your map)
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        // handling clicks on a map
        // this on method is from leaflet library not from js
        // if you attach event handler to entire map element you won't be able to know where user clicked and so you will be unable to access location coordinates
        this.#map.on('click', this._showForm.bind(this));

        // for explanation go to _getLocalStorage
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });
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

        const validInputs = (...inputs) =>
            inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        //1. get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        // if workout running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            // check if data is valid
            if (
                // !Number.isFinite(distance) ||
                // !Number.isFinite(duration) ||
                // !Number.isFinite(cadence)

                !validInputs(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            ) {
                return alert('Inputs have to be positive number');
            }
            workout = new Running([lat, lng], distance, duration, cadence);
        }
        // if workout cycling create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (
                // !Number.isFinite(distance) ||
                // !Number.isFinite(duration) ||
                // !Number.isFinite(cadence)

                !validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration)
            ) {
                return alert('Inputs have to be positive number');
            }
            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        this.#workouts.push(workout);
        // console.log(this.#workouts);

        // add new object to workout array

        // render workout on map as marker

        //  render workout on list

        // hide form+ clear input fields

        // console.log(lat, lng);
        this._renderWorkoutMarker(workout);
        this._renderWorkout(workout);
        this._hideForm();

        // set local storage to store all workouts
        this._setLocalStorage();
    }
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(
                `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
                    workout.description
                }`
            )
            .openPopup();
    }
    _renderWorkout(workout) {
        let workoutMarkup = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
                workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

        if (workout.type === 'running') {
            workoutMarkup += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(
                        1
                    )}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
            `;
        }

        if (workout.type === 'cycling') {
            workoutMarkup += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(
                        1
                    )}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
        </li>`;
        }
        form.insertAdjacentHTML('afterend', workoutMarkup);
    }

    _hideForm() {
        //clear input fields
        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
                '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => {
            form.style.display = 'grid';
        }, 1000);
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        // console.log(workoutEl);
        if (!workoutEl) return;

        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        );
        // console.log(workout);

        // there is a method available in leaflet which is available on every map which can take you to a marker popup
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });

        //  using the public interface
        // workout.click();
    }

    _setLocalStorage() {
        // local storage is an API available in browser: local storage is simply a key value store
        // JSON.stringify(object) --> converts any js object to string
        // local storage is small and blocking so you should not store large amounts of data in it
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        // getItem accepts data key which you used to store your data, you  will get JSON data in string format so you have to parse it

        const data = JSON.parse(localStorage.getItem('workouts'));
        // console.log(data);
        if (!data) return;

        this.#workouts = data;
        this.#workouts.forEach(work => {
            this._renderWorkout(work);
            // this does not work here because this _getLocalStorage gets executed when page loads but till than map is not loaded yet which causes an error , so shift it after the map has loaded
            // this._renderWorkoutMarker(work);
        });
    }

    reset() {
        localStorage.removeItem('workouts');
        // location have a lot of methods and it also has reload  one of them which reloads the page
        location.reload();
    }
}

const app = new App();
// to avoid this we have a method in class that gets executed immediately when object is created, constructor method.
// app._getPosition()

// geolocation API : browser API
// getCurrentPosition(success callback fxn, error callback fxn)
