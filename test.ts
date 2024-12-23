import { expect } from 'jsr:@std/expect';
import {
	$never,
	$undefined,
	$null,
	$boolean,
	$number,
	$string,
	$bigint,
	$symbol,
	$literal,
	$optional,
	$nullable,
	$tuple,
	$union,
	$array,
	$object,
	$objectStrict,
	$record,
} from "./mod.ts";


Deno.test('$never :: undefined', () => {
	expect($never.check(undefined)).toBe(false);
});

Deno.test('$never :: number', () => {
	expect($never.check(1)).toBe(false);
});


Deno.test('$undefined :: undefined', () => {
	expect($undefined.check(undefined)).toBe(true);
});

Deno.test('$undefined :: number', () => {
	expect($undefined.check(1)).toBe(false);
});


Deno.test('$null :: null', () => {
	expect($null.check(null)).toBe(true);
});

Deno.test('$null :: number', () => {
	expect($null.check(1)).toBe(false);
});


Deno.test('$boolean :: boolean', () => {
	expect($boolean.check(true)).toBe(true);
});

Deno.test('$boolean :: number', () => {
	expect($boolean.check(1)).toBe(false);
});


Deno.test('$number :: number', () => {
	expect($number.check(1)).toBe(true);
});

Deno.test('$number :: string', () => {
	expect($number.check('1')).toBe(false);
});


Deno.test('$string :: string', () => {
	expect($string.check('1')).toBe(true);
});

Deno.test('$string :: number', () => {
	expect($string.check(1)).toBe(false);
});


Deno.test('$bigint :: bigint', () => {
	expect($bigint.check(1n)).toBe(true);
});

Deno.test('$bigint :: number', () => {
	expect($bigint.check(1)).toBe(false);
});

Deno.test('$bigint :: string', () => {
	expect($bigint.check('1')).toBe(false);
});


Deno.test('$symbol :: symbol', () => {
	expect($symbol.check(Symbol())).toBe(true);
});

Deno.test('$symbol :: number', () => {
	expect($symbol.check(1)).toBe(false);
});


{
	const checkerNumbers = $literal(1, 2);

	Deno.test('$literal (1 | 2) :: 1', () => {
		expect(checkerNumbers.check(1)).toBe(true);
	});

	Deno.test('$literal (1 | 2) :: 2', () => {
		expect(checkerNumbers.check(2)).toBe(true);
	});

	Deno.test('$literal (1 | 2) :: 3', () => {
		expect(checkerNumbers.check(3)).toBe(false);
	});


	const checkerString = $literal('foo');

	Deno.test('$literal ("foo") :: "foo"', () => {
		expect(checkerString.check('foo')).toBe(true);
	});

	Deno.test('$literal ("foo") :: "bar"', () => {
		expect(checkerString.check('bar')).toBe(false);
	});
}


{
	const checker = $optional($number);

	Deno.test('$optional (number) :: number', () => {
		expect(checker.check(1)).toBe(true);
	});

	Deno.test('$optional (number) :: undefined', () => {
		expect(checker.check(undefined)).toBe(true);
	});

	Deno.test('$optional (number) :: string', () => {
		expect(checker.check('1')).toBe(false);
	});
}


{
	const checker = $nullable($number);

	Deno.test('$nullable (number) :: number', () => {
		expect(checker.check(1)).toBe(true);
	});

	Deno.test('$nullable (number) :: null', () => {
		expect(checker.check(null)).toBe(true);
	});

	Deno.test('$nullable (number) :: string', () => {
		expect(checker.check('1')).toBe(false);
	});
}


{
	const checker = $tuple($number, $number);

	// This technically tests both valid length and valid value at once
	Deno.test('$tuple :: Equal length', () => {
		expect(checker.check([1, 1])).toBe(true);
	});

	Deno.test('$tuple :: Smaller length', () => {
		expect(checker.check([1])).toBe(false);
	});

	Deno.test('$tuple :: Bigger length', () => {
		expect(checker.check([1, 1, 1])).toBe(false);
	});

	Deno.test('$tuple [number, number] :: [number, string]', () => {
		expect(checker.check([1, '1'])).toBe(false);
	});
}


