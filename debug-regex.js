// Test de la regex pour déboguer
const testClassBody = `
	simpleField = 5;
	complexObject = {
		prop: "value"
	};
	complexArray = [ {} ];
	a = [ {} ];
`;

const lines = testClassBody.split('\n');
console.log('Lignes à analyser:', lines);

for (let i = 0; i < lines.length; i++) {
	const line = lines[i].trim();
	
	if (!line || line.startsWith('//') || line.startsWith('/*')) {
		continue;
	}
	
	console.log(`Ligne ${i}: "${line}"`);
	
	const fieldMatch = line.match(/^(?:(?:public|private|protected|readonly|static|abstract)\s+)*(\w+)(?:\?\s*)?(?:\s*:\s*[^=;]+)?(\s*=|\s*;)/);
	
	if (fieldMatch) {
		console.log(`  Match trouvé: nom=${fieldMatch[1]}, assignation=${fieldMatch[2]}`);
	} else {
		console.log(`  Pas de match`);
	}
}
