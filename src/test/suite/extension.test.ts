import * as assert from 'assert';

import { evalWhen } from '../../extension';

function assertAgreesWithEval(code: string, ops: { log: boolean } = { log: false }) {
  const result = evalWhen(code, {});

  if (ops.log) {
    result.log.forEach(v => console.log(v));
  }

  assert.deepStrictEqual(result.result, eval(code));
}

suite('boolean const', () => {
  test('True is true', () => {
    assertAgreesWithEval('true');
  });

  test('False is false', () => {
    assertAgreesWithEval('false');
  });
});

suite('negation', () => {
  test('True is true', () => {
    assertAgreesWithEval('!false');
  });

  test('False is false', () => {
    assertAgreesWithEval('!true');
  });
});

suite('boolean const', () => {
  test('True is true', () => {
    assertAgreesWithEval('true');
  });

  test('False is false', () => {
    assertAgreesWithEval('false');
  });
});

suite('identifier', () => {
  test('case 1', () => {
    assert.strictEqual(evalWhen('abc', { abc: true }).result, true);
  });

  test('case 2', () => {
    assert.strictEqual(evalWhen('abc', { abc: 'hello world' }).result, 'hello world');
  });

  test('case 3', () => {
    assert.strictEqual(evalWhen('abc && true', { abc: true }).result, true);
  });
});

suite('binary op and', () => {
  test('case 1', () => {
    assertAgreesWithEval('true && true');
  });

  test('case 2', () => {
    assertAgreesWithEval('false && false');
  });

  test('case 3', () => {
    assertAgreesWithEval('true && false');
  });

  test('case 4', () => {
    assertAgreesWithEval('false && true');
  });
});

suite('binary op', () => {
  test('case 1', () => {
    assertAgreesWithEval('true || true');
  });

  test('case 2', () => {
    assertAgreesWithEval('false && true');
  });

  test('case 3', () => {
    assertAgreesWithEval('true ?? false');
  });

  test('case 4', () => {
    assertAgreesWithEval('false == true');
  });

  test('case 5', () => {
    assertAgreesWithEval('false === true');
  });

  test('case 6', () => {
    assertAgreesWithEval('false != true');
  });

  test('case 7', () => {
    assertAgreesWithEval('false !== true');
  });

  test('case 8', () => {
    assertAgreesWithEval('32345 - 9542');
  });

  test('case 9', () => {
    assertAgreesWithEval('32345 + 9542');
  });

  test('case 10', () => {
    assertAgreesWithEval('32345 / 9542');
  });

  test('case 11', () => {
    assertAgreesWithEval('32345 * 9542');
  });

  test('case 12', () => {
    assertAgreesWithEval('32345 ** 9542');
  });

  test('case 13', () => {
    assertAgreesWithEval('32345 % 9542');
  });

  test('case 14', () => {
    assertAgreesWithEval('23455 < 2345');
  });

  test('case 15', () => {
    assertAgreesWithEval('23455 > 2345');
  });

  test('case 16', () => {
    assertAgreesWithEval('23455 >= 2345');
  });

  test('case 17', () => {
    assertAgreesWithEval('23455 <= 2345');
  });

  test('case 18', () => {
    assertAgreesWithEval('23455 << 2345');
  });

  test('case 19', () => {
    assertAgreesWithEval('23455 >> 2345');
  });

  test('case 20', () => {
    assertAgreesWithEval('23455 >>> 2345');
  });

  test('case 21', () => {
    assertAgreesWithEval('23455 & 2345');
  });

  test('case 22', () => {
    assertAgreesWithEval('23455 | 2345');
  });

  test('case 23', () => {
    assertAgreesWithEval('23455 ^ 2345');
  });
});

suite('order of operations', () => {
  test('case 1', () => {
    assertAgreesWithEval('true || false && false');
  });

  test('case 2', () => {
    assertAgreesWithEval('(true || false) && false');
  });
});

suite('parens', () => {
  test('case 1', () => {
    assertAgreesWithEval('(true || false)');
  });

  test('case 1', () => {
    assertAgreesWithEval('(true)');
  });
});

suite('whitespace', () => {
  test('case 1', () => {
    assertAgreesWithEval(' true');
    assertAgreesWithEval(' false');
    assertAgreesWithEval(' true  ');
  });

  test('case 2', () => {
    assertAgreesWithEval(' true || false  ');
    assertAgreesWithEval(' true || false  ');
  });

  test('case 3', () => {
    assertAgreesWithEval(' (true || false)  ');
    assertAgreesWithEval(' true || (false  )');
    assertAgreesWithEval('( true || (false  ))');
  });
});

suite('number', () => {
  test('case 1', () => {
    assertAgreesWithEval('1');
    assertAgreesWithEval('1000');
  });

  test('case 2', () => {
    assertAgreesWithEval('0x1');
    assertAgreesWithEval('0x1000');
  });

  test('case 3', () => {
    assertAgreesWithEval('0b1');
    assertAgreesWithEval('0b1000');
  });

  test('case 4', () => {
    assertAgreesWithEval('1.4');
    assertAgreesWithEval('1000.0432');
    assertAgreesWithEval('1000.');
    assertAgreesWithEval('1.0');
  });

  test('case 4', () => {
    assertAgreesWithEval('NaN');
  });
});

suite('string', () => {
  test('case 1', () => {
    assertAgreesWithEval('""');
  });

  test('case 2', () => {
    assertAgreesWithEval('"hello world"');
  });

  test('case 3', () => {
    assertAgreesWithEval("''");
  });

  test('case 4', () => {
    assertAgreesWithEval("'hello world'");
  });
});
