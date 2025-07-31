
abstract class StoreBase {
	protected abstract proxi: this;
}

const test = new class TestClass extends StoreBase {
	override proxi: this = this;
	curentProjectData: {} | null = null;
	a = [ {} ];
	b = {
		prop: 'value' };
}();

// const test = new TestClass();
const { a: uuu } = test;
console.log( 'uuu:', uuu );
test.a;
test.b;
test.a = [ { newProp: 'newValue' } ];
test.b = { newProp: 'newValue' };
test.curentProjectData = { newProp: 'newValue' };