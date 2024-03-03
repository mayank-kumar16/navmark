"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const removeButton = document.querySelector(".removeallDetails");
const showhideBtn = document.querySelector(".showhidebox");
const sideBar = document.querySelector(".sidebar");

// workout class
class Workouts {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // we need array here [lat,lng]
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // prettier-ignore
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    // console.log(this.description);
  }
}

class Running extends Workouts {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workouts {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([13, -12], 20, 60, 5);
// const cycle1 = new Running([20, 25], 40, 45, 15);

// console.log(run1, cycle1);

// let map, mapEvent;
// main App class holding all the methods
// architech
class App {
  #map;
  #maxZoomlevel = 13;
  #mapEvent;
  #workoutslist = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._newTOPopup.bind(this));
  }

  //setting data to local storage
  _setLocalStorage() {
    localStorage.setItem("workoutstorage", JSON.stringify(this.#workoutslist));
  }
  //getting data from local storage
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workoutstorage"));
    // console.log(data);

    if (!data) return;

    this.#workoutslist = data;

    // console.log(this.#workoutslist);

    this.#workoutslist.forEach((workoutstorage) => {
      this._renderWorkoutonDom(workoutstorage);
    });
  }

  resetLocalstorage() {
    localStorage.removeItem("workoutstorage");
    location.reload();
  }

  // getPosition method
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("can not get your position");
        }
      );
    }
  }

  //loadMap method
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    //leaflet js
    this.#map = L.map("map").setView(coords, this.#maxZoomlevel); // coords array and zoom level (13)

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));

    this.#workoutslist.forEach((workout) => {
      this._rendermarkerworkout(workout);
    });
  }

  //showForm methos
  _showForm(mapEv) {
    this.#mapEvent = mapEv;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  //hide form method
  _hideForm() {
    //clearing values
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value ="";
    //iding form
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);
  }

  //toggleElevationField methos
  _toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  // newworkout method
  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const allPositive = (...inputsN) => inputsN.every((inp) => inp > 0);

    e.preventDefault();
    // console.log("submitted");

    //get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    // const { latt, lngg } = this.#mapEvent.latlng;
    //render workout on map as marker
    const { lat } = this.#mapEvent.latlng;
    const { lng } = this.#mapEvent.latlng;

    // if workout running create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      //check if data is valid
      // using guard clause
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("input should be a positive number");
      // creating new running object if everything is okay
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // if workout cycling create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      // using guard clause
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("input should be a positive number");
      // if user inputs right value then create a cycling workout
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // add new object to workout array
    this.#workoutslist.push(workout);
    // console.log(workout);

    // setting marker
    this._rendermarkerworkout(workout);

    //render workout on list
    this._renderWorkoutonDom(workout);

    //hide the form
    this._hideForm();

    //setting to local storage
    this._setLocalStorage();
  }
  _rendermarkerworkout(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }).setContent(
          `${workout.type == "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
        )
      )
      .openPopup();
  }
  _renderWorkoutonDom(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id=${
      workout.id
    }>
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type == "running" ? "🏃‍♂️" : "🚴‍♀️"
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    // renderig for running
    if (workout.type === "running") {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
      </li>`;
    }

    // renderig for cycling
    if (workout.type === "cycling") {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;
    }

    form.insertAdjacentHTML("afterend", html);
  }

  _newTOPopup(e) {
    const targetEl = e.target.closest(".workout");
    // console.log(targetEl);
    if (!targetEl) return;

    const workoutDetails = this.#workoutslist.find((workoutDetail) => {
      return workoutDetail.id === targetEl.dataset.id;
    });
    // console.log(workoutDetails);
    this.#map.setView(workoutDetails.coords, this.#maxZoomlevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // workoutDetails.click();
    // console.log(workoutDetails);
  }
}

const app = new App();

removeButton.addEventListener("click", app.resetLocalstorage);

// removeButton.addEventListener("click", app.resetLocalstorage());

showhideBtn.addEventListener("click", function (e) {
  if (e.target.innerHTML === "Hide activities") {
    e.target.innerHTML = "Show activities";
  } else {
    e.target.innerHTML = "Hide activities";
  }
  sideBar.classList.toggle("hide");
});
