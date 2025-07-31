const vscode = require("vscode");
// OutputChannel pour le debug
const outputChannel = vscode.window.createOutputChannel("Property Read Write CodeLens");

class PropertyReadWriteCodeLensProvider {
	constructor() {
		this.onDidChangeEmitter = new vscode.EventEmitter();
		// Cache pour les documents ouverts lors d'une session CodeLens
		this.documentCache = new Map();
	}
	get onDidChangeCodeLenses() {
		return this.onDidChangeEmitter.event;
	}
	refresh() {
		this.onDidChangeEmitter.fire();
	}

	// Utilise l'API Document Symbols de VS Code pour une analyse précise
async provideCodeLenses(doc, token) {
		const lenses = [];
		this.documentCache.clear();
		this.documentCache.set(doc.uri.toString(), doc);

		if (token.isCancellationRequested) {
			return lenses;
		}

		try {
			const symbols = await vscode.commands.executeCommand(
				'vscode.executeDocumentSymbolProvider',
				doc.uri
			);
			if (symbols && Array.isArray(symbols)) {
				for (const symbol of symbols) {
					if (token.isCancellationRequested) {
						return lenses;
					}
					if (symbol.kind === vscode.SymbolKind.Class) {
						await this.processClassSymbol(symbol, doc, lenses, token);
					} else if (symbol.kind === vscode.SymbolKind.Variable || 
							   symbol.kind === vscode.SymbolKind.Constant) {
						await this.processVariableSymbol(symbol, doc, lenses, token);
					}
				}
			}
		} catch (error) {
			outputChannel.appendLine('[CodeLens] Erreur lors de l\'analyse des symboles: ' + error?.message);
			outputChannel.appendLine(error?.stack || String(error));
		}
		return lenses;
	}

	// Traite les variables/constantes qui peuvent contenir des objets avec propriétés
	async processVariableSymbol(variableSymbol, doc, lenses, token) {
		
		
	   if (variableSymbol.children && Array.isArray(variableSymbol.children)) {
		   
		   for (const child of variableSymbol.children) {
			   
			   // Vérifie l'annulation
			   if (token.isCancellationRequested) {
				   return;
			   }
			   // Si c'est une propriété directe
			   if (child.kind === vscode.SymbolKind.Property || child.kind === vscode.SymbolKind.Field) {
				   
				   await this.processPropertySymbol(child, doc, lenses, token);
			   }
			   // Si c'est une classe (ex: classe anonyme instanciée)
			   else if (child.kind === vscode.SymbolKind.Class) {
				   
				   // Appel récursif pour traiter toutes les propriétés internes de la classe
				   await this.processClassSymbol(child, doc, lenses, token);
			   }
		   }
	   } else {
		   
	   }
	}

	// Traite les symboles de classe pour trouver les propriétés
	async processClassSymbol(classSymbol, doc, lenses, token) {
		
		
		if (classSymbol.children && Array.isArray(classSymbol.children)) {
			
			
			for (const child of classSymbol.children) {
				
				
				// Vérifie l'annulation
				if (token.isCancellationRequested) {
					return;
				}

				// Recherche les propriétés de classe déclarées explicitement
				if (child.kind === vscode.SymbolKind.Property || 
					child.kind === vscode.SymbolKind.Field) {
					
					
					await this.processPropertySymbol(child, doc, lenses, token);
				}
				// Traite les constructeurs pour trouver les propriétés this.property
				else if (child.kind === vscode.SymbolKind.Constructor) {
					
					await this.processConstructorForProperties(child, classSymbol, doc, lenses, token);
				}
			}
		} else {
			
		}
	}

	// Traite le constructeur pour trouver les propriétés this.property
	async processConstructorForProperties(constructorSymbol, classSymbol, doc, lenses, token) {
		
		
		try {
			// Récupère le contenu du constructeur
			const constructorRange = constructorSymbol.range;
			const constructorText = doc.getText(constructorRange);
			
			
			
			// Regex pour trouver les affectations this.property = 
			const thisPropertyRegex = /this\.(\w+)\s*=/g;
			const properties = new Set();
			let match;
			
			while ((match = thisPropertyRegex.exec(constructorText)) !== null) {
				properties.add(match[1]);
			}
			
			
			
			// Pour chaque propriété trouvée, cherche sa position et crée un CodeLens
			for (const propName of properties) {
				if (token.isCancellationRequested) {
					return;
				}
				
				await this.processThisProperty(propName, classSymbol, doc, lenses, token);
			}
			
		} catch (error) {
			outputChannel.appendLine(`[CodeLens] Erreur lors de l'analyse du constructeur: ${error?.message}`);
			outputChannel.appendLine(error?.stack || String(error));
		}
	}

