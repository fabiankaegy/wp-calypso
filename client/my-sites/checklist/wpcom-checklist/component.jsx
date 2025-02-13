/** @format */
/**
 * External dependencies
 */
import page from 'page';
import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { get, includes } from 'lodash';
import { isDesktop } from 'lib/viewport';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { Checklist, Task } from 'components/checklist';
import ChecklistBanner from './checklist-banner';
import ChecklistBannerTask from './checklist-banner/task';
import ChecklistNavigation from './checklist-navigation';
import ChecklistPrompt from './checklist-prompt';
import ChecklistPromptTask from './checklist-prompt/task';
import getSiteChecklist from 'state/selectors/get-site-checklist';
import getSiteTaskList from 'state/selectors/get-site-task-list';
import QueryPosts from 'components/data/query-posts';
import QuerySiteChecklist from 'components/data/query-site-checklist';
import { successNotice } from 'state/notices/actions';
import { getSelectedSiteId } from 'state/ui/selectors';
import { getSiteOption, getSiteSlug, isCurrentPlanPaid } from 'state/sites/selectors';
import { recordTracksEvent } from 'state/analytics/actions';
import { requestGuidedTour } from 'state/ui/guided-tours/actions';
import { requestSiteChecklistTaskUpdate } from 'state/checklist/actions';
import { getCurrentUser, isCurrentUserEmailVerified } from 'state/current-user/selectors';
import userFactory from 'lib/user';
import { launchSite } from 'state/sites/launch/actions';
import isUnlaunchedSite from 'state/selectors/is-unlaunched-site';
import getChecklistTaskUrls, {
	FIRST_TEN_SITE_POSTS_QUERY,
} from 'state/selectors/get-checklist-task-urls';
import { getDomainsBySiteId } from 'state/sites/domains/selectors';
import {
	showInlineHelpPopover,
	showChecklistPrompt,
	setChecklistPromptTaskId,
	setChecklistPromptStep,
} from 'state/inline-help/actions';
import { emailManagement } from 'my-sites/email/paths';
import PendingGSuiteTosNoticeDialog from 'my-sites/domains/components/domain-warnings/pending-gsuite-tos-notice-dialog';

const userLib = userFactory();

class WpcomChecklistComponent extends PureComponent {
	state = {
		pendingRequest: false,
		emailSent: false,
		error: null,
		gSuiteDialogVisible: false,
		selectedTaskId: null,
	};

	constructor() {
		super();

		this.taskFunctions = {
			email_verified: this.renderEmailVerifiedTask,
			site_created: this.renderSiteCreatedTask,
			address_picked: this.renderAddressPickedTask,
			blogname_set: this.renderBlogNameSetTask,
			site_icon_set: this.renderSiteIconSetTask,
			blogdescription_set: this.renderBlogDescriptionSetTask,
			avatar_uploaded: this.renderAvatarUploadedTask,
			contact_page_updated: this.renderContactPageUpdatedTask,
			post_published: this.renderPostPublishedTask,
			custom_domain_registered: this.renderCustomDomainRegisteredTask,
			mobile_app_installed: this.renderMobileAppInstalledTask,
			site_launched: this.renderSiteLaunchedTask,
			email_setup: this.renderEmailSetupTask,
			email_forwarding_upgraded_to_gsuite: this.renderEmailForwardingUpgradedToGSuiteTask,
			gsuite_tos_accepted: this.renderGSuiteTOSAcceptedTask,
			about_text_updated: this.renderAboutTextUpdatedTask,
			front_page_updated: this.renderFrontPageUpdatedTask,
			homepage_photo_updated: this.renderHomepagePhotoUpdatedTask,
			business_hours_added: this.renderBusinessHoursAddedTask,
			service_list_added: this.renderServiceListAddedTask,
			staff_info_added: this.renderStaffInfoAddedTask,
			product_list_added: this.renderProductListAddedTask,
		};
	}

