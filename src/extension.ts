import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const columnColors = [
		'rgba(255, 102, 102, 0.3)', // Record Type
		'rgba(255, 178, 102, 0.3)', // Blank
		'rgba(255, 255, 102, 0.3)', // Reel Sequence Number
		'rgba(178, 255, 102, 0.3)', // Financial Institution Name
		'rgba(102, 255, 102, 0.3)', // Blank
		'rgba(102, 255, 178, 0.3)', // User Name
		'rgba(102, 255, 255, 0.3)', // User ID Number
		'rgba(102, 178, 255, 0.3)', // Description
		'rgba(102, 102, 255, 0.3)', // Processing Date
		'rgba(178, 102, 255, 0.3)', // Blank
		'rgba(255, 102, 255, 0.3)', // Title of Account
		'rgba(255, 102, 178, 0.3)', // Lodgement Reference
		'rgba(153, 102, 255, 0.3)', // Trace BSB
		'rgba(153, 204, 255, 0.3)', // Trace Account Number
		'rgba(204, 153, 255, 0.3)', // Name of Remitter
		'rgba(255, 153, 204, 0.3)'  // Withholding Tax
	];

	const hoverMessages = {
		"header": [
			'Record Type Indicator (Header)',
			'Blank',
			'Reel Sequence Number',
			'Name of User\'s Financial Institution',
			'Blank',
			'Name of User supplying file',
			'User Identification Number',
			'Description of entries on file',
			'Date to be processed',
			'Blank'
		],
		"detail": [
			'Record Type Indicator (Detail)',
			'Bank/State/Branch Number',
			'Account number to be credited/debited',
			'Indicator',
			'Transaction Code',
			'Amount',
			'Title of Account to be credited/debited',
			'Lodgement Reference',
			'Trace BSB',
			'Trace Account Number',
			'Name of Remitter',
			'Amount of Withholding Tax'
		],
		"footer": [
			'Record Type Indicator (Footer)',
			'BSB Format Filler',
			'Blank',
			'File (User) Net Total Amount',
			'File (User) Credit Total Amount',
			'File (User) Debit Total Amount',
			'Blank',
			'File (User) Count of Records Type 1',
			'Blank'
		],
		"return": [
			'Record Type Indicator (Return)',
			'Bank/State/Branch Number',
			'Account number to be credited/debited',
			'Indicator',
			'Transaction Code',
			'Amount',
			'Title of Account to be credited/debited',
			'Lodgement Reference',
			'Trace BSB',
			'Trace Account Number',
			'Name of Remitter',
			'Amount of Withholding Tax'
		],
		"refusal": [
			'Record Type Indicator (Refusal)',
			'Bank/State/Branch Number',
			'Account number to be credited/debited',
			'Indicator',
			'Transaction Code',
			'Amount',
			'Title of Account to be credited/debited',
			'Lodgement Reference',
			'Trace BSB',
			'Trace Account Number',
			'Name of Remitter',
			'Amount of Withholding Tax'
		]
	};

	// Define column widths for each row type
	const headerColumns = [1, 17, 2, 3, 7, 26, 6, 12, 6, 40];
	const detailColumns = [1, 7, 9, 1, 2, 10, 32, 18, 7, 9, 16, 8];
	const footerColumns = [1, 7, 12, 10, 10, 10, 24, 6, 40];
	const returnColumns = [1, 7, 9, 1, 2, 10, 32, 18, 7, 9, 16, 8];
	const refusalColumns = [1, 7, 9, 1, 2, 10, 32, 18, 7, 9, 16, 8];

	const headerDecorations = createColumnDecorations(headerColumns, columnColors);
	const detailDecorations = createColumnDecorations(detailColumns, columnColors);
	const footerDecorations = createColumnDecorations(footerColumns, columnColors);
	const returnDecorations = createColumnDecorations(returnColumns, columnColors);
	const refusalDecorations = createColumnDecorations(refusalColumns, columnColors);

	vscode.languages.registerHoverProvider('aba', {
		provideHover(document, position, token) {
			const line = document.lineAt(position.line).text;
			let hoverMessage = '';
			let columnRanges: vscode.Range[] = [];

			if (line.startsWith('0')) {
				columnRanges = getColumnRanges(position.line, headerColumns);
				hoverMessage = getHoverMessage(position.character, columnRanges, hoverMessages.header);
			} else if (line.startsWith('1')) {
				columnRanges = getColumnRanges(position.line, detailColumns);
				hoverMessage = getHoverMessage(position.character, columnRanges, hoverMessages.detail);
			} else if (line.startsWith('7')) {
				columnRanges = getColumnRanges(position.line, footerColumns);
				hoverMessage = getHoverMessage(position.character, columnRanges, hoverMessages.footer);
			} else if (line.startsWith('3')) {
				columnRanges = getColumnRanges(position.line, returnColumns);
				hoverMessage = getHoverMessage(position.character, columnRanges, hoverMessages.return);
			} else if (line.startsWith('5')) {
				columnRanges = getColumnRanges(position.line, refusalColumns);
				hoverMessage = getHoverMessage(position.character, columnRanges, hoverMessages.refusal);
			}

			for (const range of columnRanges) {
				if (range.contains(position)) {
					return new vscode.Hover(hoverMessage, range);
				}
			}

			return null;
		}
	});

	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor && editor.document.languageId === 'aba') {
			decorateDocument(editor, headerDecorations, detailDecorations, footerDecorations, returnDecorations, refusalDecorations, headerColumns, detailColumns, footerColumns, returnColumns, refusalColumns);
		}
	});

	vscode.workspace.onDidOpenTextDocument(document => {
		const editor = vscode.window.activeTextEditor;
		if (editor && document === editor.document && document.languageId === 'aba') {
			decorateDocument(editor, headerDecorations, detailDecorations, footerDecorations, returnDecorations, refusalDecorations, headerColumns, detailColumns, footerColumns, returnColumns, refusalColumns);
		}
	});

	// Handle the case when a file is already open when the extension is activated
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor && activeEditor.document.languageId === 'aba') {
		decorateDocument(activeEditor, headerDecorations, detailDecorations, footerDecorations, returnDecorations, refusalDecorations, headerColumns, detailColumns, footerColumns, returnColumns, refusalColumns);
	}

	vscode.workspace.onDidChangeTextDocument(event => {
		const editor = vscode.window.activeTextEditor;
		if (editor && event.document === editor.document && editor.document.languageId === 'aba') {
			decorateDocument(editor, headerDecorations, detailDecorations, footerDecorations, returnDecorations, refusalDecorations, headerColumns, detailColumns, footerColumns, returnColumns, refusalColumns);
		}
	});
}

