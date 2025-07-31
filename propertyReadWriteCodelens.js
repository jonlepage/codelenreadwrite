const vscode = require("vscode");

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
		console.log(`[CodeLens] provideCodeLenses appelé pour: ${doc.fileName}`);
		const lenses = [];

		// Réinitialise le cache pour chaque session CodeLens
		this.documentCache.clear();
		this.documentCache.set(doc.uri.toString(), doc);

		// Vérifie si l'opération a été annulée
		if (token.isCancellationRequested) {
			console.log('[CodeLens] Opération annulée');
			return lenses;
		}

		try {
			// Utilise l'API Document Symbols pour obtenir la structure précise du fichier
			const symbols = await vscode.commands.executeCommand(
				'vscode.executeDocumentSymbolProvider',
				doc.uri
			);

			console.log(`[CodeLens] Symboles trouvés: ${symbols ? symbols.length : 0}`);

			if (symbols && Array.isArray(symbols)) {
				for (const symbol of symbols) {
					console.log(`[CodeLens] Symbole: ${symbol.name}, kind: ${symbol.kind}`);
					
					// Vérifie l'annulation
					if (token.isCancellationRequested) {
						return lenses;
					}

					// Recherche les classes ET les variables (qui peuvent contenir des objets/classes anonymes)
					if (symbol.kind === vscode.SymbolKind.Class) {
						console.log(`[CodeLens] Traitement classe: ${symbol.name}`);
						await this.processClassSymbol(symbol, doc, lenses, token);
					} else if (symbol.kind === vscode.SymbolKind.Variable || 
							   symbol.kind === vscode.SymbolKind.Constant) {
						console.log(`[CodeLens] Traitement variable/constante: ${symbol.name}`);
						await this.processVariableSymbol(symbol, doc, lenses, token);
					}
				}
			}

		} catch (error) {
			console.error('[CodeLens] Erreur lors de l\'analyse des symboles:', error);
		}

		console.log(`[CodeLens] Total CodeLens générés: ${lenses.length}`);
		return lenses;
	}

	// Traite les variables/constantes qui peuvent contenir des objets avec propriétés
	async processVariableSymbol(variableSymbol, doc, lenses, token) {
		console.log(`[CodeLens] processVariableSymbol: ${variableSymbol.name}, children: ${variableSymbol.children ? variableSymbol.children.length : 'aucun'}`);
		
	   if (variableSymbol.children && Array.isArray(variableSymbol.children)) {
		   console.log(`[CodeLens] ${variableSymbol.name} a ${variableSymbol.children.length} enfants`);
		   for (const child of variableSymbol.children) {
			   console.log(`[CodeLens] Enfant: ${child.name}, kind: ${child.kind}`);
			   // Vérifie l'annulation
			   if (token.isCancellationRequested) {
				   return;
			   }
			   // Si c'est une propriété directe
			   if (child.kind === vscode.SymbolKind.Property || child.kind === vscode.SymbolKind.Field) {
				   console.log(`[CodeLens] Propriété trouvée dans variable: ${child.name}`);
				   await this.processPropertySymbol(child, doc, lenses, token);
			   }
			   // Si c'est une classe (ex: classe anonyme instanciée)
			   else if (child.kind === vscode.SymbolKind.Class) {
				   console.log(`[CodeLens] Enfant de type Class trouvé dans variable: ${child.name}`);
				   // Appel récursif pour traiter toutes les propriétés internes de la classe
				   await this.processClassSymbol(child, doc, lenses, token);
			   }
		   }
	   } else {
		   console.log(`[CodeLens] ${variableSymbol.name} n'a pas d'enfants - on ne peut pas détecter ses propriétés avec l'API Document Symbols`);
	   }
	}

	// Traite les symboles de classe pour trouver les propriétés
	async processClassSymbol(classSymbol, doc, lenses, token) {
		console.log(`[CodeLens] processClassSymbol: ${classSymbol.name}, children: ${classSymbol.children ? classSymbol.children.length : 'aucun'}`);
		
		if (classSymbol.children && Array.isArray(classSymbol.children)) {
			console.log(`[CodeLens] Classe ${classSymbol.name} a ${classSymbol.children.length} enfants`);
			
			for (const child of classSymbol.children) {
				console.log(`[CodeLens] Enfant classe: ${child.name}, kind: ${child.kind}`);
				
				// Vérifie l'annulation
				if (token.isCancellationRequested) {
					return;
				}

				// Recherche les propriétés de classe déclarées explicitement
				if (child.kind === vscode.SymbolKind.Property || 
					child.kind === vscode.SymbolKind.Field) {
					
					console.log(`[CodeLens] Propriété de classe trouvée: ${child.name}`);
					await this.processPropertySymbol(child, doc, lenses, token);
				}
				// Traite les constructeurs pour trouver les propriétés this.property
				else if (child.kind === vscode.SymbolKind.Constructor) {
					console.log(`[CodeLens] Traitement du constructeur pour trouver les propriétés this.*`);
					await this.processConstructorForProperties(child, classSymbol, doc, lenses, token);
				}
			}
		} else {
			console.log(`[CodeLens] Classe ${classSymbol.name} n'a pas d'enfants`);
		}
	}

	// Traite le constructeur pour trouver les propriétés this.property
	async processConstructorForProperties(constructorSymbol, classSymbol, doc, lenses, token) {
		console.log(`[CodeLens] Analyse du constructeur de ${classSymbol.name}`);
		
		try {
			// Récupère le contenu du constructeur
			const constructorRange = constructorSymbol.range;
			const constructorText = doc.getText(constructorRange);
			
			console.log(`[CodeLens] Texte du constructeur: ${constructorText.substring(0, 200)}...`);
			
			// Regex pour trouver les affectations this.property = 
			const thisPropertyRegex = /this\.(\w+)\s*=/g;
			const properties = new Set();
			let match;
			
			while ((match = thisPropertyRegex.exec(constructorText)) !== null) {
				properties.add(match[1]);
			}
			
			console.log(`[CodeLens] Propriétés this.* trouvées: ${Array.from(properties).join(', ')}`);
			
			// Pour chaque propriété trouvée, cherche sa position et crée un CodeLens
			for (const propName of properties) {
				if (token.isCancellationRequested) {
					return;
				}
				
				await this.processThisProperty(propName, classSymbol, doc, lenses, token);
			}
			
		} catch (error) {
			console.error(`[CodeLens] Erreur lors de l'analyse du constructeur:`, error);
		}
	}

	// Traite une propriété this.property trouvée dans le constructeur
	async processThisProperty(propName, classSymbol, doc, lenses, token) {
		console.log(`[CodeLens] Traitement de la propriété this.${propName}`);
		
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
				
				console.log(`[CodeLens] Position de this.${propName}: ligne ${propPosition.line}, char ${propPosition.character}`);
				
				// Utilise la méthode existante pour traiter la propriété
				await this.processPropertySymbolByName(propName, propRange, doc, lenses, token);
			}
		} catch (error) {
			console.error(`[CodeLens] Erreur lors du traitement de this.${propName}:`, error);
		}
	}

	// Version modifiée pour traiter une propriété par nom et range
	async processPropertySymbolByName(propName, range, doc, lenses, token) {
		console.log(`[CodeLens] processPropertySymbolByName: ${propName}`);
		
		try {
			// Utilise executeReferenceProvider pour trouver toutes les références
			const refs = await vscode.commands.executeCommand(
				"vscode.executeReferenceProvider",
				doc.uri,
				range.start
			);

			console.log(`[CodeLens] Références trouvées pour ${propName}: ${refs ? refs.length : 0}`);

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
						console.log(`[CodeLens] Ignoré déclaration de ${propName}`);
						continue;
					}

					try {
						const refDoc = await this.getDocument(ref.uri);
						if (!refDoc) continue;

						if (this.isWriteReference(ref, refDoc, propName)) {
							writes++;
							writeRefs.push(ref);
							console.log(`[CodeLens] Écriture détectée pour ${propName}`);
						} else {
							reads++;
							readRefs.push(ref);
							console.log(`[CodeLens] Lecture détectée pour ${propName}`);
						}
					} catch (error) {
						console.warn(`[CodeLens] Erreur lors du traitement de la référence:`, error);
						continue;
					}
				}
			}

			console.log(`[CodeLens] ${propName}: ${reads} lectures, ${writes} écritures`);

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
			console.error(`[CodeLens] Erreur lors du traitement de ${propName}:`, error);
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
			console.error(`[CodeLens] Erreur lors du traitement de ${propName}:`, error);
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
			console.warn(
				`[CodeLens] Impossible d'ouvrir le document ${uriString}:`,
				error
			);
			return null;
		}
	}
}

function activate(context) {
	console.log('[CodeLens] Extension Property Read Write CodeLens est en cours d\'activation...');
	
	const provider = new PropertyReadWriteCodeLensProvider();
	
	const codeLensDisposable = vscode.languages.registerCodeLensProvider(
		[
			{ language: "javascript", scheme: "file" },
			{ language: "typescript", scheme: "file" },
		],
		provider
	);
	
	console.log('[CodeLens] Provider CodeLens enregistré pour JavaScript et TypeScript');
	
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
	
	console.log('[CodeLens] Extension Property Read Write CodeLens activée avec succès !');
}

module.exports = { activate };
