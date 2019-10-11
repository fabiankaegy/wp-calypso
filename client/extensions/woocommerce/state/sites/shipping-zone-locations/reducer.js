/**
 * Internal dependencies
 */
import {
	WOOCOMMERCE_SHIPPING_ZONE_DELETED,
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_REQUEST,
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_REQUEST_SUCCESS,
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_UPDATED,
	WOOCOMMERCE_SHIPPING_ZONE_UPDATED,
} from 'woocommerce/state/action-types';
import { LOADING } from 'woocommerce/state/constants';

function buildLocations( data = [] ) {
	const locations = {
		continent: [],
		country: [],
		state: [],
		postcode: [],
	};
	data.forEach( ( { type, code } ) => locations[ type ].push( code ) );
	return locations;
}

export default function( state = {}, action ) {
	switch ( action.type ) {
		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_REQUEST:
			return {
				...state,
				[ action.zoneId ]: LOADING,
			};

		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_REQUEST_SUCCESS: {
			return {
				...state,
				[ action.zoneId ]: buildLocations( action.data ),
			};
		}

		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_UPDATED:
			return {
				...state,
				[ action.originatingActio.zoneId ]: buildLocations( action.data ),
			};

		case WOOCOMMERCE_SHIPPING_ZONE_UPDATED: {
			const {
				originatingAction: { zone },
			} = action;
			if ( 'number' === typeof zone.id ) {
				return state;
			}

			return {
				...state,
				[ action.data.id ]: buildLocations(),
			};
		}

		case WOOCOMMERCE_SHIPPING_ZONE_DELETED: {
			const {
				originatingAction: { zone },
			} = action;
			const newState = { ...state };
			delete newState[ zone.id ];
			return newState;
		}
	}

	return state;
}