function createColumnDecorations(columns: number[], colors: string[]): vscode.TextEditorDecorationType[] {
	return columns.map((_, index) => vscode.window.createTextEditorDecorationType({
		backgroundColor: colors[index % colors.length]
	}));
}

function getHoverMessage(character: number, ranges: vscode.Range[], messages: string[]): string {
	for (let i = 0; i < ranges.length; i++) {
		const range = ranges[i];
		if (character >= range.start.character && character < range.end.character) {
			return `${messages[i]} (Range: ${range.start.character}-${range.end.character})`;
		}
	}
	return 'Unknown Column';
}

function getColumnRanges(line: number, columns: number[]): vscode.Range[] {
	const ranges: vscode.Range[] = [];
	let start = 0;
	for (let i = 0; i < columns.length; i++) {
		const end = start + columns[i];
		ranges.push(new vscode.Range(new vscode.Position(line, start), new vscode.Position(line, end)));
		start = end;
	}
	return ranges;
}

function decorateDocument(editor: vscode.TextEditor, headerDecorations: vscode.TextEditorDecorationType[], detailDecorations: vscode.TextEditorDecorationType[], footerDecorations: vscode.TextEditorDecorationType[], returnDecorations: vscode.TextEditorDecorationType[], refusalDecorations: vscode.TextEditorDecorationType[], headerColumns: number[], detailColumns: number[], footerColumns: number[], returnColumns: number[], refusalColumns: number[]) {
	const headerRanges = headerColumns.map(() => [] as vscode.Range[]);
	const detailRanges = detailColumns.map(() => [] as vscode.Range[]);
	const footerRanges = footerColumns.map(() => [] as vscode.Range[]);
	const returnRanges = returnColumns.map(() => [] as vscode.Range[]);
	const refusalRanges = refusalColumns.map(() => [] as vscode.Range[]);

	for (let line = 0; line < editor.document.lineCount; line++) {
		const text = editor.document.lineAt(line).text;

		if (text.startsWith('0')) {
			addRangesForColumns(text, line, headerColumns, headerRanges);
		} else if (text.startsWith('1')) {
			addRangesForColumns(text, line, detailColumns, detailRanges);
		} else if (text.startsWith('7')) {
			addRangesForColumns(text, line, footerColumns, footerRanges);
		} else if (text.startsWith('3')) {
			addRangesForColumns(text, line, returnColumns, returnRanges);
		} else if (text.startsWith('5')) {
			addRangesForColumns(text, line, refusalColumns, refusalRanges);
		}
	}

	applyDecorations(editor, headerDecorations, headerRanges);
	applyDecorations(editor, detailDecorations, detailRanges);
	applyDecorations(editor, footerDecorations, footerRanges);
	applyDecorations(editor, returnDecorations, returnRanges);
	applyDecorations(editor, refusalDecorations, refusalRanges);
}

function addRangesForColumns(text: string, line: number, columns: number[], ranges: vscode.Range[][]) {
	let start = 0;
	for (let i = 0; i < columns.length; i++) {
		const end = start + columns[i];
		const range = new vscode.Range(new vscode.Position(line, start), new vscode.Position(line, end));
		ranges[i].push(range);
		start = end;
	}
}

function applyDecorations(editor: vscode.TextEditor, decorations: vscode.TextEditorDecorationType[], ranges: vscode.Range[][]) {
	for (let i = 0; i < decorations.length; i++) {
		editor.setDecorations(decorations[i], ranges[i]);
	}
}

export function deactivate() { }
