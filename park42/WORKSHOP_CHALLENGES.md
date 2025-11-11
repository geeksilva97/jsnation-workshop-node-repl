# Park42 Console Workshop Challenges

Welcome to the Park42 Console Workshop! This workshop guides you through building an interactive Node.js REPL console with custom commands and database integration.

## Overview

The workshop is organized into progressive challenges, each building on the previous one. Each challenge has a corresponding Git branch where you can start fresh.

---

## Challenge 1: Add a Name Variable and Custom Command

**Branch:** `console-challenge-1`

### Objective

Expose a `name` variable in the REPL context and create a custom command `.mycommand`.

### Tasks

1. **Add the `name` variable**
   - The REPL should expose a variable called `name` with the value `"JSNation"`
   - When a user types `name` in the REPL, it should output `'JSNation'`

2. **Add a custom command `.mycommand`**
   - Define a REPL command called `.mycommand`
   - When executed, it should print: `"Hello Node REPL"`
   - After execution, the REPL prompt should be displayed again

### Success Criteria

- Running `name` in the console outputs `'JSNation'`
- Running `.mycommand` prints `"Hello Node REPL"` and displays the prompt

### Hints

- Use `Object.assign(r.context, { ... })` to add variables to the REPL context
- Use `r.defineCommand()` to define custom commands
- Use `console.log()` to print output
- Use `this.displayPrompt()` to show the prompt again after a command

### Test Command

```bash
npx tsx src/console.test.ts
```

Expected output: ✅ Test 1 and 2 should pass

---

## Challenge 2: Implement REPL Rollback Behavior

**Branch:** `console-challenge-2`

### Objective

Implement transaction rollback on REPL session close. This challenge focuses purely on Node.js REPL event handling - the transaction and sandbox flag detection are already set up!

### Context

The Park42 application needs a safe way for users to experiment with data without persisting changes. This is useful for:
- Learning and training (this workshop!)
- Testing queries without affecting production data
- Temporary exploration

The key is ensuring that when a user ends their REPL session (by typing `.exit`), all changes are automatically rolled back.

### Task

**Implement rollback on REPL exit**
- When the user types `.exit`, the `r.on("exit", ...)` event fires
- Check if sandbox mode is enabled AND a transaction exists
- If yes: call `await trx.rollback()` to discard all changes
- This is the core REPL behavior you need to implement

### What's Already Done

✓ Sandbox flag detection: `process.argv.includes("--sandbox")`  
✓ Transaction creation: `await database.connection.transaction()`  
✓ Challenge 1 solution: name variable and .mycommand  
✓ All REPL context setup  

### Success Criteria

- Running `npx tsx src/console.ts --sandbox` works without errors
- When `.exit` is typed, the REPL exits and transaction is rolled back
- Test 3 passes: "Sandbox mode rolls back changes when session closes"

### Hints

- The sandbox flag is stored in: `isSandbox`
- The transaction is stored in: `trx`
- Use the REPL `exit` event: `r.on("exit", async () => { ... })`
- Implement: `if (isSandbox && trx) { await trx.rollback(); }`

### Optional: Advanced Feature

After completing the main task, you might be interested in the `bindModels(trx)` function available at `src/interface/console/index.ts`. This function binds all models to a transaction so queries automatically use it - but that's beyond the scope of this challenge!

### Test Command

```bash
npx tsx src/console.test.ts
```

Expected output: ✅ All 3 tests should pass

---

## Running the Workshop

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Setup database: `npm run dev:db:setup`

### Per Challenge

1. Checkout the challenge branch: `git checkout console-challenge-1`
2. Read the challenge description above
3. Implement the required changes in `src/console.ts`
4. Run tests to verify: `npx tsx src/console.test.ts`
5. When complete, checkout the next challenge branch

### File to Edit

- **Main file**: `src/console.ts`
- **Test file (read-only)**: `src/console.test.ts`
- **Helper file (read-only)**: `tests/support/index.ts`

---

## Key Concepts Covered

- **Node.js REPL API**: Creating custom REPLs with `node:repl`
- **Custom Commands**: Defining reusable REPL commands
- **Database Transactions**: Ensuring data consistency and rollback on error
- **Model Binding**: Scoping queries to specific database contexts
- **Error Handling**: Graceful cleanup when sessions close

---

## Additional Resources

- [Node.js REPL Documentation](https://nodejs.org/api/repl.html)
- [Objection.js Documentation](https://vincit.github.io/objection.js/)
- [Knex.js Transactions](https://knexjs.org/guide/transactions.html)
