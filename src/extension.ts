import * as vscode from 'vscode';
import * as gll from './parser';

function dbg(x: any) {
  console.log(x);
  return x;
}

export function activate(context: vscode.ExtensionContext) {
  const vscodeContext = {};

  const setContext = vscode.commands.registerCommand('condmap.setContext', args => {
    Object.assign(vscodeContext, args.context);

    for (const continuation of args.continuation) {
      vscode.commands.executeCommand(continuation.command, continuation.args);
    }
  });

  const executeCommand = vscode.commands.registerCommand('condmap.executeCommand', (commands) => {
    console.log(vscodeContext);
    for (const command of commands) {
      if (!command.when || dbg(evalWhen(command.when, vscodeContext).result)) {
        vscode.commands.executeCommand(command.command, command.args);
        break;
      }
    }
  });

  context.subscriptions.push(setContext);
  context.subscriptions.push(executeCommand);
}

export function deactivate() { }

export function evalWhen(when: string, context: Record<string, unknown>) {
  const result = gll.run(gll.andThen(expr, gll.eol, (a, _) => a), when);

  return { result: result.result?.success ? result.result.exec(context) : undefined, log: result.log };
}

const lparens     = gll.string('(');
const rparens     = gll.string(')');
const singlequote = gll.string("'");
const doublequote = gll.string('"');
const whitespace  = gll.regex(/^\s+/);

const op = gll.or(
  gll.map(gll.string('||'),  () => () => (a: any, b: any) => a || b),
  gll.map(gll.string('&&'),  () => () => (a: any, b: any) => a && b),
  gll.map(gll.string('??'),  () => () => (a: any, b: any) => a ?? b),
  // eslint-disable-next-line eqeqeq
  gll.map(gll.string('=='),  () => () => (a: any, b: any) => a == b),
  gll.map(gll.string('==='), () => () => (a: any, b: any) => a === b),
  // eslint-disable-next-line eqeqeq
  gll.map(gll.string('!='),  () => () => (a: any, b: any) => a != b),
  gll.map(gll.string('!=='), () => () => (a: any, b: any) => a !== b),
  gll.map(gll.string('-'),   () => () => (a: any, b: any) => a - b),
  gll.map(gll.string('+'),   () => () => (a: any, b: any) => a + b),
  gll.map(gll.string('/'),   () => () => (a: any, b: any) => a / b),
  gll.map(gll.string('*'),   () => () => (a: any, b: any) => a * b),
  gll.map(gll.string('**'),  () => () => (a: any, b: any) => a ** b),
  gll.map(gll.string('%'),   () => () => (a: any, b: any) => a % b),
  gll.map(gll.string('<'),   () => () => (a: any, b: any) => a < b),
  gll.map(gll.string('>'),   () => () => (a: any, b: any) => a > b),
  gll.map(gll.string('<='),  () => () => (a: any, b: any) => a <= b),
  gll.map(gll.string('>='),  () => () => (a: any, b: any) => a >= b),
  gll.map(gll.string('<<'),  () => () => (a: any, b: any) => a << b),
  gll.map(gll.string('>>'),  () => () => (a: any, b: any) => a >> b),
  gll.map(gll.string('>>>'), () => () => (a: any, b: any) => a >>> b),
  gll.map(gll.string('&'),   () => () => (a: any, b: any) => a & b),
  gll.map(gll.string('|'),   () => () => (a: any, b: any) => a | b),
  gll.map(gll.string('^'),   () => () => (a: any, b: any) => a ^ b),
);

const keywords = gll.or(
  gll.map(gll.string('true'),  () => () => true),
  gll.map(gll.string('false'), () => () => false),
  gll.map(gll.string('NaN'),   () => () => NaN),
);

const identifier = gll.not(keywords, gll.regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*/));

const string = gll.or(
  gll.between(singlequote, gll.regex(/^[^']*/), singlequote),
  gll.between(doublequote, gll.regex(/^[^"]*/), doublequote),
);

const literal = gll.or(
  gll.map(gll.regex(/^(0(x|b|o))?[0-9]+\.?[0-9]*/), exec => ctx => +(new Number(exec(ctx)))),
  string,
);

const simpleExpr = gll.between(
  gll.optional(whitespace),
  gll.or(
    keywords,
    gll.map(identifier, (exec: any) => (ctx) => ctx[exec(ctx)]),
    literal,
    gll.between(lparens, gll.lazy(() => expr), rparens),
  ),
  gll.optional(whitespace),
);

const expr = gll.or(
  simpleExpr,
  gll.between(
    gll.optional(whitespace),
    gll.lazy(() => binaryOp),
    gll.optional(whitespace)
  ),
  gll.between(
    gll.optional(whitespace),
    gll.lazy(() => prefixOp),
    gll.optional(whitespace)
  ),
);

const binaryOp = gll.map(
  gll.and(
    simpleExpr,
    whitespace,
    op,
    whitespace,
    expr,
  ),
  exec => ctx => {
    const result: any = exec(ctx);

    return result[1][1][0](result[0], result[1][1][1][1]);
  }
);

const prefixOp = gll.map(
  gll.andThen(
    gll.or(
      gll.map(gll.string('!'),  () => () => (a: any) => !a),
      gll.map(gll.string('-'),  () => () => (a: any) => -a),
    ),
    simpleExpr,
  ),
  exec => ctx => {
    const result: any = exec(ctx);

    console.log(result);

    return result[0](result[1][0]);
  }
);