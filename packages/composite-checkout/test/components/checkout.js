/**
 * External dependencies
 */
import React from 'react';
import { render, getByText } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Checkout from '../../src/components/checkout';

test( 'When we enter checkout, the line items and total are rendered', () => {
	const { container } = render(
		<Checkout
			locale="en-us"
			items={ [
				{
					label: 'Illudium Q-36 Explosive Space Modulator',
					id: 'space-modulator',
					type: 'widget',
					amount: { currency: 'USD', value: 5500, displayValue: '$55' },
				},
			] }
			total={ {
				label: 'Total',
				id: 'total',
				type: 'total',
				amount: { currency: 'USD', value: 5500, displayValue: '$55' },
			} }
			onSuccess={ () => {
				return;
			} }
			onFailure={ () => {
				return;
			} }
			successRedirectUrl="#"
			failureRedirectUrl="#"
		/>
	);

	const totalDiv = container.querySelector( '.order-review-total' );
	expect( getByText( totalDiv, 'Total' ) ).toBeDefined();
	expect( getByText( totalDiv, '$55' ) ).toBeDefined();

	const lineItemsDiv = container.querySelector( '.order-review-line-items' );
	expect( getByText( lineItemsDiv, 'Illudium Q-36 Explosive Space Modulator' ) ).toBeDefined();
	expect( getByText( lineItemsDiv, '$55' ) ).toBeDefined();
} );
