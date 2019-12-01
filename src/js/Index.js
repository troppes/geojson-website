const mapsapi = require("google-maps-api")("GOOGLE-MAPS-KEY");
const $ = require("jquery");

let map;
let gmap;
let bounds;
let ctx;
let c = document.getElementById("heightCanvas");
//Promise, der die Karte laedt
mapsapi().then(function (maps) {
	map = new maps.Map(document.getElementById("map-canvas"), {
		center: {
			lat: 49.75, lng: 6.6333
		},
		zoom: 12,
	});
	gmap = maps;
});

//OVERVIEW-Objekt anfordern und berabeiten
(function () {
	let request = new XMLHttpRequest();

	request.addEventListener("error", error => {
		console.error(error.toString());
	});

	request.addEventListener("load", () => {
		if (request.status === 200) {
			let overview = request.response;
			let geoarray = overview.geoobjects;

			Object.keys(geoarray).forEach((id) => {
				$("#table > tbody").append("<tr><td id=" + id + ">" + geoarray[id].name + "</td></tr>"); //Befülle Tabelle
			});
			renderTable();
		}
	});
	request.open("GET", "geoobjects");
	request.responseType = "json";
	request.send();
})();

let totalRows;
let recordPerPage;
let selectedPage;
let totalPages;

let hData;
let hMenu;
let hRow = 0;

//Zeichne Tabelle
function renderTable() {
	//Zeichen Tabellenkopf
	$("<button class='button' id='back'><</button>").appendTo($("#tmenu"));
	$("<button class='button' id='for'>></button>").appendTo($("#tmenu"));
	$("<span id='page'>" + selectedPage + "/" + totalPages + "</span>").appendTo($("#tmenu"));

	hData = $("#data").height();
	hMenu = $("#tmenu").height();
	hRow = $("table tr").height();

	totalRows = $("#table").find("tbody tr:has(td)").length;
	recordPerPage = Math.floor((hData - hMenu - hRow) / hRow);
	selectedPage = 1;
	totalPages = Math.ceil(totalRows / recordPerPage);
	if (!isFinite(totalPages) || totalPages <= 0) {
		totalPages = 0;
	}

	$("#page").text(selectedPage + "/" + totalPages);

	$("table").find("tbody tr:has(td)").hide();
	let tr = $("table tbody tr:has(td)");
	for (let i = 0; i <= recordPerPage - 1; i++) {
		$(tr[i]).show();
	}
	$("button").click(function (event) {
		if (event.target.id === "for") {
			if (selectedPage < totalPages) {
				selectedPage++;
			}
		}
		if (event.target.id === "back") {
			if (selectedPage > 1) {
				selectedPage--;
			}
		}
		tr.hide();
		let nBegin = (selectedPage - 1) * recordPerPage;
		let nEnd = (selectedPage * recordPerPage) - 1;

		$("#page").text(selectedPage + "/" + totalPages);
		for (let i = nBegin; i <= nEnd; i++) {
			$(tr[i]).show();
		}
	});
}
// Warte nach dem Resize um flüssiger zu wirken
let resizeTimer;
$(window).on("resize", function () {
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout(function () {
		hData = $("#data").height();
		hMenu = $("#tmenu").height();
		hRow = $("table tr").height();

		selectedPage = 1;
		recordPerPage = Math.floor((hData - hMenu - hRow) / hRow);
		totalPages = Math.ceil(totalRows / recordPerPage);
		if (!isFinite(totalPages) || totalPages <= 0) {
			selectedPage = "-";
			totalPages = "-";
		}

		$("#page").text(selectedPage + "/" + totalPages);

		let tr = $("table tbody tr:has(td)");
		tr.hide();
		let nBegin = (selectedPage - 1) * recordPerPage;
		let nEnd = (selectedPage * recordPerPage) - 1;

		$("#page").text(selectedPage + "/" + totalPages);
		for (let i = nBegin; i <= nEnd; i++) {
			$(tr[i]).show();
		}
	}, 100);
});

// Melde Event listener für die Tabelle
$("body").on("click", "td", function () {
	geoobjektanfordern(this.id);
});
// Zeichne Linien auf die Map und lade Funktion für das Canvas
function loadPath(geojson) {
	if (ctx) { // Falls gezeichnet lösche alte Daten
		removeData();
	}
	map.data.setStyle({
		strokeColor: "red"
	});
	map.data.addGeoJson(geojson);
	bounds = new gmap.LatLngBounds();
	map.data.forEach(function (feature) {
		feature.getGeometry().forEachLatLng(function (latlng) {
			bounds.extend(latlng);
		});
	});

	map.fitBounds(bounds);
	drawCanvas(geojson);
}
// Funktion um das Canvas zu clearen und Maps zu löschen
function removeData() {
	map.data.forEach(function (feature) {
		map.data.remove(feature);
	});
	ctx.clearRect(0, 0, c.width, c.height);
}

// einzelnes GEOOBJEKT anfordern
function geoobjektanfordern(id) {
	let request = new XMLHttpRequest();

	request.addEventListener("error", error => {
		console.error(error.toString());
	});

	request.addEventListener("load", () => {
		if (request.status === 200) {
			let geoobject = request.response.geoobject;

			loadPath(geoobject);
		}
	});
	request.open("GET", `geoobjects/${id}`);
	request.responseType = "json";
	request.send();
}
// Funktion um Höhenprofil zu zeichnen
function drawCanvas(geoobject) {
	let values = [];
	let coordinates = geoobject.features[0].geometry.coordinates;
	coordinates.forEach((element) => {
		values.push(element[2]);
	});

	let maximum = Math.max(...values);
	maximum = 800;

	let numberOfValues = values.length;

	c.height = 150;
	c.width = 300;
	let height = 150;
	let width = 300;
	ctx = c.getContext("2d");
	ctx.strokeStyle = "#FFFFFF";
	ctx.fillStyle = "#FFFFFF";

	ctx.beginPath();
	ctx.moveTo(0, -(((values[0] / maximum) * height) - height));
	values.forEach((heightvalue, index) => {
		ctx.lineTo(((index + 1) / numberOfValues) * width, -(((heightvalue / maximum) * height) - height));
	});
	ctx.lineTo(c.width, c.height);
	ctx.lineTo(0, c.height);
	ctx.stroke();
	ctx.fill();
}
