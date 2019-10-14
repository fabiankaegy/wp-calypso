/**
 * External dependencies
 */
import { find, pull } from 'lodash';

/**
 * Internal dependencies
 */
import {
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_CANCEL,
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_CLOSE,
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_EDIT,
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_SELECT_CONTINENT,
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_SELECT_COUNTRY,
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_SELECT_STATE,
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_EDIT_POSTCODE,
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_FILTER_BY_WHOLE_COUNTRY,
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_FILTER_BY_STATE,
	WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_FILTER_BY_POSTCODE,
} from 'woocommerce/state/action-types';
import { mergeLocationEdits } from './helpers';

export const JOURNAL_ACTIONS = {
	ADD_CONTINENT: 'ADD_CONTINENT',
	REMOVE_CONTINENT: 'REMOVE_CONTINENT',
	ADD_COUNTRY: 'ADD_COUNTRY',
	REMOVE_COUNTRY: 'REMOVE_COUNTRY',
};

export const initialState = {
	journal: [],
	states: null,
	postcode: null,
	pristine: true,
};

function mainReducer( state = initialState, action ) {
	switch ( action.type ) {
		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_EDIT:
			return {
				...state,
				temporaryChanges: { ...initialState },
			};

		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_CLOSE: {
			const { temporaryChanges, ...committedChanges } = state;
			return mergeLocationEdits( committedChanges, temporaryChanges );
		}

		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_CANCEL:
			return {
				...state,
				temporaryChanges: null,
			};

		// There's no way to handle continent / country selection state having just the changes, so here we'll just
		// "journal" the changes and that will be parsed by the selectors
		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_SELECT_CONTINENT:
			return {
				...state,
				temporaryChanges: {
					...state.temporaryChanges,
					states: null,
					postcode: null,
					journal: [
						...state.temporaryChanges.journal,
						{
							action: action.selected
								? JOURNAL_ACTIONS.ADD_CONTINENT
								: JOURNAL_ACTIONS.REMOVE_CONTINENT,
							code: action.continentCode,
						},
					],
				},
			};

		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_SELECT_COUNTRY:
			return {
				...state,
				temporaryChanges: {
					...state.temporaryChanges,
					states: null,
					postcode: null,
					journal: [
						...state.temporaryChanges.journal,
						{
							action: action.selected
								? JOURNAL_ACTIONS.ADD_COUNTRY
								: JOURNAL_ACTIONS.REMOVE_COUNTRY,
							code: action.countryCode,
						},
					],
				},
			};

		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_SELECT_STATE: {
			const states = state.temporaryChanges.states || {
				add: [],
				remove: [],
				removeAll: false,
			};
			const add = [ ...states.add ];
			const remove = [ ...states.remove ];
			const removeAll = states.removeAll;

			if ( action.selected ) {
				if ( ! find( add, action.stateCode ) ) {
					add.push( action.stateCode );
				}
				pull( remove, action.stateCode );
			} else {
				if ( ! find( remove, action.stateCode ) ) {
					remove.push( action.stateCode );
				}
				pull( add, action.stateCode );
			}
			return {
				...state,
				temporaryChanges: {
					...state.temporaryChanges,
					states: { add, remove, removeAll },
				},
			};
		}

		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_EDIT_POSTCODE:
			return {
				...state,
				temporaryChanges: {
					...state.temporaryChanges,
					postcode: action.postcode,
				},
			};

		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_FILTER_BY_WHOLE_COUNTRY:
			return {
				...state,
				temporaryChanges: {
					...state.temporaryChanges,
					postcode: null,
					states: null,
				},
			};

		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_FILTER_BY_STATE:
			return {
				...state,
				temporaryChanges: {
					...state.temporaryChanges,
					postcode: null,
					states: {
						add: [],
						remove: [],
						removeAll: true,
					},
				},
			};

		case WOOCOMMERCE_SHIPPING_ZONE_LOCATIONS_FILTER_BY_POSTCODE:
			return {
				...state,
				temporaryChanges: {
					...state.temporaryChanges,
					postcode: '',
					states: null,
				},
			};
	}
	return state;
}

export default ( state, action ) => {
	const newState = mainReducer( state, action );

	if (
		state.temporaryChanges &&
		newState.temporaryChanges &&
		state.temporaryChanges !== newState.temporaryChanges
	) {
		newState.temporaryChanges.pristine = false;
	}

	return newState;
};