	handleTaskStart = ( { task, tourId, url } ) => () => {
		if ( ! tourId && ! url ) {
			return;
		}

		this.trackTaskStart( task );

		if ( tourId && ! task.isCompleted && isDesktop() ) {
			this.props.requestGuidedTour( tourId );
		}

		if ( url ) {
			page.show( url );
		}
	};

	trackTaskStart = ( task, props ) => {
		let location;

		switch ( this.props.viewMode ) {
			case 'banner':
				location = 'checklist_banner';
				break;
			case 'prompt':
				location = 'checklist_prompt';
				break;
			default:
				location = 'checklist_show';
		}

		this.props.recordTracksEvent( 'calypso_checklist_task_start', {
			checklist_name: 'new_blog',
			site_id: this.props.siteId,
			location,
			step_name: task.id,
			completed: task.isCompleted,
			...props,
		} );
	};

	handleTaskDismiss = taskId => () => {
		const { siteId } = this.props;

		if ( taskId ) {
			this.props.successNotice( 'You completed a task!', { duration: 5000 } );
			this.props.requestSiteChecklistTaskUpdate( siteId, taskId );
			this.trackTaskDismiss( taskId );
		}
	};

	trackTaskDismiss = taskId => {
		if ( taskId ) {
			this.props.recordTracksEvent( 'calypso_checklist_task_dismiss', {
				checklist_name: 'new_blog',
				site_id: this.props.siteId,
				step_name: taskId,
			} );
		}
	};

	trackTaskDisplay = ( id, isCompleted, location ) => {
		this.props.recordTracksEvent( 'calypso_checklist_task_display', {
			checklist_name: 'new_blog',
			site_id: this.props.siteId,
			step_name: id,
			completed: isCompleted,
			location,
		} );
	};

	trackExpandTask = ( { id } ) =>
		void this.props.recordTracksEvent( 'calypso_checklist_task_expand', {
			step_name: id,
			product: 'WordPress.com',
		} );

	handleTaskStartThenDismiss = args => () => {
		const { task } = args;
		this.handleTaskStart( args )();
		this.handleTaskDismiss( task.id )();
	};

	handleSendVerificationEmail = e => {
		e.preventDefault();

		if ( this.state.pendingRequest ) {
			return;
		}

		this.setState( {
			pendingRequest: true,
		} );

		userLib.sendVerificationEmail( ( error, response ) => {
			this.setState( {
				emailSent: response && response.success,
				error: error,
				pendingRequest: false,
			} );
		} );
	};

	handleLaunchSite = task => () => {
		if ( task.isCompleted ) {
			return;
		}

		const { siteId, domains, isPaidPlan, siteSlug } = this.props;

		if ( isPaidPlan && domains.length > 1 ) {
			this.props.launchSite( siteId );
		} else {
			location.href = `/start/launch-site?siteSlug=${ siteSlug }`;
		}
	};

	verificationTaskButtonText() {
		const { translate } = this.props;
		if ( this.state.pendingRequest ) {
			return translate( 'Sending…' );
		}

		if ( this.state.error ) {
			return translate( 'Error' );
		}

		if ( this.state.emailSent ) {
			return translate( 'Email sent' );
		}

		return translate( 'Resend email' );
	}

	handleInlineHelpStart = task => () => {
		if ( task.isCompleted ) {
			return;
		}

		this.props.setChecklistPromptTaskId( task.id );
		this.props.setChecklistPromptStep( 0 );
		this.props.showInlineHelpPopover();
		this.props.showChecklistPrompt();
	};

	nextInlineHelp = () => {
		const taskList = this.props.taskList;
		const firstIncomplete = taskList.getFirstIncompleteTask();

		if ( firstIncomplete ) {
			this.props.setChecklistPromptTaskId( firstIncomplete.id );
			this.props.setChecklistPromptStep( 0 );
		} else {
			this.props.setChecklistPromptTaskId( null );
			this.backToChecklist();
		}
	};

	backToChecklist = () => {
		page( `/checklist/${ this.props.siteSlug }` );
	};

