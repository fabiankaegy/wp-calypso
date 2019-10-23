/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { registerPaymentMethod } from '../../lib/payment-methods';
import { ApplePayBillingForm, ApplePaySubmitButton, ApplePayLabel } from './apple-pay';
import CreditCardFields from '../../components/credit-card-fields';
import BillingFields from '../../components/billing-fields';

export default function loadPaymentMethods() {
	registerPaymentMethod( {
		id: 'apple-pay',
		LabelComponent: ApplePayLabel,
		PaymentMethodComponent: () => null,
		BillingContactComponent: BillingFields,
		SubmitButtonComponent: ApplePaySubmitButton,
	} );

	registerPaymentMethod( {
		id: 'card',
		LabelComponent: () => <span>Credit Card</span>,
		PaymentMethodComponent: ( { isActive } ) => ( isActive ? <CreditCardFields /> : null ),
		BillingContactComponent: ApplePayBillingForm, // TODO: replace this
		SubmitButtonComponent: () => <button>Pay</button>,
	} );

	registerPaymentMethod( {
		id: 'paypal',
		LabelComponent: () => <span>PayPal</span>,
		PaymentMethodComponent: () => null,
		BillingContactComponent: ApplePayBillingForm, // TODO: replace this
		SubmitButtonComponent: () => <button>Pay</button>,
	} );
}
