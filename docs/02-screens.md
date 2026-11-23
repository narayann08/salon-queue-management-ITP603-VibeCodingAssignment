# 02 - Screens

Every screen must use a shared header theme, EN/GU labels and an accessible loading/error state. Data and queue calculations must be received from the backend; clients must not calculate authoritative totals or positions.

## 1. Home

- **URL:** `/`
- **User:** Customer
- **Layout:**
  - Mobile: one-column card stack with compact header and thumb-friendly join action
  - Tablet/Desktop: centered content with two or three salon summary columns
- **UI, top to bottom:**
  1. Salon name
  2. EN/GU language toggle
  3. Open/Closed badge
  4. Live card showing waiting count and estimated wait
  5. Barber chips showing `Busy`, `Free` or `On break`
  6. Gold **Join Queue** button
- **Join Queue behaviour:** open `/join` when joining is allowed; otherwise show a clear closed/closing-soon message and keep the button disabled.
- **Empty state:** show “No customers waiting” instead of a zero queue card if the queue is empty.
- **Error state:** show a retryable connection error without inventing queue numbers.

## 2. Join Queue

- **URL:** `/join`
- **User:** Customer
- **Layout:**
  - Mobile: grouped stacked sections and a sticky live summary/Confirm area
  - Tablet/Desktop: form and live summary side by side
- **UI, top to bottom:**
  1. Back or close control
  2. Name field
  3. Phone field, requiring exactly 10 digits
  4. Service cards with English/Gujarati name, minutes and price; allow up to three selections
  5. Barber picker with **Any barber (fastest)** and barber cards
  6. Live summary: backend-calculated total minutes, price and expected wait
  7. Gold **Confirm** button
- **Confirm behaviour:** validate locally for fast feedback, submit to the backend and navigate to `/status/:id` on success.
- **Duplicate behaviour:** if the phone already has an active spot, return that existing spot and navigate to its status without creating a new token.
- **Empty state:** show “No services available” and disable Confirm if no enabled services exist.
- **Error states:** phone format, no service selected, over-three-service limit, service disabled, preferred barber unavailable/on break, barber on duty change and joining closed. Keep entered values intact and explain the server rejection.

## 3. My Status

- **URL:** `/status/:id`
- **User:** Customer
- **Layout:** single mobile-first status card, with large token and countdown on the main axis.
- **UI, top to bottom:**
  1. Salon name and live sync indicator
  2. Large token such as `S-14`
  3. Position such as `4th in line`
  4. Circular countdown showing live expected wait
  5. English/Gujarati status label
  6. Gold **Cancel my spot** button
- **Live behaviour:** update position/countdown through Socket.IO and refresh from the backend after reconnect.
- **Second-position banner:** at second place, show “Start coming to the salon.”
- **Called state:** replace the normal screen with a full-screen gold **It's your turn! Go to <barber>** alert, pulse animation and phone vibration where supported.
- **Cancel behaviour:** open a confirmation dialog; confirmed cancellation calls the backend and closes the status with a clear cancelled state.
- **Empty/error state:** if the spot does not exist or is completed/cancelled, show a resolved-state screen and a link back home. Do not expose another customer's status.

## 4. Reception

- **URL:** `/reception`
- **User:** Receptionist/Owner
- **Access:** PIN-protected in portrait and required in landscape.
- **Layout:** tablet landscape with barber cards on the left and waiting list on the right; compact fallback stack on portrait/tablet.
- **Top area:** **+ Add walk-in** quick form and EN/GU toggle.
- **Barber cards:** name/status, current customer, time remaining and gold **Call next** button.
- **Waiting list columns:** token, name, services, preferred barber, waiting time and actions.
- **Call next behaviour:** call the earliest eligible waiting customer for the selected barber according to the shared next-customer rules.
- **Action behaviour:** **No-show** acts only on an eligible Called spot; **Cancel** moves an active spot to Cancelled after confirmation.
- **Highlight:** waiting entries over 60 minutes use an amber row/background and icon.
- **Empty state:** show “Waiting list is empty” and disabled/unavailable next calls where appropriate.
- **Error state:** reject stale or invalid actions and display the exact backend transition error.

## 5. Barber View

- **URL:** `/barber/:name`
- **User:** Barber
- **Access:** PIN-protected.
- **Layout:** phone portrait first, with large current-customer and action controls; tablet can use two columns.
- **UI, top to bottom:**
  1. Barber name/status
  2. On break / Available toggle
  3. Current customer and start time
  4. Live timer
  5. Big **Start** button, then big **Done** button
  6. Next customer card: token, name and services
- **Start behaviour:** move one current Called customer to In chair only if no other chair is occupied by this barber.
- **Done behaviour:** move In chair to Done and clear the chair.
- **Break behaviour:** persist on-break state; customer-specific status can show `<Name> is on break` for customers who chose that barber.
- **Empty state:** show “No customer in chair” and “No next customer.”
- **Error state:** show the backend transition/occupancy error and disable conflicting actions.

## 6. Waiting-Area TV

- **URL:** `/display`
- **User:** Waiting-area audience
- **Access:** no navigation or PIN.
- **Layout:** fixed 1920x1080, but scale responsively for other TV resolutions.
- **UI:**
  1. A row per on-duty barber with photo, name and `Now: S-12` or empty state
  2. Up Next list of five tokens with estimated times
  3. Newly called token in a gold flash and supported chime
- **Live behaviour:** update through Socket.IO and refetch on reconnect.
- **Empty state:** show “No customers in chair” and “Queue is empty” while retaining large readable typography.
- **Error state:** show a full-width reconnecting indicator rather than stale or fabricated values.

## 7. Owner Settings

- **URL:** `/admin`
- **User:** Owner
- **Access:** PIN-protected.
- **Layout:** mobile single-column sections; tablet/desktop two-column settings and stats.
- **UI, top to bottom:**
  1. Open/Closed switch for online joining
  2. Service management: list, create/edit, name English, name Gujarati, minutes, price and on/off
  3. Barber on-duty toggle and break status
  4. Today's stats: customers served, average wait and no-show count
- **CRUD behaviour:** create and edit services; toggle active/disabled state without deleting historical records.
- **Barber behaviour:** on-duty toggle updates availability immediately through the backend.
- **Open/Closed behaviour:** queue closing can override the calculated automatic closing window.
- **Error state:** show per-row save errors and keep unsaved values in place.
