const express = require("express");
const commandLineArgs = require("command-line-args");
const bodyParser = require("body-parser");

const geoobjects = require("./Geoobjects");

const URLPREFIX = "/geoobjects/";
const DEFAULTPORT = 8080;

//Die 2 folgenden Initialisierungen sind notwendig, damit man auf Kommandozeilenargumente zugreifen kann.
// "-port [number]" und "-p [number]" muss als Kommandozeilenargument angegeben werden
const optionDefinitions = [
	{ name: "port", alias: "p", type: Number }
];

const options = commandLineArgs(optionDefinitions);

//Pruefe, ob Port angegeben wurde und ob dieser gueltig ist. Sonst verwende Standardport 8080.
let usedPort;
bestimmePort(); //diese Funktion belegt die Variable usedPort mit einem Wert

const BASE_URI = `http://localhost:${usedPort}`;

//Lade die Geojson-Objekte in den Hauptspeicher
geoobjects.initObjects();

//Konfiguriere den Server
let app = express();
let path = __dirname + "/dist/";

app.use(bodyParser.json());
app.use("/css", express.static("dist/css"));
app.use("/css", express.static("node_modules/bulma/css"));
app.use("/js", express.static("dist/js"));

//Startseite anfordern oder Einstiegspunkt-JSON verschicken
app.get("", function (request, response) {
	let requestType = request.get("Accept");
	//Falls explizit ein JSON-Objekt angefordert wird, wird die Einstiegspunkt-JSON verschickt
	if (requestType === "application/json") {
		response.json(createEinstiegspunktResponseBody());
	}
	else {
		response.sendFile(path + "index.html");
	}
});
//Favicon anfordern
app.get("/favicon.ico", function (request, response) {
	response.sendFile(path + "favicon.ico");
});
//Liste anfordern, die die Uebersicht aller vorhandenen GeoJSON-Objekte anzeigt
app.get(`${URLPREFIX}`, (request, response) => {
	response.json(createGeoJSONObjectListResponseBody());
});
//Einzelnes GeoJSON-Objekt anfordern
app.get(`${URLPREFIX}:id`, (request, response) => {
	let id = request.params.id;

	if (!geoobjects.exists(id)) {
		response.sendStatus(404);
	}
	else {
		response.json(createGeoJSONObjectResponseBody(id));
	}
});

//Hilfsfunktionen:
//Pruefe, ob Port angegeben wurde und ob dieser gueltig ist. Sonst verwende Standardport 8080.
function bestimmePort() {
	// options.port ist das uebergebene Kommandozeilenargument
	usedPort = Number(options.port);

	if (!isNaN(usedPort) && usedPort > 1024 && usedPort < 65535) {
		usedPort = options.port;
		console.log(`Es wird der angegebene Port ${usedPort} verwendet.`);
	}
	else {
		usedPort = DEFAULTPORT;
		console.log("Es wurde kein (gueltiger) Port angegeben. Es wird Port 8080 verwendet.");
	}
}

function createGeoJSONObjectListResponseBody() {
	let geoJSONObjects = geoobjects.getAll();
	let overview = {};

	Object.keys(geoJSONObjects).forEach((id) => {
		overview[id] = {
			name: geoJSONObjects[id].features[0].properties.name,
			href: `${BASE_URI}${URLPREFIX}${id}`
		};
	});

	let responseBody = {
		geoobjects: overview,
		_links: {
			self: {
				href: `${BASE_URI}${URLPREFIX}`
			}
		}
	};

	return responseBody;
}

function createGeoJSONObjectResponseBody(id) {
	let responseBody = {
		geoobject: geoobjects.get(id),
		_links: {
			self: {
				href: `${BASE_URI}${URLPREFIX}${id}`
			},
			list: {
				href: `${BASE_URI}${URLPREFIX}`
			}
		}
	};

	return responseBody;
}

function createEinstiegspunktResponseBody() {
	let responseBody = {
		_links: {
			self: {
				href: `${BASE_URI}`
			},
			geoobjects: {
				href: `${BASE_URI}${URLPREFIX}`
			}
		}
	};

	return responseBody;
}

//Server starten:
app.listen(usedPort, function () {
	console.log(`Server laeuft auf Port ${usedPort}.`);
});
