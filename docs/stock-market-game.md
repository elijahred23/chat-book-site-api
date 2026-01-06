# Stock Market Game & Bot Sandbox

A lightweight stock-market simulator with an HTML canvas price board and a programmable bot sandbox.

## How to get there
- Menu → **Stock Market Game** (`/market-sim`)

## Playing the game
- Pick one of 10 stocks from the selector; each has its own price history and portfolio.
- Price updates about once per second with gentle drift and noise.
- Manual actions: Pause/Resume the market, Reset (resets all stocks and portfolios).
- Dashboard shows cash, position, average cost, unrealized P&L, and total equity for the selected stock.

## Writing a bot
1. In the Automation panel, edit the code and click **Start Program**.
2. Define `run(state, api, utils)`; you control the loop and pacing.
3. Use the provided helpers:
   - `state`: `{ price, cash, position, avgCost, tick, history, stocks[] }` (the active stock and an array of all stocks)
   - `api`: `buy(qty)`, `sell(qty)`, `log(message)`, `sleep(ms)`
   - `utils`: `trend` (short-term delta), `volatility` (`0-1` scale)
4. Control flow: use `while` + `await api.sleep(ms)` to tick and act.
5. Multi-stock access: use `state.stocks[index]` to inspect other symbols (price, cash, position, avgCost, history). Trades apply to the currently selected stock in the UI.

## Notes
- Bots run inside `new Function` with a minimal API (not a full sandbox); keep code lightweight.
- Logs show your bot and manual trade events for quick debugging.
- Reset clears portfolio, price history, and logs so you can iterate fast.
