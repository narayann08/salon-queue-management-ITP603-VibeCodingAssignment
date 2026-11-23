# 01 - Product Brief

## Problem

On weekends, salon customers commonly wait one to two hours without knowing their turn or how much longer they will wait. This creates uncertainty, repeated front-desk questions and avoidable crowding near the waiting area.

The system gives customers a live queue position and expected wait, lets reception manage walk-ins and no-shows, lets barbers manage their chairs, and shows the current queue clearly on a waiting-area TV.

## Users

- **Customer:** joins remotely or by reception, follows the live status, receives a called alert, and cancels when needed.
- **Receptionist/Owner:** protects staff actions with a PIN, manages the waiting list and barbers, adds walk-ins, handles no-shows/cancellations and changes salon settings.
- **Barber:** follows the PIN-protected current-customer flow, starts and completes services, views the next customer, and toggles availability.

## Must-have features

1. **Live salon overview:** show whether the salon is open or closed, the number of people waiting, estimated waiting time and each barber's busy/free/break status.
2. **Remote joining:** validate a 10-digit phone number, select up to three services, choose any barber or one specific barber, preview totals and wait, and join or duplicate-check safely.
3. **Customer status:** show the token, queue position, live countdown, second-position reminder and full-screen turn alert with vibration.
4. **Reception operations:** manage the waiting list, call the next eligible customer for a barber, add walk-ins, mark no-shows and cancel spots.
5. **Barber operations:** show the current customer and timer, control Start/Done transitions, show the next assigned customer and toggle break/availability.
6. **Waiting-area display:** show all barber rows, now-serving information, estimated up-next entries and a short gold flash/chime for newly called tokens.
7. **Owner configuration:** manage bilingual services and prices, barber duty and break states, open/closed state and daily statistics.
8. **Real-time synchronization:** broadcast queue, status and barber changes to customers and operational screens by Socket.IO.

## Don't-build list

- Online payments
- Future-date appointments
- SMS or WhatsApp notifications
- Loyalty programs
- Multiple branches
- Any other feature not required for the seven listed screens

## Look and feel

- Premium salon aesthetic with charcoal `#1F2937` and gold `#D4A017`
- Clean typography, rounded cards and clear hierarchy
- Mobile-first customer screens
- Tablet-optimized reception and barber layouts
- Television layout readable from five metres
- Minimum 44px tap targets on phones
- English and Gujarati labels, with a persistent language toggle backed by one language file
- Gold reserved for primary actions and important status states
