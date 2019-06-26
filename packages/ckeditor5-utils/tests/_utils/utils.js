/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* global console:false */

import EmitterMixin from '../../src/emittermixin';
import CKEditorError from '../../src/ckeditorerror';
import areConnectedThroughProperties from '../../src/areconnectedthroughproperties';

/**
 * Creates an instance inheriting from {@link utils.EmitterMixin} with one additional method `observe()`.
 * It allows observing changes to attributes in objects being {@link utils.Observable observable}.
 *
 * The `observe()` method accepts:
 *
 * * `{String} observableName` – Identifier for the observable object. E.g. `"Editable"` when
 * you observe one of editor's editables. This name will be displayed on the console.
 * * `{utils.Observable observable} – The object to observe.
 * * `{Array.<String>} filterNames` – Array of propery names to be observed.
 *
 * Typical usage:
 *
 *		const observer = utils.createObserver();
 *		observer.observe( 'Editable', editor.editables.current );
 *
 *		// Stop listening (method from the EmitterMixin):
 *		observer.stopListening();
 *
 * @returns {Emitter} The observer.
 */
export function createObserver() {
	const observer = Object.create( EmitterMixin, {
		observe: {
			value: function observe( observableName, observable, filterNames ) {
				observer.listenTo( observable, 'change', ( evt, propertyName, value, oldValue ) => {
					if ( !filterNames || filterNames.includes( propertyName ) ) {
						console.log( `[Change in ${ observableName }] ${ propertyName } = '${ value }' (was '${ oldValue }')` );
					}
				} );

				return observer;
			}
		}
	} );

	return observer;
}

/**
 * Checks whether observable properties are properly bound to each other.
 *
 * Syntax given that observable `A` is bound to observables [`B`, `C`, ...]:
 *
 *		assertBinding( A,
 *			{ initial `A` attributes },
 *			[
 *				[ B, { new `B` attributes } ],
 *				[ C, { new `C` attributes } ],
 *				...
 *			],
 *			{ `A` attributes after [`B`, 'C', ...] changed }
 *		);
 */
export function assertBinding( observable, stateBefore, data, stateAfter ) {
	let key, boundObservable, attrs;

	for ( key in stateBefore ) {
		expect( observable[ key ] ).to.be.equal( stateBefore[ key ] );
	}

	// Change attributes of bound observables.
	for ( [ boundObservable, attrs ] of data ) {
		for ( key in attrs ) {
			if ( !boundObservable.hasOwnProperty( key ) ) {
				boundObservable.set( key, attrs[ key ] );
			} else {
				boundObservable[ key ] = attrs[ key ];
			}
		}
	}

	for ( key in stateAfter ) {
		expect( observable[ key ] ).to.be.equal( stateAfter[ key ] );
	}
}

export function expectToThrowCKEditorError( fn, message, editorThatShouldBeFindableFromContext ) {
	let err = null;

	try {
		fn();
	} catch ( _err ) {
		err = _err;

		assertCKEditorError( err, message, editorThatShouldBeFindableFromContext );
	}

	expect( err ).to.not.equal( null, 'Function did not throw any error' );
}

export function assertCKEditorError( err, message, editorThatShouldBeFindableFromContext ) {
	expect( err ).to.be.instanceOf( CKEditorError );
	expect( err.message ).to.match( message, 'Error message does not match the provided one.' );

	if ( editorThatShouldBeFindableFromContext === null ) {
		expect( err.context ).to.equal( null, 'Error context was expected to be `null`' );
	} else {
		expect(
			areConnectedThroughProperties( editorThatShouldBeFindableFromContext, err.context ),
			'Editor cannot be find from the error context'
		);
	}
}
