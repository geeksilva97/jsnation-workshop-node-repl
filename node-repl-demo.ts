import * as repl from 'node:repl';

const r = repl.start('jsnation> ');

Object.assign(r.context, {
  message: 'Hello'
});

r.defineCommand('bye', {
  help: 'Exit the REPL',
  action() {
    console.log('Goodbye!');
    this.close();
  }
});
