# Purity

Lightweight no dependency TypeScript library for runtime type checking.

- Support for primitives, arrays, objects, tuples, unions, literals, and more.
- Comprehensive type-string representations for easy debugging.

## Examples

Basic usage
```ts
import { $string } from '@purity/purity';

$string.check('hi'); // > true
$string.check(1);    // > false
```

The error is useful
```ts
import { $object, $string, CheckerError } from '@purity/purity';

const $person = $object({
	name: $string
});

try {
	const person = $person.assert(1);
} catch (error) {
	const checkerError = error as CheckerError;

	checkerError.message;  // > "Expected '{ name: string }' but received 'number'"
	checkerError.expected; // > "{ name: string }"
	checkerError.received; // > "number"
}
```

Nesting checkers
```ts
import { $literal, $object, $string, $number, CheckerType } from '@purity/purity';

const $toy = $literal('ball', 'plush');

const $pet = $object({
	name: $string,
	toy: $toy
});

const $person = $object({
	name: $string,
	age: $number,
	pet: $pet
});

if ($person.check(unknownValue)) {
	...
}


// Getting hints from TypeScript

type Person = CheckerType<typeof $person>;

const person: Person = {
	name: 'John',
	age: 30,
	pet: {
		name: 'Max',
		toy: 'ball'
	}
};
```

Custom Checker for specific class
```ts
import { Checker } from '@purity/purity';

class Foo {}

const $foo = new Checker<Foo>({

	typeString: Foo.name,

	check(value) {
		return value instanceof Foo;
	},

});

// TypeError: Expected 'Foo' but received 'number'
const foo = $foo.assert(1);

// Ok, and foo is typed as Foo
const foo = $foo.assert(new Foo());
```

Custom Checker for positive integers
```ts
import { Checker } from '@purity/purity';

const $uint = new Checker<number>({

	typeString: 'uint',

	check(value) {
		return typeof value === 'number' && value >= 0;
	},

});

// TypeError: Expected 'uint' but received 'number'
const uint = $uint.assert(-1);

// Ok
const uint = $uint.assert(1);
```

Custom Checker factory
```ts
function $multipleOf(number: number)
{
	return new Checker<number>({

		typeString: `number <multiple of ${number}>`,

		check(value) {
			return typeof value === 'number' && value % number === 0;
		},

	});
}

const $multipleOf3 = $multipleOf(3);
const $multipleOf5 = $multipleOf(5);
const $multipleOf10 = $multipleOf(10);
```