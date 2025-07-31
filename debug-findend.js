// Test de findFieldEnd
const lines = [
	"	a = [{", // ligne 0
	"		test: 123", // ligne 1  
	"	}];" // ligne 2
];

console.log('Test 1: a = [{ ... }];');
console.log('Lines:', lines);

// Simulation de findFieldEnd
let braceCount = 0;
let bracketCount = 0;
let parenCount = 0;
let inString = false;
let stringChar = '';

const startLineIndex = 0;
const startCharIndex = 3; // position du '='

for (let lineIndex = startLineIndex; lineIndex < lines.length; lineIndex++) {
	const line = lines[lineIndex];
	const startIndex = lineIndex === startLineIndex ? startCharIndex : 0;
	
	console.log(`Analyse ligne ${lineIndex}: "${line}"`);
	
	for (let charIndex = startIndex; charIndex < line.length; charIndex++) {
		const char = line[charIndex];
		
		if (!inString && (char === '"' || char === "'" || char === '`')) {
			inString = true;
			stringChar = char;
		} else if (inString && char === stringChar) {
			const prevChar = charIndex > 0 ? line[charIndex - 1] : '';
			if (prevChar !== '\\') {
				inString = false;
				stringChar = '';
			}
		}
		
		if (!inString) {
			switch (char) {
				case '{': 
					braceCount++; 
					console.log(`  { trouvé à pos ${charIndex}, braceCount = ${braceCount}`);
					break;
				case '}': 
					braceCount--; 
					console.log(`  } trouvé à pos ${charIndex}, braceCount = ${braceCount}`);
					break;
				case '[': 
					bracketCount++; 
					console.log(`  [ trouvé à pos ${charIndex}, bracketCount = ${bracketCount}`);
					break;
				case ']': 
					bracketCount--; 
					console.log(`  ] trouvé à pos ${charIndex}, bracketCount = ${bracketCount}`);
					break;
				case ';':
					console.log(`  ; trouvé à pos ${charIndex}, braces=${braceCount}, brackets=${bracketCount}`);
					if (braceCount === 0 && bracketCount === 0 && parenCount === 0) {
						console.log(`  FIN TROUVÉE !`);
						process.exit(0);
					}
					break;
			}
		}
	}
}

console.log('Fin non trouvée');
