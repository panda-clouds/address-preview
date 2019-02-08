

const PCAddressPreview = require("../src/PCAddressPreview.js");
const PCParseJasmine = require("@panda-clouds/parse-jasmine")
const cloud =
`
Parse.Cloud.define("challenge", function(request, response) {
  response.success("everest");
});
`

describe('PCAddress.js', () => {
	const parseRunner = new PCParseJasmine();
	parseRunner.cloud(cloud);

	beforeAll((done) => {
		parseRunner.startParseServer()
			.then(done).catch(done.fail);
	}, 1000 * 60 * 2);

	afterAll((done) => {
		parseRunner.cleanUp()
			.then(done).catch(done.fail);
	});

	describe('_generateRandomFloat', () => {

		it('should hit 0,1 and 2 in 100 interations', () => {

			let found0 = false;
			let found1 = false;
			let found2 = false;
			const iterations = 100;

			for (var i = 0; i < iterations; i++) {

				const result = PCAddressPreview._generateRandomFloat(0,2,6);
				expect(result).not.toBeLessThan(0);
				expect(result).not.toBeGreaterThan(2);
				expect(result.lenth).toBe();

				if(Math.round(result) == 0){
					found0 = true;
				}else if(Math.round(result) == 1){
					found1 = true;
				}else if(Math.round(result) == 2){
					found2 = true;
				}

				if(found0 && found1 && found2){
					break;
				}

			}

			expect(found0).toBe(true);
			expect(found1).toBe(true);
			expect(found2).toBe(true);


			// Special matcher from
			// https://github.com/JamieMason/Jasmine-Matchers


		});

		it('should hit -2,-1,0,1 and 2 in 100 interations', () => {

			let foundNeg2 = false;
			let foundNeg1 = false;
			let found0 = false;
			let found1 = false;
			let found2 = false;
			const iterations = 100;

			for (var i = 0; i < iterations; i++) {

				const result = PCAddressPreview._generateRandomFloat(-2,2,6);

				expect(result).not.toBeLessThan(-2);
				expect(result).not.toBeGreaterThan(2);

				if(Math.round(result) == -2){
					foundNeg2 = true;
				}else if(Math.round(result) == -1){
					foundNeg1 = true;
				}else if(Math.round(result) == 0){
					found0 = true;
				}else if(Math.round(result) == 1){
					found1 = true;
				}else if(Math.round(result) == 2){
					found2 = true;
				}

				if(foundNeg2 && foundNeg1 && found0 && found1 && found2){
					break;
				}

			}
			expect(foundNeg2).toBe(true);
			expect(foundNeg1).toBe(true);
			expect(found0).toBe(true);
			expect(found1).toBe(true);
			expect(found2).toBe(true);

			// Special matcher from
			// https://github.com/JamieMason/Jasmine-Matchers

		});

	});


	describe('_randomPointWithInRadiusInMiles', () => {

		it('should randomize 1341 W 10th Place with no radius', () => {
			for(var x = 0; x < 500; x++) {
				const preview = new PCAddressPreview();
				preview.street('1341 W 10th Place');
				preview.city("Tempe");
				preview.state("AZ");
				preview.country("US");
				preview.zipcode("85281");

				// Bamboozle up a Geo-Point
				const knownHouseGeo = PCAddressPreview.GeoPoint(33.417847, -111.960097);
				const spoofGeo = PCAddressPreview._randomPointWithInRadiusInMiles(knownHouseGeo);

				const spoofDelta = knownHouseGeo.milesTo(spoofGeo);
				// the spoof geo should be within 1 mile of our house
				expect(spoofDelta).not.toBeLessThan(0.02);
				expect(spoofDelta).not.toBeGreaterThan(1);
			}


		});

		it('should randomize 1341 W 10th Place with 2 mile radius', () => {
			for(var x = 0; x < 500; x++) {
				const preview = new PCAddressPreview();
				preview.street('1341 W 10th Place');
				preview.city("Tempe");
				preview.state("AZ");
				preview.country("US");
				preview.zipcode("85281");

				// Bamboozle up a Geo-Point
				const knownHouseGeo = PCAddressPreview.GeoPoint(33.417847, -111.960097);
				const spoofGeo = PCAddressPreview._randomPointWithInRadiusInMiles(knownHouseGeo,100);

				const spoofDelta = knownHouseGeo.milesTo(spoofGeo);
				// the spoof geo should be within 1 mile of our house
				expect(spoofDelta).not.toBeLessThan(0.02);
				expect(spoofDelta).not.toBeGreaterThan(100);
			}
		});
	});


	describe('preview', () => {

		it('should geocode an 1341', (done) => {
			let spoofId;
			const street1 = '1341 W 10th Pl';
			const city1 = 'Tempe'
			const state1 = 'Arizona'
			const country1 = 'USA'
			const zipcode1 = '85281'

			// Attempt to trick the system into thinking
			// that it is a different address
			const street2 = '1341 west 10th Place';
			const city2 = 'teMpe'
			const state2 = 'aZ'
			const country2 = 'United states of amEriCa'
			const zipcode2 = '85281'

			const knownLat = 33.417847;
			const knownLong = -111.959508;
			const closeEnoughLat = 33.417;
			const closeEnoughLong = -111.959;

			const user = {
				"__type": "Pointer",
				"className": "_User",
				"objectId": "abc123"
			}

			Promise.resolve()
				.then(()=>{
					// check that caches results are the same
					const address = new PCAddressPreview();
					address.street(street1);
					address.city(city1);
					address.state(state1);
					address.country(country1);
					address.zipcode(zipcode1);
					address.user(user);
					// address.previewRadius(1); default

					return address.savePreview()
						.then((result)=>{
							// eslint-disable-next-line no-console
							console.log('ncioed' + JSON.stringify(result))
							expect(result).toBeDefined();
							expect(result.className).toBe("PCAddressPreview");
							expect(result.id.length).toBe(10);
							spoofId = result.id;

							const knownHouseGeo = PCAddressPreview.GeoPoint(knownLat, knownLong);
							const spoof = result.get("geoPoint");
							expect(spoof).toBeDefined();

							const pcAddress = result.get("address");
							expect(pcAddress).toBeDefined();

							const actualGeo = pcAddress.get("geoPoint");
							expect(actualGeo).toBeDefined();


							expect(actualGeo.latitude + '').toContain(closeEnoughLat + '');
							expect(actualGeo.longitude + '').toContain(closeEnoughLong + '');


							// the actual geo should be within 0.1 mile of our known geo
							// give 1/10 of a mile flex room
							const actualGeoDelta = knownHouseGeo.milesTo(actualGeo);
							expect(actualGeoDelta).toBeLessThan(0.1);

							const spoofDelta = knownHouseGeo.milesTo(spoof);
							// the spoof geo should be within 1 mile of our known geo
							expect(spoofDelta).toBeLessThan(1.1);

						})
				})
				.then(()=>{
					// check that caches results are the same
					const address = new PCAddressPreview();
					address.street(street2);
					address.city(city2);
					address.state(state2);
					address.country(country2);
					address.zipcode(zipcode2);
					address.user(user);
					// address.previewRadius(1); default

					return address.savePreview()
						.then((result)=>{
							// eslint-disable-next-line no-console
							console.log('dif' + JSON.stringify(result))
							expect(result).toBeDefined();
							expect(result.className).toBe("PCAddressPreview");
							expect(result.id.length).toBe(10);
							// ensures the cache was used
							expect(result.id).toBe(spoofId);
							const knownHouseGeo = PCAddressPreview.GeoPoint(knownLat, knownLong);
							const spoof = result.get("geoPoint");
							expect(spoof).toBeDefined();

							const pcAddress = result.get("address");
							expect(pcAddress).toBeDefined();

							const actualGeo = pcAddress.get("geoPoint");
							expect(actualGeo).toBeDefined();


							expect(actualGeo.latitude + '').toContain(closeEnoughLat + '');
							expect(actualGeo.longitude + '').toContain(closeEnoughLong + '');


							// the actual geo should be within 0.1 mile of our known geo
							// give 1/10 of a mile flex room
							const actualGeoDelta = knownHouseGeo.milesTo(actualGeo);
							// eslint-disable-next-line no-console
							console.log("actualGeoDelta " + actualGeoDelta);
							expect(actualGeoDelta).toBeLessThan(0.1);

							const spoofDelta = knownHouseGeo.milesTo(spoof);
							// the spoof geo should be within 1 mile of our known geo
							expect(spoofDelta).toBeLessThan(1.1);

						})
				})
				.then(done).catch(done.fail);
		});

		it('should geocode an 2753', (done) => {
			let spoofId;
			const street1 = '2753 E Windrose Dr';
			const city1 = 'Phoenix'
			const state1 = 'Arizona'
			const country1 = 'USA'
			const zipcode1 = '85032'

			// Attempt to trick the system into thinking
			// that it is a different address
			const street2 = '2753 east WindRose drive';
			const city2 = 'Phoenix'
			const state2 = 'az'
			const country2 = 'United states'
			const zipcode2 = '85032'

			const knownLat = 33.602524;
			const knownLong = -112.022703;
			const closeEnoughLat = 33.602;
			const closeEnoughLong = -112.022;

			Promise.resolve()
				.then(()=>{
					// check that caches results are the same
					const address = new PCAddressPreview();
					address.street(street1);
					address.city(city1);
					address.state(state1);
					address.country(country1);
					address.zipcode(zipcode1);
					// address.previewRadius(1); default

					return address.savePreview()
						.then((result)=>{
							// eslint-disable-next-line no-console
							console.log('ncioed' + JSON.stringify(result))
							expect(result).toBeDefined();
							expect(result.className).toBe("PCAddressPreview");
							expect(result.id.length).toBe(10);
							spoofId = result.id;

							const knownHouseGeo = PCAddressPreview.GeoPoint(knownLat, knownLong);
							const spoof = result.get("geoPoint");
							expect(spoof).toBeDefined();

							const pcAddress = result.get("address");
							expect(pcAddress).toBeDefined();

							const actualGeo = pcAddress.get("geoPoint");
							expect(actualGeo).toBeDefined();


							expect(actualGeo.latitude + '').toContain(closeEnoughLat + '');
							expect(actualGeo.longitude + '').toContain(closeEnoughLong + '');


							// the actual geo should be within 0.1 mile of our known geo
							// give 1/10 of a mile flex room
							const actualGeoDelta = knownHouseGeo.milesTo(actualGeo);
							expect(actualGeoDelta).toBeLessThan(0.1);

							const spoofDelta = knownHouseGeo.milesTo(spoof);
							// the spoof geo should be within 1 mile of our known geo
							expect(spoofDelta).toBeLessThan(1.1);

						})
				})
				.then(()=>{
					// check that caches results are the same
					const address = new PCAddressPreview();
					address.street(street2);
					address.city(city2);
					address.state(state2);
					address.country(country2);
					address.zipcode(zipcode2);
					// address.previewRadius(1); default

					return address.savePreview()
						.then((result)=>{
							// eslint-disable-next-line no-console
							console.log('dif' + JSON.stringify(result))
							expect(result).toBeDefined();
							expect(result.className).toBe("PCAddressPreview");
							expect(result.id.length).toBe(10);
							// ensures the cache was used
							expect(result.id).toBe(spoofId);
							const knownHouseGeo = PCAddressPreview.GeoPoint(knownLat, knownLong);
							const spoof = result.get("geoPoint");
							expect(spoof).toBeDefined();

							const pcAddress = result.get("address");
							expect(pcAddress).toBeDefined();

							const actualGeo = pcAddress.get("geoPoint");
							expect(actualGeo).toBeDefined();


							expect(actualGeo.latitude + '').toContain(closeEnoughLat + '');
							expect(actualGeo.longitude + '').toContain(closeEnoughLong + '');


							// the actual geo should be within 0.1 mile of our known geo
							// give 1/10 of a mile flex room
							const actualGeoDelta = knownHouseGeo.milesTo(actualGeo);
							// eslint-disable-next-line no-console
							console.log("actualGeoDelta " + actualGeoDelta);
							expect(actualGeoDelta).toBeLessThan(0.1);

							const spoofDelta = knownHouseGeo.milesTo(spoof);
							// the spoof geo should be within 1 mile of our known geo
							expect(spoofDelta).toBeLessThan(1.1);

						})
				})
				.then(done).catch(done.fail);
		});

		it('should NOT geocode an 2707', (done) => {
			let spoofId;
			const street1 = '2707 E Windrose Dr';
			const city1 = 'Phoenix'
			const state1 = 'Arizona'
			const country1 = 'USA'
			const zipcode1 = '85032'

			// Attempt to trick the system into thinking
			// that it is a different address
			const street2 = '2707 east WindRose drive';
			const city2 = 'Phoenix'
			const state2 = 'az'
			const country2 = 'United states'
			const zipcode2 = '85032'

			const knownLat = 33.602525;
			const knownLong = -112.023747;
			const closeEnoughLat = 33.602;
			const closeEnoughLong = -112.023;

			Promise.resolve()
				.then(()=>{
					// check that caches results are the same
					const address = new PCAddressPreview();
					address.street(street1);
					address.city(city1);
					address.state(state1);
					address.country(country1);
					address.zipcode(zipcode1);
					// address.previewRadius(1); default

					return address.savePreview()
						.then((result)=>{
							// eslint-disable-next-line no-console
							console.log('ncioed' + JSON.stringify(result))
							expect(result).toBeDefined();
							expect(result.className).toBe("PCAddressPreview");
							expect(result.id.length).toBe(10);
							spoofId = result.id;

							const knownHouseGeo = PCAddressPreview.GeoPoint(knownLat, knownLong);
							const spoof = result.get("geoPoint");
							expect(spoof).toBeDefined();

							const pcAddress = result.get("address");
							expect(pcAddress).toBeDefined();

							const actualGeo = pcAddress.get("geoPoint");
							expect(actualGeo).toBeDefined();


							expect(actualGeo.latitude + '').toContain(closeEnoughLat + '');
							expect(actualGeo.longitude + '').toContain(closeEnoughLong + '');


							// the actual geo should be within 0.1 mile of our known geo
							// give 1/10 of a mile flex room
							const actualGeoDelta = knownHouseGeo.milesTo(actualGeo);
							expect(actualGeoDelta).toBeLessThan(0.1);

							const spoofDelta = knownHouseGeo.milesTo(spoof);
							// the spoof geo should be within 1 mile of our known geo
							expect(spoofDelta).toBeLessThan(1.1);

						})
				})
				.then(()=>{
					// check that caches results are the same
					const address = new PCAddressPreview();
					address.street(street2);
					address.city(city2);
					address.state(state2);
					address.country(country2);
					address.zipcode(zipcode2);
					// address.previewRadius(1); default

					return address.savePreview()
						.then((result)=>{
							// eslint-disable-next-line no-console
							console.log('dif' + JSON.stringify(result))
							expect(result).toBeDefined();
							expect(result.className).toBe("PCAddressPreview");
							expect(result.id.length).toBe(10);
							// ensures the cache was used
							expect(result.id).toBe(spoofId);
							const knownHouseGeo = PCAddressPreview.GeoPoint(knownLat, knownLong);
							const spoof = result.get("geoPoint");
							expect(spoof).toBeDefined();

							const pcAddress = result.get("address");
							expect(pcAddress).toBeDefined();

							const actualGeo = pcAddress.get("geoPoint");
							expect(actualGeo).toBeDefined();


							expect(actualGeo.latitude + '').toContain(closeEnoughLat + '');
							expect(actualGeo.longitude + '').toContain(closeEnoughLong + '');


							// the actual geo should be within 0.1 mile of our known geo
							// give 1/10 of a mile flex room
							const actualGeoDelta = knownHouseGeo.milesTo(actualGeo);
							// eslint-disable-next-line no-console
							console.log("actualGeoDelta " + actualGeoDelta);
							expect(actualGeoDelta).toBeLessThan(0.1);

							const spoofDelta = knownHouseGeo.milesTo(spoof);
							// the spoof geo should be within 1 mile of our known geo
							expect(spoofDelta).toBeLessThan(1.1);

						})
				})
				.then(done).catch(done.fail);
		});

		it('check totals', (done) => {

			Promise.resolve()
				.then(()=>{
					var query = PCAddressPreview.Query('PCAddress');

					return query.find()
						.then((result)=>{
							// eslint-disable-next-line no-console
							console.log('dn8w09dns' + JSON.stringify(result))
							expect(result).toBeDefined();
							expect(result.length).toBe(3);

						})
				})
				.then(()=>{
					var query = PCAddressPreview.Query('PCAddressPreview');

					return query.find()
						.then((result)=>{
							// eslint-disable-next-line no-console
							console.log('9403msis' + JSON.stringify(result))
							expect(result).toBeDefined();
							expect(result.length).toBe(3);

						})
				})
				.then(done).catch(done.fail);
		});


	});
});

