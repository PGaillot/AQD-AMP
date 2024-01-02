import ProjectApi from "./api/projects.api.js";
import ImageApi from "./api/image.api.js";
import HouseRequestApi from "./api/houseRequest.api.js";
import HouseRequest from "./houseRequest.model.js";
import GeocodingApi from "./api/geocoding.api.js";

const mapLayer = document.getElementById("map");
const houseRequestApi = new HouseRequestApi();
const imageApi = new ImageApi();
const projectApi = new ProjectApi();
const geocodingApi = new GeocodingApi();

// MODAL 💬
const askHouse = document.getElementById("ask-house");
const modalCloseButton = document.getElementById("modal-close-button");
const snackBar = document.getElementById("modal-snackbar");

// MAP 🗺️
const henrivilleLocation = [49.884195, 2.299391];
const requestForm = document.getElementById("request-form");
const modal = document.getElementById("modal");

// POPUP 💥
const closeButton = document.querySelector(".close-button");
const arrow = document.getElementById("arrow");
const popUp = document.getElementById("popUp");

//?----------------- 🗺️🗺️ MAP 🗺️🗺️ -----------//

mapLayer.addEventListener("click", () => {
  if (modal.classList[0] === "show-modal") {
    toggleModal();
  }
});

var map = L.map("map").setView(henrivilleLocation, 16);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

let greenIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/7191/7191059.png",
  iconSize: [38, 40], // size of the icon
  shadowSize: [50, 85], // size of the shadow
  iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
  shadowAnchor: [4, 62], // the same for the shadow
  popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
});

//? -------- 💥💥💥 POP-UP 💥💥💥 ----------------//

function togglePopUp() {
  popUp.classList.toggle("show-popup");
  popUp.classList.toggle("hidden-popup");
}

function loadPopUp(project) {
  document.getElementById("address").textContent = project.address;
  document.getElementById("description").textContent = project.description;
  document.getElementById("title").textContent = project.title;
  document.getElementById("city").textContent = project.city;
  document.getElementById("district").textContent = project.district;

  if (project.district === "" || project.district === undefined) {
    arrow.style.display = "none";
  } else {
    arrow.style.display = "block";
  }

  //! "APPEL D'API, de l'image "//
  imageApi
    .getProjectImageUrl(project.imgId)
    .then((data) => {
      document.getElementById("img").src = data;
    })
    .catch((error) => console.error(error))
    .finally(() => console.log("It's over"));
}

function onMarkerClick(project) {
  togglePopUp();
  loadPopUp(project);
  console.log(project);
}

closeButton.addEventListener("click", () => {
  togglePopUp();
});

projectApi
  .getProjects()
  .then((projects) => {
    projects.forEach((project) => {
      if (project.lat && project.long)
        L.marker([project.lat, project.long], { icon: greenIcon })
          .bindPopup(project.address)
          .addTo(map)
          .on("click", onMarkerClick.bind(null, project));
    });
  })
  .catch((e) => console.error(e));

//? --------------------💬💬 MODAL 💬💬--------------------//

function toggleModal() {
  if (modal.classList[0] === "show-modal") {
    setTimeout(() => {
      modal.classList.toggle("show-modal");
      modal.classList.toggle("hidden-modal");
      askHouse.style.display = "block";
    }, 300);
    modal.classList.toggle("modal-opacity-on");
    modal.classList.toggle("modal-opacity-off");
  } else {
    modal.classList.toggle("show-modal");
    modal.classList.toggle("hidden-modal");
    setTimeout(() => {
      modal.classList.toggle("modal-opacity-on");
      modal.classList.toggle("modal-opacity-off");
      askHouse.style.display = "none";
    }, 10);
  }
  askHouse.style.display = "none";
}

function toggleSnackbar() {
  snackBar.classList.add("show");
  setTimeout( ()=> {
   snackBar.classList.remove("show");
  }, 3000);
}

askHouse.addEventListener("click", () => {
  if (popUp.classList[0] === "show-popup") {
    togglePopUp();
    setTimeout(() => {
      toggleModal();
    }, 200);
  } else {
    toggleModal();
  }
});

modalCloseButton.addEventListener("click", toggleModal);

//^ START on form submit //

requestForm.addEventListener("submit", function (event) {
  event.preventDefault(); // Empêche la soumission par défaut du formulaire
  const emailInput = document.getElementById("modal-email");
  const addressInput = document.getElementById("modal-address");
  const msgInput = document.getElementById("modal-msg");
  const cityInput = document.getElementById("modal-city");
  const districtInput = document.getElementById("modal-district");
  const zipCodeInput = document.getElementById("modal-zip-code");

  const email = emailInput.value;
  const address = addressInput.value;
  const city = cityInput.value;
  const district = districtInput.value;
  const zipCode = zipCodeInput.value;
  const msg = msgInput.value;
  //   const imgFiles = imgInput.files;
  const completeAddress = address + " " + zipCode + " " + city;
  const inputs = requestForm.querySelectorAll("input");
  console.log(completeAddress);

  geocodingApi
    .getCoordinateFromAddress(completeAddress)
    .then((data) => {
      //? Ici on recupere la lat et lng depuis l'API de geocoding//
      const houseRequest = new HouseRequest(
        email,
        address,
        data.lat,
        data.lng,
        city,
        district,
        zipCode,
        [],
        msg
      );

      houseRequestApi.createHouseRequest(houseRequest);

      toggleModal();
      toggleSnackbar();

      //TODO: Add a snack bar //
      inputs.forEach((input) => (input.value = ""));
    })
    .catch((error) => {
      console.error(error);
      window.alert(
        `${completeAddress} n'est pas reconnue commme une vraie adresse :(`
      );
    });
});
