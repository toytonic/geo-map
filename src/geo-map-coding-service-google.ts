import * as Result from './result';
import * as Types from './types';
import * as Util from './util';
import * as CountryCodes from './country-codes';

export class GeoMapCodingServiceGoogle
  implements Types.GeoMapCodingServiceImplementation {
  private api: Types.GoogleApi;

  public static create(init: {
    api: Types.GoogleApi;
  }): GeoMapCodingServiceGoogle {
    return new GeoMapCodingServiceGoogle(init);
  }

  private constructor(init: { api: Types.GoogleApi }) {
    this.api = init.api;
  }

  public async reverse(
    location: Types.GeoPoint
  ): Promise<Types.Result<Types.GeoMapPlaceDetails[]>> {
    return new Promise<Types.Result<Types.GeoMapPlaceDetails[]>>(resolve => {
      const coder = new this.api.Geocoder();

      coder.geocode({ location }, (results, status) => {
        if (status !== google.maps.GeocoderStatus.OK) {
          return resolve(
            Result.createFailure(new Error(`Geocoding failed: ${status}`))
          );
        }

        resolve(Result.createSuccess(results.map(googleToGeoPlace)));
      });
    });
  }
}

function googleToGeoPlace(
  result: google.maps.GeocoderResult
): Types.GeoMapPlaceDetails {
  const get = Util.getAddressComponent(result.address_components);

  const countryCode = get('country', {
    variant: Util.AddressComponentVariant.Short
  });

  return {
    provider: Types.GeoMapProvider.Google,
    id: result.place_id,
    formattedAddress: result.formatted_address,
    address: {
      country: get('country'),
      countryCode: CountryCodes.alphaTwo[countryCode],
      county: get('administrative_area_level_2'),
      district: get('sublocality_level_1'),
      state: get('administrative_area_level_1'),
      postalCode: get('postal_code'),
      locality: get('locality'),
      route: get('route'),
      streetNumber: get('street_number')
    }
  };
}

type AddressComponentType =
  | 'street_number'
  | 'route'
  | 'political'
  | 'sublocality'
  | 'sublocality_level_1'
  | 'locality'
  | 'administrative_area_level_2'
  | 'administrative_area_level_1'
  | 'country'
  | 'postal_code';
