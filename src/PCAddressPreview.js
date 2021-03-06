
const TestingParse = require('parse/node');

const PCGeocoder = require('@panda-clouds/geocoder');
const PCAddressFormatter = require('@panda-clouds/address-formatter');

const defaultRadius = 1;


class PCAddressPreview {
	constructor() {
		// Empty Constructor
		// default to 1 mile
		this.radius = defaultRadius;
	}
	static Object(className) {
		if (typeof Parse !== 'undefined') {
			/* global Parse */
			return new Parse.Object(className);
		}

		return new TestingParse.Object(className);
	}
	static Query(className) {
		if (typeof Parse !== 'undefined') {
			/* global Parse */
			return new Parse.Query(className);
		}

		return new TestingParse.Query(className);
	}
	static GeoPoint(lat, long) {
		if (typeof Parse !== 'undefined') {
			/* global Parse */
			return new Parse.GeoPoint(lat, long);
		}

		return new TestingParse.GeoPoint(lat, long);
	}
	static bestParse() {
		if (typeof Parse !== 'undefined') {
			/* global Parse */
			return Parse;
		}

		return TestingParse;
	}
	static _generateRandomFloat(min, max, decimals) {
		// Truly random
		// https://gist.github.com/naomik/6030653
		return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
	}

	static _randomPointWithInRadiusInMiles(centerGeo, radiusInput) {
		// Lat is about 69 miles apart always
		// Long are about 69 miles apart at the equator
		// Long in 0 miles at the north pole
		// https://www.thoughtco.com/degree-of-latitude-and-longitude-distance-4070616
		let radius;

		if (radiusInput) {
			radius = radiusInput;
		} else {
			radius = defaultRadius;
		}

		const aboutOneMileInDegrees = 1 / 69;
		const radiusInDegrees = aboutOneMileInDegrees * radius;

		let randomGeo;
		let distance;
		// Why a do-while?
		// the 1/69 is an esimate so we check that
		// the dot actually falls within the radius

		do {
			const latDelta = PCAddressPreview._generateRandomFloat(-radiusInDegrees, radiusInDegrees, 6);
			const longDelta = PCAddressPreview._generateRandomFloat(-radiusInDegrees, radiusInDegrees, 6);

			const randLat = centerGeo.latitude + latDelta;
			const randLong = centerGeo.longitude + longDelta;

			randomGeo = PCAddressPreview.GeoPoint(randLat, randLong);

			distance = centerGeo.milesTo(randomGeo);
		} while (distance > radius || distance < 0.02);

		// Make sure the point in within the X mile radius
		// and not within 0.02 miles (105.6 feet) of the house.
		// (a spoof is usless if its right on the house)
		return randomGeo;
	}
	async _save(result) {
		// result comes from PCGeocoder
		// its an object with:
		// - lat
		// - long
		// - address
		// -- {'formattedAddress':'2753 E Windrose Dr, Phoenix, AZ 85032, United States','latitude':33.6025,'longitude':-112.02269,'country':'United States','countryCode':'US','state':'Arizona','county':'Maricopa','city':'Phoenix','zipcode':'85032','district':'North Phoenix','streetName':'E Windrose Dr','streetNumber':'2753','building':null,'extra':{'herePlaceId':'NT_K9IhbsLP54qz5bbKFLPjcA_ycTNzA','confidence':1},'administrativeLevels':{'level1long':'Arizona','level2long':'Maricopa'},'provider':'here'}
		// -raw (Depends on the geocoder that delivered the results)
		// -- [{'place_id':'203032233','licence':'Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright','osm_type':'way','osm_id':'5609650','boundingbox':['33.602592','33.602692','-112.022642','-112.022542'],'lat':'33.602642','lon':'-112.022592','display_name':'2753, East Windrose Drive, Phoenix, Maricopa County, Arizona, 85032, USA','class':'place','type':'house','importance':0.7409999999999999,'address':{'house_number':'2753','road':'East Windrose Drive','city':'Phoenix','county':'Maricopa County','state':'Arizona','postcode':'85032','country':'USA','country_code':'us'}}

		if (!result.address) {
			return PCAddressPreview.bestParse().Promise.reject('Missing Address Object');
		}

		let shortState;

		if (result.address.state) {
			shortState = PCAddressFormatter.state(result.address.state);
		}

		const cache = PCAddressPreview.Object('PCAddress'); // convert 'Arizona' to 'AZ'

		if (this.user) {
			cache.set('creator', this.user);
		}

		const geo = PCAddressPreview.GeoPoint(result.address.latitude, result.address.longitude);

		if (this.nickname) {
			cache.set('name', this.nickname);
		}

		if (this.notes) {
			cache.set('notes', this.notes);
		}

		if (this.gateCode) {
			cache.set('gateCode', this.gateCode);
		}

		if (this.unit) {
			cache.set('unit', this.unit);
		}

		if (geo) {
			cache.set('geoPoint', geo); // (33.6025,-112.02269)
		}

		cache.set('streetNumber', result.address.streetNumber); // '2753'
		cache.set('streetName', result.address.streetName);
		cache.set('street', result.address.street); // 'E Windrose Dr'

		if (this.street !== result.address.street) {
			cache.set('inputStreet', this.street);
		}

		cache.set('city', result.address.city); // 'Phoenix'

		if (this.city !== result.address.city) {
			cache.set('inputCity', this.city);
		}

		cache.set('county', result.address.county); // 'Maricopa'
		cache.set('state', shortState); // 'AZ'

		if (this.state !== shortState) {
			cache.set('inputState', this.state);
		}

		// cache.set('country',result.address.country); X  // 'United States' We decided to use country code for less storage
		cache.set('country', result.address.countryCode); // 'US'

		if (this.country !== result.address.countryCode) {
			cache.set('inputCountry', this.country);
		}

		const zipOnly = PCAddressFormatter.zipcode(result.address.zipcode);

		if (!this.plusFour) {
			// the user didn't input it,
			// lets see if the provider returned it?
			// mapquest and sometimes openstreetmap return the +4
			this.plusFour = PCAddressFormatter.plusFour(result.address.zipcode);
		}

		cache.set('zipcode', zipOnly); // '85032'

		if (this.zipcode !== zipOnly) {
			cache.set('inputZipcode', this.zipcode);
		}

		if (this.plusFour) {
			cache.set('plusFour', this.plusFour);
		}

		cache.set('provider', result.address.provider); // 'here'

		// cache.set('formattedAddress',result.address.formattedAddress)    X   // '2753 E Windrose Dr, Phoenix, AZ 85032, United States' We decided to force manual formatting for less storage
		const address = await cache.save(null, this.permissions());


		const spoof = PCAddressPreview.Object('PCAddressPreview');
		const oneMileSpoof = PCAddressPreview._randomPointWithInRadiusInMiles(geo, this.radius);

		spoof.set('radiusInMiles', this.radius);
		spoof.set('geoPoint', oneMileSpoof);
		spoof.set('address', address.toPointer());
		spoof.set('city', result.address.city);
		spoof.set('zipcode', zipOnly);

		if (this.user) {
			spoof.set('creator', this.user);
		}

		const final = await spoof.save(null, this.permissions());

		return final;
	}

