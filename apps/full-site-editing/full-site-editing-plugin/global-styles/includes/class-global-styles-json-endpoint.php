<?php
/**
 * JSON REST API endpoint for Global Styles plugin.
 */

namespace A8C\FSE\Global_Styles;

/**
 * REST API endpoint for Global Styles plugin.
 */
class JSON_Endpoint extends \WP_REST_Controller {

	/**
	 * Namespace for the REST endpoint.
	 *
	 * @var string
	 */
	private $rest_namespace;

	/**
	 * Route name for the REST endpoint.
	 *
	 * @var string
	 */
	private $rest_route;

	/**
	 * Object holding the data description to work with.
	 *
	 * @var A8C\FSE\Global_Styles\Data_Set
	 */
	private $data_set;

	/**
	 * Constructor
	 *
	 * @param string $rest_namespace Namespace for the REST endpoint.
	 * @param string $rest_route Route name.
	 * @param array  $data_set Description of the data to work with.
	 */
	public function __construct( $rest_namespace, $rest_route, $data_set ) {
		$this->rest_namespace = $rest_namespace;
		$this->rest_route     = $rest_route;
		$this->data_set       = $data_set;
	}

	/**
	 * Callback to determine whether the request can proceed.
	 *
	 * @return boolean
	 */
	public function permission_callback() {
		return is_user_logged_in() && apply_filters( 'global_styles_permission_check_additional', true );
	}

	/**
	 * Initialize the routes. To be called on `rest_api_init'
	 *
	 * @return void
	 */
	public function setup() {
		register_rest_route(
			$this->rest_namespace,
			$this->rest_route,
			[
				[
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_data' ],
					'permission_callback' => [ $this, 'permission_callback' ],
				],
			]
		);
		register_rest_route(
			$this->rest_namespace,
			$this->rest_route,
			[
				[
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'update_data' ],
					'permission_callback' => [ $this, 'permission_callback' ],
				],
			]
		);
	}

	/**
	 * Process the incoming request to get data.
	 *
	 * @return Array
	 */
	public function get_data() {
		return $this->data_set->get_data();
	}

	/**
	 * Process the incoming request to update data.
	 *
	 * @param \WP_REST_Request $request Incoming request.
	 * @return Boolean False if data hasn't changed or update failed, true otherwise.
	 */
	public function update_data( \WP_REST_Request $request ) {
		$incoming_data = $request->get_json_params();
		return $this->data_set->save_data( $incoming_data );
	}
}
