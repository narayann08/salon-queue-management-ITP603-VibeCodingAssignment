# 03 - Flows and Shared Rules

## Shared backend rules module

Queue status transitions, duplicate-phone behavior, token generation, next-customer selection, availability counting and wait calculations must live in one shared backend module. API handlers and Socket.IO broadcasts may call this module but must not duplicate the rules.

## Asia/Kolkata and token rules

- Use the Asia/Kolkata timezone for daily operational boundaries.
- Tokens use `S-1`, `S-2`, etc. in ascending daily order.
- Reset the token sequence each day in Asia/Kolkata.
- A token is never reused during a day after it has been issued.

## Remote join flow

1. Customer enters name, exactly 10-digit phone and one to three services.
2. Customer chooses any barber or a specific barber.
3. Frontend requests a preview from the backend; the backend calculates service total, price and expected wait.
4. Customer confirms.
5. Backend validates salon open state, closing window, phone, service IDs and barber choice.
6. Backend checks for an existing active spot for the normalized phone.
7. If an active spot exists, return it and do not create a token or queue entry.
8. Otherwise create the spot as `Waiting`, assign a sequential token and return the canonical status.
9. Broadcast queue updates and waiting-area changes through Socket.IO.

Duplicate matching must be exact after normalization of spaces and common phone formatting. The API should not accept two active spots for the same phone.

## Walk-in flow

1. Reception opens **+ Add walk-in**.
2. Reception enters customer name, phone and selected services.
3. Reception may choose a preferred barber or any barber.
4. Backend performs the same duplicate active-phone check and joins the customer if allowed.
5. Walk-ins remain available after the normal online joining cutoff and do not depend on the join button's open state.
6. Reception receives the new token and waiting-list update.

## Status transitions

Allowed transitions:

- `Waiting -> Called`
- `Waiting -> Cancelled`
- `Called -> In chair`
- `Called -> No-show`
- `In chair -> Done`

Forbidden transitions include:

- Moving backwards
- `Waiting -> In chair`
- `Waiting -> Done`
- `Called -> Waiting`
- `Called -> Cancelled`
- `In chair -> Waiting/Called/Cancelled`
- `Done -> any status`
- `Cancelled -> any status`
- `No-show -> Waiting` without the re-added arrival flow

Invalid transitions must be rejected atomically with a clear error that identifies the current status and allowed next states.

## Next-customer rules

- “Call next” for barber X selects the earliest `Waiting` customer who either chose X or chose `Any`.
- A customer who chose Ravi is never selectable for a different barber.
- “Earliest” means earliest active queue insertion order/token creation time.
- A barber cannot be called next if already in `In chair`.
- Once called, the customer may be started by that barber.
- Rejected/stale calls must not advance queue order or change status.

## Estimated waiting-time rule

- For a customer, wait is based on backend-computed service durations.
- The denominator is the number of working barbers who are on duty and not on break.
- If no active barbers are available, expected wait is unavailable and joining should be allowed or blocked only according to the backend availability policy.
- Preferred-barber wait may account for that barber's chair/work ahead; generic salon wait uses total remaining service minutes divided by available barbers.
- The UI must display a server-calculated result, not a client-calculated result.

## No-show and late-arrival rules

- A receptionist may mark `Called -> No-show` only for a customer who was called.
- The 10-minute absence period is relevant to this manual no-show action; the receptionist must confirm that 10 minutes have elapsed.
- No-showed customers are removed from the active waiting queue.
- If they arrive later, add them to the end with a new token by running a fresh join/re-add flow.
- Do not reuse the old token or preserve the old queue position.

## Cancellation rules

- `Waiting -> Cancelled` is allowed by the customer or receptionist.
- `Called -> Cancelled` is not allowed.
- Cancelled and no-show entries are inactive and must not contribute to the queue, but remain available in daily history.
- One active spot per normalized phone: cancel/no-show completion releases the phone for a later new join.

## Closing and barber availability rules

- Online joining closes automatically 30 minutes before the configured closing time, default 9 PM Asia/Kolkata.
- Manual owner close disables remote joining and shows a clear closed message.
- Owner/manual closure does not block reception walk-ins.
- A barber on break remains on duty but is removed from the available-barber count.
- A customer who chose a barber on break must see `<Name> is on break`.
- A barber who selected a customer remains on break/available only according to owner/barber action and must not be automatically reassigned.

## Test checklist

1. Verify the home waiting count and estimate update after a join, call, completion or cancellation.
2. Reject a phone with fewer or more than exactly 10 digits.
3. Reject more than three selected services and service/phone submission without required fields.
4. Duplicate join with the same normalized phone returns the existing spot and does not create a second token.
5. Verify waiting totals and price come from server-enabled service definitions, not submitted totals.
6. Verify allowed status transitions and rejection of every listed backwards or skipped transition.
7. Verify first come/first served selection uses queue order across callers.
8. Verify a Ravi preference is not assigned to another barber while the matching rule for `Any` is followed.
9. Verify a barber cannot receive/call a second customer while one is in `In chair`.
10. Verify wait equals remaining service minutes divided by on-duty, non-break barbers.
11. Verify `Called -> No-show` requires Called state and removes the customer from the active queue.
12. Verify a later re-add receives a new token at the end and not the previous token.
13. Verify cancel from Waiting succeeds and cancelled spots do not affect wait/position calculations.
14. Verify tokens are sequential and reset once in the Asia/Kolkata calendar day.
15. Verify online joining is disabled exactly 30 minutes before closing and re-enabled according to opening settings.
16. Verify owner manual close disables remote join but does not block reception walk-ins.
17. Verify barber break removes that barber from the wait denominator and shows the break message to choosing customers.
18. Verify Socket.IO updates all open customer and staff/TV views after each status change and reconnects cleanly.
