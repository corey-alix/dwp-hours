# Lift README Aspects to Skills

## Description

The DWP Hours Tracker application is nearly complete, with comprehensive documentation in README.md covering various implementation details, patterns, and best practices. To improve maintainability and provide better reference for future development, extract key technical sections from README.md into dedicated skill documents in the `.github/skills/` folder. This will create reusable knowledge bases that can be referenced by specialized assistants for specific development tasks.

## Priority

🟢 Low Priority

## Checklist

### Phase 1: Analysis and Planning

- [x] Review README.md sections for skill-worthy content
- [x] Identify overlapping or complementary existing skills
- [x] Determine which sections should become new skills vs. enhance existing ones
- [x] Create mapping of README sections to skill documents

**Mapping of README Sections to Skills/Documents:**

| README Section                           | Action                  | Target                                          |
| ---------------------------------------- | ----------------------- | ----------------------------------------------- |
| PTO Calculation Rules                    | Create new skill        | `pto-calculation-rules-assistant`               |
| Date Management                          | Create new skill        | `date-management-assistant`                     |
| DOM Utilities                            | Create new skill        | `dom-utilities-assistant`                       |
| Notification System                      | Create new skill        | `notification-system-assistant`                 |
| Theming System                           | Enhance existing skill  | `css-theming-assistant`                         |
| Development Best Practices and Learnings | Create new skill        | `development-best-practices-assistant`          |
| Prior Year Review Component              | Create component README | `client/components/prior-year-review/README.md` |
| Architecture                             | Enhance existing skill  | `architecture-guidance`                         |

### Phase 2: PTO Calculation Rules Skill

- [x] Create new skill: `pto-calculation-rules-assistant`
- [x] Extract PTO calculation logic, business rules, and accrual formulas
- [x] Include examples of PTO balance calculations and work day determination
- [x] Document carryover rules, reset policies, and type-specific tracking

### Phase 3: Date Management Skill

- [x] Create new skill: `date-management-assistant`
- [x] Extract date handling patterns, YYYY-MM-DD string usage, and timezone avoidance strategies
- [x] Document custom date utility functions and conversion patterns
- [x] Include database storage guidelines and client-side date construction

### Phase 4: DOM Utilities Skill

- [x] Create new skill: `dom-utilities-assistant`
- [x] Extract DOM manipulation patterns and utility function usage
- [x] Document type-safe element queries and error handling approaches
- [x] Include examples of event listener management and element creation

### Phase 5: Notification System Skill

- [x] Create new skill: `notification-system-assistant`
- [x] Extract toast notification implementation and usage patterns
- [x] Document notification types, auto-dismiss behavior, and accessibility features
- [x] Include integration guidelines for test-friendly notifications

### Phase 6: Theming System Skill

- [x] Enhance existing `css-theming-assistant` skill
- [x] Extract comprehensive theming implementation details from README
- [x] Document semantic color naming, CSS custom properties hierarchy, and theme switching
- [x] Include component adaptation plan and theming tips for consistency

### Phase 7: Development Best Practices Skill

- [x] Create new skill: `development-best-practices-assistant`
- [x] Extract all "Development Best Practices and Learnings" content
- [x] Organize by categories: Code Quality, Testing, Architecture, Performance, Documentation
- [x] Include CI/CD patterns and quality assurance guidelines

### Phase 8: Prior Year Review Component README

- [x] Create component README: `client/components/prior-year-review/README.md`
- [x] Extract component architecture, color-coding schemes, and integration details
- [x] Document responsive grid layout and historical data visualization patterns

### Phase 8.1: Additional Component READMEs

- [x] Create component README: `client/components/admin-panel/README.md`
- [x] Create component README: `client/components/confirmation-dialog/README.md`
- [x] Create component README: `client/components/data-table/README.md`
- [x] Create component README: `client/components/employee-form/README.md`
- [x] Create component README: `client/components/employee-list/README.md`
- [x] Create component README: `client/components/pto-accrual-card/README.md`
- [x] Create component README: `client/components/pto-bereavement-card/README.md`
- [x] Create component README: `client/components/pto-calendar/README.md`
- [x] Create component README: `client/components/pto-dashboard/README.md`
- [x] Create component README: `client/components/pto-employee-info-card/README.md`
- [x] Create component README: `client/components/pto-entry-form/README.md`
- [x] Create component README: `client/components/pto-jury-duty-card/README.md`
- [x] Create component README: `client/components/pto-request-queue/README.md`
- [x] Create component README: `client/components/pto-sick-card/README.md`
- [x] Create component README: `client/components/pto-summary-card/README.md`
- [x] Create component README: `client/components/report-generator/README.md`

### Phase 9: Architecture Overview Skill

- [x] Enhance existing `architecture-guidance` skill
- [x] Extract high-level architecture details, tech stack choices, and component relationships
- [x] Document database schema overview and ORM patterns
- [x] Integrate with existing guidance patterns for design decisions

### Phase 10: README Cleanup and Validation

- [x] Remove extracted content from README.md, replacing with references to skill documents
- [x] Update README.md links to point to new skill documents
- [x] Validate that all skill documents are accessible and properly formatted
- [x] Test that skill assistants can reference the new documents

## Implementation Notes

- **Skill Structure**: Follow the existing skill format with clear descriptions, file paths, and focused expertise areas
- **Enhancement Approach**: For existing skills (architecture-guidance, css-theming-assistant), integrate new content while preserving existing structure and adding complementary sections
- **Content Preservation**: Ensure all technical details, code examples, and implementation notes are accurately transferred
- **Cross-References**: Update README.md to reference skills instead of containing detailed implementation guides
- **Consistency**: Maintain the project's documentation standards and formatting conventions
- **Future Maintenance**: Skills should be living documents that evolve with the codebase

## Questions and Concerns

1. **Should we create separate skills for each major component (like pto-calendar, admin-panel) or keep them consolidated?**  
   No, the components themselves should have a README.md that describe its purpose and goals.

2. **How should we handle updates to skills when the implementation changes - manual sync or automated process?**  
   Manual.

3. **Are there any README sections that should remain in README.md for quick reference rather than being moved to skills?**  
   The README.md should be master document meant for human consumption with links to the skills, prompts and tasks used to develop the application.

4. **Should we add a skills index or navigation system to make them easier to discover?**  
   Yes, I believe this README.md will be that index.
