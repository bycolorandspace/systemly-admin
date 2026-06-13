Jimmy Buckets
info+jimmy@systemly.ai
Testtest1

Olawunmi Otedola
info+ola@systemly.ai
Testtest1

✅ Sign up -> Choose pro -> Add mt5 account
✅ Run new backtest -> Refine
✅ Run new backtest -> Refine
✅ Run new backtest -> Refine
Go to phase 3

Does test mean that only 5 viable trades were found in that whole time. Are missing out on more?

Ola Otedola
info+tola@systemly.ai
Testtest1

Card number: 4242 4242 4242 4242
Expiry: Any future date (e.g. 12/26)
CVC: Any 3 digits (e.g. 123)
Name/Address: Anything

--------------->

npx inngest-cli@latest dev

curl -X POST https://systemly.vercel.app/api/test/signals/execute \
 -H "Content-Type: application/json" \
 -d '{"signalId": "SIGNAL_ID_FROM_STEP_1"}'

curl -X POST https://systemly.vercel.app/api/mt5/execute-test \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6ImkrUDlrVStEeFZWdFVxM3IiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2t5bHl1bXVnanpmYWRrdmZ4YnpoLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmYjUyMzdhNC0xNjRhLTRjZGMtYWYwNi0xMWViOTQ0YTkzZmEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc1NjE3MjIzLCJpYXQiOjE3NzU2MTM2MjMsImVtYWlsIjoiaW5mbytqaW1teUBzeXN0ZW1seS5haSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJpbmZvK2ppbW15QHN5c3RlbWx5LmFpIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZmI1MjM3YTQtMTY0YS00Y2RjLWFmMDYtMTFlYjk0NGE5M2ZhIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NzUxNDQ2MjN9XSwic2Vzc2lvbl9pZCI6Ijc2ZDNlNTZkLWY3NjgtNGE2ZS05NDA4LTNiMjhhZjNjNmIwNCIsImlzX2Fub255bW91cyI6ZmFsc2V9.A9eFeVBp_lpUYbSkynIlW2wVfDFe5LYgCkezBTWEE74"
 
---------------> TEST

What are we including in the trades test UI?

Befoe unpausing I want to erase past signals from database. Thats because every signal moving forward will be executed via MT unlike before. There needs to be a deliniation.

---------------> TRADES / CCOMMUNITY

Unify watching and execution status updates in community - when watched or exectued in community its not in my own analyses

Community to should show both startaegies and and trades.

Best signals, Best strategies, Popular symbols

Community signals sould be categorized in time created.
Add filter for showing trading style opportunities : swing/day/scalp

---------------> RE EXECUTION ✅

Execute button still not updating when execution has happened. Check that the trade execution table is being read on mouunt of analysis detail page. Show me the route from button to db call.

The folowing applies to exection dialog:
Add current price stream to execution so real time price is compared to signal entry before execution...
Pre-Check what position and entry and account details is being added to MT5 for execution

Click "Execute" → AlertDialog opens (now shows live price + pre-check details)
→ Confirm → POST /api/signals/execute { signalId }
→ Auth (JWT) + tier check (Pro required)
→ SELECT \* FROM market_signal WHERE id = signalId
→ executeTrade() in execution-service.ts
→ getRpcForUser() → mt5_connections → MetaApi RPC
→ getAccountInformation() → balance, currency
→ toBrokerSymbol() → MT5 symbol format
→ Risk-based lot sizing → createMarketBuyOrder/SellOrder
→ INSERT INTO trade_executions (signal_id, order_id, ...)
→ UPDATE market_signal SET status = 'executed' ← FIXED
→ UPDATE test_signals SET execution_status = 'executed'
→ Return { orderId, lotSize, executedPrice }
→ Button → setIsExecuted(true) + onExecuteSuccess() callback

On page mount:
→ checkIsExecuted(id) → SELECT FROM trade_executions WHERE signal_id = id
→ isAlreadyExecuted prop → button renders as "Executed" ✓

---------------> STRATEGY UI CHANGE 🔥

UI and strategy update for new config variables

I need to be able to manipulate test strategies via the UI. Perhaps use a uniform sturcuture

Use Strategy types to update UI configuration and connect with update config service

Add "Watch trade" indicator to EUR/USD

--------------->

So we have all we need for automating signals and auto executiing trades.

Lets discuss and formulate a test on 2 different strategies in-mass that live paper trades.

--------------->

I would like to keep a set of signals regularly auto-generated for community use.

This will allow for user retention when they are alerted of potential opportunities.

It will be efficient because its not done on an individual basis but for all users with a default strategy.

The symbols for which the signals are generated will be tier restricted (still show to all users but inaccessible to respective tier)

The question is where should it live and how does it work?

Should it go in the community and when review/accepted added to users analyses?

What do you think, how do we execute this idea?

Quick Queries for Supabase
Overall progress:

