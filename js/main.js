/*
 * Başlangıçta kullanıcının konuma erişmeliyiz.Bu sayede haritanın başlangıç konumunu belirleriz. */

import { personIcon } from "./constants.js";
import { getNoteIcon, getStatus } from "./helpers.js";
import elements from "./ui.js";

// Global Değişkenler
var map;
let clickedCoords;
let layer;
// Localstorage'dan notes keyine sahip elemanları al
let notes = JSON.parse(localStorage.getItem("notes")) || [];

// window içerisindeki navigator objesi içerisinde kullanıcının açmış olduğu sekme ile alakalı birçok veriyi bulundurur.(kordinat,tarayıcı ile alakalı veriler,pc ile alakalı veriler)Bizde bu yapı içerisindeki geolocation yapısıyla kordinat verisine eriştik.geolocation içerisindeki  getCurrentPosition kullanıcının  mevcut konumunu almak için kullanılır.Bu fonksiyon içerisine iki adet callBack fonksiyon ister.Birincisi kullanıcının konum bilgisini paylaşması durumunda çalışır ikincisi ise konum bilgisini paylaşmaması durumunda çalışır.

window.navigator.geolocation.getCurrentPosition(
  (e) => {
    //konum bilgisi paylaşıldığında
    loadMap([e.coords.latitude, e.coords.longitude], "Mevcut Konum");
  },
  (e) => {
    //konum bilgisi paylaşılmadığında
    loadMap([39.925143, 32.837528], "Varsayılan Konum");
  }
);

//haritayı oluşturan fonksiyon

function loadMap(currentPosition, msg) {
  map = L.map("map", {
    zoomControl: false,
  }).setView(currentPosition, 12);

  // Haritayı render eder
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // zoom araçlarının konumunu belirle
  L.control.zoom({ position: "bottomright" }).addTo(map);

  // ekrana basılacak katman oluştur

  layer = L.layerGroup().addTo(map);

  // kullanıcının başlangıç konumuna bir tane marker ekle

  L.marker(currentPosition, { icon: personIcon }).addTo(map).bindPopup(msg);

  // harita üzerindeki tıklanma olaylarını izle

  map.on("click", onMapClick);

  // notları render eden fonk
  renderNotes();

  // Markerları render eden fonksiyon
  renderMarkers();
}

//! haritaya tıklanıldığında çalışacak fonksiyon
function onMapClick(e) {
  //tıklanılan yerin kordinatlarına eriş
  clickedCoords = [e.latlng.lat, e.latlng.lng];

  //aside'a add classını ekle
  elements.aside.classList.add("add");
}

//! form gönderildiğinde calısacak fonk

elements.form.addEventListener("submit", (e) => {
  // sayfa yenilenmeyi engelle
  e.preventDefault();

  //form içerisindeki değerlere eriş
  const title = e.target[0].value;
  const date = e.target[1].value;
  const status = e.target[2].value;

  // bir tane not objesi oluştur
  const newNote = {
    id: new Date().getTime(),
    title,
    date,
    status,
    coords: clickedCoords,
  };

  //note dizisine yeni notları ekle
  notes.push(newNote);

  // LocalStorage'a notları kaydet
  localStorage.setItem("notes", JSON.stringify(notes));

  //formu resetle
  e.target.reset();

  //asideı eski haline çevir
  elements.aside.classList.remove("add");

  // Noteları render et
  renderNotes();

  // Markerları render et
  renderMarkers();
});

// close btne tıklanınca aside'ı tekrardan eski haline çevir

elements.cancelBtn.addEventListener("click", () => {
  elements.aside.classList.remove("add");
});

//mevcut notları render eden fonk

function renderNotes() {
  //note dizisini dönerek her bir not için bir html oluştur

  const noteCard = notes
    .map((note) => {
      //tarih ayarlaması
      const date = new Date(note.date).toLocaleDateString("tr", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      // Status ayarlaması
      //  getStatus adında bir fonksiyon yazıldı.Bu fonksiyon kendisine verilen status değerine göre uygun ifadeyi return etti
      return ` <li>

          <div>
            <p>${note.title}</p>
            <p>${date}</p>
            <p>${getStatus(note.status)}</p>
            
          </div>
      
          <div class="icons">
            <i data-id='${
              note.id
            }' class="bi bi-airplane-fill" id="fly-btn"></i>
            <i data-id='${note.id}' class="bi bi-trash" id="delete-btn"></i>
          </div>
        </li>`;
    })
    .join("");

  // ilgili htmli arayüze ekle
  elements.noteList.innerHTML = noteCard;

  //delete iconlarına eriş
  document.querySelectorAll("#delete-btn").forEach((btn) => {
    //delete iconunun idsine eriş
    const id = btn.dataset.id;
    // delete iconlarına tıklanınca deleteNote fonksiyonunu çalıştır
    btn.addEventListener("click", () => {
      deleteNote(id);
    });
  });

  //fly iconlarına eriş
  document.querySelectorAll("#fly-btn").forEach((btn) => {
    // Fly Btn'e tıklanınca flyNote fonksiyonunu çalıştır
    btn.addEventListener("click", () => {
      // fly btn'in idsine eriş
      const id = +btn.dataset.id;
      flyToNote(id);
    });
  });
}
// Her not için bir marker render eden fonksiyon

function renderMarkers() {
  // Haritadaki markerları sıfırla
  layer.clearLayers();
  notes.map((note) => {
    // Eklenecek ikonun türüne karar ver
    const icon = getNoteIcon(note.status);

    // Not için bir marker oluştur
    L.marker(note.coords, { icon }).addTo(layer).bindPopup(note.title);
  });
}

// Not silen fonksiyon
function deleteNote(id) {
  // Kullanıcıdan onay al
  const res = confirm("Not silme işlemini onaylıyor musunuz ?");

  // Eğer kullanıcı onayladıysa
  if (res) {
    // İd'si bilinen not'u note dizisinden kaldır
    notes = notes.filter((note) => note.id != id);

    // localestorage'ı güncelle
    localStorage.setItem("notes", JSON.stringify(notes));

    // notları render et
    renderNotes();
    // markerları render et
    renderMarkers();
  }
}

// Notlara focuslanan fonksiyon
function flyToNote(id) {
  // İd'si bilinen notu note dizisi içerisinden bul
  const foundedNote = notes.find((note) => note.id == id);

  // Bulunan not'a focuslan
  map.flyTo(foundedNote.coords, 12);
}

// arrowIcon'a tıklanınca çalışacak fonksiyon

elements.arrowIcon.addEventListener("click", () => {
  elements.aside.classList.toggle("hide");
});

// sayfa yüklendiği anı izle ve gerekli fonsiyonları çalıştır

document.addEventListener("DOMContentLoaded", () => {
  renderNotes();
});
