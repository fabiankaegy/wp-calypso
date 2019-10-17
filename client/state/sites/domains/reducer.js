/* eslint-disable no-case-declarations */
/**
 * External dependencies
 */
import { find, indexOf } from 'lodash';

/**
 * Internal dependencies
 */
import {
	SITE_DOMAINS_RECEIVE,
	SITE_DOMAINS_REQUEST,
	SITE_DOMAINS_REQUEST_SUCCESS,
	SITE_DOMAINS_REQUEST_FAILURE,
	DOMAIN_PRIVACY_ENABLE,
	DOMAIN_PRIVACY_DISABLE,
	DOMAIN_PRIVACY_ENABLE_SUCCESS,
	DOMAIN_PRIVACY_DISABLE_SUCCESS,
	DOMAIN_PRIVACY_ENABLE_FAILURE,
	DOMAIN_PRIVACY_DISABLE_FAILURE,
} from 'state/action-types';
import { combineReducers, withSchemaValidation } from 'state/utils';
import { itemsSchema } from './schema';

const modifyDomainPrivacyImmutable = ( state, siteId, domain, privacyValue ) => {
	// Find the domain we want to update
	const targetDomain = find( state[ siteId ], { domain: domain } );
	const domainIndex = indexOf( state[ siteId ], targetDomain );
	// Copy as we shouldn't mutate original state
	const newDomains = [ ...state[ siteId ] ];
	// Update privacy
	newDomains.splice(
		domainIndex,
		1,
		Object.assign( {}, targetDomain, {
			privateDomain: privacyValue,
		} )
	);

	return Object.assign( {}, state, {
		[ siteId ]: newDomains,
	} );
};

/**
 * Domains `Reducer` function
 *
 * @param {Object} state - current state
 * @param {Object} action - domains action
 * @return {Object} updated state
 */
export const items = withSchemaValidation( itemsSchema, ( state = {}, action ) => {
	const { siteId } = action;
	switch ( action.type ) {
		case SITE_DOMAINS_RECEIVE:
			return Object.assign( {}, state, {
				[ siteId ]: action.domains,
			} );
		case DOMAIN_PRIVACY_ENABLE_SUCCESS:
			return modifyDomainPrivacyImmutable( state, siteId, action.domain, true );
		case DOMAIN_PRIVACY_DISABLE_SUCCESS:
			return modifyDomainPrivacyImmutable( state, siteId, action.domain, false );
	}

	return state;
} );

export const updatingPrivacy = ( state = {}, action ) => {
	switch ( action.type ) {
		case DOMAIN_PRIVACY_ENABLE:
		case DOMAIN_PRIVACY_ENABLE_SUCCESS:
		case DOMAIN_PRIVACY_ENABLE_FAILURE:
		case DOMAIN_PRIVACY_DISABLE:
		case DOMAIN_PRIVACY_DISABLE_SUCCESS:
		case DOMAIN_PRIVACY_DISABLE_FAILURE:
			return Object.assign( {}, state, {
				[ action.siteId ]: {
					[ action.domain ]:
						[ DOMAIN_PRIVACY_ENABLE, DOMAIN_PRIVACY_DISABLE ].indexOf( action.type ) !== -1,
				},
			} );
	}

	return state;
};

/**
 * `Reducer` function which handles request/response actions
 * to/from WP REST-API
 *
 * @param {Object} state - current state
 * @param {Object} action - domains action
 * @return {Object} updated state
 */
export const requesting = ( state = {}, action ) => {
	switch ( action.type ) {
		case SITE_DOMAINS_REQUEST:
		case SITE_DOMAINS_REQUEST_SUCCESS:
		case SITE_DOMAINS_REQUEST_FAILURE:
			return Object.assign( {}, state, {
				[ action.siteId ]: action.type === SITE_DOMAINS_REQUEST,
			} );
	}

	return state;
};

/**
 * `Reducer` function which handles ERRORs REST-API response actions
 *
 * @param {Object} state - current state
 * @param {Object} action - domains action
 * @return {Object} updated state
 */
export const errors = ( state = {}, action ) => {
	switch ( action.type ) {
		case SITE_DOMAINS_REQUEST:
		case SITE_DOMAINS_REQUEST_SUCCESS:
			return Object.assign( {}, state, {
				[ action.siteId ]: null,
			} );

		case SITE_DOMAINS_REQUEST_FAILURE:
			return Object.assign( {}, state, {
				[ action.siteId ]: action.error,
			} );
	}

	return state;
};

export default combineReducers( {
	errors,
	items,
	requesting,
	updatingPrivacy,
} );
