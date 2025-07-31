// Fichier de test simple pour vérifier les CodeLens

 const test = new class TestClass extends StoreBase {
	override proxi: this = this;
	curentProjectData: ProjectSettings | null = null;
	a = [ {} ];
	b = {prop: 'value' };
}();

// const test = new TestClass();
const { a: uuu } = test;
console.log( 'uuu:', uuu );
test.a;
test.b;
test.a = [ { newProp: 'newValue' } ];