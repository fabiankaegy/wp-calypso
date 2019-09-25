/**
 * External dependencies
 */
import { registerPlugin } from '@wordpress/plugins';
import { withDispatch, withSelect, select } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import registerStore from './store';
import registerDOMUpdater from './dom-updater';
import GlobalStylesSidebar from './global-styles-sidebar';
import {
	FONT_BASE,
	FONT_BASE_DEFAULT,
	FONT_HEADINGS,
	FONT_HEADINGS_DEFAULT,
	FONT_PAIRINGS,
	FONT_OPTIONS,
	SITE_NAME,
} from './constants';

// Global variable.
const { PLUGIN_NAME, STORE_NAME, REST_PATH } = A8C_GLOBAL_STYLES_EDITOR_CONSTANTS;

registerStore( STORE_NAME, REST_PATH );
registerDOMUpdater( [ FONT_BASE, FONT_HEADINGS ], select( STORE_NAME ).getOption );

registerPlugin( PLUGIN_NAME, {
	render: compose(
		withSelect( getSelectors => ( {
			siteName: getSelectors( STORE_NAME ).getOption( SITE_NAME ),
			fontHeadings: getSelectors( STORE_NAME ).getOption( FONT_HEADINGS ),
			fontHeadingsDefault: getSelectors( STORE_NAME ).getOption( FONT_HEADINGS_DEFAULT ),
			fontBase: getSelectors( STORE_NAME ).getOption( FONT_BASE ),
			fontBaseDefault: getSelectors( STORE_NAME ).getOption( FONT_BASE_DEFAULT ),
			fontPairings: getSelectors( STORE_NAME ).getOption( FONT_PAIRINGS ),
			fontOptions: getSelectors( STORE_NAME ).getOption( FONT_OPTIONS ),
			hasLocalChanges: getSelectors( STORE_NAME ).hasLocalChanges(),
		} ) ),
		withDispatch( dispatch => ( {
			updateOptions: dispatch( STORE_NAME ).updateOptions,
			resetLocalChanges: dispatch( STORE_NAME ).resetLocalChanges,
		} ) )
	)( GlobalStylesSidebar ),
} );
