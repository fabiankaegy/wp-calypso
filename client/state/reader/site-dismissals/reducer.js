/** @format */

/**
 * Internal dependencies
 */
import { READER_DISMISS_SITE, READER_DISMISS_POST } from 'state/action-types';
import { combineReducers, withoutPersistence } from 'state/utils';

export const items = withoutPersistence( ( state = {}, action ) => {
	switch ( action.type ) {
		case READER_DISMISS_SITE: {
			return {
				...state,
				[ action.payload.siteId ]: true,
			};
		}
		case READER_DISMISS_POST: {
			return {
				...state,
				[ action.payload.siteId ]: true,
			};
		}
	}

	return state;
} );

export default combineReducers( {
	items,
} );
