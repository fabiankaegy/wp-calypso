/** @format */

/**
 * External dependencies
 */
import { noop } from 'lodash';
import i18n from 'i18n-calypso';

/**
 * Internal dependencies
 */
import config from 'config';
import {
	PLAN_PERSONAL,
	PLAN_PREMIUM,
	PLAN_BUSINESS,
	TYPE_FREE,
	TYPE_PERSONAL,
	TYPE_PREMIUM,
	TYPE_BUSINESS,
	TYPE_ECOMMERCE,
} from 'lib/plans/constants';

export function generateSteps( {
	addPlanToCart = noop,
	createAccount = noop,
	createSite = noop,
	createSiteOrDomain = noop,
	createSiteWithCart = noop,
	currentPage = noop,
	setThemeOnSite = noop,
	addDomainToCart = noop,
	launchSiteApi = noop,
	isPlanFulfilled = noop,
	isDomainFulfilled = noop,
	isSiteTypeFulfilled = noop,
	isSiteTopicFulfilled = noop,
} = {} ) {
	return {
		survey: {
			stepName: 'survey',
			props: {
				surveySiteType:
					currentPage && currentPage.toString().match( /\/start\/blog/ ) ? 'blog' : 'site',
			},
			providesDependencies: [ 'surveySiteType', 'surveyQuestion' ],
		},

		themes: {
			stepName: 'themes',
			dependencies: [ 'siteSlug' ],
			providesDependencies: [ 'themeSlugWithRepo' ],
		},

		'portfolio-themes': {
			stepName: 'portfolio-themes',
			props: {
				designType: 'grid',
			},
			dependencies: [ 'siteSlug' ],
			providesDependencies: [ 'themeSlugWithRepo' ],
		},

		// `themes` does not update the theme for an existing site as we normally
		// do this when the site is created. In flows where a site is merely being
		// updated, we need to use a different API request function.
		'themes-site-selected': {
			stepName: 'themes-site-selected',
			dependencies: [ 'siteSlug', 'themeSlugWithRepo' ],
			providesDependencies: [ 'themeSlugWithRepo' ],
			apiRequestFunction: setThemeOnSite,
			props: {
				headerText: i18n.translate( 'Choose a theme for your new site.' ),
			},
		},

		'domains-launch': {
			stepName: 'domains-launch',
			apiRequestFunction: addDomainToCart,
			fulfilledStepCallback: isDomainFulfilled,
			providesDependencies: [ 'domainItem' ],
			props: {
				isDomainOnly: false,
				showExampleSuggestions: false,
				includeWordPressDotCom: false,
				showSkipButton: true,
				headerText: i18n.translate( 'Getting ready to launch, pick a domain' ),
				subHeaderText: i18n.translate( 'Select a domain name for your website' ),
			},
			dependencies: [ 'siteSlug' ],
		},

		'plans-site-selected': {
			stepName: 'plans-site-selected',
			apiRequestFunction: addPlanToCart,
			dependencies: [ 'siteSlug' ],
			providesDependencies: [ 'cartItem' ],
		},

		site: {
			stepName: 'site',
			apiRequestFunction: createSite,
			providesDependencies: [ 'siteSlug' ],
		},

		'rebrand-cities-welcome': {
			stepName: 'rebrand-cities-welcome',
			apiRequestFunction: createSiteWithCart,
			providesDependencies: [ 'siteId', 'siteSlug', 'domainItem', 'themeItem' ],
			props: {
				isDomainOnly: false,
			},
			delayApiRequestUntilComplete: true,
		},

		about: {
			stepName: 'about',
			providesDependencies: [ 'designType', 'themeSlugWithRepo', 'siteTitle', 'surveyQuestion' ],
		},

		user: {
			stepName: 'user',
			apiRequestFunction: createAccount,
			providesToken: true,
			providesDependencies: [ 'bearer_token', 'username' ],
			props: {
				isSocialSignupEnabled: config.isEnabled( 'signup/social' ),
			},
		},

		'site-title': {
			stepName: 'site-title',
			providesDependencies: [ 'siteTitle' ],
		},

		test: {
			stepName: 'test',
		},

		plans: {
			stepName: 'plans',
			apiRequestFunction: addPlanToCart,
			dependencies: [ 'siteSlug' ],
			providesDependencies: [ 'cartItem' ],
			fulfilledStepCallback: isPlanFulfilled,
		},

		'plans-ecommerce': {
			stepName: 'plans-ecommerce',
			apiRequestFunction: addPlanToCart,
			dependencies: [ 'siteSlug' ],
			providesDependencies: [ 'cartItem' ],
			fulfilledStepCallback: isPlanFulfilled,
			props: {
				hideFreePlan: true,
				planTypes: [ TYPE_BUSINESS, TYPE_ECOMMERCE ],
			},
		},

		'plans-import': {
			stepName: 'plans-import',
			apiRequestFunction: addPlanToCart,
			dependencies: [ 'siteSlug' ],
			providesDependencies: [ 'cartItem' ],
			fulfilledStepCallback: isPlanFulfilled,
			props: {
				planTypes: [ TYPE_FREE, TYPE_PERSONAL, TYPE_PREMIUM, TYPE_BUSINESS ],
			},
		},

		'plans-personal': {
			stepName: 'plans-personal',
			apiRequestFunction: addPlanToCart,
			fulfilledStepCallback: isPlanFulfilled,
			dependencies: [ 'siteSlug' ],
			providesDependencies: [ 'cartItem' ],
			defaultDependencies: {
				cartItem: PLAN_PERSONAL,
			},
		},

		'plans-premium': {
			stepName: 'plans-premium',
			apiRequestFunction: addPlanToCart,
			fulfilledStepCallback: isPlanFulfilled,
			dependencies: [ 'siteSlug' ],
			providesDependencies: [ 'cartItem' ],
			defaultDependencies: {
				cartItem: PLAN_PREMIUM,
			},
		},

		'plans-business': {
			stepName: 'plans-business',
			apiRequestFunction: addPlanToCart,
			fulfilledStepCallback: isPlanFulfilled,
			dependencies: [ 'siteSlug' ],
			providesDependencies: [ 'cartItem' ],
			defaultDependencies: {
				cartItem: PLAN_BUSINESS,
			},
		},

		'plans-launch': {
			stepName: 'plans-launch',
			apiRequestFunction: addPlanToCart,
			fulfilledStepCallback: isPlanFulfilled,
			dependencies: [ 'siteSlug' ],
			providesDependencies: [ 'cartItem' ],
			props: {
				headerText: i18n.translate( 'Getting ready to launch your website' ),
				subHeaderText: i18n.translate( "Pick a plan that's right for you." ),
				fallbackHeaderText: i18n.translate( "Almost there, pick a plan that's right for you." ),
				isLaunchPage: true,
			},
		},

		'plans-store-nux': {
			stepName: 'plans-store-nux',
			apiRequestFunction: addPlanToCart,
			dependencies: [ 'siteSlug', 'domainItem' ],
			providesDependencies: [ 'cartItem' ],
		},

		domains: {
			stepName: 'domains',
			apiRequestFunction: createSiteWithCart,
			providesDependencies: [ 'siteId', 'siteSlug', 'domainItem', 'themeItem' ],
			props: {
				isDomainOnly: false,
			},
			dependencies: [ 'themeSlugWithRepo' ],
			delayApiRequestUntilComplete: true,
		},

		'domain-only': {
			stepName: 'domain-only',
			providesDependencies: [ 'siteId', 'siteSlug', 'domainItem' ],
			props: {
				isDomainOnly: true,
			},
		},

		'domains-store': {
			stepName: 'domains',
			apiRequestFunction: createSiteWithCart,
			providesDependencies: [ 'siteId', 'siteSlug', 'domainItem', 'themeItem' ],
			props: {
				isDomainOnly: false,
				forceDesignType: 'store',
			},
			delayApiRequestUntilComplete: true,
		},

		'domains-theme-preselected': {
			stepName: 'domains-theme-preselected',
			apiRequestFunction: createSiteWithCart,
			providesDependencies: [ 'siteId', 'siteSlug', 'domainItem', 'themeItem' ],
			props: {
				isDomainOnly: false,
			},
			delayApiRequestUntilComplete: true,
		},

		'jetpack-user': {
			stepName: 'jetpack-user',
			apiRequestFunction: createAccount,
			providesToken: true,
			props: {
				headerText: i18n.translate( 'Create an account for Jetpack' ),
				subHeaderText: i18n.translate( "You're moments away from connecting Jetpack." ),
			},
			providesDependencies: [ 'bearer_token', 'username' ],
		},

		'oauth2-user': {
			stepName: 'oauth2-user',
			apiRequestFunction: createAccount,
			props: {
				oauth2Signup: true,
			},
			providesToken: true,
			providesDependencies: [ 'bearer_token', 'username', 'oauth2_client_id', 'oauth2_redirect' ],
		},

		'oauth2-name': {
			stepName: 'oauth2-name',
			apiRequestFunction: createAccount,
			providesToken: true,
			providesDependencies: [ 'bearer_token', 'username', 'oauth2_client_id', 'oauth2_redirect' ],
			props: {
				isSocialSignupEnabled: config.isEnabled( 'signup/social' ),
				oauth2Signup: true,
				displayNameInput: true,
				displayUsernameInput: false,
			},
		},

		displayname: {
			stepName: 'displayname',
			apiRequestFunction: createAccount,
			providesToken: true,
			providesDependencies: [ 'bearer_token', 'username' ],
			props: {
				isSocialSignupEnabled: config.isEnabled( 'signup/social' ),
				displayNameInput: true,
				displayUsernameInput: false,
			},
		},

		// Currently, these two steps explicitly submit other steps to skip them, and
		// should not be used outside of the `domain-first` flow.
		'site-or-domain': {
			stepName: 'site-or-domain',
			props: {
				headerText: i18n.translate( 'Choose how you want to use your domain.' ),
				subHeaderText: i18n.translate(
					"Don't worry you can easily add a site later if you're not ready."
				),
			},
			providesDependencies: [
				'designType',
				'siteId',
				'siteSlug',
				'siteUrl',
				'domainItem',
				'themeSlugWithRepo',
			],
		},
		'site-picker': {
			stepName: 'site-picker',
			apiRequestFunction: createSiteOrDomain,
			props: {
				headerText: i18n.translate( 'Choose your site?' ),
			},
			providesDependencies: [ 'siteId', 'siteSlug', 'domainItem', 'themeSlugWithRepo' ],
			dependencies: [ 'cartItem', 'designType', 'domainItem', 'siteUrl', 'themeSlugWithRepo' ],
			delayApiRequestUntilComplete: true,
		},

		'creds-complete': {
			stepName: 'creds-complete',
			providesDependencies: [],
		},

		'creds-confirm': {
			stepName: 'creds-confirm',
			providesDependencies: [ 'rewindconfig' ],
		},

		'creds-permission': {
			stepName: 'creds-permission',
			providesDependencies: [ 'rewindconfig' ],
		},

		'rewind-migrate': {
			stepName: 'rewind-migrate',
			providesDependencies: [ 'rewindconfig' ],
		},

		'rewind-were-backing': {
			stepName: 'rewind-were-backing',
			providesDependencies: [],
		},

		'rewind-add-creds': {
			stepName: 'rewind-add-creds',
			providesDependencies: [],
		},

		'rewind-form-creds': {
			stepName: 'rewind-form-creds',
			providesDependencies: [ 'rewindconfig' ],
		},

		'clone-start': {
			stepName: 'clone-start',
			providesDependencies: [ 'originSiteSlug', 'originSiteName', 'originBlogId' ],
		},

		'clone-destination': {
			stepName: 'clone-destination',
			providesDependencies: [ 'destinationSiteName', 'destinationSiteUrl' ],
		},

		'clone-credentials': {
			stepName: 'clone-credentials',
			providesDependencies: [ 'roleName' ],
		},

		'clone-point': {
			stepName: 'clone-point',
			providesDependencies: [ 'clonePoint' ],
		},

		'clone-jetpack': {
			stepName: 'clone-jetpack',
			providesDependencies: [ 'cloneJetpack' ],
		},

		'clone-ready': {
			stepName: 'clone-ready',
			providesDependencies: [],
		},

		'clone-cloning': {
			stepName: 'clone-cloning',
			providesDependencies: [],
		},

		/* Imports */
		'from-url': {
			stepName: 'from-url',
			providesDependencies: [
				'importSiteEngine',
				'importSiteFavicon',
				'importSiteUrl',
				'siteTitle',
				'suggestedDomain',
				'themeSlugWithRepo',
			],
		},

		/* Import onboarding */
		'import-url': {
			stepName: 'import-url',
			providesDependencies: [
				'importSiteEngine',
				'importSiteFavicon',
				'importSiteUrl',
				'siteTitle',
				'suggestedDomain',
				'themeSlugWithRepo',
			],
		},

		'import-preview': {
			stepName: 'import-preview',
			dependencies: [ 'importSiteEngine', 'importSiteFavicon', 'importSiteUrl', 'siteTitle' ],
		},

		'reader-landing': {
			stepName: 'reader-landing',
			providesDependencies: [],
		},

		/* Improved Onboarding */
		'site-type': {
			stepName: 'site-type',
			providesDependencies: [ 'siteType', 'themeSlugWithRepo' ],
			fulfilledStepCallback: isSiteTypeFulfilled,
		},

		'site-topic': {
			stepName: 'site-topic',
			providesDependencies: [ 'siteTopic', 'themeSlugWithRepo' ],
			optionalDependencies: [ 'themeSlugWithRepo' ],
			fulfilledStepCallback: isSiteTopicFulfilled,
		},

		'site-title-without-domains': {
			stepName: 'site-title-without-domains',
			apiRequestFunction: createSiteWithCart,
			delayApiRequestUntilComplete: true,
			dependencies: [ 'themeSlugWithRepo' ],
			providesDependencies: [ 'siteTitle', 'siteId', 'siteSlug', 'domainItem', 'themeItem' ],
			props: {
				showSiteMockups: true,
			},
		},

		'site-style': {
			stepName: 'site-style',
			providesDependencies: [ 'siteStyle', 'themeSlugWithRepo' ],
		},

		// Steps with preview
		// These can be removed once we make the preview the default
		'site-topic-with-preview': {
			stepName: 'site-topic-with-preview',
			providesDependencies: [ 'siteTopic', 'themeSlugWithRepo' ],
			optionalDependencies: [ 'themeSlugWithRepo' ],
			fulfilledStepCallback: isSiteTopicFulfilled,
			props: {
				showSiteMockups: true,
			},
		},

		'site-style-with-preview': {
			stepName: 'site-style-with-preview',
			providesDependencies: [ 'siteStyle', 'themeSlugWithRepo' ],
			props: {
				showSiteMockups: true,
			},
		},

		'domains-with-preview': {
			stepName: 'domains-with-preview',
			apiRequestFunction: createSiteWithCart,
			providesDependencies: [ 'siteId', 'siteSlug', 'domainItem', 'themeItem' ],
			props: {
				showSiteMockups: true,
				isDomainOnly: false,
			},
			dependencies: [ 'themeSlugWithRepo' ],
			delayApiRequestUntilComplete: true,
		},

		'site-title-with-preview': {
			stepName: 'site-title-with-preview',
			providesDependencies: [ 'siteTitle' ],
			props: {
				showSiteMockups: true,
			},
		},

		launch: {
			stepName: 'launch',
			apiRequestFunction: launchSiteApi,
			dependencies: [ 'siteSlug' ],
		},

		passwordless: {
			stepName: 'passwordless',
			providesToken: true,
			providesDependencies: [ 'bearer_token', 'email', 'username' ],
			unstorableDependencies: [ 'bearer_token' ],
		},
	};
}

const steps = generateSteps();
export default steps;
