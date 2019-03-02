const PCAddressPreview = require('../src/PCAddressPreview.js');
const PCParseJasmine = require('@panda-clouds/parse-runner');
const cloud =
`
Parse.Cloud.define('challenge', function(request, response) {
  response.success('everest');
});
`;

describe('test PCAddress.js', () => {
	const parseRunner = new PCParseJasmine();

	parseRunner.cloud(cloud);

	beforeAll(async () => {
		await parseRunner.startParseServer();
	}, 1000 * 60 * 2);

	afterAll(async () => {
		await parseRunner.cleanUp();
	});

	describe('_generateRandomFloat', () => {
		/* eslint-disable jest/prefer-expect-assertions */
		it('should hit 0,1 and 2 in 100 interations', () => {
			// expect.assertions(303); doesn't work because we stop after finding the number
			let found0 = false;
			let found1 = false;
			let found2 = false;
			const iterations = 100;

			for (let i = 0; i < iterations; i++) {
				const result = PCAddressPreview._generateRandomFloat(0, 2, 6);

				expect(result).not.toBeLessThan(0);
				expect(result).not.toBeGreaterThan(2);
				expect(result.lenth).toBe();

				if (Math.round(result) === 0) {
					found0 = true;
				} else if (Math.round(result) === 1) {
					found1 = true;
				} else if (Math.round(result) === 2) {
					found2 = true;
				}

				if (found0 && found1 && found2) {
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
			// expect.assertions(206); doesn't work because we stop after finding the number
			let foundNeg2 = false;
			let foundNeg1 = false;
			let found0 = false;
			let found1 = false;
			let found2 = false;
			const iterations = 100;

			for (let i = 0; i < iterations; i++) {
				const result = PCAddressPreview._generateRandomFloat(-2, 2, 6);

				expect(result).not.toBeLessThan(-2);
				expect(result).not.toBeGreaterThan(2);

				if (Math.round(result) === -2) {
					foundNeg2 = true;
				} else if (Math.round(result) === -1) {
					foundNeg1 = true;
				} else if (Math.round(result) === 0) {
					found0 = true;
				} else if (Math.round(result) === 1) {
					found1 = true;
				} else if (Math.round(result) === 2) {
					found2 = true;
				}

				if (foundNeg2 && foundNeg1 && found0 && found1 && found2) {
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
		/* eslint-enable jest/prefer-expect-assertions */
	});


	describe('_randomPointWithInRadiusInMiles', () => {
		it('should randomize 1341 W 10th Place with no radius', () => {
			expect.assertions(1000);
			for (let x = 0; x < 500; x++) {
				const preview = new PCAddressPreview();

				preview.street('1341 W 10th Place');
				preview.city('Tempe');
				preview.state('AZ');
				preview.country('US');
				preview.zipcode('85281');

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
			expect.assertions(1000);
			for (let x = 0; x < 500; x++) {
				const preview = new PCAddressPreview();

				preview.street('1341 W 10th Place');
				preview.city('Tempe');
				preview.state('AZ');
				preview.country('US');
				preview.zipcode('85281');

				// Bamboozle up a Geo-Point
				const knownHouseGeo = PCAddressPreview.GeoPoint(33.417847, -111.960097);
				const spoofGeo = PCAddressPreview._randomPointWithInRadiusInMiles(knownHouseGeo, 100);

				const spoofDelta = knownHouseGeo.milesTo(spoofGeo);

				// the spoof geo should be within 1 mile of our house
				expect(spoofDelta).not.toBeLessThan(0.02);
				expect(spoofDelta).not.toBeGreaterThan(100);
			}
		});
	});


	describe('preview', () => {
		it('should geocode an 1341', async () => {
			expect.assertions(21);
			const street1 = '1341 W 10th Pl';
			const city1 = 'Tempe';
			const state1 = 'Arizona';
			const country1 = 'USA';
			const zipcode1 = '85281';

			// Attempt to trick the system into thinking
			// that it is a different address
			const street2 = '1341 west 10th Place';
			const city2 = 'teMpe';
			const state2 = 'aZ';
			const country2 = 'United states of amEriCa';
			const zipcode2 = '85281';

			const knownLat = 33.417847;
			const knownLong = -111.959508;
			const knownHouseGeo = PCAddressPreview.GeoPoint(knownLat, knownLong);
			const closeEnoughLat = 33.417;
			const closeEnoughLong = -111.959;

			const user = {
				__type: 'Pointer',
				className: '_User',
				objectId: 'abc123',
			};

			// check that caches results are the same
			const address = new PCAddressPreview();

			address.street(street1);
			address.city(city1);
			address.state(state1);
			address.country(country1);
			address.zipcode(zipcode1);
			address.user(user);
			// address.previewRadius(1); default

			const result = await address.savePreview();

			// eslint-disable-next-line no-console
			console.log('ncioed' + JSON.stringify(result));
			expect(result).toBeDefined();
			expect(result.className).toBe('PCAddressPreview');
			expect(result.id).toHaveLength(10);
			const spoofId = result.id;
			const spoof = result.get('geoPoint');

			expect(spoof).toBeDefined();

			const pcAddress = result.get('address');

			expect(pcAddress).toBeDefined();

			const actualGeo = pcAddress.get('geoPoint');

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

			// check that caches results are the same
			const address2 = new PCAddressPreview();

			address2.street(street2);
			address2.city(city2);
			address2.state(state2);
			address2.country(country2);
			address2.zipcode(zipcode2);
			address2.user(user);
			// address2.previewRadius(1); default

			const result2 = await address2.savePreview();

			// eslint-disable-next-line no-console
			console.log('dif' + JSON.stringify(result2));
			expect(result2).toBeDefined();
			expect(result2.className).toBe('PCAddressPreview');
			expect(result2.id).toHaveLength(10);
			// ensures the cache was used
			expect(result2.id).toBe(spoofId);
			const spoof2 = result2.get('geoPoint');

			expect(spoof2).toBeDefined();

			const pcAddress2 = result2.get('address');

			expect(pcAddress2).toBeDefined();

			const actualGeo2 = pcAddress2.get('geoPoint');

			expect(actualGeo2).toBeDefined();


			expect(actualGeo2.latitude + '').toContain(closeEnoughLat + '');
			expect(actualGeo2.longitude + '').toContain(closeEnoughLong + '');


			// the actual geo should be within 0.1 mile of our known geo
			// give 1/10 of a mile flex room
			const actualGeoDelta2 = knownHouseGeo.milesTo(actualGeo2);

			// eslint-disable-next-line no-console
			console.log('actualGeoDelta ' + actualGeoDelta2);
			expect(actualGeoDelta2).toBeLessThan(0.1);

			const spoofDelta2 = knownHouseGeo.milesTo(spoof2);

			// the spoof geo should be within 1 mile of our known geo
			expect(spoofDelta2).toBeLessThan(1.1);
		});

		it('should geocode an 2753', async () => {
			expect.assertions(21);
			const street1 = '2753 E Windrose Dr';
			const city1 = 'Phoenix';
			const state1 = 'Arizona';
			const country1 = 'USA';
			const zipcode1 = '85032';

			// Attempt to trick the system into thinking
			// that it is a different address
			const street2 = '2753 east WindRose drive';
			const city2 = 'Phoenix';
			const state2 = 'az';
			const country2 = 'United states';
			const zipcode2 = '85032';

			const knownLat = 33.602524;
			const knownLong = -112.022703;
			const knownHouseGeo = PCAddressPreview.GeoPoint(knownLat, knownLong);
			const closeEnoughLat = 33.602;
			const closeEnoughLong = -112.022;

			const user = {
				__type: 'Pointer',
				className: '_User',
				objectId: 'abc123',
			};

			// check that caches results are the same
			const address = new PCAddressPreview();

			address.street(street1);
			address.city(city1);
			address.state(state1);
			address.country(country1);
			address.zipcode(zipcode1);
			address.user(user);
			// address.previewRadius(1); default

			const result = await address.savePreview();

			// eslint-disable-next-line no-console
			console.log('ncioed' + JSON.stringify(result));
			expect(result).toBeDefined();
			expect(result.className).toBe('PCAddressPreview');
			expect(result.id).toHaveLength(10);
			const spoofId = result.id;
			const spoof = result.get('geoPoint');

			expect(spoof).toBeDefined();

			const pcAddress = result.get('address');

			expect(pcAddress).toBeDefined();

			const actualGeo = pcAddress.get('geoPoint');

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

			// check that caches results are the same
			const address2 = new PCAddressPreview();

			address2.street(street2);
			address2.city(city2);
			address2.state(state2);
			address2.country(country2);
			address2.zipcode(zipcode2);
			address2.user(user);
			// address2.previewRadius(1); default

			const result2 = await address2.savePreview();

			// eslint-disable-next-line no-console
			console.log('dif' + JSON.stringify(result2));
			expect(result2).toBeDefined();
			expect(result2.className).toBe('PCAddressPreview');
			expect(result2.id).toHaveLength(10);
			// ensures the cache was used
			expect(result2.id).toBe(spoofId);
			const spoof2 = result2.get('geoPoint');

			expect(spoof2).toBeDefined();

			const pcAddress2 = result2.get('address');

			expect(pcAddress2).toBeDefined();

			const actualGeo2 = pcAddress2.get('geoPoint');

			expect(actualGeo2).toBeDefined();


			expect(actualGeo2.latitude + '').toContain(closeEnoughLat + '');
			expect(actualGeo2.longitude + '').toContain(closeEnoughLong + '');


			// the actual geo should be within 0.1 mile of our known geo
			// give 1/10 of a mile flex room
			const actualGeoDelta2 = knownHouseGeo.milesTo(actualGeo2);

			// eslint-disable-next-line no-console
			console.log('actualGeoDelta ' + actualGeoDelta2);
			expect(actualGeoDelta2).toBeLessThan(0.1);

			const spoofDelta2 = knownHouseGeo.milesTo(spoof2);

			// the spoof geo should be within 1 mile of our known geo
			expect(spoofDelta2).toBeLessThan(1.1);
		});

		it('should NOT geocode an 2707', async () => {
			expect.assertions(21);
			const street1 = '2707 E Windrose Dr';
			const city1 = 'Phoenix';
			const state1 = 'Arizona';
			const country1 = 'USA';
			const zipcode1 = '85032';

			// Attempt to trick the system into thinking
			// that it is a different address
			const street2 = '2707 east WindRose drive';
			const city2 = 'Phoenix';
			const state2 = 'az';
			const country2 = 'United states';
			const zipcode2 = '85032';

			const knownLat = 33.602525;
			const knownLong = -112.023747;
			const knownHouseGeo = PCAddressPreview.GeoPoint(knownLat, knownLong);
			const closeEnoughLat = 33.602;
			const closeEnoughLong = -112.023;

			const user = {
				__type: 'Pointer',
				className: '_User',
				objectId: 'abc123',
			};

			// check that caches results are the same
			const address = new PCAddressPreview();

			address.street(street1);
			address.city(city1);
			address.state(state1);
			address.country(country1);
			address.zipcode(zipcode1);
			address.user(user);
			// address.previewRadius(1); default

			const result = await address.savePreview();

			// eslint-disable-next-line no-console
			console.log('ncioed' + JSON.stringify(result));
			expect(result).toBeDefined();
			expect(result.className).toBe('PCAddressPreview');
			expect(result.id).toHaveLength(10);
			const spoofId = result.id;
			const spoof = result.get('geoPoint');

			expect(spoof).toBeDefined();

			const pcAddress = result.get('address');

			expect(pcAddress).toBeDefined();

			const actualGeo = pcAddress.get('geoPoint');

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

			// check that caches results are the same
			const address2 = new PCAddressPreview();

			address2.street(street2);
			address2.city(city2);
			address2.state(state2);
			address2.country(country2);
			address2.zipcode(zipcode2);
			address2.user(user);
			// address2.previewRadius(1); default

			const result2 = await address2.savePreview();

			// eslint-disable-next-line no-console
			console.log('dif' + JSON.stringify(result2));
			expect(result2).toBeDefined();
			expect(result2.className).toBe('PCAddressPreview');
			expect(result2.id).toHaveLength(10);
			// ensures the cache was used
			expect(result2.id).toBe(spoofId);
			const spoof2 = result2.get('geoPoint');

			expect(spoof2).toBeDefined();

			const pcAddress2 = result2.get('address');

			expect(pcAddress2).toBeDefined();

			const actualGeo2 = pcAddress2.get('geoPoint');

			expect(actualGeo2).toBeDefined();


			expect(actualGeo2.latitude + '').toContain(closeEnoughLat + '');
			expect(actualGeo2.longitude + '').toContain(closeEnoughLong + '');


			// the actual geo should be within 0.1 mile of our known geo
			// give 1/10 of a mile flex room
			const actualGeoDelta2 = knownHouseGeo.milesTo(actualGeo2);

			// eslint-disable-next-line no-console
			console.log('actualGeoDelta ' + actualGeoDelta2);
			expect(actualGeoDelta2).toBeLessThan(0.1);

			const spoofDelta2 = knownHouseGeo.milesTo(spoof2);

			// the spoof geo should be within 1 mile of our known geo
			expect(spoofDelta2).toBeLessThan(1.1);
		});

		it('check totals', async () => {
			expect.assertions(4);

			const query1 = PCAddressPreview.Query('PCAddress');

			const result1 = await query1.find();

			expect(result1).toBeDefined();
			expect(result1).toHaveLength(3);

			const query2 = PCAddressPreview.Query('PCAddressPreview');

			const result2 = await query2.find();

			expect(result2).toBeDefined();
			expect(result2).toHaveLength(3);
		});
	});
});

