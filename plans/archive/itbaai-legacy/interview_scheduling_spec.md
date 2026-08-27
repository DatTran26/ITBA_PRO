# Interview Scheduling Specification

## Recommended Ownership

**Primary owner of interview scheduling: HR**

Interview scheduling should be treated as a **pipeline coordination task**, so the main owner should be **HR**.  
**Interviewer** should be the assigned evaluator, not the default scheduler.

---

## Role Responsibilities

### HR
HR is responsible for:

- selecting the candidate for interview
- initiating the interview scheduling action
- selecting the assigned interviewer
- setting interview date/time
- adding scheduling notes if needed
- updating candidate status to `Interview Scheduled`
- rescheduling or cancelling the interview if needed
- continuing the pipeline after interview results are submitted

### Interviewer
Interviewer is responsible for:

- viewing interviews assigned to them
- reviewing candidate information, CV, JD, and related notes
- conducting the interview
- submitting interview results in the system:
  - `Pass`
  - `Fail`
  - interview notes / comments

### Admin
Admin has full permissions and can perform both HR and Interviewer actions when needed.

---

## Recommended Flow

### Step 1 — HR reviews candidate
**Role owner:** HR

HR reviews the candidate after CV screening and decides whether the candidate should move to the interview stage.

### Step 2 — HR schedules interview
**Role owner:** HR

HR clicks **Schedule Interview** and enters:

- assigned interviewer
- interview date/time
- optional note

### Step 3 — System creates interview assignment
**Role owner:** System

The system creates an interview assignment record and updates candidate status to:

- `Interview Scheduled`

### Step 4 — Interviewer receives assigned task
**Role owner:** Interviewer

Interviewer logs into the system and sees the assigned interview in their dashboard/task list.

### Step 5 — Interviewer conducts interview
**Role owner:** Interviewer

Interviewer performs the interview based on the assigned schedule.

### Step 6 — Interviewer submits result
**Role owner:** Interviewer

Interviewer submits the interview outcome in the system:

- `Pass`
- `Fail`
- optional note / evaluation comments

### Step 7 — HR continues the pipeline
**Role owner:** HR

Based on the submitted result, HR continues the recruitment pipeline to the next stage, such as:

- `Passed`
- `Failed`
- `Offered`

---

## Permission Rule

### Default rule
- **HR creates and manages interview schedules**
- **Interviewer handles assigned interviews and submits results**

### Optional future enhancement
If needed later, the system may allow **Interviewer** to:

- request rescheduling
- update scheduling notes for interviews already assigned to them
- propose a new time slot

However, this should be treated as a future enhancement, not the default MVP behavior.

---

## Final Decision Statement

Interview scheduling is primarily owned by **HR**.  
Interviewer is the assigned evaluator who reviews the candidate and submits interview results after the scheduled interview.
