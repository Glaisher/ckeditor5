/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* global atob, URL */

/**
 * @module ckbox/utils
 */

import type { InitializedToken } from '@ckeditor/ckeditor5-cloud-services';
import type { CKBoxImageUrls } from './ckboxconfig';

const IMAGE_BREAKPOINT_MAX_WIDTH = 4000;
const IMAGE_BREAKPOINT_PIXELS_THRESHOLD = 80;
const IMAGE_BREAKPOINT_PERCENTAGE_THRESHOLD = 10;

export function getImageUrls2( imageUrls: CKBoxImageUrls ): {
	imageFallbackUrl: string;
	imageSources: Array<{
		srcset: string;
		sizes: string;
		type: string;
	}>;
} {
	const responsiveUrls: Array<string> = [];
	let maxWidth = 0;

	for ( const key in imageUrls ) {
		const width = parseInt( key, 10 );

		if ( !isNaN( width ) ) {
			if ( width > maxWidth ) {
				maxWidth = width;
			}

			responsiveUrls.push( `${ imageUrls[ key ] } ${ key }w` );
		}
	}

	const imageSources = [ {
		srcset: responsiveUrls.join( ',' ),
		sizes: `(max-width: ${ maxWidth }px) 100vw, ${ maxWidth }px`,
		type: 'image/webp'
	} ];

	return {
		imageFallbackUrl: imageUrls.default,
		imageSources
	};
}

/**
 * Creates URLs for the image:
 * - responsive URLs for the "webp" image format,
 * - one fallback URL for browsers that do not support the "webp" format.
 */
export function getImageUrls(
	{ token, id, origin, width, extension }: {
		token: InitializedToken;
		id: string;
		origin: string;
		width: number;
		extension: string;
	}
): {
	imageFallbackUrl: string;
	imageSources: Array<{
		srcset: string;
		sizes: string;
		type: string;
	}>;
} {
	const workspaceId = getWorkspaceIds( token )[ 0 ];
	const imageBreakpoints = getImageBreakpoints( width );
	const imageFallbackExtension = getImageFallbackExtension( extension );
	const imageFallbackUrl = getResponsiveImageUrl( { workspaceId, id, origin, width, extension: imageFallbackExtension } );
	const imageResponsiveUrls = imageBreakpoints.map( imageBreakpoint => {
		const responsiveImageUrl = getResponsiveImageUrl( { workspaceId, id, origin, width: imageBreakpoint, extension: 'webp' } );

		return `${ responsiveImageUrl } ${ imageBreakpoint }w`;
	} );

	// Create just one image source definition containing all calculated URLs for each image breakpoint. Additionally, limit this source
	// image width by defining two allowed slot sizes:
	// - If the viewport width is not greater than the image width, make the image occupy the whole slot.
	// - Otherwise, limit the slot width to be equal to the image width, to avoid enlarging the image beyond its width.
	//
	// This is a kind of a workaround. In a perfect world we could use `sizes="100vw" width="real image width"` on our single `<source>`
	// element, but at the time of writing this code the `width` attribute is not supported in the `<source>` element in Firefox yet.
	const imageSources = [ {
		srcset: imageResponsiveUrls.join( ',' ),
		sizes: `(max-width: ${ width }px) 100vw, ${ width }px`,
		type: 'image/webp'
	} ];

	return {
		imageFallbackUrl,
		imageSources
	};
}

/**
 * Returns workspace ids from a token used for communication with the CKBox service.
 */
export function getWorkspaceIds( token: InitializedToken ): Array<string> {
	const [ , binaryTokenPayload ] = token.value.split( '.' );
	const payload = JSON.parse( atob( binaryTokenPayload ) );
	const workspaces = payload.auth && payload.auth.ckbox && payload.auth.ckbox.workspaces;

	return workspaces && workspaces.length ? workspaces : [ payload.aud ];
}

/**
 * Calculates the image breakpoints for the provided image width in the following way:
 *
 * 1) The breakpoint threshold (the breakpoint step in the calculations) should be equal to 10% of the image width, but not less than 80
 * pixels.
 *
 * 2) Set the max. allowed image breakpoint (4000px) or the image width (if it is smaller than 4000px) as the first calculated breakpoint.
 *
 * 3) From the last computed image breakpoint subtract the computed breakpoint threshold, as long as the calculated new breakpoint value is
 * greater than the threshold.
 */
function getImageBreakpoints( width: number ) {
	// Step 1) - calculating the breakpoint threshold.
	const imageBreakpointThresholds = [
		width * IMAGE_BREAKPOINT_PERCENTAGE_THRESHOLD / 100,
		IMAGE_BREAKPOINT_PIXELS_THRESHOLD
	];
	const imageBreakpointThreshold = Math.floor( Math.max( ...imageBreakpointThresholds ) );

	// Step 2) - set the first breakpoint.
	const imageBreakpoints = [ Math.min( width, IMAGE_BREAKPOINT_MAX_WIDTH ) ];

	// Step 3) - calculate the next breakpoint as long as it is greater than the breakpoint threshold.
	let lastBreakpoint = imageBreakpoints[ 0 ];

	while ( lastBreakpoint - imageBreakpointThreshold >= imageBreakpointThreshold ) {
		lastBreakpoint -= imageBreakpointThreshold;
		imageBreakpoints.unshift( lastBreakpoint );
	}

	return imageBreakpoints;
}

/**
 * Returns the image extension for the fallback URL.
 */
function getImageFallbackExtension( extension: string ) {
	if ( extension === 'bmp' || extension === 'tiff' || extension === 'jpg' ) {
		return 'jpeg';
	}

	return extension;
}

/**
 * Creates the URL for the given image.
 */
function getResponsiveImageUrl(
	{ workspaceId, id, origin, width, extension }: {
		workspaceId: string;
		id: string;
		origin: string;
		width: number;
		extension: string;
	}
) {
	const endpoint = `${ workspaceId }/assets/${ id }/images/${ width }.${ extension }`;

	return new URL( endpoint, origin ).toString();
}