	// Traite une propriété this.property trouvée dans le constructeur
	async processThisProperty(propName, classSymbol, doc, lenses, token) {
		
		
		try {
			// Trouve la première occurrence de this.propName dans la classe
			const classRange = classSymbol.range;
			const classText = doc.getText(classRange);
			const propPattern = new RegExp(`this\\.${propName}\\s*=`, 'g');
			const match = propPattern.exec(classText);
			
			if (match) {
				// Calcule la position absolue dans le document
				const classStartOffset = doc.offsetAt(classRange.start);
				const propOffset = classStartOffset + match.index;
				const propPosition = doc.positionAt(propOffset);
				
				// Crée un range pour la propriété
				const propRange = new vscode.Range(
					propPosition,
					new vscode.Position(propPosition.line, propPosition.character + `this.${propName}`.length)
				);
				
				
				
				// Utilise la méthode existante pour traiter la propriété
				await this.processPropertySymbolByName(propName, propRange, doc, lenses, token);
			}
		} catch (error) {
			outputChannel.appendLine(`[CodeLens] Erreur lors du traitement de this.${propName}: ${error?.message}`);
			outputChannel.appendLine(error?.stack || String(error));
		}
	}

	// Version modifiée pour traiter une propriété par nom et range
	async processPropertySymbolByName(propName, range, doc, lenses, token) {
		
		
		try {
			// Utilise executeReferenceProvider pour trouver toutes les références
			const refs = await vscode.commands.executeCommand(
				"vscode.executeReferenceProvider",
				doc.uri,
				range.start
			);

			

			// Vérifie l'annulation après l'appel async
			if (token.isCancellationRequested) {
				return;
			}

			let reads = 0, writes = 0;
			const readRefs = [], writeRefs = [];

			if (refs && Array.isArray(refs)) {
				for (const ref of refs) {
					// Ignore la déclaration elle-même
					if (this.isDeclaration(ref, range, doc.uri)) {
						
						continue;
					}

					try {
						const refDoc = await this.getDocument(ref.uri);
						if (!refDoc) continue;

						if (this.isWriteReference(ref, refDoc, propName)) {
							writes++;
							writeRefs.push(ref);
							
						} else {
							reads++;
							readRefs.push(ref);
							
						}
					} catch (error) {
						console.warn(`[CodeLens] Erreur lors du traitement de la référence:`, error);
						continue;
					}
				}
			}

			

			// Ajoute les CodeLens
			if (reads > 0) {
				lenses.push(new vscode.CodeLens(range, {
					title: `📖 ${reads} reads`,
					command: "propertyReadWriteCodelens.showReads",
					arguments: [doc.uri, range.start, "reads", readRefs],
				}));
			}

			if (writes > 0) {
				lenses.push(new vscode.CodeLens(range, {
					title: `✏️ ${writes} writes`,
					command: "propertyReadWriteCodelens.showWrites", 
					arguments: [doc.uri, range.start, "writes", writeRefs],
				}));
			}

		} catch (error) {
			outputChannel.appendLine(`[CodeLens] Erreur lors du traitement de ${propName}: ${error?.message}`);
			outputChannel.appendLine(error?.stack || String(error));
		}
	}

