/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals console, window, document, CKEditorInspector */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor.js';
import SourceEditing from '@ckeditor/ckeditor5-source-editing/src/sourceediting.js';
import ArticlePluginSet from '@ckeditor/ckeditor5-core/tests/_utils/articlepluginset.js';
import { ImageResize } from '@ckeditor/ckeditor5-image';

window.editors = {};

function createEditor( selector, poweredByConfig ) {
	const config = {
		plugins: [ ArticlePluginSet, ImageResize, SourceEditing ],
		toolbar: [
			'sourceEditing',
			'|',
			'heading',
			'|',
			'bold',
			'italic',
			'link',
			'bulletedList',
			'numberedList',
			'|',
			'outdent',
			'indent',
			'|',
			'blockQuote',
			'insertTable',
			'mediaEmbed',
			'undo',
			'redo'
		],
		image: {
			toolbar: [ 'imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'imageTextAlternative' ]
		},
		table: {
			contentToolbar: [
				'tableColumn',
				'tableRow',
				'mergeTableCells'
			]
		},
		ui: {
			poweredBy: {
				position: 'border',
				verticalOffset: 14,
				horizontalOffset: 0
			}
		}
	};

	if ( poweredByConfig ) {
		config.ui = { poweredBy: poweredByConfig };
	}

	ClassicEditor
		.create( document.querySelector( selector ), config )
		.then( editor => {
			window.editors[ selector ] = editor;

			CKEditorInspector.attach( { [ selector ]: editor } );
		} )
		.catch( err => {
			console.error( err.stack );
		} );
}

createEditor( '#normal-css-customized' );