select
status,
outcome,
count(\*)
from test_signals
group by status, outcome
order by status, outcome;

Win rate:
select
count(_) filter (where outcome like 'TP%') as wins,
count(_) filter (where outcome = 'SL*HIT') as losses,
round(
100.0 * count(\_) filter (where outcome like 'TP%') /
nullif(count(\*) filter (where status = 'closed'), 0), 1
) as win_rate_pct
from test_signals;

Daily summary:
select
date(created*at) as day,
count(*) as signals,
count(\_) filter (where status = 'closed') as closed,
count(\*) filter (where outcome like 'TP%') as wins

from test_signals
group by date(created_at)
order by day;

Okay, please remember whre we are with the tests. We'll revisit if neccessary.
I want to add alerts, (in-app and external) when

# Build auto-execution:

User clicks "Analyse EUR/USD"
↓
System fetches candles, runs Claude analysis
↓
Claude returns:

- direction: "BUY"
- entry_price: 1.1520
- entry_type: "limit"
- stop_loss: 1.1485
- take_profit_1: 1.1575
- pre_entry_invalidation: "Break below 1.1470"
  ↓
  User sees analysis, clicks "Execute Trade"
  ↓
  System checks entry_type

# Branch A: Limit/Stop Order

entry_type = "limit" or "stop"
↓
System places pending order via MT5:

- BUY LIMIT @ 1.1520
- SL: 1.1485
- TP: 1.1575
- Expiry: 4 hours (optional)
  ↓
  Order sits with broker
  ↓
  System monitors for invalidation:
- Every 5 mins: Has price broken 1.1470?
  ↓
  If invalidated → Cancel pending order, notify user
  If triggered → Order fills, notify user "Trade opened"

# Branch B: Market Order

entry_type = "market"
↓
System fetches current price: 1.1525
↓
Compare to analysis entry: 1.1520
Difference: 5 pips
↓
Within tolerance (e.g. 10 pips)?

# If YES:

Recalculate R:R with actual entry
↓
Still acceptable (> 1:1)?
↓
YES → Execute market order
NO → Show warning: "R:R now 1:0.8 due to price movement. Continue?"

# If NO (price moved too far):

Show warning:
"Price has moved from 1.1520 to 1.1545 (25 pips).
Entry no longer valid.

Options:
[Place Limit Order at 1.1520]
[Execute at Current Price]
[Cancel]"

User clicks "Execute"
↓
┌───────────────────────┐
│ Check invalidation │
│ level breached? │
└───────────────────────┘
↓ NO ↓ YES
↓ → Block: "Setup invalidated"
↓
┌───────────────────────┐
│ What is entry_type? │
└───────────────────────┘
↓ ↓ ↓
"market" "limit" "stop"
↓ ↓ ↓
↓ └─────┬─────┘
↓ ↓
┌───────────────┐ ┌─────────────────┐
│ Fetch current │ │ Place pending │
│ price │ │ order via MT5 │
└───────────────┘ └─────────────────┘
↓ ↓
┌───────────────┐ ┌─────────────────┐
│ Within │ │ Start monitor │
│ tolerance? │ │ for invalidation│
└───────────────┘ └─────────────────┘
↓ YES ↓ NO ↓
↓ ↓ If invalidated:
↓ ↓ Cancel order
↓ ↓ Notify user
↓ ↓
┌──────────┐ ┌─────────────────────┐
│ Execute │ │ Show options: │
│ market │ │ - Place limit │
│ order │ │ - Execute anyway │
└──────────┘ │ - Cancel │
↓ └─────────────────────┘
┌──────────┐
│ Confirm │
│ to user │
└──────────┘

Every 5 mins:
↓
Check trade status via MT5:

- Still pending? Still open?
- Hit TP1? Hit SL?
  ↓
  If TP1 hit:
- Notify user: "EUR/USD TP1 reached, +£15.50"
- Option: Move SL to breakeven, let TP2 run
  ↓
  If SL hit:
- Notify user: "EUR/USD stopped out, -£10.00"
  ↓
  If pending order invalidated:
- Cancel order
- Notify user: "Setup invalidated, order cancelled"

# Test payment success (renewal)

stripe trigger invoice.payment_succeeded

# Test payment failure (downgrade)

stripe trigger invoice.payment_failed

# Test cancellation

stripe trigger customer.subscription.deleted

curl -X POST http://localhost:3000/api/stripe/create-checkout \
 -H "Content-Type: application/json" \
 -d '{
"priceId": "price_1Svmf4HSUfUPPh4yIzdOWq6x",
"userId": "e6a63483-e68f-4968-a995-c68f4a5cc50b"
}'

