<?php
/**
 * Plugin Name: Privacy Password Generator Shortcode
 * Description: Adds a dark-mode password generator with shortcode support.
 * Version: 1.0.1
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (! defined('ABSPATH')) {
	exit;
}

final class Privacy_Password_Generator_Shortcode {
	private const SHORTCODE = 'privacy_password_generator';
	private const VERSION   = '1.0.1';

	public function __construct() {
		add_action('wp_enqueue_scripts', array($this, 'register_assets'));
		add_shortcode(self::SHORTCODE, array($this, 'render_shortcode'));
	}

	public function register_assets(): void {
		wp_register_style(
			'ppg-shortcode',
			plugins_url('assets/css/ppg-shortcode.css', __FILE__),
			array(),
			self::VERSION
		);

		wp_register_script(
			'ppg-shortcode',
			plugins_url('assets/js/ppg-shortcode.js', __FILE__),
			array(),
			self::VERSION,
			true
		);
	}

	public function render_shortcode(array $atts = array()): string {
		wp_enqueue_style('ppg-shortcode');
		wp_enqueue_script('ppg-shortcode');

		$atts = shortcode_atts(
			array(
				'min'    => 4,
				'max'    => 128,
				'length' => 12,
			),
			$atts,
			self::SHORTCODE
		);

		$min    = max(4, min(128, (int) $atts['min']));
		$max    = max($min, min(128, (int) $atts['max']));
		$length = max($min, min($max, (int) $atts['length']));
		$range_id = wp_unique_id('ppg-length-');

		ob_start();
		?>
		<div class="ppg-wrap" data-ppg data-min="<?php echo esc_attr((string) $min); ?>" data-max="<?php echo esc_attr((string) $max); ?>">
			<div class="ppg-control-block">
				<label class="ppg-label" for="<?php echo esc_attr($range_id); ?>">
					Length: <span class="ppg-length-value" data-ppg-length><?php echo esc_html((string) $length); ?></span>
				</label>
				<input
					class="ppg-range"
					id="<?php echo esc_attr($range_id); ?>"
					type="range"
					min="<?php echo esc_attr((string) $min); ?>"
					max="<?php echo esc_attr((string) $max); ?>"
					value="<?php echo esc_attr((string) $length); ?>"
					step="1"
					data-ppg-range
				/>
			</div>

			<div class="ppg-control-block ppg-checkboxes">
				<label><input type="checkbox" data-ppg-type="upper" checked /> Uppercase</label>
				<label><input type="checkbox" data-ppg-type="lower" checked /> Lowercase</label>
				<label><input type="checkbox" data-ppg-type="number" checked /> Numbers</label>
				<label><input type="checkbox" data-ppg-type="symbol" checked /> Symbols</label>
			</div>

			<div class="ppg-actions">
				<button class="ppg-generate-btn" type="button" data-ppg-generate>Refresh Password</button>
				<button class="ppg-copy-btn" type="button" data-ppg-copy>Copy Password</button>
			</div>

			<div class="ppg-output" data-ppg-output aria-live="polite"></div>
			<div class="ppg-message" data-ppg-message aria-live="polite"></div>

			<div class="ppg-legend" aria-label="Password character color legend">
				<div class="ppg-legend-title">Color guide</div>
				<div class="ppg-legend-items">
					<span class="ppg-legend-item"><span class="ppg-dot ppg-dot--upper"></span> Blue = Uppercase</span>
					<span class="ppg-legend-item"><span class="ppg-dot ppg-dot--lower"></span> Green = Lowercase</span>
					<span class="ppg-legend-item"><span class="ppg-dot ppg-dot--number"></span> Red = Numbers</span>
					<span class="ppg-legend-item"><span class="ppg-dot ppg-dot--symbol"></span> Yellow = Symbols</span>
				</div>
			</div>
		</div>
		<?php
		return (string) ob_get_clean();
	}
}

new Privacy_Password_Generator_Shortcode();
