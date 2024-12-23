type ExtractTuple<A extends Checker[]> = {
    [K in keyof A]: CheckerType<A[K]>;
};

type CheckerOptions = {
	typeString: string;
	check: Checker['check'];
};

type CheckerType<C extends Checker> = C extends Checker<infer T> ? T : unknown;



class Checker<T = unknown>
{
	/**
	 * Check whether the value matches this type
	 * 
	 * @example
	 * ```ts
	 * import { $record, $string, $number } from 'purity';
	 * 
	 * const personChecker = $record({
	 * 	name: $string,
	 * 	age: $number
	 * });
	 * 
	 * if (personChecker.check(unknownValue)) {
	 * 	console.log('unknownValue matches person checker');
	 * }
	 * 
	 * // You probably want to use assert instead though:
	 * const person = personChecker.assert(unknownValue);
	 * ```
	 */
	// deno-lint-ignore no-explicit-any
	public check: (value: any) => boolean;

	/** A string representation of this wrapper's Type */
	public typeString: string;


	public constructor(options: CheckerOptions) {
		this.check = options.check;
		this.typeString = options.typeString;
	}


	/**
	 * Throws an error if the value doesn't match this type, returns typed value otherwise
	 * 
	 * @example
	 * ```ts
	 * import { $record, $string, $number } from 'purity';
	 * 
	 * const personChecker = $record({
	 * 	name: $string,
	 * 	age: $number
	 * });
	 * 
	 * const person = personChecker.assert(unknownValue);
	 * 
	 * console.log(person.name);
	 * ```
	 */
	// deno-lint-ignore no-explicit-any
	public assert(value: any): T {
		if (this.check(value)) {
			return value;
		}

		throw new CheckerError(this.typeString, Checker.getTypeString(value));
	}


	/** Returns an union of this and the wrapper passed as argument */
	// public or<Other extends Checker>(checker: Other): Checker<T | CheckerType<Other>> {
	// 	return $union(this, checker);
	// }

	/** Creates a string representation of the type of value */
	// deno-lint-ignore no-explicit-any
	public static getTypeString(value: any): string {
		const type = typeof value;

		if (type !== 'object') {
			return type;
		}

		if (value === null) {
			return 'null';
		}

		if (Array.isArray(value)) {
			return '[' + value.map(Checker.getTypeString).join(', ') + ']';
		}

		const entries = Object.entries(value);

		if (entries.length === 0) {
			return '{}';
		}

		return '{ ' + entries.map(([k, v]) => k + ': ' + Checker.getTypeString(v)).join(', ') + ' }';
	}
}

class CheckerError extends TypeError {

	public expected: string;
	public received: string;

	constructor(expected: string, received: string) {
		super(`Expected '${expected}' but received '${received}'`);
		this.expected = expected;
		this.received = received;
	}
}



const unionSeparator = ' | ';



const $never: Checker<never> = new Checker<never>({
	typeString: 'never',
	check(_value) { return false },
});

const $undefined: Checker<undefined> = new Checker<undefined>({
	typeString: 'undefined',
	check(value) { return typeof value === 'undefined' },
});

const $null: Checker<null> = new Checker<null>({
	typeString: 'null',
	check(value) { return value === null },
});

const $boolean: Checker<boolean> = new Checker<boolean>({
	typeString: 'boolean',
	check(value) { return typeof value === 'boolean' },
});

const $number: Checker<number> = new Checker<number>({
	typeString: 'number',
	check(value) { return typeof value === 'number' },
});

const $string: Checker<string> = new Checker<string>({
	typeString: 'string',
	check(value) { return typeof value === 'string' },
});

const $bigint: Checker<bigint> = new Checker<bigint>({
	typeString: 'bigint',
	check(value) { return typeof value === 'bigint' },
});

const $symbol: Checker<symbol> = new Checker<symbol>({
	typeString: 'symbol',
	check(value) { return typeof value === 'symbol' },
});



