/**
 * Internal dependencies
 */
import joinClasses from '../../src/lib/join-classes';

describe( 'joinClasses', function() {
	it( 'Empty array', function() {
		expect( joinClasses( [] ) ).toBe( '' );
	} );

	it( 'Singleton array', function() {
		expect( joinClasses( [ 'foo' ] ) ).toBe( 'foo' );
	} );

	it( 'Doubleton array', function() {
		expect( joinClasses( [ 'foo', 'bar' ] ) ).toBe( 'foo bar' );
	} );

	it( 'Number argument', function() {
		expect( joinClasses( [ 27 ] ) ).toBe( '27' );
	} );

	// Should probably do some validation in joinClasses().
	it( 'String argument', function() {
		expect( () => joinClasses( 'foo' ) ).toThrow( 'classNames.filter is not a function' );
	} );
} );
