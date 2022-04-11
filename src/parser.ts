type Context = Record<string, unknown>;
type Exec = (context: Context) => unknown;
type ParseResult = { success: true, tokens: string, exec: Exec } | { success: false };
type Continuation = (_: ParseResult) => void;
type Parser = (tokens: string, pushStack: (parser: Parser, tokens: string, continuation: Continuation) => void, continuation: Continuation, log: (_: unknown) => void) => void;

export function run(parser: Parser, tokens: string): { result: ParseResult | undefined, log: string[] } {
  const logger: string[] = [];

  function log(msg: unknown) {
    logger.push(JSON.stringify(msg, null, 2));
  }

  const trampoline = new Array<() => void>();
  const memo = new WeakMap<Parser, Record<string, { results: ParseResult[], continuations: Continuation[] }>>();

  function pushStack(parser: Parser, tokens: string, continuation: Continuation) {
    const parserMemo = memo.get(parser) || {};
    memo.set(parser, parserMemo);

    const memoized = parserMemo[tokens];

    if (memoized) {
      memoized.results.forEach(result => trampoline.push(() => continuation(result)));
      memoized.continuations.push(continuation);
    } else {
      parserMemo[tokens] = { results: [], continuations: [continuation] };

      trampoline.push(() => parser(tokens, pushStack, (result) => {
        parserMemo[tokens].continuations.forEach(cont => trampoline.push(() => cont(result)));
        parserMemo[tokens].results.push(result);
      }, log));
    }
  }

  let result: ParseResult | undefined;
  let stack: (() => void) | undefined = () => { parser(tokens, pushStack, r => result = r, log); };

  while(stack) {
    stack();

    if (result?.success || trampoline.length <= 0) {
      return { result, log: logger };
    }

    stack = trampoline.shift();
  }

  return { result, log: logger };
}

export function or(...parsers: Parser[]): Parser {
  return (tokens, pushStack, continuation, log) => {
    for (const parser of parsers) {
      pushStack(parser, tokens, continuation);
    }
  };
}

export function and(...parsers: Parser[]): Parser {
  const [parser, ...rest] = parsers;

  if (rest.length === 0) {
    return parser;
  }

  return andThen(parser, and(...rest));
}

export function andThen(a: Parser, b: Parser, map?: (_0: Exec, _1: Exec) => Exec): Parser {
  return (tokens, pushStack, cont, log) => {
    pushStack(a, tokens, (ra) => {
      if (ra.success) {
        pushStack(b, ra.tokens, (rb) => {
          if (rb.success) {
            map = map || ((a, b) => (ctx) => [a(ctx), b(ctx)]);
            cont({ success: true, tokens: rb.tokens, exec: map(ra.exec, rb.exec) });
          } else {
            cont(rb);
          }
        });
      } else {
        cont(ra);
      }
    });
  };
}

export function map(a: Parser, mapper: (_: Exec) => Exec): Parser {
  return (tokens, pushStack, cont) => {
    pushStack(a, tokens, (ra) => {
      if (ra.success) {
        cont({ success: true, tokens: ra.tokens, exec: mapper(ra.exec) });
      } else {
        cont(ra);
      }
    });
  };
}

export function not(a: Parser, b: Parser): Parser {
  return (tokens, pushStack, cont) => {
    pushStack(a, tokens, (ra) => {
      if (ra.success) {
        cont({ success: false });
      } else {
        pushStack(b, tokens, cont);
      }
    });
  };
}

export function optional(a: Parser): Parser {
  return or(
    a,
    epsilon,
  );
}

export const epsilon: Parser = (tokens, _, cont) => {
  cont({ success: true, tokens, exec: () => 'epsilon' });
};

export function between(left: Parser, a: Parser, right: Parser): Parser {
  return map(and(left, a, right), (expr) => (ctx) => {
    const result: any = expr(ctx);
    return result[1][0];
  });
}

export function lazy(parser: () => Parser): Parser {
  let cached: Parser | undefined;

  return (tokens, trampoline, continuation, log) => {
    if (!cached) {
      cached = parser();
    }

    return cached(tokens, trampoline, continuation, log);
  };
}

export const eol: Parser = (tokens, _, cont) => {
  if (tokens === '') {
    cont({ success: true, tokens, exec: () => 'eol' });
  } else {
    cont({ success: false });
  }
};

export function regex(regex: RegExp): Parser {
  return (tokens, _, continuation) => {
    const match = tokens.match(regex);

    if (match) {
      continuation({ success: true, tokens: tokens.slice(match[0].length), exec: () => match[0] });
    } else {
      continuation({ success: false });
    }
  };
}

export function string(val: string): Parser {
  return (tokens, _, continuation) => {
    if (tokens.startsWith(val)) {
      continuation({ success: true, tokens: tokens.slice(val.length), exec: () => val });
    } else {
      continuation({ success: false });
    }
  };
}