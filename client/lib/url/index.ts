/**
 * External dependencies
 */
import { format as formatUrl, parse as parseUrl } from 'url';
import { has, isString, omit, startsWith } from 'lodash';

/**
 * Internal dependencies
 */
import { URL, Scheme } from 'types';
import { Falsey } from 'utility-types';

/**
 * Re-exports
 */
export { addQueryArgs } from 'lib/route';
export { withoutHttp, urlToSlug, urlToDomainAndPath } from './http-utils';
export { default as isExternal } from './is-external';

/**
 * Check if a URL is located outside of Calypso.
 * Note that the check this function implements is incomplete --
 * it only returns false for absolute URLs, so it misses
 * relative URLs, or pure query strings, or hashbangs.
 *
 * @param  url URL to check
 * @return     true if the given URL is located outside of Calypso
 */
export function isOutsideCalypso( url: URL ): boolean {
	return !! url && ( startsWith( url, '//' ) || ! startsWith( url, '/' ) );
}

export function isHttps( url: URL ): boolean {
	return !! url && startsWith( url, 'https://' );
}

const schemeRegex = /^\w+:\/\//;

export function addSchemeIfMissing( url: URL, scheme: Scheme ): URL {
	if ( false === schemeRegex.test( url ) ) {
		return scheme + '://' + url;
	}
	return url;
}

export function setUrlScheme( url: URL, scheme: Scheme ) {
	const schemeWithSlashes = scheme + '://';
	if ( startsWith( url, schemeWithSlashes ) ) {
		return url;
	}

	const newUrl = addSchemeIfMissing( url, scheme );
	if ( newUrl !== url ) {
		return newUrl;
	}

	return url.replace( schemeRegex, schemeWithSlashes );
}

/**
 * Checks if the supplied string appears to be a URL.
 * Looks only for the absolute basics:
 *  - does it have a .suffix?
 *  - does it have at least two parts separated by a dot?
 *
 * @param  query The string to check
 * @return       Does it appear to be a URL?
 */
export function resemblesUrl( query: string ): boolean {
	if ( ! query ) {
		return false;
	}

	let parsedUrl = parseUrl( query );

	// Make sure the query has a protocol - hostname ends up blank otherwise
	if ( ! parsedUrl.protocol ) {
		parsedUrl = parseUrl( 'http://' + query );
	}

	if ( ! parsedUrl.hostname || parsedUrl.hostname.indexOf( '.' ) === -1 ) {
		return false;
	}

	// Check for a valid-looking TLD
	if ( parsedUrl.hostname.lastIndexOf( '.' ) > parsedUrl.hostname.length - 3 ) {
		return false;
	}

	// Make sure the hostname has at least two parts separated by a dot
	const hostnameParts = parsedUrl.hostname.split( '.' ).filter( Boolean );
	if ( hostnameParts.length < 2 ) {
		return false;
	}

	return true;
}

/**
 * Removes given params from a url.
 *
 * @param  {String} url URL to be cleaned
 * @param  {Array|String}  paramsToOmit The collection of params or single param to reject
 * @return {String} Url less the omitted params.
 */
export function omitUrlParams( url: Falsey, paramsToOmit: string | string[] ): null;
export function omitUrlParams( url: URL, paramsToOmit: string | string[] ): URL;
export function omitUrlParams( url: URL | Falsey, paramsToOmit: string | string[] ): URL | null {
	if ( ! url ) {
		return null;
	}

	const parsed = parseUrl( url, true );
	parsed.query = omit( parsed.query, paramsToOmit );

	delete parsed.search;
	return formatUrl( parsed );
}

/**
 * Wrap decodeURI in a try / catch block to prevent `URIError` on invalid input
 * Passing a non-string value will return an empty string.
 * @param  encodedURI URI to attempt to decode
 * @return            Decoded URI (or passed in value on error)
 */
export function decodeURIIfValid( encodedURI: string ): URL {
	if ( ! ( isString( encodedURI ) || has( encodedURI, 'toString' ) ) ) {
		return '';
	}
	try {
		return decodeURI( encodedURI );
	} catch ( e ) {
		return encodedURI;
	}
}

/**
 * Wrap decodeURIComponent in a try / catch block to prevent `URIError` on invalid input
 * Passing a non-string value will return an empty string.
 * @param  encodedURIComponent URI component to attempt to decode
 * @return                     Decoded URI component (or passed in value on error)
 */
export function decodeURIComponentIfValid( encodedURIComponent: string ): string {
	if ( ! ( isString( encodedURIComponent ) || has( encodedURIComponent, 'toString' ) ) ) {
		return '';
	}
	try {
		return decodeURIComponent( encodedURIComponent );
	} catch ( e ) {
		return encodedURIComponent;
	}
}