	render() {
		const {
			phase2,
			siteId,
			taskList,
			taskStatuses,
			viewMode,
			updateCompletion,
			setNotification,
			setStoredTask,
			closePopover,
			showNotification,
			storedTask,
		} = this.props;

		let ChecklistComponent = Checklist;

		switch ( viewMode ) {
			case 'banner':
				ChecklistComponent = ChecklistBanner;
				break;
			case 'navigation':
				ChecklistComponent = ChecklistNavigation;
				break;
			case 'prompt':
				ChecklistComponent = ChecklistPrompt;
				break;
			case 'notification':
				return null;
		}

		return (
			<>
				{ siteId && <QuerySiteChecklist siteId={ siteId } /> }
				{ siteId && <QueryPosts siteId={ siteId } query={ FIRST_TEN_SITE_POSTS_QUERY } /> }
				<ChecklistComponent
					isPlaceholder={ ! taskStatuses }
					updateCompletion={ updateCompletion }
					closePopover={ closePopover }
					showNotification={ showNotification }
					setNotification={ setNotification }
					setStoredTask={ setStoredTask }
					storedTask={ storedTask }
					taskList={ taskList }
					phase2={ phase2 }
					onExpandTask={ this.trackExpandTask }
					showChecklistHeader={ true }
				>
					{ taskList.getAll().map( task => this.renderTask( task ) ) }
				</ChecklistComponent>
			</>
		);
	}

	renderTask( task ) {
		const { siteSlug, viewMode, closePopover } = this.props;

		let TaskComponent = Task;

		switch ( viewMode ) {
			case 'banner':
				TaskComponent = ChecklistBannerTask;
				break;
			case 'prompt':
				TaskComponent = ChecklistPromptTask;
				break;
		}

		const baseProps = {
			id: task.id,
			key: task.id,
			completed: task.isCompleted,
			siteSlug,
			closePopover: closePopover,
			trackTaskDisplay: this.trackTaskDisplay,
		};

		if ( this.shouldRenderTask( task.id ) ) {
			return this.taskFunctions[ task.id ]( TaskComponent, baseProps, task );
		}

		return null;
	}

	shouldRenderTask( taskId ) {
		return typeof this.taskFunctions[ taskId ] !== 'undefined';
	}

