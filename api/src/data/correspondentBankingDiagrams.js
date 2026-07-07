export const correspondentBankingDiagrams = {
  'relationship-map': {
    title: 'Correspondent Relationship Map',
    source: `@startuml
left to right direction
skinparam componentStyle rectangle

actor Customer
component "Respondent Bank" as Respondent
component "Correspondent Bank" as Correspondent
database "Settlement Account" as Settlement
component "Payment Hub" as Hub
cloud "External Rail\\nFedwire / ACH / SWIFT / X9" as Rail
component "Beneficiary Bank" as Beneficiary

Customer --> Respondent : instruction
Respondent --> Hub : validate and approve
Hub --> Correspondent : rail request
Correspondent --> Settlement : liquidity and settlement control
Correspondent --> Rail : formatted message or file
Rail --> Beneficiary : clearing / presentment
Beneficiary --> Rail : status / return / acknowledgement
Rail --> Correspondent : evidence
Correspondent --> Hub : status and reports
Hub --> Respondent : posting instructions
@enduml`,
  },
  'fedwire-iso-sequence': {
    title: 'Fedwire ISO 20022 Sequence',
    source: `@startuml
actor "Bank User" as User
participant "Respondent Core" as Core
participant "Payment Hub" as Hub
participant "Sanctions/Fraud" as Risk
participant "Correspondent Bank" as Corr
participant "Fedwire" as Fed

User -> Core : create wire request
Core -> Hub : payment instruction
Hub -> Risk : screen parties and purpose
Risk --> Hub : pass / review / reject
Hub -> Hub : build head.001 + pacs.008
Hub -> Corr : submit ISO message
Corr -> Fed : send pacs.008
Fed --> Corr : pacs.002 status
Corr --> Hub : accepted / rejected / settled
Hub -> Core : post status and accounting
Core --> User : confirmation and reference IDs
@enduml`,
  },
  'iso-family-map': {
    title: 'ISO Message Family Map',
    source: `@startmindmap
* ISO 20022 in correspondent banking
** pain
*** Customer initiation
*** Customer status
*** Cancellation requests
** pacs
*** Interbank credit transfer
*** Bank-to-bank transfer
*** Status report
*** Return
** camt
*** Statements
*** Debit/credit notifications
*** Recall and investigation
*** Case response
** head
*** Business application header
** admi
*** Technical acknowledgement
*** Technical rejection
@endmindmap`,
  },
  'status-state-machine': {
    title: 'Status Lane State Machine',
    source: `@startuml
[*] --> Created
Created --> Validated
Validated --> Approved
Approved --> Screened
Screened --> Serialized
Serialized --> Queued
Queued --> Delivered
Delivered --> TechnicallyAcknowledged
TechnicallyAcknowledged --> BusinessAccepted
BusinessAccepted --> Settled
Settled --> Posted
Posted --> Reconciled

Validated --> Rejected
Screened --> ManualReview
ManualReview --> Approved
ManualReview --> Rejected
BusinessAccepted --> Returned
Settled --> RecallRequested
RecallRequested --> RecallAnswered
Returned --> Reconciled
Rejected --> [*]
Reconciled --> [*]
@enduml`,
  },
  'ach-file-structure': {
    title: 'ACH File Structure',
    source: `@startuml
object "ACH File" as File
object "File Header" as FileHeader
object "Batch Header" as BatchHeader
object "Entry Detail" as Entry
object "Addenda" as Addenda
object "Batch Control" as BatchControl
object "File Control" as FileControl

File *-- FileHeader
File *-- BatchHeader
BatchHeader *-- Entry
Entry *-- Addenda
File *-- BatchControl
File *-- FileControl

FileHeader : immediate destination
FileHeader : immediate origin
BatchHeader : company ID
BatchHeader : SEC code
Entry : RDFI routing
Entry : account number
Entry : amount
Addenda : remittance detail
BatchControl : totals and counts
FileControl : file totals and hash
@enduml`,
  },
  'ach-return-flow': {
    title: 'ACH Return Flow',
    source: `@startuml
actor Originator
participant ODFI
participant "ACH Operator" as Operator
participant RDFI
actor Receiver

Originator -> ODFI : payment file
ODFI -> Operator : ACH batch
Operator -> RDFI : entry
RDFI -> Receiver : post debit or credit
RDFI --> Operator : return entry if needed
Operator --> ODFI : return code
ODFI --> Originator : return report
@enduml`,
  },
  'check-image-presentment': {
    title: 'Check Image Presentment',
    source: `@startuml
start
:Capture front and back image;
:Read MICR line;
if (Image quality passes?) then (yes)
  :Detect duplicates;
  if (Duplicate?) then (yes)
    :Route to exception queue;
  else (no)
    :Build X9 image cash letter;
    :Send to image exchange partner;
    :Receive presentment status;
    :Post or adjust account;
  endif
else (no)
  :Repair or reject item;
endif
stop
@enduml`,
  },
  'exception-investigation-loop': {
    title: 'Exception And Investigation Loop',
    source: `@startuml
participant "Originating Bank" as Origin
participant "Correspondent Bank" as Corr
participant "Receiving Bank" as Receive
database "Case Management" as Case
database "Reconciliation" as Recon

Origin -> Corr : original pacs.008 / pacs.009
Corr -> Receive : payment message
Origin -> Corr : camt.056 recall request
Corr -> Receive : recall request
Receive --> Corr : camt.029 response
Corr --> Origin : recall response
alt funds returned
  Receive -> Corr : pacs.004 return
  Corr -> Origin : return and accounting evidence
else no return
  Corr -> Case : record refusal or investigation notes
end
Corr -> Recon : match original IDs, return IDs, statements
@enduml`,
  },
  'liquidity-controls': {
    title: 'Liquidity And Settlement Controls',
    source: `@startuml
left to right direction
rectangle "Respondent Bank" as Resp {
  component "Payment Requests" as Requests
  component "Approval Limits" as Limits
}
rectangle "Correspondent Bank" as Corr {
  database "Settlement Account" as Account
  component "Intraday Liquidity Monitor" as Liquidity
  component "Credit Line Controls" as Credit
}
cloud "Rail Operator" as Rail

Requests --> Limits
Limits --> Liquidity : projected debit
Liquidity --> Account : available balance check
Liquidity --> Credit : credit availability check
Liquidity --> Rail : release if funded or approved
Rail --> Account : settlement debit or credit
@enduml`,
  },
  'reconciliation-evidence-model': {
    title: 'Reconciliation Evidence Model',
    source: `@startuml
entity Payment {
  * payment_id
  --
  rail
  amount
  currency
  current_status
}

entity Message {
  * message_id
  --
  payment_id
  message_type
  original_message_id
  uetr
}

entity StatusEvent {
  * status_event_id
  --
  payment_id
  source
  status
  received_at
}

entity LedgerEntry {
  * ledger_entry_id
  --
  payment_id
  account
  debit_credit
  amount
}

entity ExternalReport {
  * report_id
  --
  rail
  report_type
  business_date
}

Payment ||--o{ Message
Payment ||--o{ StatusEvent
Payment ||--o{ LedgerEntry
ExternalReport ||--o{ StatusEvent
ExternalReport ||--o{ LedgerEntry
@enduml`,
  },
  'platform-placement': {
    title: 'Fiserv-Style Platform Placement',
    source: `@startuml
package "Bank Channels" {
  [Branch Wire Screen]
  [Online Banking]
  [Treasury Portal]
}

package "Fiserv-style Bank Platform" {
  [Core Banking]
  [Wire Operations]
  [ACH Origination]
  [Item Processing]
  [Reports and Audit]
}

package "Shared Controls" {
  [Limits]
  [Approvals]
  [Sanctions Screening]
  [Fraud Rules]
}

package "External Networks" {
  [Fedwire]
  [ACH Operator]
  [SWIFT]
  [Image Exchange]
}

[Branch Wire Screen] --> [Wire Operations]
[Online Banking] --> [ACH Origination]
[Treasury Portal] --> [ACH Origination]
[Wire Operations] --> [Limits]
[ACH Origination] --> [Approvals]
[Item Processing] --> [Fraud Rules]
[Wire Operations] --> [Fedwire]
[ACH Origination] --> [ACH Operator]
[Wire Operations] --> [SWIFT]
[Item Processing] --> [Image Exchange]
[Wire Operations] --> [Core Banking]
[ACH Origination] --> [Core Banking]
[Item Processing] --> [Core Banking]
@enduml`,
  },
  'daily-operations-close': {
    title: 'Daily Operations Close',
    source: `@startuml
start
:Collect rail reports;
:Collect correspondent statements;
:Collect core posting journals;
:Match payment IDs and trace IDs;
if (All totals balance?) then (yes)
  :Archive evidence;
  :Publish close report;
else (no)
  :Open reconciliation exceptions;
  :Assign owner and SLA;
  :Resolve or carry forward;
endif
stop
@enduml`,
  },
};

export function getCorrespondentBankingDiagram(diagramId) {
  return correspondentBankingDiagrams[diagramId] || null;
}
