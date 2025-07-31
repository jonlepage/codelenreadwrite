const vscode = require("vscode");

class PropertyReadWriteCodeLensProvider {
	constructor() {
		this.onDidChangeEmitter = new vscode.EventEmitter();
	}
	get onDidChangeCodeLenses() {
		return this.onDidChangeEmitter.event;
	}
	refresh() {
		this.onDidChangeEmitter.fire();
	}

	// Optimisation pour de meilleures performances et éviter les bugs
	async provideCodeLenses(doc, token) {
		const lenses = [];
		const text = doc.getText();

		// Vérifie si l'opération a été annulée
		if (token.isCancellationRequested) {
			return lenses;
		}

		// Regex pour détecter les classes et leurs champs d'instance
		// Gère tous les patterns: class Foo {}, class Foo extends Bar {}, class Foo implements Bar {}, avec génériques, décorateurs, etc.
		const classRegex = /class\s+\w+[^{]*\{([\s\S]*?)\}/g;
		let classMatch;
		while ((classMatch = classRegex.exec(text)) !== null) {
			// Vérifie l'annulation entre chaque classe
			if (token.isCancellationRequested) {
				return lenses;
			}

			const classBody = classMatch[1];
			const classStartOffset =
				classMatch.index + classMatch[0].indexOf("{") + 1;

			// Regex pour détecter les champs d'instance dans le corps de la classe
			// Gère JS: a = 5; et TS: a:number = 5; a?:number = 5; abstract a:number; etc.
			const fieldRegex =
				/(?:(?:public|private|protected|readonly|static|abstract)\s+)*(\w+)(?:\?\s*)?(?:\s*:\s*[^=;]+)?(?:\s*=\s*[^;]+)?;/g;
			let fieldMatch;
			while ((fieldMatch = fieldRegex.exec(classBody)) !== null) {
				// Vérifie l'annulation entre chaque champ
				if (token.isCancellationRequested) {
					return lenses;
				}

				const propName = fieldMatch[1];
				// Calcule la position exacte du nom de la propriété dans le match
				const propNameIndex = fieldMatch[0].indexOf(propName);
				const fieldOffset = classStartOffset + fieldMatch.index + propNameIndex;
				const start = doc.positionAt(fieldOffset);
				const end = start.translate(0, propName.length);

				try {
					// Utilise executeReferenceProvider pour trouver toutes les références à la propriété
					const refs = await vscode.commands.executeCommand(
						"vscode.executeReferenceProvider",
						doc.uri,
						start
					);

					// Vérifie l'annulation après l'appel async
					if (token.isCancellationRequested) {
						return lenses;
					}

					let reads = 0,
						writes = 0;
					const readRefs = [];
					const writeRefs = [];

					if (refs && Array.isArray(refs)) {
						for (const ref of refs) {
							// Ignore la déclaration elle-même
							if (
								ref.range.start.line === start.line &&
								ref.range.start.character === start.character
							) {
								continue;
							}

							// Analyse le contexte pour déterminer si c'est une lecture ou écriture
							const refLine = doc.lineAt(ref.range.start.line).text;
							const refPosition = ref.range.start.character;

							// Vérifie que la position est valide
							if (refPosition < 0 || refPosition >= refLine.length) {
								continue;
							}

							// Vérifie si c'est une écriture (affectation)
							const afterProp = refLine
								.substring(refPosition + propName.length)
								.trim();
							const beforeProp = refLine.substring(0, refPosition).trim();

							// Patterns d'écriture: prop = value, prop++, prop--, ++prop, --prop, prop += value, etc.
							if (
								afterProp.match(/^(\s*=(?!=)|(\+\+|--|\+=|-=|\*=|\/=|%=))/) ||
								beforeProp.match(/(\+\+|--)\s*$/) ||
								refLine.includes(`${propName} =`)
							) {
								writes++;
								writeRefs.push(ref);
							} else {
								reads++;
								readRefs.push(ref);
							}
						}
					}

					// Ajoute des CodeLens séparés pour les lectures et écritures clickables
					if (reads > 0) {
						lenses.push(
							new vscode.CodeLens(new vscode.Range(start, end), {
								title: `📖 ${reads} reads`,
								command: "propertyReadWriteCodelens.showReads",
								arguments: [doc.uri, start, "reads", readRefs],
							})
						);
					}

					if (writes > 0) {
						lenses.push(
							new vscode.CodeLens(new vscode.Range(start, end), {
								title: `✏️ ${writes} writes`,
								command: "propertyReadWriteCodelens.showWrites",
								arguments: [doc.uri, start, "writes", writeRefs],
							})
						);
					}
				} catch (error) {
					// Log l'erreur mais continue le traitement
					console.error("Erreur lors du traitement des références:", error);
					continue;
				}
			}
		}

		return lenses;
	}
}

function activate(context) {
	const provider = new PropertyReadWriteCodeLensProvider();
	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider(
			[
				{ language: "javascript", scheme: "file" },
				{ language: "typescript", scheme: "file" },
			],
			provider
		),
		vscode.commands.registerCommand("propertyReadWriteCodelens.refresh", () =>
			provider.refresh()
		),

		// Commande pour afficher uniquement les lectures
		vscode.commands.registerCommand(
			"propertyReadWriteCodelens.showReads",
			async (uri, position, type, references) => {
				try {
					if (
						references &&
						Array.isArray(references) &&
						references.length > 0
					) {
						await vscode.commands.executeCommand(
							"editor.action.peekLocations",
							uri,
							position,
							references,
							"peek"
						);
					}
				} catch (error) {
					console.error("Erreur lors de l'affichage des lectures:", error);
					vscode.window.showErrorMessage(
						"Impossible d'afficher les références de lecture"
					);
				}
			}
		),

		// Commande pour afficher uniquement les écritures
		vscode.commands.registerCommand(
			"propertyReadWriteCodelens.showWrites",
			async (uri, position, type, references) => {
				try {
					if (
						references &&
						Array.isArray(references) &&
						references.length > 0
					) {
						await vscode.commands.executeCommand(
							"editor.action.peekLocations",
							uri,
							position,
							references,
							"peek"
						);
					}
				} catch (error) {
					console.error("Erreur lors de l'affichage des écritures:", error);
					vscode.window.showErrorMessage(
						"Impossible d'afficher les références d'écriture"
					);
				}
			}
		)
	);
}

module.exports = { activate };