{"sessionId":"cs_test_a19QDAglwjSuaDCbIV4k83SJl5rXI8Gs3Sl3ZIXUQTjvYPu4R3UZd2E4AW","url":"https://checkout.stripe.com/c/pay/cs_test_a19QDAglwjSuaDCbIV4k83SJl5rXI8Gs3Sl3ZIXUQTjvYPu4R3UZd2E4AW#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0VnNObUhNVlBjUFVVbTF8TW1vY0JOdkNmSXJQTlx8MkxHUXduc11pUlx0RGxqUTNvb0tqN2o9Y0FzTjRSMEpRfUpvc0RVcU53PH9NVVRkdG1xSVBzaFJBNTViSXx%2FUm5iNycpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyZjY2NjY2MnKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSdga2RnaWBVaWRmYG1qaWFgd3YnP3F3cGB4JSUl"}%

{"sessionId":"cs_test_a1AFQbv5jTCnWsafxJSjWVI1dlHvtVfINjbmAhZenlPg6oxyu9NKpGWTpg","url":"https://checkout.stripe.com/c/pay/cs_test_a1AFQbv5jTCnWsafxJSjWVI1dlHvtVfINjbmAhZenlPg6oxyu9NKpGWTpg#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0VnNObUhNVlBjUFVVbTF8TW1vY0JOdkNmSXJQTlx8MkxHUXduc11pUlx0RGxqUTNvb0tqN2o9Y0FzTjRSMEpRfUpvc0RVcU53PH9NVVRkdG1xSVBzaFJBNTViSXx%2FUm5iNycpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyZjY2NjY2MnKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSdga2RnaWBVaWRmYG1qaWFgd3YnP3F3cGB4JSUl"}%

Using the layout and design of this....

Create a new root home dashboard that lays out a trading system as detailed below.

The dashboard is composed of the following elements and element is a different component.

The data displayed in the dashboard will be populated via an onboarding strategy creator, similar to the user-trade-input.tsx but with more detail. We can work on this form later on.

Use shadcn components for UI and work ith tailwind coniguration and establish design patterns.

Each element header and sub-labels should have a small "i" next to them which is hoverable and reveals a tool tip with short, respective relevant explanations of terms. This has to be centralised in its own component for ease of use and change throughout app. Also all copy must be in one trading-terms-copy.ts file which should be segmented according to page and relevant section using comments.

Now create a dashboard with the following elements:

Element (CTAs):
Calculate Risk - Go to Risk Doctor
Genrate signal - Analyse New Trade

Element (Trading times):
Countdown to preffered trading hours  
Time elapsed on current trading session
Preffered trading hours / Current Trading session (London/New York/Tokyo/Sydney)

Element (Risk monitor):
Account size
Risk per trade
Daily trade limit
Daily loss limit

Element (Trader type):
Trading type

Element (Entry and Exit - tabbed):
Entry check list
Exit check list

Element (Targets):
Weekly PNL Targets
Monthly PNL Targets
Current PNL

---

I want the root to be the users chosen system/strategy, which can be drawn from a database via a hook

That same system page.tsx will be used to show any system detail

How do I reconcile that dual usage?

I want to rename the strategies table to systems
Add primary system bool to database user profile with relational to system table
Add primary system bool to systems database
Use hook to get current system

---

create table public.systems (
id uuid not null default gen_random_uuid (),
user_id uuid not null,
name text not null,
account_size numeric(12, 2) not null,
account_currency text not null,
risk_per_trade numeric(5, 2) not null,
daily_trade_limit integer not null,
daily_loss_limit numeric(5, 2) not null,
trading_type text not null,
weekly_target numeric(12, 2) not null,
monthly_target numeric(12, 2) not null,
trading_windows jsonb not null,
instruments jsonb not null,
entry_checklist jsonb not null,
exit_checklist jsonb not null,
is_primary boolean not null default false,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
constraint systems_pkey primary key (id),
constraint systems_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_systems_user_id on public.systems using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_systems_is_primary on public.systems using btree (user_id, is_primary) TABLESPACE pg_default;

create index IF not exists idx_systems_instruments on public.systems using gin (instruments) TABLESPACE pg_default;

create index IF not exists idx_systems_trading_windows on public.systems using gin (trading_windows) TABLESPACE pg_default;

create unique INDEX IF not exists idx_systems_one_primary_per_user on public.systems using btree (user_id) TABLESPACE pg_default
where
(is_primary = true);

create trigger update_systems_updated_at BEFORE
update on systems for EACH row
execute FUNCTION update_updated_at_column ();

---

I want to create copy for a landing page that succinctly conveys the tools systemly offers and its benefits to potential users.

The are target market are new to novice traders who tend to be part of signal groups and trading commnnities that heavily copy trade. They tend to follow signals from expereinced traders as they learn trading.

The core/lead feature will be generating signals and detailed trade analyse by uploading chart images.

Create a full one page landing copy with including but not limited to about, features, How to use (From signal generation process to copying signals into MT4/5 like they would with a normal copy trade fro a signal community), pricing, FAQs, anything I may have missed.

Place in an MD file for me
