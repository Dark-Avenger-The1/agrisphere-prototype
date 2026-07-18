# Domain Data Model

Use this as a starting point for schemas, app state, APIs, and sample data.

## Core Actors

- Farmer or farm business
- Cooperative or association
- Waste/feedstock supplier
- Processor: composter, biochar producer, digester, insect farm, mill, recycler
- Buyer: farm input buyer, livestock/aquaculture feed buyer, food company, local government, carbon project developer
- Verifier: lab, certifier, extension worker, NGO, auditor
- Logistics provider

## Core Entities

- Organization: name, type, location, contact, verification status
- Site: organization, coordinates, area, facilities, storage constraints
- Feedstock: type, source, volume, timing, contamination risk, moisture, price
- Batch: inputs, processing method, dates, quality checks, outputs
- Product: compost, biochar, frass, digestate, feed ingredient, biomass material, service
- Transaction: parties, quantity, price, pickup/delivery, documents, status
- Activity record: farm practice, waste diversion, processing event, application, transport
- Evidence: photo, receipt, lab result, certificate, geotag, timestamp, source document
- Impact metric: waste diverted, nutrient recovered, emissions estimate, input cost saved, yield effect

## Common Statuses

- Draft
- Pending verification
- Available
- Matched
- Scheduled
- In transit
- Processed
- Delivered
- Rejected
- Reported

## Design Notes

- Keep audit fields on anything that supports payments, certification, or impact claims.
- Model quality uncertainty explicitly: grade, confidence, test date, and caveat.
- Store units carefully and normalize internally.
- Expect offline or low-connectivity capture for field workflows.