	async _searchCache() {
		const innerQuery = PCAddressPreview.Query('PCAddress');

		innerQuery.equalTo('street', this.street);
		innerQuery.equalTo('city', this.city);
		innerQuery.equalTo('state', this.state);
		innerQuery.equalTo('country', this.country);
		innerQuery.equalTo('zipcode', this.zipcode);
		innerQuery.equalTo('creator', this.user);

		const query = PCAddressPreview.Query('PCAddressPreview');

		query.matchesQuery('address', innerQuery);
		query.equalTo('radiusInMiles', this.radius);
		query.include('address');

		const first = await query.first(this.permissions());

		return first;
	}

	nickname(input) {
		this.nickname = input;
	}

	notes(input) {
		this.notes = input;
	}

	gateCode(input) {
		this.gateCode = input;
	}

	plusFour(input) {
		this.plusFour = input;
	}

	unit(input) {
		this.unit = input;
	}

	street(input) {
		this.street = PCAddressFormatter.street(input);
		const maybeUnit = PCAddressFormatter.unit(input);

		if (maybeUnit) {
			this.unit = maybeUnit;
		}
	}

	city(input) {
		this.city = PCAddressFormatter.city(input);
	}

	state(input) {
		this.state = PCAddressFormatter.state(input);
	}

	country(input) {
		this.country = PCAddressFormatter.country(input);
	}

	zipcode(input) {
		this.zipcode = PCAddressFormatter.zipcode(input);
		const maybePlusFour = PCAddressFormatter.plusFour(input);

		if (maybePlusFour) {
			this.plusFour = maybePlusFour;
		}
	}

	// addr.user(request.user)
	user(input) {
		this.user = input;
	}

	useMasterKey(input) {
		this.useMasterKeyBoolean = input;
	}

	permissions() {
		const permDic = {};

		if (this.useMasterKeyBoolean) {
			permDic.useMasterKey = this.useMasterKeyBoolean;
		}

		if (this.user && this.user.getSessionToken) {
			permDic.sessionToken = this.user.getSessionToken();
		}

		return permDic;
	}

	previewRadius(input) {
		if (isNaN(input)) {
			throw new Error('previewRadius expects a number');
		}

		if (input > 99999) {
			throw new Error('Please specifiy a number less than 999 miles');
		}

		if (input < 0.05) {
			throw new Error('Please specifiy a number greater than 0.05 miles (264\' is only 4-6 houses)');
		}

		this.radius = input;
	}

	// primaryProviders are attemped before 'free services'
	primaryProviders(input) {
		// geo.primaryProviders( [{provider:'locationiq',apiKey:'abc123'},{provider:'google',apiKey:'def345'}] )
		this.primaryProvidersArray = input;
	}

	// backupProviders are attemped after 'free services'
	backupProviders(input) {
		// geo.backupProviders( [{provider:'locationiq',apiKey:'abc123'},{provider:'google',apiKey:'def345'}] )
		this.backupProvidersArray = input;
	}

	async savePreview() {
		// This function first tries to query our database to:
		// 1. reduce the dependency on external geocoder API's
		// 2. to keep a consistent randomMarker (to keep malicous users
		//    from refreshing the random markers and ruling out areas)
		// 3. to speed up response time
		// 4. to keep perfectly consistent coordinates

		const result = await this._searchCache();

		if (result) {
			// We have cached results
			return result;
		}

		// Not found.
		// Geocode then cache
		const geo = new PCGeocoder();

		geo.street(this.street);
		geo.city(this.city);
		geo.state(this.state);
		geo.country(this.country);
		geo.zipcode(this.zipcode);

		// forward provider info
		if (this.primaryProvidersArray) {
			geo.primaryProviders(this.primaryProvidersArray);
		}

		if (this.backupProvidersArray) {
			geo.backupProviders(this.backupProvidersArray);
		}

		const searchResults = await geo.search();

		if (searchResults) {
			await this._save(searchResults);
			const maybeNewResults = await this._searchCache();

			if (maybeNewResults) {
				return maybeNewResults;
			}

			throw new Error('We couldn\'t find that address');
		} else {
			throw new Error('We couldn\'t find that address');
		}
	}
}
module.exports = PCAddressPreview;
