/**
 * Internal dependencies
 */
import { swatches } from './lib/swatches.js';

const theme = {
	colors: {
		background: swatches.gray0,
		surface: swatches.white,
		highlight: swatches.wordpressBlue50,
		primary: swatches.pink50,
		primaryBorder: swatches.pink70,
		highlightBorder: swatches.wordpressBlue80,
		success: swatches.green50,
		disabledPaymentButtons: swatches.gray0,
		disabledButtons: swatches.gray20,
		borderColorLight: swatches.gray5,
		borderColor: swatches.gray20,
		upcomingStepBackground: swatches.gray5,
		textColor: swatches.gray80,
		textColorLight: swatches.gray50,
		textColorDark: swatches.black,
		warning: swatches.red50,
		warningBackground: swatches.red0,
		outline: swatches.blue30,
		applePayButtonColor: swatches.black,
		applePayButtonRollOverColor: swatches.gray80,
		paypalGold: '#F0C443',
		paypalGoldHover: '#FFB900',
	},
	breakpoints: {
		tabletUp: 'min-width: 700px',
	},
	weights: {
		bold: '600',
		normal: '400',
	},
};

export default theme;
