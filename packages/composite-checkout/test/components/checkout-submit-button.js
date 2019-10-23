/**
 * External dependencies
 */
import React from 'react';
import { shallow, mount } from '../enzyme-adapter';

/**
 * Internal dependencies
 */
import CheckoutSubmitButton from '../../src/components/checkout-submit-button';

describe( 'CheckoutSubmitButton', function() {
	const componentWithDefaults = <CheckoutSubmitButton isActive={ true } />;
	console.log(
		shallow(
			<span>
				<div>hello</div>
			</span>
		).html()
	);
	it( 'Default component is in the dom', function() {
		expect( shallow( componentWithDefaults ).exists() ).toBe( true );
	} );
	it( 'Default component is selectable with checkout-submit-button', function() {
		expect(
			shallow( componentWithDefaults )
				.find( 'div' )
				.hasClass( 'checkout-submit-button' )
		).toBe( true );
	} );
} );
