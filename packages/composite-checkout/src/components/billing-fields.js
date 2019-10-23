/**
 * External dependencies
 */
import React from 'react';
import styled from 'styled-components';

/**
 * Internal dependencies
 */
import { useLocalize } from '../lib/localize';
import { useCheckoutLineItems } from '../index';
import GridRow from './grid-row';
import Field from './field';

export default function BillingFields( {
	summary,
	setPaymentData,
	paymentData,
	isActive,
	isComplete,
} ) {
	const [ items ] = useCheckoutLineItems();
	const localize = useLocalize();
	if ( summary && isComplete ) {
		return <BillingFormSummary paymentData={ paymentData } />;
	}
	if ( ! isActive ) {
		return null;
	}
	const {
		billingName = '',
		billingAddress = '',
		billingCity = '',
		billingState = '',
		billingZipCode = '',
		billingCountry = '',
		billingPhoneNumber = '',
		billingVatIdNumber = '',
		billingNameError = null,
		billingAddressError = null,
		billingCityError = null,
		billingStateError = null,
		billingZipCodeError = null,
		billingCountryError = null,
		billingPhoneNumberError = null,
		billingVatIdError = null,
	} = paymentData || {};

	const nameOnChange = value => setPaymentData( { ...( paymentData || {} ), billingName: value } );
	const addressOnChange = value =>
		setPaymentData( { ...( paymentData || {} ), billingAddress: value } );
	const cityOnChange = value => setPaymentData( { ...( paymentData || {} ), billingCity: value } );
	const stateOnChange = value =>
		setPaymentData( { ...( paymentData || {} ), billingState: value } );
	const zipCodeOnChange = value =>
		setPaymentData( { ...( paymentData || {} ), billingZipCode: value } );
	const countryOnChange = value =>
		setPaymentData( { ...( paymentData || {} ), billingCountry: value } );
	const phoneNumberOnChange = value =>
		setPaymentData( { ...( paymentData || {} ), billingPhoneNumber: value } );
	const vatIdOnChange = value =>
		setPaymentData( { ...( paymentData || {} ), billingVatIdNumber: value } );

	return (
		<BillingFormFields>
			{ isDomainRelatedField( items ) && (
				<React.Fragment>
					<FormField
						id="billing-name"
						type="Text"
						label={ localize( 'Name' ) }
						error={ billingNameError }
						errorMessage={ localize( 'This is a required field' ) }
						value={ billingName }
						onChange={ nameOnChange }
					/>

					<FormField
						id="billing-address"
						type="Text"
						label={ localize( 'Address' ) }
						error={ billingAddressError }
						errorMessage={ localize( 'This is a required field' ) }
						value={ billingAddress }
						onChange={ addressOnChange }
					/>

					<FieldRow gap="4%" columnWidths="48% 48%">
						<Field
							id="billing-city"
							type="Text"
							label={ localize( 'City' ) }
							error={ billingCityError }
							errorMessage={ localize( 'This is a required field' ) }
							value={ billingCity }
							onChange={ cityOnChange }
						/>

						<Field
							id="billing-state"
							type="Text"
							label={ localize( 'State' ) }
							error={ billingStateError }
							errorMessage={ localize( 'This is a required field' ) }
							value={ billingState }
							onChange={ stateOnChange }
						/>
					</FieldRow>
				</React.Fragment>
			) }

			<FieldRow gap="4%" columnWidths="48% 48%">
				<Field
					id="billing-zip-code"
					type="Text"
					label={ localize( 'Zip code' ) }
					error={ billingZipCodeError }
					errorMessage={ localize( 'This is a required field' ) }
					value={ billingZipCode }
					onChange={ zipCodeOnChange }
				/>

				<Field
					id="billing-country"
					type="Text"
					label={ localize( 'Country' ) }
					error={ billingCountryError }
					errorMessage={ localize( 'This is a required field' ) }
					value={ billingCountry }
					onChange={ countryOnChange }
				/>
			</FieldRow>

			<FormField
				id="billing-phone-number"
				type="Number"
				label={ localize( 'Phone number (Optional)' ) }
				error={ billingPhoneNumberError }
				errorMessage={ localize( 'This is a required field' ) }
				value={ billingPhoneNumber }
				onChange={ phoneNumberOnChange }
			/>

			{ isElligibleForVat() && (
				<FormField
					id="billing-vat-id-number"
					type="Text"
					label={ localize( 'VAT identification number' ) }
					description={ localize( 'For businesses only' ) }
					error={ billingVatIdError }
					errorMessage={ localize( 'This is a required field' ) }
					value={ billingVatIdNumber }
					onChange={ vatIdOnChange }
				/>
			) }
		</BillingFormFields>
	);
}

const BillingFormFields = styled.div`
	margin-bottom: 16px;
`;

const FormField = styled( Field )`
	margin-top: 16px;
	:first-child {
		margin-top: 0;
	}
`;

const FieldRow = styled( GridRow )`
	margin-top: 16px;

	first-child {
		margin-top: 0;
	}
`;

function isDomainRelatedField( items ) {
	if ( items.find( item => item.type === 'domain' ) ) {
		return true;
	}

	return false;
}

function isElligibleForVat() {
	return false;
}

function BillingFormSummary( { paymentData } ) {
	const localize = useLocalize();
	const {
		billingName = '',
		billingAddress = '',
		billingCity = '',
		billingState = '',
		billingZipCode = '',
		billingCountry = '',
		billingPhoneNumber = '',
		billingVatIdNumber = '',
	} = paymentData || {};

	return (
		<React.Fragment>
			{ billingName } <br />
			{ billingAddress } <br />
			{ billingCity }, { billingState } <br />
			{ billingZipCode }, { billingCountry } <br />
			<br />
			{ billingPhoneNumber }
			{ isElligibleForVat() && (
				<React.Fragment>
					<br />
					{ localize( 'VAT indentification number:' ) }
					{ billingVatIdNumber }
				</React.Fragment>
			) }
		</React.Fragment>
	);
}
