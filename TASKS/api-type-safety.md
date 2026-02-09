# API Type Safety

## Description

Implement strong typings for the API client to enable type-safe consumption of server services. The current APIClient lacks strong types, making it prone to runtime errors and reducing developer experience. Both server and client should be constrained by the same models to ensure consistency. Explore options similar to Swagger's approach for generating API proxies or defining shared models.

**Current State**: The client already has comprehensive type definitions in `client/api-types.d.ts` and `APIClient.ts` uses these types. However, these types are not shared with the server - the server uses its own TypeORM entity definitions with different naming conventions (snake_case vs camelCase) and data types (Date objects vs ISO strings). The goal is to move these client types to `shared/` and make both client and server use the same models.

## Priority

🟡 Medium Priority

## Checklist

- [X] Move existing client types from `client/api-types.d.ts` to `shared/api-models.ts`
- [ ] Create entity transformation utilities in `shared/entity-transforms.ts`
- [ ] Update server routes to use shared types and transformation utilities
- [ ] Update client to import types from `shared/api-models.ts`
- [ ] Verify TypeScript compilation and existing tests pass

## Implementation Notes

- Preferred approach: Option 2 (shared model definitions) for simplicity and direct TypeScript integration
- Ensure models cover all entities: Employee, PTOEntry, MonthlyHours, Acknowledgement, AdminAcknowledgement
- Maintain backward compatibility during transition
- Follow project's TypeScript strict mode and error handling patterns

## Option 2: Shared TypeScript Model Definitions

### Overview
The client already has comprehensive type definitions in `client/api-types.d.ts` that are used by `APIClient.ts`. The goal is to move these existing types to `shared/api-models.ts` so both client and server can use the same models. The server currently uses TypeORM entities with different naming (snake_case) and data types (Date objects), so transformation utilities will be needed to convert between the database entities and the shared API models.

### Step-by-Step Implementation

1. **Move Existing Client Types to Shared**
   The client already has comprehensive type definitions in `client/api-types.d.ts`. Move these to `shared/api-models.ts`:

   ```typescript
   // Copy all interfaces from client/api-types.d.ts to shared/api-models.ts
   // Core entity interfaces (API format - camelCase, string dates)
   export interface Employee {
     id: number;
     name: string;
     identifier: string;
     ptoRate: number;
     carryoverHours: number;
     hireDate: string; // ISO date string
     role: string;
   }

   // ... all other interfaces from client/api-types.d.ts
   ```

2. **Update Client API Types**
   Replace `client/api-types.d.ts` with imports from shared models:

   ```typescript
   // client/api-types.ts (rename from .d.ts to .ts)
   export type {
     Employee,
     PTOEntry,
     PTOStatusResponse,
     CreatePTOEntryRequest,
     PTOCreateResponse,
     PTOUpdateResponse,
     HoursSubmitResponse,
     AcknowledgementSubmitResponse,
     EmployeeCreateResponse,
     EmployeeUpdateResponse,
     GenericMessageResponse,
     ErrorResponse,
   } from '../shared/api-models.js';
   ```

3. **Create Entity Transformation Utilities**
   Create `shared/entity-transforms.ts` to convert between database entities and API models:

   ```typescript
   // shared/entity-transforms.ts
   import { Employee as EntityEmployee, PTOEntry as EntityPTOEntry } from '../server/entities/index.js';
   import { Employee, PTOEntry } from './api-models.js';

   export function serializeEmployee(entity: EntityEmployee): Employee {
     return {
       id: entity.id,
       name: entity.name,
       identifier: entity.identifier,
       ptoRate: entity.pto_rate,
       carryoverHours: entity.carryover_hours,
       hireDate: entity.hire_date.toISOString().split('T')[0], // YYYY-MM-DD format
       role: entity.role,
     };
   }

   export function serializePTOEntry(entity: EntityPTOEntry): PTOEntry {
     return {
       id: entity.id,
       employeeId: entity.employee_id,
       date: entity.date,
       type: entity.type,
       hours: entity.hours,
       createdAt: entity.created_at.toISOString(),
     };
   }
   ```

4. **Update Server Routes**
   Use shared interfaces for type safety and transformation utilities for responses:

   ```typescript
   import { CreatePTOEntryRequest, PTOCreateResponse } from '../shared/api-models.js';
   import { serializePTOEntry } from '../shared/entity-transforms.js';

   app.post('/api/pto', authenticate, async (req, res) => {
     try {
       const requestData: CreatePTOEntryRequest = req.body;

       // Basic type checking (can add more validation as needed)
       if (!requestData.date || typeof requestData.hours !== 'number') {
         return res.status(400).json({ error: 'Invalid request data' });
       }

       // Create entity and save
       const ptoEntry = await createPTOEntry(requestData);

       const response: PTOCreateResponse = {
         message: 'PTO entry created successfully',
         ptoEntry: serializePTOEntry(ptoEntry),
       };

       res.json(response);
     } catch (error) {
       res.status(500).json({ error: 'Internal server error' });
     }
   });
   ```

5. **Update APIClient.ts**
   The client already imports from `api-types.js`, so minimal changes needed after updating the import path.

### Benefits
- **TypeScript-First**: Pure TypeScript interfaces without external dependencies
- **Single Source of Truth**: Models defined once in TypeScript
- **Direct Sharing**: Both client and server import the same interfaces
- **Maintainable**: Changes to models automatically propagate to both sides
- **Lightweight**: No runtime validation overhead

### Challenges & Solutions
- **Entity vs API Models**: Use transformation functions to convert between database entities and API models
- **Date Handling**: Ensure consistent date string formatting (YYYY-MM-DD)
- **Runtime Validation**: Add manual validation in server routes as needed (can be enhanced later)
- **Circular Dependencies**: Keep shared models independent of server/client specific code
- **Build Process**: Ensure shared directory is included in both client and server builds

### Validation Steps
- Verify TypeScript compilation passes for both client and server
- Test API endpoints return properly typed responses
- Confirm client components can import and use shared types
- Run existing tests to ensure no regressions
