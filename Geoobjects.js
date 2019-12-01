const fs = require("file-system");

let geoJSONObjects = {};

exports.exists = function (id) {
	return geoJSONObjects[id] !== undefined;
};

exports.getAll = function () {
	return geoJSONObjects;
};

exports.get = function (id) {
	if (!exports.exists(id)) {
		return null;
	}
	else {
		return geoJSONObjects[id];
	}
};

exports.initObjects = function () {
	//bestimme alle Dateinamen im Ordner mit den GeoJSON-Dateien
	let filenames = fs.readdirSync("./src/data/");

	//lade den Inhalt dieser Dateien als JSON-Objekte in den Arbeitsspeicher;
	//Mapping im Objekt: ID => JSON-Objekte
	filenames.forEach((file) => {
		let dataString = fs.readFileSync(`./src/data/${file}`);
		let tempGeoJSON = JSON.parse(dataString);

		//Die ID soll der Nummer des Dateinamen gleichen
		let indexOfDot = file.indexOf(".");
		let id = file.substring(0, indexOfDot);
		geoJSONObjects[id] = tempGeoJSON;
	});
};