function $array<T extends Checker[] | [Checker]>(...checkers: T): Checker<CheckerType<T[number]>[]> {

	let checker: Checker;

	switch (checkers.length) {
		case 0: checker = $never; break;
		case 1: checker = checkers[0]; break;
		default: checker = $union(...checkers); break;
	}

	const typeString = (checkers.length > 1 ? '(' + checker.typeString + ')' : checker.typeString) + '[]';

	return new Checker({

		typeString,

		check(values) {
			return Array.isArray(values) && values.every(checker.check);
		},

	});
}

function $object<T extends Record<string, Checker>>(record: T): Checker<{ [K in keyof T]: CheckerType<T[K]> }> {

	const checkerEntries = Object.entries(record);
	const propertyStrings = checkerEntries.map(([key, checker]) => key + ': ' + checker.typeString);
	const typeString = '{ ' + propertyStrings.join(', ') + ' }';
  
	return new Checker({

		typeString,
		
		check(value) {

			if (typeof value !== 'object' || value === null)
				return false;

			for (const [key, checker] of checkerEntries) {
				if (!checker.check(value[key]))
					return false;
			}

			return true;
		},

	});
}

/** Similar to object but will also fail if extra properties
 * exist even if the type of the expected properties matche */
function $objectStrict<T extends Record<string, Checker>>(record: T): Checker<{ [K in keyof T]: CheckerType<T[K]> }> {

	const checkerEntries = Object.entries(record);
	const propertyStrings = checkerEntries.map(([key, checker]) => key + ': ' + checker.typeString);
	const typeString = '{ ' + propertyStrings.join(', ') + ' }';
  
	return new Checker({

		typeString,
		
		check(value) {

			if (typeof value !== 'object' || value === null)
				return false;

			// What makes this strict
			if (!Object.keys(value).every(key => key in record))
				return false;

			for (const [key, checker] of checkerEntries) {
				if (!checker.check(value[key]))
					return false;
			}

			return true;
		},

	});
}

function $record<T extends Checker>(valueChecker: T): Checker<Record<string, CheckerType<T>>> {
	return new Checker({

		typeString: '{ [key: string]: ' + valueChecker.typeString + ' }',
		
		check(value) {
			return (
				typeof value === 'object'
				&& value !== null
				&& Object.values(value).every(valueChecker.check)
			);
		},
  
	});
}


function $literal<T extends (string | number)[]>(...literals: T): Checker<T[number]> {

	const typeString = literals
		.map(literal => (typeof literal === 'string' ? `"${literal}"` : literal.toString()))
		.join(' | ');

	return new Checker<T[number]>({

		typeString,

		check(value) {
			return literals.includes(value as T[number]);
		},

	});
}

function $optional<T extends Checker>(checker: T): Checker<CheckerType<T> | undefined> {
	return new Checker({

		typeString: checker.typeString + unionSeparator + $undefined.typeString,

		check(value) {
			return $undefined.check(value) || checker.check(value);
		},

	});
}

function $nullable<T extends Checker>(checker: T): Checker<CheckerType<T> | null> {
	return new Checker({

		typeString: checker.typeString + unionSeparator + $null.typeString,

		check(value) {
			return $null.check(value) || checker.check(value)
		},

	});
}

function $tuple<T extends Checker[]>(...checkers: T): Checker<ExtractTuple<T>> {
	return new Checker({

		typeString: '[' + checkers.map(Type => Type.typeString).join(', ') + ']',

		check(value) {
			return (
				Array.isArray(value)
				&& value.length === checkers.length
				&& checkers.every((Type, i) => Type.check(value[i]))
			);
		},

	});
}

function $union<T extends Checker[]>(...checkers: T): Checker<CheckerType<T[number]>> {
	return new Checker({

		typeString: checkers.map(type => type.typeString).join(unionSeparator),

		check(value) {
			return checkers.some(type => type.check(value));
		},

	});
}



export {
	Checker,
	type CheckerType,

	$never,
	$undefined,
	$null,
	$boolean,
	$number,
	$string,
	$bigint,
	$symbol,

	$array,
	$object,
	$objectStrict,
	$record,

	$literal,
	$optional,
	$nullable,
	$tuple,
	$union,
};