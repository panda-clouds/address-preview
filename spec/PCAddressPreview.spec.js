/*global Parse*/


const PCAddressPreview = require("../src/PCAddressPreview.js");

describe('PCAddress.js', () => {

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


	xdescribe('preview', () => {
		// const PCJasmine = require("@panda-clouds/parse-jasmine")
		// const parseRunner = new PCJasmine();
		beforeAll(() => {
			// Set TESTING env variable if needed
			// process.env.TESTING = true;
			// parseRunner.startParseServerForMMjs()
			// .then(done).catch(done.fail);
		}, 1000 * 60 * 2);

		// Keep the database throughout the test
		afterAll(() => {
			// parseRunner.cleanUp()
			// .then(done).catch(done.fail);
		});

		it('should geocode an address', (done) => {

			// actual house
			// Top left acceptable 33.418127, -111.960312
			// botton right accetable coordinates 33.417632, -111.959918

			// acceptable 1 mile spoof rectange
			let spoofId;

			const address = new PCAddressPreview();
			address.street("1341 W 10th Place");
			address.city("Tempe");
			address.state("AZ");
			address.country("United States");
			address.zipCode("85281");
			// address.previewRadius(1); default

			address.savePreview()
				.then((result)=>{
					expect(result).toBeDefined();
					expect(result.className).toBe("PCAddressPreview");
					expect(result.id.lenth).toBe(10);
					spoofId = result.id;

					const knownHouseGeo = new Parse.GeoPoint(33.417847, -111.960097);
					const spoof = result.get("geoPoint");
					expect(spoof).toBeDefined();

					const pcAddress = result.get("realAddress");
					expect(pcAddress).toBeDefined();

					const actualGeo = pcAddress.get("geoPoint");
					expect(actualGeo).toBeDefined();


					expect(actualGeo.latitude).toBeGreaterThan(33.417632);
					expect(actualGeo.latitude).toBeLessThan(33.418127);
					expect(actualGeo.longitude).toBeGreaterThan(-111.959918);
					expect(actualGeo.longitude).toBeLessThan(-111.960312);


					// the actual geo should be within 0.1 mile of our known geo
					// give 1/10 of a mile flex room
					const actualGeoDelta = knownHouseGeo.milesTo(actualGeo);
					expect(actualGeoDelta).toBeLessThan(0.1);

					const spoofDelta = knownHouseGeo.milesTo(spoof);
					// the spoof geo should be within 1 mile of our known geo
					expect(spoofDelta).toBeLessThan(1.1);

				}).then(()=>{
					// check that caches results are the same
					const address = new PCAddressPreview();
					address.street("1341 W 10th Place");
					address.city("Tempe");
					address.state("AZ");
					address.country("United States");
					address.zipCode("85281");
					// address.previewRadius(1); default

					return address.savePreview()
						.then((result)=>{

							expect(result).toBeDefined();
							expect(result.className).toBe("PCAddressPreview");
							expect(result.id.lenth).toBe(10);
							// ensures the cache was used
							expect(result.id).toBe(spoofId);
							const knownHouseGeo = new Parse.GeoPoint(33.417847, -111.960097);
							const spoof = result.get("geoPoint");
							expect(spoof).toBeDefined();

							const pcAddress = result.get("realAddress");
							expect(pcAddress).toBeDefined();

							const actualGeo = pcAddress.get("geoPoint");
							expect(actualGeo).toBeDefined();


							expect(actualGeo.latitude).toBeGreaterThan(33.417632);
							expect(actualGeo.latitude).toBeLessThan(33.418127);
							expect(actualGeo.longitude).toBeGreaterThan(-111.959918);
							expect(actualGeo.longitude).toBeLessThan(-111.960312);


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
				}).then(done).catch(done.fail);
		});


	});
});