	renderEmailVerifiedTask = ( TaskComponent, baseProps ) => {
		const { translate } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				bannerImageSrc="/calypso/images/illustrations/checkEmailsDesktop.svg"
				buttonText={ this.verificationTaskButtonText() }
				completedTitle={ translate( 'You validated your email address' ) }
				description={ translate(
					'Please click the link in the email we sent to %(email)s.{{br /}}' +
						'Typo in your email address? {{changeButton}}Change it here{{/changeButton}}.',
					{
						args: {
							email: this.props.userEmail,
						},
						components: {
							br: <br />,
							changeButton: <a href="/me/account?tour=checklistUserEmail" />,
						},
					}
				) }
				// only render an unclickable grey circle when email conformation is incomplete
				disableIcon={ ! baseProps.completed }
				duration={ translate( '%d minute', '%d minutes', { count: 1, args: [ 1 ] } ) }
				onClick={ this.handleSendVerificationEmail }
				title={ translate( 'Confirm your email address' ) }
			/>
		);
	};

	renderSiteCreatedTask = ( TaskComponent, baseProps ) => {
		const { translate } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				completedTitle={ translate( 'You created your site' ) }
				description={ translate( 'This is where your adventure begins.' ) }
				title={ translate( 'Create your site' ) }
			/>
		);
	};

	renderAddressPickedTask = ( TaskComponent, baseProps ) => {
		const { translate } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				completedTitle={ translate( 'You picked a website address' ) }
				description={ translate( 'Choose an address so people can find you on the internet.' ) }
				title={ translate( 'Pick a website address' ) }
			/>
		);
	};

	renderBlogNameSetTask = ( TaskComponent, baseProps, task ) => {
		const { translate, siteSlug } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				bannerImageSrc="/calypso/images/stats/tasks/personalize-your-site.svg"
				completedButtonText={ translate( 'Edit' ) }
				completedTitle={ translate( 'You updated your site title' ) }
				description={ translate( 'Give your site a descriptive name to entice visitors.' ) }
				duration={ translate( '%d minute', '%d minutes', { count: 1, args: [ 1 ] } ) }
				onClick={ this.handleTaskStart( {
					task,
					tourId: 'checklistSiteTitle',
					url: `/settings/general/${ siteSlug }`,
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				title={ translate( 'Give your site a name' ) }
				showSkip={ true }
			/>
		);
	};

	renderSiteIconSetTask = ( TaskComponent, baseProps, task ) => {
		const { translate, siteSlug } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				bannerImageSrc="/calypso/images/stats/tasks/upload-icon.svg"
				completedButtonText={ translate( 'Change' ) }
				completedTitle={ translate( 'You uploaded a site icon' ) }
				description={ translate(
					'Help people recognize your site in browser tabs — just like the WordPress.com W!'
				) }
				duration={ translate( '%d minute', '%d minutes', { count: 1, args: [ 1 ] } ) }
				onClick={ this.handleTaskStart( {
					task,
					tourId: 'checklistSiteIcon',
					url: `/settings/general/${ siteSlug }`,
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				title={ translate( 'Upload a site icon' ) }
				showSkip={ true }
			/>
		);
	};

	renderBlogDescriptionSetTask = ( TaskComponent, baseProps, task ) => {
		const { translate, siteSlug } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				bannerImageSrc="/calypso/images/stats/tasks/create-tagline.svg"
				completedButtonText={ translate( 'Change' ) }
				completedTitle={ translate( 'You created a tagline' ) }
				description={ translate(
					'Pique readers’ interest with a little more detail about your site.'
				) }
				duration={ translate( '%d minute', '%d minutes', { count: 2, args: [ 2 ] } ) }
				onClick={ this.handleTaskStart( {
					task,
					tourId: 'checklistSiteTagline',
					url: `/settings/general/${ siteSlug }`,
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				title={ translate( 'Create a tagline' ) }
				showSkip={ true }
			/>
		);
	};

	renderAvatarUploadedTask = ( TaskComponent, baseProps, task ) => {
		const { translate } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				bannerImageSrc="/calypso/images/stats/tasks/upload-profile-picture.svg"
				completedButtonText={ translate( 'Change' ) }
				completedTitle={ translate( 'You uploaded a profile picture' ) }
				description={ translate(
					'Who’s the person behind the site? Personalize your posts and comments with a custom profile picture.'
				) }
				duration={ translate( '%d minute', '%d minutes', { count: 2, args: [ 2 ] } ) }
				onClick={ this.handleTaskStart( {
					task,
					tourId: 'checklistUserAvatar',
					url: '/me',
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				title={ translate( 'Upload your profile picture' ) }
				showSkip={ true }
			/>
		);
	};

	renderContactPageUpdatedTask = ( TaskComponent, baseProps, task ) => {
		const { translate, taskUrls } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				bannerImageSrc="/calypso/images/stats/tasks/contact.svg"
				completedButtonText={ translate( 'Edit' ) }
				completedTitle={ translate( 'You updated your Contact page' ) }
				description={ translate(
					'Encourage visitors to get in touch — a website is for connecting with people.'
				) }
				duration={ translate( '%d minute', '%d minutes', { count: 2, args: [ 2 ] } ) }
				onClick={ this.handleTaskStart( {
					task,
					tourId: 'checklistContactPage',
					url: taskUrls.contact_page_updated,
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				title={ translate( 'Personalize your Contact page' ) }
				showSkip={ true }
			/>
		);
	};

	renderPostPublishedTask = ( TaskComponent, baseProps, task ) => {
		const { translate, taskUrls } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				bannerImageSrc="/calypso/images/stats/tasks/first-post.svg"
				completedButtonText={ translate( 'Edit' ) }
				completedTitle={ translate( 'You published your first blog post' ) }
				description={ translate( 'Introduce yourself to the world! That’s why you’re here.' ) }
				duration={ translate( '%d minute', '%d minutes', { count: 10, args: [ 10 ] } ) }
				onClick={ this.handleTaskStart( {
					task,
					tourId: 'checklistPublishPost',
					url: taskUrls.post_published,
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				title={ translate( 'Publish your first blog post' ) }
				showSkip={ true }
			/>
		);
	};

	renderCustomDomainRegisteredTask = ( TaskComponent, baseProps, task ) => {
		const { translate, siteSlug } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				bannerImageSrc="/calypso/images/stats/tasks/custom-domain.svg"
				completedButtonText={ translate( 'Change' ) }
				completedTitle={ translate( 'You registered a custom domain' ) }
				description={ translate(
					'Memorable domain names make it easy for people to remember your address — and search engines love ’em.'
				) }
				duration={ translate( '%d minute', '%d minutes', { count: 2, args: [ 2 ] } ) }
				onClick={ this.handleTaskStart( {
					task,
					tourId: 'checklistDomainRegister',
					url: `/domains/add/${ siteSlug }`,
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				title={ translate( 'Register a custom domain' ) }
				showSkip={ true }
			/>
		);
	};

	renderMobileAppInstalledTask = ( TaskComponent, baseProps, task ) => {
		const { translate } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				bannerImageSrc="/calypso/images/stats/tasks/mobile-app.svg"
				completedButtonText={ translate( 'Download' ) }
				completedTitle={ translate( 'You downloaded the WordPress app' ) }
				description={ translate(
					'Download the WordPress app to your mobile device to manage your site and follow your stats on the go.'
				) }
				duration={ translate( '%d minute', '%d minutes', { count: 3, args: [ 3 ] } ) }
				onClick={ this.handleTaskStartThenDismiss( {
					task,
					url: '/me/get-apps',
					dismiss: true,
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				title={ translate( 'Get the WordPress app' ) }
				showSkip={ true }
			/>
		);
	};

	renderSiteLaunchedTask = ( TaskComponent, baseProps, task ) => {
		const { needsVerification, translate } = this.props;
		const disabled = ! baseProps.completed && needsVerification;

		return (
			<TaskComponent
				{ ...baseProps }
				bannerImageSrc="/calypso/images/stats/tasks/launch.svg"
				buttonText={ translate( 'Launch site' ) }
				completedTitle={ translate( 'You launched your site' ) }
				description={ translate(
					"Your site is private and only visible to you. When you're ready, launch your site to make it public."
				) }
				disableIcon={ disabled }
				isButtonDisabled={ disabled }
				noticeText={
					disabled ? translate( 'Confirm your email address before launching your site.' ) : null
				}
				onClick={ this.handleLaunchSite( task ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				title={ translate( 'Launch your site' ) }
			/>
		);
	};

	renderEmailSetupTask = ( TaskComponent, baseProps, task ) => {
		const { translate, siteSlug } = this.props;

		const clickProps = baseProps.completed
			? {}
			: {
					onClick: () => {
						this.trackTaskStart( task );
						page( emailManagement( siteSlug ) );
					},
					onDismiss: this.handleTaskDismiss( task.id ),
			  };

		return (
			<TaskComponent
				{ ...baseProps }
				bannerImageSrc="/calypso/images/stats/tasks/email.svg"
				title={ translate( 'Get email for your site' ) }
				completedTitle={ translate( 'You set up email for your site' ) }
				description={ translate(
					'Subscribe to G Suite to get a dedicated inbox with a personalized email address using your domain and collaborate in real-time on documents, spreadsheets, and slides.'
				) }
				duration={ translate( '%d minute', '%d minutes', { count: 5, args: [ 5 ] } ) }
				showSkip={ true }
				{ ...clickProps }
			/>
		);
	};

	renderEmailForwardingUpgradedToGSuiteTask = ( TaskComponent, baseProps, task ) => {
		const { translate, siteSlug } = this.props;

		baseProps.completed = true;
		return (
			<TaskComponent
				{ ...baseProps }
				bannerImageSrc="/calypso/images/stats/tasks/email.svg"
				title={ translate( 'Get email for your site' ) }
				completedTitle={ translate( 'You set up email forwarding for your site' ) }
				description={ translate(
					'Want a dedicated inbox, docs, and cloud storage? {{link}}Upgrade to G Suite!{{/link}}',
					{
						components: {
							link: (
								<a
									onClick={ () => this.trackTaskStart( task, { clicked_element: 'hyperlink' } ) }
									href={ emailManagement( siteSlug ) }
								/>
							),
						},
					}
				) }
				completedButtonText={ translate( 'Upgrade' ) }
				onClick={ () => {
					this.trackTaskStart( task, { clicked_element: 'button' } );
					page( emailManagement( siteSlug ) );
				} }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				showSkip={ true }
			/>
		);
	};

	onCloseGSuiteDialogClickHandler = () => {
		this.setState( { gSuiteDialogVisible: false } );
	};

	onOpenGSuiteDialogClickHandler = () => {
		this.setState( { gSuiteDialogVisible: true } );
	};

	renderGSuiteTOSAcceptedTask = ( TaskComponent, baseProps, task ) => {
		const { domains, translate, userEmail } = this.props;

		let domainName;
		let user;
		if ( Array.isArray( domains ) && domains.length > 0 ) {
			domainName = domains[ 0 ].name;
			user = domains[ 0 ].googleAppsSubscription.pendingUsers[ 0 ];
		}

		return (
			<Fragment key={ baseProps.key }>
				<TaskComponent
					{ ...baseProps }
					bannerImageSrc="/calypso/images/stats/tasks/email.svg"
					title={ translate( 'You set up email for your site' ) }
					description={ translate(
						"{{strong}}You're almost done!{{/strong}} We've sent an email to %s. Log in and accept Google's Terms of Service to activate your G Suite account. {{link}}Didn't receive the email?{{/link}}",
						{
							components: {
								strong: <strong />,
								link: (
									<a
										onClick={ () =>
											this.trackTaskStart( task, {
												sub_step_name: 'gsuite_tos_accepted',
												clicked_element: 'no_email_help_link',
											} )
										}
										href={ `/help/contact` }
									/>
								),
							},
							args: [ userEmail ],
						}
					) }
					isWarning={ true }
					onClick={ () => {
						if ( ! domainName ) {
							return;
						}
						this.onOpenGSuiteDialogClickHandler();
						this.trackTaskStart( task, {
							sub_step_name: 'gsuite_tos_accepted',
						} );
					} }
				/>

				<PendingGSuiteTosNoticeDialog
					domainName={ domainName }
					onClose={ this.onCloseGSuiteDialogClickHandler }
					section={ 'gsuite-timeline-task' }
					siteSlug={ this.props.siteSlug }
					user={ user }
					visible={ this.state.gSuiteDialogVisible }
				/>
			</Fragment>
		);
	};

	renderAboutTextUpdatedTask = ( TaskComponent, baseProps, task ) => {
		const { translate, taskUrls } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				preset="update-homepage"
				title={ translate( 'Edit About text' ) }
				description={ translate(
					'Update the text we’ve written for you to describe what makes your business unique. ' +
						'Make your homepage speak to your customers.'
				) }
				steps={ [
					{
						title: translate( 'Update your homepage text' ),
						description: translate(
							'Take a moment to review what we’ve written for you. ' +
								'Click the text to make any additions or changes.'
						),
					},
					{
						title: translate( 'Homepage updated!' ),
						description: translate(
							'Nice work. If all the text looks good, ' + 'let’s move on to changing your photos.'
						),
					},
				] }
				duration={ translate( '%d minute', '%d minutes', { count: 5, args: [ 5 ] } ) }
				onClick={ this.handleTaskStart( {
					task,
					url: taskUrls[ task.id ],
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				backToChecklist={ this.backToChecklist }
				nextInlineHelp={ this.nextInlineHelp }
				showSkip={ true }
			/>
		);
	};

	renderHomepagePhotoUpdatedTask = ( TaskComponent, baseProps, task ) => {
		const { translate, taskUrls } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				preset="update-homepage"
				title={ translate( 'Change homepage photo' ) }
				description={ translate(
					'Upload your own photo or choose from a wide selection of free ones to personalize your new site.'
				) }
				steps={ [
					{
						title: translate( 'Upload a photo or choose a new one from ours' ),
						description: translate(
							'Make a good first impression. ' +
								'Change your cover photo by uploading your own or choose from a selection of free ones.'
						),
					},
					{
						title: translate( 'Your photo looks great!' ),
						description: translate(
							'Go ahead and change any other photos to further personalize your site. ' +
								'When you’re ready, let’s continue.'
						),
					},
				] }
				duration={ translate( '%d minute', '%d minutes', { count: 10, args: [ 10 ] } ) }
				onClick={ this.handleTaskStart( {
					task,
					url: taskUrls[ task.id ],
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				backToChecklist={ this.backToChecklist }
				nextInlineHelp={ this.nextInlineHelp }
				showSkip={ true }
			/>
		);
	};

	renderFrontPageUpdatedTask = ( TaskComponent, baseProps, task ) => {
		const { translate, taskUrls } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				preset="update-homepage"
				title={ translate( 'Update your homepage' ) }
				completedTitle={ translate( 'You updated your homepage' ) }
				bannerImageSrc="/calypso/images/stats/tasks/personalize-your-site.svg"
				completedButtonText={ translate( 'Change' ) }
				description={ translate(
					`We've created the basics, now it's time for you to update the images and text.`
				) }
				steps={ [] }
				duration={ translate( '%d minute', '%d minutes', { count: 20, args: [ 20 ] } ) }
				onClick={ this.handleTaskStart( {
					task,
					url: taskUrls[ task.id ],
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				backToChecklist={ this.backToChecklist }
				nextInlineHelp={ this.nextInlineHelp }
				showSkip={ true }
			/>
		);
	};

	renderBusinessHoursAddedTask = ( TaskComponent, baseProps, task ) => {
		const { translate, taskUrls } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				preset="update-homepage"
				title={ translate( 'Add business hours' ) }
				description={ translate(
					'Let your customers know when you’re open or the best time to contact you.'
				) }
				steps={ [
					{
						title: translate( 'Add business hours to your homepage' ),
						description: translate(
							'Customers love to easily know when they can stop in. ' +
								'Click the business hours block to add your hours.'
						),
					},
					{
						title: translate( 'Business hours saved!' ),
						description: translate( 'Your site is really looking great now.' ),
					},
				] }
				duration={ translate( '%d minute', '%d minutes', { count: 8, args: [ 8 ] } ) }
				onClick={ this.handleTaskStart( {
					task,
					url: taskUrls[ task.id ],
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				backToChecklist={ this.backToChecklist }
				nextInlineHelp={ this.nextInlineHelp }
				showSkip={ true }
			/>
		);
	};

	renderServiceListAddedTask = ( TaskComponent, baseProps, task ) => {
		const { translate, taskUrls } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				preset="update-homepage"
				title={ translate( 'Add your services' ) }
				description={ translate( 'Let customers and clients know how you can help them.' ) }
				steps={ [
					{
						title: translate( 'Add services to your homepage' ),
						description: translate(
							'Customers are more likely to contact you if they know what you have to offer. ' +
								'Click the services block to add your list of services.'
						),
					},
					{
						title: translate( 'Services added!' ),
						description: translate( 'Ready to move on?' ),
					},
				] }
				duration={ translate( '%d minute', '%d minutes', { count: 5, args: [ 5 ] } ) }
				onClick={ this.handleTaskStart( {
					task,
					url: taskUrls[ task.id ],
				} ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				backToChecklist={ this.backToChecklist }
				nextInlineHelp={ this.nextInlineHelp }
				showSkip={ true }
			/>
		);
	};

	renderStaffInfoAddedTask = ( TaskComponent, baseProps, task ) => {
		const { translate, taskUrls, siteVerticals } = this.props;
		let title = translate( 'Add info about your staff' );

		if ( includes( siteVerticals, 'Health & Medical' ) ) {
			title = translate( 'Add info about your doctors' );
		} else if ( includes( siteVerticals, 'Educations' ) ) {
			title = translate( 'Add info about your educators' );
		} else if ( includes( siteVerticals, 'Fitness & Exercise' ) ) {
			title = translate( 'Add info about your professionals' );
		}

		return (
			<TaskComponent
				{ ...baseProps }
				preset="update-homepage"
				title={ title }
				description={ translate(
					'Customers love to learn about who they’re going to interact with if they contact you.'
				) }
				steps={ [
					{
						title: translate( 'Add staff to your homepage' ),
						description: translate(
							'Help customers trust you by telling them about your qualifications. ' +
								'Click the services block to add your list of services.'
						),
					},
					{
						title: translate( 'Services added!' ),
						description: translate( 'Ready to move on?' ),
					},
				] }
				duration={ translate( '%d minute', '%d minutes', { count: 5, args: [ 5 ] } ) }
				targetUrl={ taskUrls[ task.id ] }
				onClick={ this.handleInlineHelpStart( task ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				backToChecklist={ this.backToChecklist }
				nextInlineHelp={ this.nextInlineHelp }
				showSkip={ true }
			/>
		);
	};

	renderProductListAddedTask = ( TaskComponent, baseProps, task ) => {
		const { translate, taskUrls } = this.props;

		return (
			<TaskComponent
				{ ...baseProps }
				preset="update-homepage"
				title={ translate( 'Add products and services' ) }
				description={ translate(
					'Let visitors know what you do best and what you have to offer.'
				) }
				steps={ [
					{
						title: translate( 'Add products to your homepage' ),
						description: translate(
							'Customers are more likely to contact you if they know what you have to offer. ' +
								'Add products and services to your homepage.'
						),
					},
					{
						title: translate( 'Homepage saved!' ),
						description: translate( 'Ready to move on?' ),
					},
				] }
				duration={ translate( '%d minute', '%d minutes', { count: 10, args: [ 10 ] } ) }
				targetUrl={ taskUrls[ task.id ] }
				onClick={ this.handleInlineHelpStart( task ) }
				onDismiss={ this.handleTaskDismiss( task.id ) }
				backToChecklist={ this.backToChecklist }
				nextInlineHelp={ this.nextInlineHelp }
				showSkip={ true }
			/>
		);
	};
}

export default connect(
	state => {
		const siteId = getSelectedSiteId( state );
		const siteSlug = getSiteSlug( state, siteId );
		const siteChecklist = getSiteChecklist( state, siteId );
		const user = getCurrentUser( state );
		const taskUrls = getChecklistTaskUrls( state, siteId );
		const taskList = getSiteTaskList( state, siteId );

		return {
			designType: getSiteOption( state, siteId, 'design_type' ),
			phase2: get( siteChecklist, 'phase2' ),
			siteId,
			siteSlug,
			siteVerticals: get( siteChecklist, 'verticals' ),
			taskStatuses: get( siteChecklist, 'tasks' ),
			taskUrls,
			taskList,
			userEmail: ( user && user.email ) || '',
			needsVerification: ! isCurrentUserEmailVerified( state ),
			isSiteUnlaunched: isUnlaunchedSite( state, siteId ),
			domains: getDomainsBySiteId( state, siteId ),
			isPaidPlan: isCurrentPlanPaid( state, siteId ),
		};
	},
	{
		successNotice,
		recordTracksEvent,
		requestGuidedTour,
		requestSiteChecklistTaskUpdate,
		launchSite,
		showInlineHelpPopover,
		showChecklistPrompt,
		setChecklistPromptTaskId,
		setChecklistPromptStep,
	}
)( localize( WpcomChecklistComponent ) );