{
	const checker = $union($number, $string);

	Deno.test('$union (number | string) :: number', () => {
		expect(checker.check(1)).toBe(true);
	});

	Deno.test('$union (number | string) :: string', () => {
		expect(checker.check('1')).toBe(true);
	});

	Deno.test('$union (number | string) :: boolean', () => {
		expect(checker.check(true)).toBe(false);
	});
}


{
	const checkerNever = $array();

	Deno.test('$array never :: never', () => {
		expect(checkerNever.check([])).toBe(true);
	});

	Deno.test('$array never :: undefined', () => {
		expect(checkerNever.check([undefined])).toBe(false);
	});


	Deno.test('$array never :: number', () => {
		expect(checkerNever.check([1])).toBe(false);
	});


	const checkerSingleType = $array($number);

	Deno.test('$array number[] :: number[]', () => {
		expect(checkerSingleType.check([1])).toBe(true);
	});

	Deno.test('$array number[] :: string[]', () => {
		expect(checkerSingleType.check(['1'])).toBe(false);
	});


	const checkerMultipleTypes = $array($number, $string);

	Deno.test('$array :: Valid array', () => {
		expect(checkerMultipleTypes.check([1, 2, '3'])).toBe(true);
	});

	Deno.test('$array :: Array with all valid types and invalid extra type', () => {
		expect(checkerMultipleTypes.check([1, 2, '3', true])).toBe(false);
	});

	Deno.test('$array :: Array with invalid type', () => {
		expect(checkerMultipleTypes.check([1, 2, true])).toBe(false);
	});
}


{
	const checker = $object({
		foo: $number,
		bar: $string
	});

	Deno.test('$object :: Valid object', () => {
		const object = {
			foo: 1,
			bar: '1'
		};
		expect(checker.check(object)).toBe(true);
	});

	Deno.test('$object :: Invalid object', () => {
		const object = {
			foo: 1,
			bar: 1
		};
		expect(checker.check(object)).toBe(false);
	});

	Deno.test('$object :: Missing property', () => {
		const object = {
			foo: 1
		};
		expect(checker.check(object)).toBe(false);
	});

	Deno.test('$object :: Extra property', () => {
		const object = {
			foo: 1,
			bar: '1',
			qux: true
		};
		expect(checker.check(object)).toBe(true);
	});
}


{
	const checker = $objectStrict({
		foo: $number,
		bar: $string
	});

	Deno.test('$objectStrict :: Valid object', () => {
		const object = {
			foo: 1,
			bar: '1'
		};
		expect(checker.check(object)).toBe(true);
	});

	Deno.test('$objectStrict :: Invalid object', () => {
		const object = {
			foo: 1,
			bar: 1
		};
		expect(checker.check(object)).toBe(false);
	});

	Deno.test('$objectStrict :: Missing property', () => {
		const object = {
			foo: 1
		};
		expect(checker.check(object)).toBe(false);
	});

	Deno.test('$objectStrict :: Extra property', () => {
		const object = {
			foo: 1,
			bar: '1',
			qux: true
		};
		expect(checker.check(object)).toBe(false);
	});
}


{
	const checker = $record($number);

	Deno.test('$record :: Empty', () => {
		expect(checker.check({})).toBe(true);
	});

	Deno.test('$record :: Valid object', () => {
		const object = {
			foo: 1,
			bar: 1
		};
		expect(checker.check(object)).toBe(true);
	});

	Deno.test('$record :: Invalid object', () => {
		const object = {
			foo: 1,
			bar: '1'
		};
		expect(checker.check(object)).toBe(false);
	});

	Deno.test('$record :: Object with undefined', () => {
		const object = {
			foo: 1,
			bar: undefined
		};
		expect(checker.check(object)).toBe(false);
	});
}