	// Traite une propriété spécifique
	async processPropertySymbol(propertySymbol, doc, lenses, token) {
		const propName = propertySymbol.name;
		const range = propertySymbol.range || propertySymbol.location?.range;
		
		if (!range) {
			console.warn(`[CodeLens] Pas de range pour la propriété ${propName}`);
			return;
		}

		try {
			// Utilise executeReferenceProvider pour trouver toutes les références
			const refs = await vscode.commands.executeCommand(
				"vscode.executeReferenceProvider",
				doc.uri,
				range.start
			);

			// Vérifie l'annulation après l'appel async
			if (token.isCancellationRequested) {
				return;
			}

			let reads = 0, writes = 0;
			const readRefs = [], writeRefs = [];

			if (refs && Array.isArray(refs)) {
				for (const ref of refs) {
					// Ignore la déclaration elle-même
					if (this.isDeclaration(ref, range, doc.uri)) {
						continue;
					}

					try {
						const refDoc = await this.getDocument(ref.uri);
						if (!refDoc) continue;

						if (this.isWriteReference(ref, refDoc, propName)) {
							writes++;
							writeRefs.push(ref);
						} else {
							reads++;
							readRefs.push(ref);
						}
					} catch (error) {
						console.warn(`[CodeLens] Erreur lors du traitement de la référence:`, error);
						continue;
					}
				}
			}

			// Ajoute les CodeLens
			if (reads > 0) {
				lenses.push(new vscode.CodeLens(range, {
					title: `📖 ${reads} reads`,
					command: "propertyReadWriteCodelens.showReads",
					arguments: [doc.uri, range.start, "reads", readRefs],
				}));
			}

			if (writes > 0) {
				lenses.push(new vscode.CodeLens(range, {
					title: `✏️ ${writes} writes`,
					command: "propertyReadWriteCodelens.showWrites", 
					arguments: [doc.uri, range.start, "writes", writeRefs],
				}));
			}

		} catch (error) {
			outputChannel.appendLine(`[CodeLens] Erreur lors du traitement de ${propName}: ${error?.message}`);
			outputChannel.appendLine(error?.stack || String(error));
		}
	}

	// Vérifie si une référence est la déclaration elle-même
	isDeclaration(ref, propertyRange, docUri) {
		return ref.range.start.line === propertyRange.start.line &&
			   ref.range.start.character === propertyRange.start.character &&
			   ref.uri.toString() === docUri.toString();
	}

	// Vérifie si une référence est une écriture
	isWriteReference(ref, refDoc, propName) {
		if (ref.range.start.line < 0 || ref.range.start.line >= refDoc.lineCount) {
			return false;
		}

		const refLine = refDoc.lineAt(ref.range.start.line).text;
		const refPosition = ref.range.start.character;

		if (refPosition < 0 || refPosition >= refLine.length) {
			return false;
		}

		const afterProp = refLine.substring(refPosition + propName.length).trim();
		const beforeProp = refLine.substring(0, refPosition).trim();

		// Patterns d'écriture
		return afterProp.match(/^(\s*=(?!=)|(\+\+|--|\+=|-=|\*=|\/=|%=))/) ||
			   beforeProp.match(/(\+\+|--)\s*$/) ||
			   refLine.includes(`${propName} =`);
	}

	// Méthode optimisée pour récupérer les documents avec cache
	async getDocument(uri) {
		const uriString = uri.toString();

		// Vérifie d'abord le cache
		if (this.documentCache.has(uriString)) {
			return this.documentCache.get(uriString);
		}

		// Vérifie si le document est déjà ouvert dans l'éditeur (plus rapide)
		const openDoc = vscode.workspace.textDocuments.find(
			(doc) => doc.uri.toString() === uriString
		);
		if (openDoc) {
			this.documentCache.set(uriString, openDoc);
			return openDoc;
		}

		// Sinon, ouvre le document (plus lent)
		try {
			const doc = await vscode.workspace.openTextDocument(uri);
			this.documentCache.set(uriString, doc);
			return doc;
		} catch (error) {
			outputChannel.appendLine(`[CodeLens] Impossible d'ouvrir le document ${uriString}: ${error?.message}`);
			outputChannel.appendLine(error?.stack || String(error));
			return null;
		}
	}
}

function activate(context) {
	outputChannel.appendLine('[CodeLens] Extension Property Read Write CodeLens activée !');
	const provider = new PropertyReadWriteCodeLensProvider();
	const codeLensDisposable = vscode.languages.registerCodeLensProvider(
		[
			{ language: "javascript", scheme: "file" },
			{ language: "typescript", scheme: "file" },
		],
		provider
	);
	context.subscriptions.push(
		codeLensDisposable,
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
					outputChannel.appendLine("Erreur lors de l'affichage des lectures: " + error?.message);
					outputChannel.appendLine(error?.stack || String(error));
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
					outputChannel.appendLine("Erreur lors de l'affichage des écritures: " + error?.message);
					outputChannel.appendLine(error?.stack || String(error));
					vscode.window.showErrorMessage(
						"Impossible d'afficher les références d'écriture"
					);
				}
			}
		)
	);
}

module.exports = { activate };
